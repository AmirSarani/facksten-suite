import { corsJson, corsPreflight } from "@/lib/cors";
import { localizeProject, publishedProjectBySlug } from "@/lib/content";
import { parseLocale } from "@/lib/locale";

export function OPTIONS(req: Request) {
  return corsPreflight(req);
}

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const locale = parseLocale(new URL(req.url).searchParams.get("locale"));
  const row = await publishedProjectBySlug(slug);
  if (!row) return corsJson(req, { error: "Not found" }, { status: 404 });
  return corsJson(req, { locale, item: localizeProject(row, locale) });
}
