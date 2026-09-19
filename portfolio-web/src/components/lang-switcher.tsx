"use client";

import { usePathname } from "next/navigation";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/locale";
import { switchLocalePath } from "@/lib/paths";

const BASE = (process.env.NEXT_PUBLIC_BASE_PATH || "/portfolio").replace(/\/$/, "");

function withBase(path: string) {
  if (!BASE) return path;
  if (path === "/") return BASE; // no trailing slash — Next returns empty body for /portfolio/
  return `${BASE}${path}`;
}

export function LangSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname() || "/";
  const copy = t(locale);

  return (
    <div className="flex items-center border border-outline p-0.5 font-mono text-xs">
      {(["fa", "en"] as const).map((code) => {
        const active = locale === code;
        const href = withBase(switchLocalePath(pathname, code));
        return (
          <a
            key={code}
            href={href}
            hrefLang={code}
            className={`focus-cta inline-flex min-h-11 min-w-11 items-center justify-center ${
              active ? "bg-cta text-on-primary" : "text-on-surface-variant hover:text-cta"
            }`}
            aria-current={active ? "true" : undefined}
          >
            {copy.lang[code]}
          </a>
        );
      })}
    </div>
  );
}
