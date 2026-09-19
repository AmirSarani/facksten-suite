import { notFound } from "next/navigation";
import { LocaleHtmlAttrs } from "@/components/locale-html-attrs";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { isLocale, LOCALES, type Locale } from "@/lib/locale";
import { getSettingsMap } from "@/lib/settings";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  const settings = await getSettingsMap();

  return (
    <>
      <LocaleHtmlAttrs locale={locale} />
      <SiteHeader locale={locale} settings={settings} />
      <main className="min-w-0 max-w-full flex-1 overflow-x-hidden">{children}</main>
      <SiteFooter locale={locale} settings={settings} />
    </>
  );
}
