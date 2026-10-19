import { randomBytes } from "node:crypto";
import { migrateProject } from "@/lab/project/schema";
import type { LabProject } from "@/lab/types";

/** Limits for circuits saved to accounts. */
export const LAB_PROJECT_LIMITS = {
  /** Serialized JSON, bytes. A busy breadboard project is ~20 KB. */
  maxBytes: 400_000,
  perUser: 100,
};

export type ProjectSummary = { id: string; name: string; updatedAt: string; shared: boolean; parts: number };

/**
 * Validate and normalize a project coming from the browser. Server-only fields never come
 * from the client: the stored copy has no cloudId (the row id is the cloud id).
 */
export function parseIncomingProject(raw: unknown): { ok: true; project: LabProject; json: string } | { ok: false; error: string } {
  let project: LabProject;
  try {
    project = migrateProject(raw);
  } catch {
    return { ok: false, error: "ساختار پروژه نامعتبر است." };
  }
  const clean: LabProject = { ...project, name: project.name.trim().slice(0, 120) || "پروژه بدون نام", cloudId: undefined };
  const json = JSON.stringify(clean);
  if (Buffer.byteLength(json) > LAB_PROJECT_LIMITS.maxBytes) {
    return { ok: false, error: "پروژه بیش از حد بزرگ است." };
  }
  return { ok: true, project: clean, json };
}

/** The stored project, as handed back to the workspace (with its cloud id). */
export function storedProject(row: { id: string; data: string }, opts: { asCopy?: boolean } = {}): LabProject {
  const project = migrateProject(JSON.parse(row.data));
  return opts.asCopy ? { ...project, cloudId: undefined } : { ...project, cloudId: row.id };
}

export function summarize(row: { id: string; name: string; updatedAt: Date; shareToken: string | null; data: string }): ProjectSummary {
  let parts = 0;
  try {
    parts = (JSON.parse(row.data) as LabProject).parts?.length ?? 0;
  } catch {
    parts = 0;
  }
  return { id: row.id, name: row.name, updatedAt: row.updatedAt.toISOString(), shared: !!row.shareToken, parts };
}

/** 128-bit URL-safe token for share links (not guessable, not derived from the id). */
export function newShareToken(): string {
  return randomBytes(16).toString("base64url");
}
