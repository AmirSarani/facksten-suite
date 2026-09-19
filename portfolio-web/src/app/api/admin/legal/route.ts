import { corsJson, corsPreflight } from "@/lib/cors";
import { prisma } from "@/lib/db";
import { adminOr401, apiError, parseBody } from "@/lib/http";
import { normalizeLegal } from "@/lib/legal";
import { getSettingsMap } from "@/lib/settings";
import { legalUpdateSchema } from "@/lib/validate";

export function OPTIONS(req: Request) {
  return corsPreflight(req);
}

export async function GET(req: Request) {
  const auth = await adminOr401(req);
  if ("error" in auth) {
    return apiError(req, "UNAUTHORIZED", "Unauthorized", 401);
  }
  const settings = await getSettingsMap();
  return corsJson(req, { legal: normalizeLegal(settings.legal) });
}

export async function PUT(req: Request) {
  const auth = await adminOr401(req);
  if ("error" in auth) {
    return apiError(req, "UNAUTHORIZED", "Unauthorized", 401);
  }
  const parsed = await parseBody(req, legalUpdateSchema);
  if ("error" in parsed) {
    return apiError(req, "INVALID_PAYLOAD", "Invalid payload", 400);
  }
  const legal = normalizeLegal(parsed.data);
  await prisma.siteSetting.upsert({
    where: { key: "legal" },
    create: { key: "legal", valueJson: JSON.stringify(legal) },
    update: { valueJson: JSON.stringify(legal) },
  });
  return corsJson(req, { legal });
}
