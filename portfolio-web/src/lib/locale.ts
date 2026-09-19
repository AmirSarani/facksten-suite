export const LOCALES = ["fa", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "fa";

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "fa" || value === "en";
}

export function parseLocale(value: string | undefined | null): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export function localeDir(locale: Locale): "rtl" | "ltr" {
  return locale === "fa" ? "rtl" : "ltr";
}

export function pickLocalized(
  row: Record<string, unknown>,
  locale: Locale,
  field: string,
): string {
  const suffix = locale === "en" ? "En" : "Fa";
  const value = row[`${field}${suffix}`];
  return typeof value === "string" ? value : "";
}
