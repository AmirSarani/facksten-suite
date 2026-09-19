import { corsJson, corsPreflight } from "@/lib/cors";
import { prisma } from "@/lib/db";
import { adminOr401 } from "@/lib/http";

export function OPTIONS(req: Request) {
  return corsPreflight(req);
}

export async function GET(req: Request) {
  const auth = await adminOr401(req);
  if ("error" in auth) return auth.error;
  const items = await prisma.lead.findMany({ orderBy: { createdAt: "desc" } });
  return corsJson(req, { items });
}
