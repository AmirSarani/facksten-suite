import { useState, type FormEvent } from "react";
import { Alert, Button, EmptyState, PageHeader, TextArea, TextInput } from "../components/ui";
import { errorMessage, settingsApi } from "../lib/api";
import { useAsync } from "../lib/useAsync";
import type { SiteSetting } from "../types";

function pretty(value: unknown): string {
  try {
    return JSON.stringify(value ?? {}, null, 2);
  } catch {
    return String(value);
  }
}

export function SettingsPage() {
  const { data, loading, error, reload } = useAsync(settingsApi.list);
  const items = data ?? [];
  const [keyName, setKeyName] = useState("");
  const [jsonText, setJsonText] = useState("{\n  \n}");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function startEdit(item: SiteSetting) {
    setEditingId(item.id);
    setKeyName(item.key);
    setJsonText(pretty(item.value));
    setFormError(null);
  }

  function resetForm() {
    setEditingId(null);
    setKeyName("");
    setJsonText("{\n  \n}");
    setFormError(null);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const value = JSON.parse(jsonText) as unknown;
      const payload = { key: keyName.trim(), value };
      if (editingId) await settingsApi.update(editingId, payload);
      else await settingsApi.create(payload);
      resetForm();
      await reload();
    } catch (err) {
      setFormError(err instanceof SyntaxError ? "Value must be valid JSON." : errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!window.confirm("Delete this setting?")) return;
    await settingsApi.remove(id);
    if (editingId === id) resetForm();
    await reload();
  }

  return (
    <div>
      <PageHeader title="Settings" titleFa="تنظیمات سایت" />
      {loading ? <p className="font-mono text-sm text-on-surface-variant">loading…</p> : null}
      {error ? <Alert>{error}</Alert> : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <form className="panel-card space-y-4 p-5" onSubmit={(event) => void onSubmit(event)}>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cta">
            {editingId ? "edit key" : "new key"}
          </p>
          {formError ? <Alert>{formError}</Alert> : null}
          <TextInput
            id="setting-key"
            label="کلید / Key"
            dir="ltr"
            required
            value={keyName}
            onChange={(event) => setKeyName(event.currentTarget.value)}
          />
          <TextArea
            id="setting-value"
            label="مقدار JSON / Value"
            dir="ltr"
            className="min-h-40 font-mono text-xs"
            value={jsonText}
            onChange={(event) => setJsonText(event.currentTarget.value)}
          />
          <div className="flex gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
            {editingId ? (
              <Button type="button" variant="ghost" onClick={resetForm}>
                Cancel
              </Button>
            ) : null}
          </div>
        </form>

        <div>
          {!loading && !error && items.length === 0 ? (
            <EmptyState title="No settings" body="Store site-wide JSON values such as social links or homepage copy." />
          ) : null}
          {items.length > 0 ? (
            <div className="space-y-3">
              {items.map((item) => (
                <article key={item.id} className="panel-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-mono text-sm text-cta">{item.key}</p>
                    <div className="flex gap-3 text-xs">
                      <button type="button" className="cursor-pointer text-cta focus-cta" onClick={() => startEdit(item)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="cursor-pointer text-error focus-cta"
                        onClick={() => void onDelete(item.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <pre className="mt-2 overflow-x-auto font-mono text-[11px] text-on-surface-variant">
                    {pretty(item.value)}
                  </pre>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
