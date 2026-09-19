import { parseLocale, type Locale } from "@/lib/locale";
import type { LegalSetting, SettingsMap } from "@/lib/settings";

export const LEGAL_PAGES = ["privacy", "terms"] as const;
export type LegalPage = (typeof LEGAL_PAGES)[number];

export function isLegalPage(value: string): value is LegalPage {
  return value === "privacy" || value === "terms";
}

export function resolveLegalBody(
  settings: SettingsMap,
  page: string,
  localeRaw: string | null | undefined,
): { page: LegalPage; locale: Locale; body: string } | null {
  if (!isLegalPage(page)) return null;
  const locale = parseLocale(localeRaw);
  const body = settings.legal?.[page]?.[locale];
  if (!body) return null;
  return { page, locale, body };
}

export function normalizeLegal(value?: {
  privacy?: { fa?: string; en?: string };
  terms?: { fa?: string; en?: string };
}): Required<LegalSetting> {
  return {
    privacy: { fa: value?.privacy?.fa ?? "", en: value?.privacy?.en ?? "" },
    terms: { fa: value?.terms?.fa ?? "", en: value?.terms?.en ?? "" },
  };
}
