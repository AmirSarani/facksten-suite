import { SectionHeading } from "@/components/section-heading";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/locale";
import { pickCopy, type TrustSetting } from "@/lib/settings";

const FALLBACK_STATS = [
  { value: "3+", label: { fa: "سامانه منتشرشده", en: "Published systems" } },
  { value: "HW / FW / UI", label: { fa: "حوزه ساخت", en: "Build domains" } },
  { value: "<1s", label: { fa: "تأخیر پنل پایش", en: "Monitoring panel lag" } },
  { value: "FA + EN", label: { fa: "تحویل دوزبانه", en: "Bilingual delivery" } },
] as const;

export function TrustBand({
  locale,
  trust,
}: {
  locale: Locale;
  trust?: TrustSetting;
}) {
  const dict = t(locale);
  const title = pickCopy(trust?.title, locale, dict.home.trust);
  const lead = pickCopy(trust?.lead, locale, "");
  const stats = (trust?.stats?.length ? trust.stats : FALLBACK_STATS).map((stat) => ({
    value: stat.value,
    label: pickCopy(stat.label, locale, ""),
  }));

  return (
    <section className="border-b border-outline bg-surface-container-lowest">
      <div className="px-page mx-auto max-w-6xl py-section">
        <SectionHeading kicker="03" title={title} lead={lead || undefined} latin={locale === "en"} />
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={`${stat.value}-${stat.label}`}
              className="ambient-card cyber-chamfer-sm min-w-0 p-4 sm:p-5"
            >
              <p
                className={`break-words text-2xl font-semibold text-cta ${locale === "en" ? "font-brand" : ""}`}
              >
                {stat.value}
              </p>
              <p className="mt-2 break-words text-sm text-on-surface-variant">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
