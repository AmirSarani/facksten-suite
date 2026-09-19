import { corsJson, corsPreflight } from "@/lib/cors";
import { prisma } from "@/lib/db";
import { adminOr401, parseBody } from "@/lib/http";
import { settingSchema } from "@/lib/validate";

export function OPTIONS(req: Request) {
  return corsPreflight(req);
}

export async function GET(req: Request, { params }: { params: Promise<{ key: string }> }) {
  const auth = await adminOr401(req);
  if ("error" in auth) return auth.error;
  const { key } = await params;
  const row = await prisma.siteSetting.findUnique({ where: { key } });
  if (!row) return corsJson(req, { error: "Not found" }, { status: 404 });
  return corsJson(req, { item: { key: row.key, value: JSON.parse(row.valueJson) as unknown } });
}

export async function PUT(req: Request, { params }: { params: Promise<{ key: string }> }) {
  const auth = await adminOr401(req);
  if ("error" in auth) return auth.error;
  const { key } = await params;
  const parsed = await parseBody(req, settingSchema.omit({ key: true }));
  if ("error" in parsed) return parsed.error;
  const item = await prisma.siteSetting.upsert({
    where: { key },
    create: { key, valueJson: JSON.stringify(parsed.data.value) },
    update: { valueJson: JSON.stringify(parsed.data.value) },
  });
  return corsJson(req, { item: { key: item.key, value: parsed.data.value } });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ key: string }> }) {
  const auth = await adminOr401(req);
  if ("error" in auth) return auth.error;
  const { key } = await params;
  try {
    await prisma.siteSetting.delete({ where: { key } });
    return corsJson(req, { ok: true });
  } catch {
    return corsJson(req, { error: "Not found" }, { status: 404 });
  }
}
