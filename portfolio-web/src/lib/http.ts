import { corsJson } from "@/lib/cors";
import { requireAdmin } from "@/lib/auth";
import type { ZodType } from "zod";

export async function readJson(req: Request) {
  return req.json().catch(() => null);
}

export async function parseBody<T>(req: Request, schema: ZodType<T>) {
  const body = await readJson(req);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return { error: corsJson(req, { error: "Invalid payload", issues: parsed.error.issues }, { status: 400 }) };
  }
  return { data: parsed.data };
}

export function apiError(req: Request, code: string, message: string, status: number) {
  return corsJson(req, { error: { code, message } }, { status });
}

export async function adminOr401(req: Request) {
  const user = await requireAdmin();
  if (!user) {
    return { error: corsJson(req, { error: "Unauthorized" }, { status: 401 }) };
  }
  return { user };
}
