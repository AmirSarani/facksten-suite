import { useState, type FormEvent } from "react";
import { BilingualField } from "../components/bilingual";
import { Alert, Button, PageHeader } from "../components/ui";
import { errorMessage, legalApi } from "../lib/api";
import { useAsync } from "../lib/useAsync";
import type { LegalDocs } from "../types";

function emptyLegal(): LegalDocs {
  return {
    privacy: { fa: "", en: "" },
    terms: { fa: "", en: "" },
  };
}

export function LegalPage() {
  const { data, loading, error, setData } = useAsync(legalApi.get);
  const form = data ?? emptyLegal();
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function patch(section: keyof LegalDocs, locale: "fa" | "en", value: string) {
    setSaved(false);
    setData((current) => {
      const next = current ?? emptyLegal();
      return {
        ...next,
        [section]: { ...next[section], [locale]: value },
      };
    });
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setFormError(null);
    setSaved(false);
    try {
      setData(await legalApi.update(form));
      setSaved(true);
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader title="Legal" titleFa="حقوقی" />
      {loading ? <p className="font-mono text-sm text-on-surface-variant">loading…</p> : null}
      {error ? <Alert>{error}</Alert> : null}
      {!loading ? (
        <form className="panel-card space-y-5 p-5" onSubmit={(event) => void onSubmit(event)}>
          {formError ? <Alert>{formError}</Alert> : null}
          {saved ? <Alert tone="info">Saved privacy and terms.</Alert> : null}
          <BilingualField
            id="privacy"
            labelFa="حریم خصوصی"
            labelEn="Privacy"
            multiline
            valueFa={form.privacy.fa}
            valueEn={form.privacy.en}
            onChangeFa={(value) => patch("privacy", "fa", value)}
            onChangeEn={(value) => patch("privacy", "en", value)}
          />
          <BilingualField
            id="terms"
            labelFa="شرایط استفاده"
            labelEn="Terms"
            multiline
            valueFa={form.terms.fa}
            valueEn={form.terms.en}
            onChangeFa={(value) => patch("terms", "fa", value)}
            onChangeEn={(value) => patch("terms", "en", value)}
          />
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save legal"}
          </Button>
        </form>
      ) : null}
    </div>
  );
}
