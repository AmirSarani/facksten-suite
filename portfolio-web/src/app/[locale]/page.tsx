import Link from "next/link";
import { notFound } from "next/navigation";
import { ProjectCard } from "@/components/project-card";
import { SectionHeading } from "@/components/section-heading";
import { ServiceCard } from "@/components/service-card";
import { TeamCard } from "@/components/team-card";
import { TrustBand } from "@/components/trust-band";
import {
  localizeProject,
  localizeService,
  localizeTeam,
  publishedProjects,
  publishedServices,
  publishedTeam,
} from "@/lib/content";
import { t } from "@/lib/i18n";
import { isLocale } from "@/lib/locale";
import { localePath } from "@/lib/paths";
import { getSettingsMap, pickCopy } from "@/lib/settings";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw;
  const dict = t(locale);
  const [settings, services, projects, team] = await Promise.all([
    getSettingsMap(),
    publishedServices(),
    publishedProjects(),
    publishedTeam(),
  ]);

  const hero = settings.hero;
  const kicker = pickCopy(hero?.kicker, locale, "FACKSTEN // STUDIO");
  const title = pickCopy(
    hero?.title,
    locale,
    locale === "fa" ? "سیستم می‌سازیم." : "We ship systems.",
  );
  const lead = pickCopy(hero?.lead, locale, dict.pages.servicesLead);
  const ctaPrimary = pickCopy(hero?.ctaPrimary, locale, dict.nav.projects);
  const ctaSecondary = pickCopy(hero?.ctaSecondary, locale, dict.actions.requestConsult);
  const featured = projects.filter((p) => p.featured).slice(0, 2);

  return (
    <>
      <section className="hero-circuit px-page border-b border-outline">
        <div className="mx-auto max-w-6xl py-16 md:py-24">
          <p className="font-mono text-[11px] tracking-[0.12em] text-cta uppercase sm:tracking-[0.28em]">{kicker}</p>
          <h1
            className={`cyber-glitch text-fluid-hero mt-4 max-w-3xl break-words font-semibold ${locale === "en" ? "font-brand" : ""}`}
            data-text={title}
          >
            {title}
          </h1>
          <p className="text-fluid-lead mt-6 max-w-2xl text-on-surface-variant">{lead}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={localePath(locale, "/projects")}
              className="focus-cta bg-cta cyber-chamfer-sm inline-flex min-h-11 w-full items-center justify-center px-5 py-3 font-semibold sm:w-auto"
            >
              {ctaPrimary}
            </Link>
            <Link
              href={localePath(locale, "/contact")}
              className="focus-cta cyber-chamfer-sm inline-flex min-h-11 w-full items-center justify-center border border-outline px-5 py-3 hover:border-primary-container hover:text-cta sm:w-auto"
            >
              {ctaSecondary}
            </Link>
          </div>
        </div>
      </section>

      <section className="px-page mx-auto max-w-6xl py-section">
        <div className="mb-8 flex min-w-0 items-end justify-between gap-4">
          <SectionHeading kicker="01" title={dict.home.services} latin={locale === "en"} />
          <Link href={localePath(locale, "/services")} className="focus-cta hidden text-sm text-cta md:inline">
            {dict.actions.viewAll}
          </Link>
        </div>
        {services.length === 0 ? (
          <p className="text-on-surface-variant">{dict.empty.services}</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {services.slice(0, 4).map((row, index) => {
              const item = localizeService(row, locale);
              return (
                <ServiceCard
                  key={row.slug}
                  index={index}
                  title={String(item.title)}
                  summary={String(item.summary)}
                  latin={locale === "en"}
                />
              );
            })}
          </div>
        )}
      </section>

      <section className="cyber-grid border-y border-outline">
        <div className="px-page mx-auto max-w-6xl py-section">
          <SectionHeading kicker="02" title={dict.home.featured} latin={locale === "en"} />
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            {(featured.length ? featured : projects.slice(0, 2)).map((row) => {
              const item = localizeProject(row, locale);
              return (
                <ProjectCard
                  key={row.slug}
                  locale={locale}
                  slug={row.slug}
                  title={String(item.title)}
                  summary={String(item.summary)}
                  coverUrl={row.coverUrl}
                  featured={row.featured}
                />
              );
            })}
          </div>
        </div>
      </section>

      <TrustBand locale={locale} trust={settings.trust} />

      <section className="px-page mx-auto max-w-6xl py-section">
        <div className="mb-8 flex min-w-0 items-end justify-between gap-4">
          <SectionHeading kicker="04" title={dict.home.team} latin={locale === "en"} />
          <Link href={localePath(locale, "/about")} className="focus-cta hidden text-sm text-cta md:inline">
            {dict.actions.viewAll}
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {team.slice(0, 3).map((row) => {
            const item = localizeTeam(row, locale);
            return (
              <TeamCard
                key={row.id}
                name={String(item.name)}
                role={String(item.role)}
                bio={String(item.bio)}
                photoUrl={row.photoUrl}
                latin={locale === "en"}
              />
            );
          })}
        </div>
      </section>

      <section className="bg-cta text-on-primary">
        <div className="px-page mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 py-10 md:flex-row md:items-center">
          <p className={`text-xl font-semibold ${locale === "en" ? "font-brand" : ""}`}>
            {dict.actions.contact}
          </p>
          <Link
            href={localePath(locale, "/contact")}
            className="focus-cta inline-flex min-h-11 w-full items-center justify-center border border-on-primary px-5 py-3 font-semibold text-on-primary hover:bg-background hover:text-cta sm:w-auto"
          >
            {dict.nav.contact}
          </Link>
        </div>
      </section>
    </>
  );
}
