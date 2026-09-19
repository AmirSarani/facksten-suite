import { corsJson, corsPreflight } from "@/lib/cors";
import { prisma } from "@/lib/db";
import { adminOr401, parseBody } from "@/lib/http";
import { settingSchema } from "@/lib/validate";

export function OPTIONS(req: Request) {
  return corsPreflight(req);
}

export async function GET(req: Request) {
  const auth = await adminOr401(req);
  if ("error" in auth) return auth.error;
  const rows = await prisma.siteSetting.findMany({ orderBy: { key: "asc" } });
  const items = rows.map((row) => ({
    key: row.key,
    value: JSON.parse(row.valueJson) as unknown,
    updatedAt: row.updatedAt,
  }));
  return corsJson(req, { items });
}

export async function POST(req: Request) {
  const auth = await adminOr401(req);
  if ("error" in auth) return auth.error;
  const parsed = await parseBody(req, settingSchema);
  if ("error" in parsed) return parsed.error;
  const item = await prisma.siteSetting.upsert({
    where: { key: parsed.data.key },
    create: { key: parsed.data.key, valueJson: JSON.stringify(parsed.data.value) },
    update: { valueJson: JSON.stringify(parsed.data.value) },
  });
  return corsJson(req, { item: { key: item.key, value: parsed.data.value } }, { status: 201 });
}
