import { corsJson, corsPreflight } from "@/lib/cors";
import { prisma } from "@/lib/db";
import { adminOr401, parseBody } from "@/lib/http";
import { serviceSchema } from "@/lib/validate";

export function OPTIONS(req: Request) {
  return corsPreflight(req);
}

export async function GET(req: Request) {
  const auth = await adminOr401(req);
  if ("error" in auth) return auth.error;
  const items = await prisma.service.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
  return corsJson(req, { items });
}

export async function POST(req: Request) {
  const auth = await adminOr401(req);
  if ("error" in auth) return auth.error;
  const parsed = await parseBody(req, serviceSchema);
  if ("error" in parsed) return parsed.error;
  const item = await prisma.service.create({ data: parsed.data });
  return corsJson(req, { item }, { status: 201 });
}
