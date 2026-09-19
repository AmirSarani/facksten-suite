import { corsJson, corsPreflight } from "@/lib/cors";
import { localizeProject, publishedProjects } from "@/lib/content";
import { parseLocale } from "@/lib/locale";

export function OPTIONS(req: Request) {
  return corsPreflight(req);
}

export async function GET(req: Request) {
  const locale = parseLocale(new URL(req.url).searchParams.get("locale"));
  const rows = await publishedProjects();
  return corsJson(req, { locale, items: rows.map((row) => localizeProject(row, locale)) });
}
