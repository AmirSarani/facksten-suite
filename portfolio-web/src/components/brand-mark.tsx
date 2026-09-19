import Link from "next/link";
import { localePath } from "@/lib/paths";
import type { Locale } from "@/lib/locale";

export function BrandMark({ locale, subtitle }: { locale: Locale; subtitle?: string }) {
  return (
    <Link href={localePath(locale)} className="focus-cta group flex min-w-0 items-center gap-2 sm:gap-3">
      <span className="brand-logo__mark-face relative grid h-10 w-10 shrink-0 place-items-center">
        <span className="brand-logo__word text-sm font-semibold text-cta">F</span>
      </span>
      <span className="min-w-0 leading-tight">
        <span className="brand-logo__word block truncate text-base font-semibold text-on-surface group-hover:text-cta">
          Facksten
        </span>
        {subtitle ? (
          <span className="mt-0.5 hidden truncate font-mono text-[10px] tracking-[0.18em] text-on-surface-variant uppercase sm:block">
            {subtitle}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
