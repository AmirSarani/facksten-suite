import { DEFAULT_LOCALE, type Locale } from "@/lib/locale";

export function localePath(locale: Locale, href = "") {
  const clean = href.startsWith("/") ? href : `/${href}`;
  if (locale === DEFAULT_LOCALE) return clean === "/" ? "/" : clean;
  return `/${locale}${clean === "/" ? "" : clean}`;
}

export function switchLocalePath(pathname: string, next: Locale) {
  const parts = pathname.split("/").filter(Boolean);
  // usePathname() may include basePath segment in some setups — strip it
  if (parts[0] === "portfolio") parts.shift();
  if (parts[0] === "fa" || parts[0] === "en") parts.shift();
  const rest = parts.length ? `/${parts.join("/")}` : "/";
  return localePath(next, rest);
}
