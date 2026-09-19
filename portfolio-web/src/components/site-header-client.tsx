"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { BrandMark } from "@/components/brand-mark";
import { LangSwitcher } from "@/components/lang-switcher";
import type { Locale } from "@/lib/locale";

export type HeaderNavItem = {
  href: string;
  label: string;
  external: boolean;
};

function MenuIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}

export function SiteHeaderClient({
  locale,
  tagline,
  items,
  consultHref,
  consultLabel,
  navAriaLabel,
}: {
  locale: Locale;
  tagline: string;
  items: HeaderNavItem[];
  consultHref: string;
  consultLabel: string;
  navAriaLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [locale]);

  const linkClass =
    "focus-cta inline-flex min-h-11 items-center px-2.5 text-on-surface-variant hover:text-cta";
  const drawerLinkClass =
    "focus-cta flex min-h-11 items-center border-b border-outline/60 px-1 text-base font-semibold text-on-surface hover:text-cta";

  return (
    <header className="sticky top-0 z-40 max-w-full overflow-x-hidden border-b border-outline bg-background/85 backdrop-blur">
      <div className="px-page mx-auto flex max-w-6xl min-w-0 items-center justify-between gap-2 py-2 sm:gap-3">
        <div className="min-w-0 shrink">
          <BrandMark locale={locale} subtitle={tagline} />
        </div>
        <nav className="hidden items-center gap-1 text-sm lg:flex" aria-label={navAriaLabel}>
          {items.map((item) =>
            item.external ? (
              <a key={item.href} href={item.href} className={linkClass}>
                {item.label}
              </a>
            ) : (
              <Link key={item.href} href={item.href} className={linkClass}>
                {item.label}
              </Link>
            ),
          )}
        </nav>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Link
            href={consultHref}
            className="focus-cta bg-cta cyber-chamfer-sm hidden min-h-11 items-center whitespace-nowrap px-3 text-sm font-semibold sm:inline-flex sm:px-4"
          >
            {consultLabel}
          </Link>
          <LangSwitcher locale={locale} />
          <button
            type="button"
            className="focus-cta inline-flex h-11 w-11 min-h-11 min-w-11 items-center justify-center border border-outline text-cta hover:border-cta hover:bg-cta/10 lg:hidden"
            aria-label={open ? (locale === "fa" ? "بستن منو" : "Close menu") : locale === "fa" ? "باز کردن منو" : "Open menu"}
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen((v) => !v)}
          >
            <MenuIcon open={open} />
          </button>
        </div>
      </div>

      {open ? (
        <div className="lg:hidden" id={panelId}>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/55"
            aria-label={locale === "fa" ? "بستن" : "Close"}
            onClick={() => setOpen(false)}
          />
          <nav
            className="relative z-50 max-h-[min(70vh,28rem)] overflow-y-auto overscroll-contain border-t border-outline bg-background px-page py-3 shadow-[var(--box-shadow-neon-sm)]"
            aria-label={locale === "fa" ? "منوی موبایل" : "Mobile menu"}
          >
            {items.map((item) =>
              item.external ? (
                <a key={item.href} href={item.href} className={drawerLinkClass} onClick={() => setOpen(false)}>
                  {item.label}
                </a>
              ) : (
                <Link key={item.href} href={item.href} className={drawerLinkClass} onClick={() => setOpen(false)}>
                  {item.label}
                </Link>
              ),
            )}
            <Link
              href={consultHref}
              className="focus-cta bg-cta cyber-chamfer-sm mt-3 inline-flex min-h-11 w-full items-center justify-center px-4 text-sm font-semibold"
              onClick={() => setOpen(false)}
            >
              {consultLabel}
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
