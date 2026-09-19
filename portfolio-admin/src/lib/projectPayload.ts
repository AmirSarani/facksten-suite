import type { CollaboratorField, ProjectCollaboratorInput, ProjectInput } from "../types";

export function mediaUrlsFromProject(item: unknown): string[] {
  if (!item || typeof item !== "object") return [];
  const rec = item as Record<string, unknown>;
  if (Array.isArray(rec.mediaUrls) && rec.mediaUrls.some((value) => typeof value === "string" && value.trim())) {
    return rec.mediaUrls.filter((value): value is string => typeof value === "string" && Boolean(value.trim()));
  }
  if (Array.isArray(rec.media)) {
    return rec.media.flatMap((entry) => {
      if (!entry || typeof entry !== "object") return [];
      const url = (entry as { url?: unknown }).url;
      return typeof url === "string" && url.trim() ? [url] : [];
    });
  }
  return [];
}

export function coverUrlFromProject(item: unknown): string {
  if (!item || typeof item !== "object") return "";
  const url = (item as { coverUrl?: unknown }).coverUrl;
  return typeof url === "string" ? url : "";
}

function pickStr(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

const LABEL_SEP = /\s+[—–-]\s+/;

export function parseCollaboratorLabel(label: string): { name: string; role: string } {
  const trimmed = label.trim();
  if (!trimmed) return { name: "", role: "" };
  const parts = trimmed.split(LABEL_SEP);
  if (parts.length === 1) return { name: trimmed, role: "" };
  return { name: parts[0]?.trim() ?? "", role: parts.slice(1).join(" — ").trim() };
}

export function normalizeCollaborator(entry: unknown): ProjectCollaboratorInput | null {
  if (entry == null || entry === "") return null;
  if (typeof entry === "string") {
    const { name, role } = parseCollaboratorLabel(entry);
    if (!name && !role) return null;
    return { nameFa: name, nameEn: name, roleFa: role, roleEn: role };
  }
  if (typeof entry !== "object") return null;
  const rec = entry as Record<string, unknown>;
  const nameEn = pickStr(rec.nameEn, rec.name, rec.nameFa);
  const nameFa = pickStr(rec.nameFa, rec.name, rec.nameEn);
  const roleEn = pickStr(rec.roleEn, rec.role, rec.roleFa);
  const roleFa = pickStr(rec.roleFa, rec.role, rec.roleEn);
  if (!nameEn && !nameFa && !roleEn && !roleFa) return null;
  return {
    nameFa,
    nameEn: nameEn || nameFa,
    roleFa,
    roleEn: roleEn || roleFa,
    sortOrder: typeof rec.sortOrder === "number" ? rec.sortOrder : undefined,
  };
}

export function collaboratorLabel(entry: unknown): string {
  if (typeof entry === "string") return entry;
  const normalized = normalizeCollaborator(entry);
  if (!normalized) return "";
  const name = normalized.nameEn || normalized.nameFa;
  const role = normalized.roleEn || normalized.roleFa;
  if (name && role) return `${name} — ${role}`;
  return name || role;
}

export function collaboratorsFromProject(item: unknown): ProjectCollaboratorInput[] {
  if (!item || typeof item !== "object") return [];
  const list = (item as { collaborators?: unknown }).collaborators;
  if (!Array.isArray(list)) return [];
  return list.flatMap((entry) => {
    const normalized = normalizeCollaborator(entry);
    return normalized ? [normalized] : [];
  });
}

function sameLocale(fa: string, en: string): boolean {
  return !fa || fa === en;
}

export function applyCollaboratorLabels(
  previous: readonly CollaboratorField[],
  labels: readonly string[],
): ProjectCollaboratorInput[] {
  return labels.map((label, index) => {
    const prev = normalizeCollaborator(previous[index]);
    if (prev && collaboratorLabel(prev) === label) return prev;
    const { name, role } = parseCollaboratorLabel(label);
    if (!prev) {
      return { nameFa: name, nameEn: name, roleFa: role, roleEn: role };
    }
    return {
      nameFa: sameLocale(prev.nameFa, prev.nameEn) ? name : prev.nameFa,
      nameEn: name || prev.nameEn,
      roleFa: sameLocale(prev.roleFa, prev.roleEn) ? role : prev.roleFa,
      roleEn: role,
      sortOrder: prev.sortOrder,
    };
  });
}

export function collaboratorsToWrite(entries: readonly CollaboratorField[]) {
  return entries.flatMap((entry) => {
    const normalized = normalizeCollaborator(entry);
    if (!normalized) return [];
    const nameFa = normalized.nameFa || normalized.nameEn;
    const nameEn = normalized.nameEn || normalized.nameFa;
    if (!nameFa || !nameEn) return [];
    return [
      {
        nameFa,
        nameEn,
        roleFa: normalized.roleFa,
        roleEn: normalized.roleEn,
      },
    ];
  }).map((entry, sortOrder) => ({ ...entry, sortOrder }));
}

export type ProjectWritePayload = ReturnType<typeof toProjectWritePayload>;

export function toProjectWritePayload(input: ProjectInput) {
  const { mediaUrls, collaborators, ...rest } = input;
  return {
    ...rest,
    coverUrl: input.coverUrl.trim(),
    media: mediaUrls
      .map((url) => url.trim())
      .filter(Boolean)
      .map((url, sortOrder) => ({ url, sortOrder })),
    collaborators: collaboratorsToWrite(collaborators),
  };
}
