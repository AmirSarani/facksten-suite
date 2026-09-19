"use client";

import { useEffect } from "react";
import { localeDir, type Locale } from "@/lib/locale";

/** Sync documentElement lang/dir when locale changes via client navigation. */
export function LocaleHtmlAttrs({ locale }: { locale: Locale }) {
  useEffect(() => {
    const root = document.documentElement;
    root.lang = locale;
    root.dir = localeDir(locale);
  }, [locale]);

  return null;
}
