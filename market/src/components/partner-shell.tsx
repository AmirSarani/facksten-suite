"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { LogoutButton } from "@/components/logout-button";
import { Icon, type IconName } from "@/components/icon";

const links: { href: string; label: string; icon: IconName }[] = [
  { href: "/partner", label: "داشبورد", icon: "home_iot_device" },
  { href: "/partner/inventory", label: "موجودی", icon: "schema" },
  { href: "/partner/orders", label: "فروش", icon: "shopping_cart" },
  { href: "/partner/tickets", label: "تیکت‌ها", icon: "mail" },
  { href: "/partner/settings", label: "تنظیمات", icon: "person" },
];

function navActive(href: string, active: string | undefined, pathname: string) {
  if (href === "/partner") return (active ?? pathname) === "/partner";
  if (href === "/partner/inventory") {
    return (active ?? "").startsWith("/partner/inventory") || pathname.startsWith("/partner/inventory");
  }
  return (active ?? "") === href || pathname === href || pathname.startsWith(`${href}/`);
}

export function PartnerShell({
  title,
  subtitle,
  children,
  active,
  actions,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  active?: string;
  actions?: React.ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <div className="panel-shell min-h-screen max-w-[100vw] overflow-x-hidden bg-surface-container-low">
      <header className="sticky top-0 z-40 border-b border-surface-variant/80 bg-surface/95 px-3 py-2.5 backdrop-blur supports-[padding:max(0px)]:pt-[max(0.625rem,env(safe-area-inset-top))] lg:hidden">
        <div className="mx-auto flex max-w-[1400px] items-center gap-2">
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-controls="partner-mobile-nav"
            onClick={() => setMenuOpen(true)}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center cyber-chamfer-sm border border-outline bg-surface text-on-surface hover:border-primary-container"
          >
            <Icon name="menu" className="h-5 w-5" />
            <span className="sr-only">منوی پنل</span>
          </button>
          <div className="min-w-0 flex-1">
            <BrandLogo size="sm" href="/partner" />
          </div>
          <Link href="/" className="inline-flex h-11 items-center cyber-chamfer-sm px-2.5 text-xs font-semibold text-primary-container">
            فروشگاه
          </Link>
        </div>
      </header>

      {menuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal aria-labelledby={titleId}>
          <button type="button" className="absolute inset-0 bg-black/40" aria-label="بستن منو" onClick={() => setMenuOpen(false)} />
          <aside id="partner-mobile-nav" className="absolute inset-y-0 right-0 flex w-[min(100%,20rem)] flex-col bg-surface p-4 shadow-xl supports-[padding:max(0px)]:pb-[max(1rem,env(safe-area-inset-bottom))] supports-[padding:max(0px)]:pt-[max(1rem,env(safe-area-inset-top))]">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <BrandLogo size="sm" href="/partner" />
                <p id={titleId} className="mt-1 text-sm text-on-surface-variant">
                  پنل نمایندگان
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="inline-flex h-11 w-11 items-center justify-center cyber-chamfer-sm border border-outline"
              >
                <Icon name="close" className="h-4 w-4" />
              </button>
            </div>
            <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
              {links.map((l) => {
                const on = navActive(l.href, active, pathname);
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setMenuOpen(false)}
                    className={
                      on
                        ? "flex min-h-11 items-center gap-2 cyber-chamfer-sm border border-primary-container bg-primary-container/15 px-3 py-2.5 text-sm font-bold text-primary-container shadow-[var(--box-shadow-neon-sm)]"
                        : "flex min-h-11 items-center gap-2 cyber-chamfer-sm px-3 py-2.5 text-sm font-semibold text-on-surface-variant hover:bg-surface-container hover:text-primary-container"
                    }
                  >
                    <Icon name={l.icon} className="h-4 w-4" />
                    {l.label}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-4 space-y-2 border-t border-surface-variant pt-4">
              <Link href="/" onClick={() => setMenuOpen(false)} className="block text-sm text-on-surface-variant">
                مشاهده فروشگاه
              </Link>
              <LogoutButton />
            </div>
          </aside>
        </div>
      ) : null}

      <div className="mx-auto grid max-w-[1400px] grid-cols-1 min-w-0 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="hidden border-surface-variant bg-surface lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-l lg:p-5">
          <div className="mb-8">
            <BrandLogo size="sm" href="/partner" />
            <p className="mt-1 text-sm text-on-surface-variant">پنل نمایندگان</p>
          </div>
          <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
            {links.map((l) => {
              const on = navActive(l.href, active, pathname);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={
                    on
                      ? "flex min-h-11 items-center gap-2 cyber-chamfer-sm border border-primary-container bg-primary-container/15 px-3 py-2.5 text-sm font-bold text-primary-container shadow-[var(--box-shadow-neon-sm)]"
                      : "flex min-h-11 items-center gap-2 cyber-chamfer-sm px-3 py-2.5 text-sm font-semibold text-on-surface-variant hover:bg-surface-container hover:text-primary-container"
                  }
                >
                  <Icon name={l.icon} className="h-4 w-4" />
                  {l.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-6 space-y-2 border-t border-surface-variant pt-4 text-sm">
            <Link href="/" className="block text-on-surface-variant hover:text-primary">
              مشاهده فروشگاه
            </Link>
            <LogoutButton />
          </div>
        </aside>

        <div className="min-w-0 p-3 sm:p-5 lg:p-8">
          <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-on-surface sm:text-fluid-title">{title}</h1>
              {subtitle ? <p className="mt-1 text-sm text-on-surface-variant sm:text-base">{subtitle}</p> : null}
            </div>
            {actions ? (
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">
                {actions}
              </div>
            ) : null}
          </div>
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
