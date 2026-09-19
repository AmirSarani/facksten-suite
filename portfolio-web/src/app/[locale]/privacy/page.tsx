import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SectionHeading } from "@/components/section-heading";
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
  return { title: t(locale).pages.privacyTitle };
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw;
  const dict = t(locale);
  const settings = await getSettingsMap();
  return (
    <div className="px-page mx-auto max-w-3xl py-section">
      <SectionHeading title={dict.pages.privacyTitle} latin={locale === "en"} />
      <p className="mt-8 break-words whitespace-pre-line leading-8 text-on-surface-variant">
        {pickCopy(settings.legal?.privacy, locale, "")}
      </p>
    </div>
  );
}
