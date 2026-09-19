import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SectionHeading } from "@/components/section-heading";
import { TeamCard } from "@/components/team-card";
import { localizeTeam, publishedTeam } from "@/lib/content";
import { t } from "@/lib/i18n";
import { isLocale } from "@/lib/locale";
import { getSettingsMap, pickCopy } from "@/lib/settings";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: t(locale).pages.aboutTitle };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw;
  const dict = t(locale);
  const [settings, team] = await Promise.all([getSettingsMap(), publishedTeam()]);
  const title = pickCopy(settings.about?.title, locale, dict.pages.aboutTitle);
  const body = pickCopy(settings.about?.body, locale, "");

  return (
    <div className="px-page mx-auto max-w-6xl py-section">
      <SectionHeading kicker="ABOUT" title={title} latin={locale === "en"} />
      <p className="mt-8 max-w-3xl break-words whitespace-pre-line leading-8 text-on-surface-variant">{body}</p>
      <h2 className={`mt-14 text-fluid-title font-semibold ${locale === "en" ? "font-brand" : ""}`}>
        {dict.home.team}
      </h2>
      {team.length === 0 ? (
        <p className="mt-6 text-on-surface-variant">{dict.empty.team}</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {team.map((row) => {
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
      )}
    </div>
  );
}
