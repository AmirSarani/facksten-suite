import { corsJson, corsPreflight } from "@/lib/cors";
import { localizeService, publishedServices } from "@/lib/content";
import { parseLocale } from "@/lib/locale";

export function OPTIONS(req: Request) {
  return corsPreflight(req);
}

export async function GET(req: Request) {
  const locale = parseLocale(new URL(req.url).searchParams.get("locale"));
  const rows = await publishedServices();
  return corsJson(req, { locale, items: rows.map((row) => localizeService(row, locale)) });
}
