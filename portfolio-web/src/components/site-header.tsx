import { SiteHeaderClient } from "@/components/site-header-client";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/locale";
import { localePath } from "@/lib/paths";
import { navCopy, pickCopy, type SettingsMap } from "@/lib/settings";

const MARKET_URL = (process.env.NEXT_PUBLIC_MARKET_URL || "http://77.221.156.164/facksten").replace(/\/$/, "");

export function SiteHeader({ locale, settings }: { locale: Locale; settings: SettingsMap }) {
  const dict = t(locale);
  const nav = navCopy(settings, locale);
  const tagline = pickCopy(settings.chrome?.tagline, locale, locale === "fa" ? "استودیو سیستم" : "Systems studio");
  const items = [
    { href: localePath(locale, "/"), label: nav.home, external: false },
    { href: localePath(locale, "/services"), label: nav.services, external: false },
    { href: localePath(locale, "/projects"), label: nav.projects, external: false },
    { href: localePath(locale, "/about"), label: nav.about, external: false },
    { href: localePath(locale, "/contact"), label: nav.contact, external: false },
    { href: MARKET_URL, label: nav.shop, external: true },
  ];

  return (
    <SiteHeaderClient
      locale={locale}
      tagline={tagline}
      items={items}
      consultHref={localePath(locale, "/contact")}
      consultLabel={dict.actions.requestConsult}
      navAriaLabel={nav.home}
    />
  );
}
