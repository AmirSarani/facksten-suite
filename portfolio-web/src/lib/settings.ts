import { prisma } from "@/lib/db";
import { t, type Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/locale";

export type ChromeSetting = {
  brand?: string;
  tagline?: { fa: string; en: string };
  nav?: Partial<Dictionary["nav"]>;
};

export type HeroSetting = {
  kicker?: { fa: string; en: string };
  title?: { fa: string; en: string };
  lead?: { fa: string; en: string };
  ctaPrimary?: { fa: string; en: string };
  ctaSecondary?: { fa: string; en: string };
};

export type ContactSetting = {
  email?: string;
  phone?: string;
  whatsapp?: string;
  address?: { fa: string; en: string };
  hours?: { fa: string; en: string };
};

export type AboutSetting = {
  title?: { fa: string; en: string };
  body?: { fa: string; en: string };
};

export type LegalSetting = {
  privacy?: { fa: string; en: string };
  terms?: { fa: string; en: string };
};

export type FooterSetting = {
  blurb?: { fa: string; en: string };
  marketUrl?: string;
  marketLabel?: { fa: string; en: string };
};

export type TrustStat = {
  value: string;
  label?: { fa: string; en: string };
};

export type TrustSetting = {
  title?: { fa: string; en: string };
  lead?: { fa: string; en: string };
  stats?: TrustStat[];
};

export type SettingsMap = {
  chrome?: ChromeSetting;
  hero?: HeroSetting;
  contact?: ContactSetting;
  about?: AboutSetting;
  legal?: LegalSetting;
  footer?: FooterSetting;
  trust?: TrustSetting;
};

function parseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export async function getSettingsMap(): Promise<SettingsMap> {
  const rows = await prisma.siteSetting.findMany();
  const map: SettingsMap = {};
  for (const row of rows) {
    const parsed = parseJson(row.valueJson);
    if (parsed && typeof parsed === "object") {
      (map as Record<string, unknown>)[row.key] = parsed;
    }
  }
  return map;
}

export function pickCopy(
  pair: { fa: string; en: string } | undefined,
  locale: Locale,
  fallback: string,
) {
  if (!pair) return fallback;
  return pair[locale] || fallback;
}

export function navCopy(settings: SettingsMap, locale: Locale) {
  const dict = t(locale);
  const nav = settings.chrome?.nav;
  return {
    home: nav?.home ?? dict.nav.home,
    services: nav?.services ?? dict.nav.services,
    projects: nav?.projects ?? dict.nav.projects,
    about: nav?.about ?? dict.nav.about,
    contact: nav?.contact ?? dict.nav.contact,
    shop: (nav as { shop?: string } | undefined)?.shop ?? dict.nav.shop,
  };
}
