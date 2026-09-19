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
import { errorMessage, teamApi } from "../lib/api";
import { useAsync } from "../lib/useAsync";
import type { PublishStatus, TeamMember, TeamMemberInput } from "../types";

function emptyMember(): TeamMemberInput {
  return {
    nameFa: "",
    nameEn: "",
    roleFa: "",
    roleEn: "",
    bioFa: "",
    bioEn: "",
    photoUrl: "",
    status: "DRAFT",
    sortOrder: 0,
  };
}

function toInput(item: TeamMember): TeamMemberInput {
  return {
    nameFa: item.nameFa ?? "",
    nameEn: item.nameEn ?? "",
    roleFa: item.roleFa ?? "",
    roleEn: item.roleEn ?? "",
    bioFa: item.bioFa ?? "",
    bioEn: item.bioEn ?? "",
    photoUrl: item.photoUrl ?? "",
    status: item.status ?? "DRAFT",
    sortOrder: item.sortOrder ?? 0,
  };
}

export function TeamListPage() {
  const { data, loading, error, reload } = useAsync(teamApi.list);
  const items = data ?? [];

  async function onDelete(id: string) {
    if (!window.confirm("Delete this team member?")) return;
    await teamApi.remove(id);
    await reload();
  }

  return (
    <div>
      <PageHeader
        title="Team"
        titleFa="تیم"
        actions={<ButtonLink to="/team/new">New member</ButtonLink>}
      />
      {loading ? <p className="font-mono text-sm text-on-surface-variant">loading…</p> : null}
      {error ? <Alert>{error}</Alert> : null}
      {!loading && !error && items.length === 0 ? (
        <EmptyState title="No team members" body="Add people who should appear on the public portfolio." />
      ) : null}
      {items.length > 0 ? (
        <div className="overflow-x-auto panel-card">
          <table className="w-full min-w-[640px] text-start text-sm">
            <thead className="border-b border-outline font-mono text-[10px] uppercase tracking-wider text-on-surface-variant">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-outline/70 last:border-0">
                  <td className="px-4 py-3">
                    <div>{item.nameEn || item.nameFa}</div>
                    <div className="text-on-surface-variant" dir="rtl" lang="fa">
                      {item.nameFa}
                    </div>
                  </td>
                  <td className="px-4 py-3">{item.roleEn || item.roleFa}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-4 py-3 text-end">
                    <Link to={`/team/${item.id}`} className="me-3 text-cta focus-cta">
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

export function TeamFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === "new";
  const [form, setForm] = useState<TeamMemberInput>(emptyMember());
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isNew || !id) return;
    let active = true;
    setLoading(true);
    void teamApi
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
      if (isNew) await teamApi.create(form);
      else if (id) await teamApi.update(id, form);
      navigate("/team");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader title={isNew ? "New member" : "Edit member"} titleFa={isNew ? "عضو جدید" : "ویرایش عضو"} />
      {loading ? <p className="font-mono text-sm text-on-surface-variant">loading…</p> : null}
      {!loading ? (
        <form className="panel-card space-y-5 p-5" onSubmit={(event) => void onSubmit(event)}>
          {error ? <Alert>{error}</Alert> : null}
          <BilingualField
            id="name"
            labelFa="نام"
            labelEn="Name"
            required
            valueFa={form.nameFa}
            valueEn={form.nameEn}
            onChangeFa={(nameFa) => setForm((current) => ({ ...current, nameFa }))}
            onChangeEn={(nameEn) => setForm((current) => ({ ...current, nameEn }))}
          />
          <BilingualField
            id="role"
            labelFa="نقش"
            labelEn="Role"
            valueFa={form.roleFa}
            valueEn={form.roleEn}
            onChangeFa={(roleFa) => setForm((current) => ({ ...current, roleFa }))}
            onChangeEn={(roleEn) => setForm((current) => ({ ...current, roleEn }))}
          />
          <BilingualField
            id="bio"
            labelFa="بیو"
            labelEn="Bio"
            multiline
            valueFa={form.bioFa}
            valueEn={form.bioEn}
            onChangeFa={(bioFa) => setForm((current) => ({ ...current, bioFa }))}
            onChangeEn={(bioEn) => setForm((current) => ({ ...current, bioEn }))}
          />
          <TextInput
            id="photoUrl"
            label="تصویر / Photo URL"
            dir="ltr"
            value={form.photoUrl}
            onChange={(event) => setForm((current) => ({ ...current, photoUrl: event.currentTarget.value }))}
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
            <Button type="button" variant="ghost" onClick={() => navigate("/team")}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
