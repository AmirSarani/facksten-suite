import { corsJson, corsPreflight } from "@/lib/cors";
import { apiError } from "@/lib/http";
import { resolveLegalBody } from "@/lib/legal";
import { getSettingsMap } from "@/lib/settings";

export function OPTIONS(req: Request) {
  return corsPreflight(req);
}

export async function GET(req: Request, { params }: { params: Promise<{ page: string }> }) {
  const { page } = await params;
  const locale = new URL(req.url).searchParams.get("locale");
  const settings = await getSettingsMap();
  const item = resolveLegalBody(settings, page, locale);
  if (!item) {
    return apiError(req, "NOT_FOUND", "Legal page not found", 404);
  }
  return corsJson(req, item);
}
