import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { BilingualField } from "../components/bilingual";
import {
  Alert,
  Button,
  ButtonLink,
  EmptyState,
  PageHeader,
  StatusBadge,
  StatusToggle,
  TextInput,
} from "../components/ui";
import { errorMessage, servicesApi } from "../lib/api";
import { useAsync } from "../lib/useAsync";
import type { PublishStatus, Service, ServiceInput } from "../types";

function emptyService(): ServiceInput {
  return {
    titleFa: "",
    titleEn: "",
    summaryFa: "",
    summaryEn: "",
    bodyFa: "",
    bodyEn: "",
    status: "DRAFT",
    sortOrder: 0,
  };
}

function toInput(item: Service): ServiceInput {
  return {
    titleFa: item.titleFa ?? "",
    titleEn: item.titleEn ?? "",
    summaryFa: item.summaryFa ?? item.summary ?? "",
    summaryEn: item.summaryEn ?? "",
    bodyFa: item.bodyFa ?? item.body ?? "",
    bodyEn: item.bodyEn ?? "",
    status: item.status ?? "DRAFT",
    sortOrder: item.sortOrder ?? 0,
  };
}

export function ServicesListPage() {
  const { data, loading, error, reload } = useAsync(servicesApi.list);
  const items = data ?? [];

  async function onDelete(id: string) {
    if (!window.confirm("Delete this service?")) return;
    await servicesApi.remove(id);
    await reload();
  }

  return (
    <div>
      <PageHeader
        title="Services"
        titleFa="خدمات"
        actions={<ButtonLink to="/services/new">New service</ButtonLink>}
      />
      {loading ? <p className="font-mono text-sm text-on-surface-variant">loading…</p> : null}
      {error ? <Alert>{error}</Alert> : null}
      {!loading && !error && items.length === 0 ? (
        <EmptyState
          title="No services yet"
          body="Create a service when portfolio-web is running, or retry after the API is up."
        />
      ) : null}
      {items.length > 0 ? (
        <div className="overflow-x-auto panel-card">
          <table className="w-full min-w-[640px] text-start text-sm">
            <thead className="border-b border-outline font-mono text-[10px] uppercase tracking-wider text-on-surface-variant">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-outline/70 last:border-0">
                  <td className="px-4 py-3">
                    <div>{item.titleEn || item.titleFa}</div>
                    <div className="text-on-surface-variant" dir="rtl" lang="fa">
                      {item.titleFa}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{item.sortOrder}</td>
                  <td className="px-4 py-3 text-end">
                    <Link to={`/services/${item.id}`} className="me-3 text-cta focus-cta">
                      Edit
                    </Link>
                    <button
                      type="button"
                      className="cursor-pointer text-error focus-cta"
                      onClick={() => void onDelete(item.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

export function ServiceFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === "new";
  const [form, setForm] = useState<ServiceInput>(emptyService());
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isNew || !id) return;
    let active = true;
    setLoading(true);
    void servicesApi
      .get(id)
      .then((item) => {
        if (active) setForm(toInput(item));
      })
      .catch((err) => {
        if (active) setError(errorMessage(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, isNew]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (isNew) await servicesApi.create(form);
      else if (id) await servicesApi.update(id, form);
      navigate("/services");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader title={isNew ? "New service" : "Edit service"} titleFa={isNew ? "خدمت جدید" : "ویرایش خدمت"} />
      {loading ? <p className="font-mono text-sm text-on-surface-variant">loading…</p> : null}
      {!loading ? (
        <form className="panel-card space-y-5 p-5" onSubmit={(event) => void onSubmit(event)}>
          {error ? <Alert>{error}</Alert> : null}
          <BilingualField
            id="title"
            labelFa="عنوان"
            labelEn="Title"
            required
            valueFa={form.titleFa}
            valueEn={form.titleEn}
            onChangeFa={(titleFa) => setForm((current) => ({ ...current, titleFa }))}
            onChangeEn={(titleEn) => setForm((current) => ({ ...current, titleEn }))}
          />
          <BilingualField
            id="summary"
            labelFa="خلاصه"
            labelEn="Summary"
            multiline
            valueFa={form.summaryFa}
            valueEn={form.summaryEn}
            onChangeFa={(summaryFa) => setForm((current) => ({ ...current, summaryFa }))}
            onChangeEn={(summaryEn) => setForm((current) => ({ ...current, summaryEn }))}
          />
          <BilingualField
            id="body"
            labelFa="متن"
            labelEn="Body"
            multiline
            valueFa={form.bodyFa}
            valueEn={form.bodyEn}
            onChangeFa={(bodyFa) => setForm((current) => ({ ...current, bodyFa }))}
            onChangeEn={(bodyEn) => setForm((current) => ({ ...current, bodyEn }))}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <StatusToggle
              value={form.status}
              onChange={(status: PublishStatus) => setForm((current) => ({ ...current, status }))}
            />
            <TextInput
              id="sortOrder"
              label="ترتیب / Sort order"
              type="number"
              value={form.sortOrder}
              onChange={(event) =>
                setForm((current) => ({ ...current, sortOrder: Number(event.currentTarget.value) }))
              }
            />
          </div>
          <div className="flex gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => navigate("/services")}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
