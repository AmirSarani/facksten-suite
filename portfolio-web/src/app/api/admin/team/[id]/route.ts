import { corsJson, corsPreflight } from "@/lib/cors";
import { prisma } from "@/lib/db";
import { adminOr401, parseBody } from "@/lib/http";
import { teamSchema } from "@/lib/validate";

export function OPTIONS(req: Request) {
  return corsPreflight(req);
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await adminOr401(req);
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const item = await prisma.teamMember.findUnique({ where: { id } });
  if (!item) return corsJson(req, { error: "Not found" }, { status: 404 });
  return corsJson(req, { item });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await adminOr401(req);
  if ("error" in auth) return auth.error;
  const parsed = await parseBody(req, teamSchema.partial());
  if ("error" in parsed) return parsed.error;
  const { id } = await params;
  try {
    const item = await prisma.teamMember.update({ where: { id }, data: parsed.data });
    return corsJson(req, { item });
  } catch {
    return corsJson(req, { error: "Not found" }, { status: 404 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await adminOr401(req);
  if ("error" in auth) return auth.error;
  const { id } = await params;
  try {
    await prisma.teamMember.delete({ where: { id } });
    return corsJson(req, { ok: true });
  } catch {
    return corsJson(req, { error: "Not found" }, { status: 404 });
  }
}
