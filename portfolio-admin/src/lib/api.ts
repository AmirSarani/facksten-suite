import type {
  AdminUser,
  Lead,
  LegalDocs,
  Project,
  Service,
  ServiceInput,
  SiteSetting,
  SiteSettingInput,
  TeamMember,
  TeamMemberInput,
} from "../types";
import type { ProjectWritePayload } from "./projectPayload";

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export function getApiBase(): string {
  const raw = import.meta.env.VITE_API_BASE ?? "http://localhost:3020";
  return raw.replace(/\/$/, "");
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function pickMessage(data: unknown, fallback: string): string {
  if (typeof data === "string" && data.trim()) return data;
  if (data && typeof data === "object") {
    const rec = data as Record<string, unknown>;
    for (const key of ["message", "error", "detail"]) {
      const value = rec[key];
      if (typeof value === "string" && value.trim()) return value;
      if (value && typeof value === "object") {
        const nested = (value as { message?: unknown }).message;
        if (typeof nested === "string" && nested.trim()) return nested;
      }
    }
  }
  return fallback;
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  if (init.body !== undefined && !headers.has("Content-Type") && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(`${getApiBase()}${path}`, {
      ...init,
      credentials: "include",
      headers,
    });
  } catch {
    throw new ApiError(
      `Cannot reach portfolio-web API at ${getApiBase()}. Start it on port 3020 and allow CORS from http://localhost:5174.`,
      0,
      null,
    );
  }

  const text = await response.text();
  const data = text ? safeJson(text) : null;

  if (!response.ok) {
    throw new ApiError(
      pickMessage(data, `${response.status} ${response.statusText}`),
      response.status,
      data,
    );
  }

  return data as T;
}

export function unwrapList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object") {
    const rec = data as Record<string, unknown>;
    for (const key of ["items", "data", "results"]) {
      if (Array.isArray(rec[key])) return rec[key] as T[];
    }
  }
  return [];
}

export function unwrapItem<T>(data: unknown): T {
  if (data && typeof data === "object") {
    if ("item" in data) return (data as { item: T }).item;
    if ("data" in data) return (data as { data: T }).data;
  }
  return data as T;
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Unexpected error";
}

export const authApi = {
  login(email: string, password: string) {
    return apiFetch<unknown>("/api/admin/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },
  logout() {
    return apiFetch<unknown>("/api/admin/auth/logout", { method: "POST" });
  },
  me() {
    return apiFetch<unknown>("/api/admin/auth/me");
  },
};

function asUser(data: unknown): AdminUser | null {
  const raw =
    data && typeof data === "object" && "user" in data
      ? (data as { user: unknown }).user
      : unwrapItem(data);
  if (!raw || typeof raw !== "object") return null;
  const rec = raw as Record<string, unknown>;
  const email = typeof rec.email === "string" ? rec.email : "";
  if (!email) return null;
  return {
    id: String(rec.id ?? email),
    email,
    name: typeof rec.name === "string" ? rec.name : undefined,
    role: typeof rec.role === "string" ? rec.role : undefined,
  };
}

export async function fetchMe(): Promise<AdminUser> {
  const user = asUser(await authApi.me());
  if (!user) throw new ApiError("Not authenticated", 401, null);
  return user;
}

function crud<T, TInput>(basePath: string) {
  return {
    list: async () => unwrapList<T>(await apiFetch<unknown>(basePath)),
    get: async (id: string) => unwrapItem<T>(await apiFetch<unknown>(`${basePath}/${id}`)),
    create: async (input: TInput) =>
      unwrapItem<T>(
        await apiFetch<unknown>(basePath, {
          method: "POST",
          body: JSON.stringify(input),
        }),
      ),
    update: async (id: string, input: TInput) =>
      unwrapItem<T>(
        await apiFetch<unknown>(`${basePath}/${id}`, {
          method: "PATCH",
          body: JSON.stringify(input),
        }),
      ),
    remove: (id: string) =>
      apiFetch<unknown>(`${basePath}/${id}`, { method: "DELETE" }),
  };
}

export const servicesApi = crud<Service, ServiceInput>("/api/admin/services");
export const projectsApi = crud<Project, ProjectWritePayload>("/api/admin/projects");
export const teamApi = crud<TeamMember, TeamMemberInput>("/api/admin/team");
export const settingsApi = crud<SiteSetting, SiteSettingInput>("/api/admin/settings");

export const leadsApi = {
  list: async () => unwrapList<Lead>(await apiFetch<unknown>("/api/admin/leads")),
};

export function absoluteAssetUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `${getApiBase()}${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`;
}

function urlFromUpload(data: unknown): string {
  if (data && typeof data === "object") {
    const url = (data as { url?: unknown }).url;
    if (typeof url === "string" && url.trim()) return url.trim();
  }
  throw new ApiError("Upload did not return a url", 0, data);
}

export async function uploadImage(file: File): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  return urlFromUpload(
    await apiFetch<unknown>("/api/admin/upload", {
      method: "POST",
      body,
    }),
  );
}

function pairFromUnknown(value: unknown): LegalDocs["privacy"] {
  const rec = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return {
    fa: typeof rec.fa === "string" ? rec.fa : "",
    en: typeof rec.en === "string" ? rec.en : "",
  };
}

export function normalizeLegal(data: unknown): LegalDocs {
  const raw =
    data && typeof data === "object" && "legal" in data ? (data as { legal: unknown }).legal : data;
  const rec = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    privacy: pairFromUnknown(rec.privacy),
    terms: pairFromUnknown(rec.terms),
  };
}

export const legalApi = {
  get: async () => normalizeLegal(await apiFetch<unknown>("/api/admin/legal")),
  update: async (legal: LegalDocs) =>
    normalizeLegal(
      await apiFetch<unknown>("/api/admin/legal", {
        method: "PUT",
        body: JSON.stringify(legal),
      }),
    ),
};
