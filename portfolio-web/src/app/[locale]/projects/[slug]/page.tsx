import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { localizeProject, publishedProjectBySlug } from "@/lib/content";
import { t } from "@/lib/i18n";
import { isLocale } from "@/lib/locale";
import { localePath } from "@/lib/paths";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const row = await publishedProjectBySlug(slug);
  if (!row) return {};
  const item = localizeProject(row, locale);
  return { title: String(item.title), description: String(item.summary) };
}

function CaseBlock({ kicker, body }: { kicker: string; body: string }) {
  if (!body) return null;
  return (
    <section className="ambient-card cyber-chamfer-sm min-w-0 p-4 sm:p-5">
      <p className="mb-3 font-mono text-[11px] tracking-[0.18em] text-cta uppercase">{kicker}</p>
      <p className="whitespace-pre-line leading-8 text-on-surface">{body}</p>
    </section>
  );
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw;
  const dict = t(locale);
  const row = await publishedProjectBySlug(slug);
  if (!row) notFound();
  const item = localizeProject(row, locale);
  const latin = locale === "en";
  const title = String(item.title);
  const summary = String(item.summary);
  const body = String(item.body);
  const hasCase = Boolean(item.challenge || item.solution || item.outcome);
  const gallery = [
    ...(row.coverUrl ? [{ url: row.coverUrl, alt: title }] : []),
    ...item.media.filter((media) => media.url !== row.coverUrl),
  ];

  return (
    <article>
      {gallery.length > 0 ? (
        <div className="hero-circuit border-b border-outline">
          <div className="px-page mx-auto max-w-6xl py-8 md:py-10">
            <div className="grid gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={gallery[0].url}
                alt={gallery[0].alt}
                className="h-auto w-full max-w-full border border-outline object-cover"
              />
              {gallery.length > 1 ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {gallery.slice(1).map((media) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={media.url}
                      src={media.url}
                      alt={media.alt}
                      className="h-auto w-full max-w-full border border-outline object-cover"
                    />
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <div className="px-page mx-auto max-w-6xl py-10 md:py-14">
        {row.featured ? (
          <p className="mb-3 font-mono text-[11px] tracking-[0.22em] text-cta uppercase">FEATURED</p>
        ) : null}
        <h1 className={`text-fluid-hero break-words font-semibold ${latin ? "font-brand" : ""}`}>{title}</h1>
        {item.tags.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-2">
            {item.tags.map((tag) => (
              <li
                key={tag}
                className="inline-flex min-h-11 max-w-full items-center break-words border border-outline px-3 py-1.5 font-mono text-xs tracking-wide text-on-surface-variant"
              >
                {tag}
              </li>
            ))}
          </ul>
        ) : null}
        {summary ? <p className="text-fluid-lead mt-5 max-w-3xl text-on-surface-variant">{summary}</p> : null}
      </div>

      <div className="px-page mx-auto grid max-w-6xl min-w-0 gap-8 pb-16 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-10">
        <div className="grid gap-4">
          <CaseBlock kicker={dict.project.challenge} body={item.challenge} />
          <CaseBlock kicker={dict.project.solution} body={item.solution} />
          <CaseBlock kicker={dict.project.result} body={item.outcome} />
          {!hasCase && body ? (
            <div className="whitespace-pre-line leading-8 text-on-surface">{body}</div>
          ) : null}
        </div>

        <aside className="grid gap-4 self-start">
          {item.collaborators.length > 0 ? (
            <div className="ambient-card cyber-chamfer-sm min-w-0 p-4 sm:p-5">
              <p className="mb-3 font-mono text-[11px] tracking-[0.18em] text-cta uppercase">
                {dict.project.collaborators}
              </p>
              <ul className="grid gap-3 text-sm">
                {item.collaborators.map((c) => (
                  <li key={`${c.name}-${c.role}`}>
                    <p className="font-semibold">{c.name}</p>
                    <p className="text-on-surface-variant">{c.role}</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {item.stack.length > 0 ? (
            <div className="ambient-card cyber-chamfer-sm min-w-0 p-4 sm:p-5">
              <p className="mb-3 font-mono text-[11px] tracking-[0.18em] text-cta uppercase">
                {dict.project.stack}
              </p>
              <ul className="flex flex-wrap gap-2">
                {item.stack.map((tech) => (
                  <li
                    key={tech}
                    className="inline-flex min-h-11 max-w-full items-center break-words border border-outline px-3 py-1.5 font-mono text-xs text-on-surface-variant"
                  >
                    {tech}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>
      </div>

      <section className="bg-cta text-on-primary">
        <div className="px-page mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 py-10 md:flex-row md:items-center">
          <p className={`break-words text-xl font-semibold ${latin ? "font-brand" : ""}`}>{dict.actions.wantSimilar}</p>
          <Link
            href={localePath(locale, "/contact")}
            className="focus-cta inline-flex min-h-11 w-full items-center justify-center border border-on-primary px-5 py-3 font-semibold text-on-primary hover:bg-background hover:text-cta sm:w-auto"
          >
            {dict.actions.requestConsult}
          </Link>
        </div>
      </section>
    </article>
  );
}
