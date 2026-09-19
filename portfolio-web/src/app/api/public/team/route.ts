import { corsJson, corsPreflight } from "@/lib/cors";
import { localizeTeam, publishedTeam } from "@/lib/content";
import { parseLocale } from "@/lib/locale";

export function OPTIONS(req: Request) {
  return corsPreflight(req);
}

export async function GET(req: Request) {
  const locale = parseLocale(new URL(req.url).searchParams.get("locale"));
  const rows = await publishedTeam();
  return corsJson(req, { locale, items: rows.map((row) => localizeTeam(row, locale)) });
}
