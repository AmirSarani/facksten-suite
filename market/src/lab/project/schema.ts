import { z } from "zod";
import type { LabProject } from "../types";

export const LAB_PROJECT_VERSION = 1;
export const LAB_STORAGE_KEY = "facksten-lab-project-v1";
export const LAB_SHARE_PREFIX = "facksten-lab-share:";

const wireEndpointSchema = z.object({
  instanceId: z.string().min(1),
  pinId: z.string().min(1),
});

export const labProjectSchema = z.object({
  version: z.number().int().positive(),
  id: z.string().min(1),
  name: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
  parts: z.array(
    z.object({
      instanceId: z.string().min(1),
      componentId: z.string().min(1),
      x: z.number(),
      y: z.number(),
      rotation: z.number().default(0),
      props: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
    }),
  ),
  wires: z.array(
    z.object({
      id: z.string().min(1),
      from: wireEndpointSchema,
      to: wireEndpointSchema,
      color: z.string().min(1),
    }),
  ),
  code: z.string(),
  boardId: z.string().min(1),
  mode: z.enum(["simple", "pro"]).optional(),
  updatedAt: z.string(),
  createdAt: z.string(),
});

export type LabProjectParsed = z.infer<typeof labProjectSchema>;

export function migrateProject(raw: unknown): LabProject {
  const obj = (raw ?? {}) as Record<string, unknown>;
  const version = typeof obj.version === "number" ? obj.version : 0;
  const next: Record<string, unknown> = { ...obj, version: version || LAB_PROJECT_VERSION };
  // Future migrations go here by bumping LAB_PROJECT_VERSION
  if (version < 1) {
    next.version = 1;
    next.parts = Array.isArray(next.parts) ? next.parts : [];
    next.wires = Array.isArray(next.wires) ? next.wires : [];
    next.code = typeof next.code === "string" ? next.code : "";
    next.boardId = typeof next.boardId === "string" ? next.boardId : "arduino-uno";
  }
  const parsed = labProjectSchema.parse(next);
  return parsed as LabProject;
}

export function serializeProject(project: LabProject): string {
  const normalized = { ...project, version: LAB_PROJECT_VERSION, updatedAt: new Date().toISOString() };
  labProjectSchema.parse(normalized);
  return JSON.stringify(normalized, null, 2);
}

export function deserializeProject(json: string): LabProject {
  return migrateProject(JSON.parse(json));
}

export function saveProjectLocal(project: LabProject): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(LAB_STORAGE_KEY, serializeProject(project));
}

export function loadProjectLocal(): LabProject | null {
  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(LAB_STORAGE_KEY);
  if (!raw) return null;
  try {
    return deserializeProject(raw);
  } catch {
    return null;
  }
}

export function exportProjectJson(project: LabProject): Blob {
  return new Blob([serializeProject(project)], { type: "application/json" });
}

export function createShareToken(project: LabProject): string {
  const token = typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID().slice(0, 12)
    : `s${Date.now().toString(36)}`;
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(LAB_SHARE_PREFIX + token, serializeProject({ ...project, id: token }));
  }
  return token;
}

export function loadShareToken(token: string): LabProject | null {
  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(LAB_SHARE_PREFIX + token);
  if (!raw) return null;
  try {
    return deserializeProject(raw);
  } catch {
    return null;
  }
}

export function newEmptyProject(name = "پروژه بدون نام"): LabProject {
  const now = new Date().toISOString();
  return {
    version: LAB_PROJECT_VERSION,
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `p${Date.now()}`,
    name,
    parts: [],
    wires: [],
    code: `// آزمایشگاه مجازی فکستن\nvoid setup() {\n  pinMode(13, OUTPUT);\n}\n\nvoid loop() {\n  digitalWrite(13, HIGH);\n  delay(500);\n  digitalWrite(13, LOW);\n  delay(500);\n}\n`,
    boardId: "arduino-uno",
    mode: "simple",
    createdAt: now,
    updatedAt: now,
  };
}
