import Link from "next/link";
import { toTelHref } from "@/lib/contact-href";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/locale";
import { localePath } from "@/lib/paths";
import { navCopy, pickCopy, type SettingsMap } from "@/lib/settings";

export function SiteFooter({ locale, settings }: { locale: Locale; settings: SettingsMap }) {
  const dict = t(locale);
  const nav = navCopy(settings, locale);
  const blurb = pickCopy(
    settings.footer?.blurb,
    locale,
    locale === "fa" ? "استودیو فکستن" : "Facksten studio",
  );
  const year = new Date().getFullYear();
  const phone = settings.contact?.phone;
  const tel = toTelHref(phone);
  const marketUrl = settings.footer?.marketUrl;
  const marketLabel = pickCopy(settings.footer?.marketLabel, locale, dict.footer.market);

  return (
    <footer className="mt-auto border-t border-outline bg-surface-container-lowest">
      <div className="px-page mx-auto grid max-w-6xl grid-cols-1 gap-8 py-10 sm:grid-cols-2 md:grid-cols-3">
        <div>
          <p className="brand-logo__word text-cta">Facksten</p>
          <p className="mt-2 break-words text-sm text-on-surface-variant">{blurb}</p>
          {tel && phone ? (
            <a href={tel} className="focus-cta mt-3 inline-flex min-h-11 items-center font-mono text-sm text-cta">
              {phone}
            </a>
          ) : null}
        </div>
        <div className="flex flex-col gap-1 text-sm">
          <Link className="focus-cta inline-flex min-h-11 items-center hover:text-cta" href={localePath(locale, "/services")}>
            {nav.services}
          </Link>
          <Link className="focus-cta inline-flex min-h-11 items-center hover:text-cta" href={localePath(locale, "/projects")}>
            {nav.projects}
          </Link>
          <Link className="focus-cta inline-flex min-h-11 items-center hover:text-cta" href={localePath(locale, "/about")}>
            {nav.about}
          </Link>
          <Link className="focus-cta inline-flex min-h-11 items-center hover:text-cta" href={localePath(locale, "/contact")}>
            {nav.contact}
          </Link>
        </div>
        <div className="flex flex-col gap-1 text-sm">
          <p className="font-mono text-[10px] tracking-[0.18em] text-on-surface-variant uppercase">
            {dict.footer.legal}
          </p>
          <Link className="focus-cta inline-flex min-h-11 items-center hover:text-cta" href={localePath(locale, "/privacy")}>
            {dict.footer.privacy}
          </Link>
          <Link className="focus-cta inline-flex min-h-11 items-center hover:text-cta" href={localePath(locale, "/terms")}>
            {dict.footer.terms}
          </Link>
          {marketUrl ? (
            <a
              className="focus-cta inline-flex min-h-11 items-center hover:text-cta"
              href={marketUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {marketLabel}
            </a>
          ) : null}
        </div>
      </div>
      <p className="px-page mx-auto max-w-6xl border-t border-outline py-4 font-mono text-[11px] text-on-surface-variant">
        © {year} Facksten
      </p>
    </footer>
  );
}
