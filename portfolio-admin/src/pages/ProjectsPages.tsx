import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { BilingualField, LineList, cleanLines } from "../components/bilingual";
import { CoverUploadField, ImageUploadButton } from "../components/ImageUpload";
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
import { errorMessage, projectsApi } from "../lib/api";
import {
  applyCollaboratorLabels,
  collaboratorsFromProject,
  coverUrlFromProject,
  mediaUrlsFromProject,
  toProjectWritePayload,
} from "../lib/projectPayload";
import { useAsync } from "../lib/useAsync";
import type { Project, ProjectInput, PublishStatus } from "../types";

function emptyProject(): ProjectInput {
  return {
    titleFa: "",
    titleEn: "",
    summaryFa: "",
    summaryEn: "",
    bodyFa: "",
    bodyEn: "",
    coverUrl: "",
    mediaUrls: [""],
    collaborators: [""],
    status: "DRAFT",
    sortOrder: 0,
  };
}

function toInput(item: Project): ProjectInput {
  const mediaUrls = mediaUrlsFromProject(item);
  const collaborators = collaboratorsFromProject(item);
  return {
    titleFa: item.titleFa ?? "",
    titleEn: item.titleEn ?? "",
    summaryFa: item.summaryFa ?? item.summary ?? "",
    summaryEn: item.summaryEn ?? "",
    bodyFa: item.bodyFa ?? item.body ?? "",
    bodyEn: item.bodyEn ?? "",
    coverUrl: coverUrlFromProject(item),
    mediaUrls: mediaUrls.length ? mediaUrls : [""],
    collaborators: collaborators.length ? collaborators : [""],
    status: item.status ?? "DRAFT",
    sortOrder: item.sortOrder ?? 0,
  };
}

export function ProjectsListPage() {
  const { data, loading, error, reload } = useAsync(projectsApi.list);
  const items = data ?? [];

  async function onDelete(id: string) {
    if (!window.confirm("Delete this project?")) return;
    await projectsApi.remove(id);
    await reload();
  }

  return (
    <div>
      <PageHeader
        title="Projects"
        titleFa="پروژه‌ها"
        actions={<ButtonLink to="/projects/new">New project</ButtonLink>}
      />
      {loading ? <p className="font-mono text-sm text-on-surface-variant">loading…</p> : null}
      {error ? <Alert>{error}</Alert> : null}
      {!loading && !error && items.length === 0 ? (
        <EmptyState title="No projects yet" body="Add a case study once the CMS API is reachable." />
      ) : null}
      {items.length > 0 ? (
        <div className="overflow-x-auto panel-card">
          <table className="w-full min-w-[720px] text-start text-sm">
            <thead className="border-b border-outline font-mono text-[10px] uppercase tracking-wider text-on-surface-variant">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Media</th>
                <th className="px-4 py-3">Status</th>
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
                  <td className="px-4 py-3 font-mono text-xs">{mediaUrlsFromProject(item).length}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-4 py-3 text-end">
                    <Link to={`/projects/${item.id}`} className="me-3 text-cta focus-cta">
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

export function ProjectFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === "new";
  const [form, setForm] = useState<ProjectInput>(emptyProject());
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isNew || !id) return;
    let active = true;
    setLoading(true);
    void projectsApi
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
      const payload = toProjectWritePayload({
        ...form,
        mediaUrls: cleanLines(form.mediaUrls),
      });
      if (isNew) await projectsApi.create(payload);
      else if (id) await projectsApi.update(id, payload);
      navigate("/projects");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader title={isNew ? "New project" : "Edit project"} titleFa={isNew ? "پروژه جدید" : "ویرایش پروژه"} />
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
          <CoverUploadField
            id="coverUrl"
            value={form.coverUrl}
            onChange={(coverUrl) => setForm((current) => ({ ...current, coverUrl }))}
          />
          <div className="space-y-3">
            <LineList
              id="media"
              label="Media URLs"
              labelFa="رسانه"
              values={form.mediaUrls}
              placeholder="/api/media/…"
              onChange={(mediaUrls) => setForm((current) => ({ ...current, mediaUrls }))}
            />
            <ImageUploadButton
              id="media-upload"
              label="Upload image"
              labelFa="بارگذاری تصویر"
              onUploaded={(url) =>
                setForm((current) => ({
                  ...current,
                  mediaUrls: [...cleanLines(current.mediaUrls), url],
                }))
              }
            />
          </div>
          <LineList
            id="collab"
            label="Collaborators"
            labelFa="همکاران"
            values={form.collaborators}
            placeholder="Name — Role"
            onChange={(labels) =>
              setForm((current) => ({
                ...current,
                collaborators: applyCollaboratorLabels(current.collaborators, labels),
              }))
            }
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
            <Button type="button" variant="ghost" onClick={() => navigate("/projects")}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
