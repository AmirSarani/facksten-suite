import Link from "next/link";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/locale";
import { localePath } from "@/lib/paths";

export function ProjectCard({
  locale,
  slug,
  title,
  summary,
  coverUrl,
  featured,
}: {
  locale: Locale;
  slug: string;
  title: string;
  summary: string;
  coverUrl: string;
  featured?: boolean;
}) {
  const dict = t(locale);
  return (
    <Link
      href={localePath(locale, `/projects/${slug}`)}
      className="ambient-card product-card cyber-chamfer-sm focus-cta group relative block min-w-0 overflow-hidden"
    >
      <span aria-hidden className="pointer-events-none absolute inset-y-0 start-0 z-10 w-[3px] bg-cta" />
      <div className="relative aspect-[16/10] bg-surface-container">
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverUrl} alt="" className="h-full w-full max-w-full object-cover" />
        ) : null}
        {featured ? (
          <span className="absolute top-3 start-3 bg-cta px-2 py-1 font-mono text-[10px] tracking-wider">
            FEATURED
          </span>
        ) : null}
      </div>
      <div className="min-w-0 p-4 sm:p-5">
        <h3 className={`break-words text-lg font-semibold group-hover:text-cta ${locale === "en" ? "font-brand" : ""}`}>
          {title}
        </h3>
        <p className="mt-2 break-words text-sm leading-7 text-on-surface-variant">{summary}</p>
        <p className="mt-4 font-mono text-[11px] text-cta">
          {dict.actions.viewProject}{" "}
          <span aria-hidden>{locale === "fa" ? "←" : "→"}</span>
        </p>
      </div>
    </Link>
  );
}
