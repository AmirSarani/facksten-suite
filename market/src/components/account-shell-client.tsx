"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { LogoutButton } from "@/components/logout-button";
import { Icon, type IconName } from "@/components/icon";

type NavItem = { href: string; label: string; icon: IconName };
type NavGroup = { label: string; items: NavItem[] };

const navGroups: NavGroup[] = [
  {
    label: "خلاصه",
    items: [{ href: "/account", label: "داشبورد", icon: "schema" }],
  },
  {
    label: "خرید و سفارش",
    items: [
      { href: "/account/orders", label: "سفارش‌ها", icon: "shopping_cart" },
      { href: "/account/downloads", label: "دانلودها", icon: "folder_zip" },
      { href: "/account/wishlist", label: "علاقه‌مندی", icon: "favorite" },
    ],
  },
  {
    label: "ارتباط و حساب",
    items: [
      { href: "/account/tickets", label: "پیام‌ها", icon: "mail" },
      { href: "/account/reviews", label: "نظرات", icon: "star" },
      { href: "/account/settings", label: "تنظیمات", icon: "lock" },
    ],
  },
];

function isActive(active: string | undefined, href: string, pathname: string) {
  const current = active || pathname;
  if (href === "/account") return current === "/account";
  return current === href || current.startsWith(`${href}/`);
}

function NavLinks({
  active,
  pathname,
  onNavigate,
}: {
  active?: string;
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="min-h-0 space-y-4 overflow-y-auto overscroll-contain pe-1">
      {navGroups.map((group) => (
        <div key={group.label}>
          <p className="mb-1.5 px-2 text-[11px] font-bold tracking-wide text-on-surface-variant uppercase">
            {group.label}
          </p>
          <div className="flex flex-col gap-0.5">
            {group.items.map((l) => {
              const on = isActive(active, l.href, pathname);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={onNavigate}
                  className={
                    on
                      ? "flex min-h-11 items-center gap-2.5 cyber-chamfer-sm bg-primary-container px-3 py-2.5 text-sm font-bold text-on-primary shadow-[var(--box-shadow-neon-sm)]"
                      : "flex min-h-11 items-center gap-2.5 cyber-chamfer-sm px-3 py-2.5 text-sm font-semibold text-on-surface-variant hover:bg-surface-container hover:text-primary-container"
                  }
                >
                  <Icon name={l.icon} className="h-4 w-4 shrink-0" />
                  {l.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function FooterBlock({
  user,
  onNavigate,
}: {
  user: { name: string; email: string } | null;
  onNavigate?: () => void;
}) {
  return (
    <div className="space-y-3 border-t border-surface-variant pt-4">
      {user ? (
        <div className="flex items-center gap-3 px-1">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center cyber-chamfer-sm border border-primary-container/40 bg-primary-container/15 text-sm font-bold text-primary-container">
            {user.name.trim().slice(0, 1) || "؟"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-xs text-on-surface-variant" dir="ltr">
              {user.email}
            </p>
          </div>
        </div>
      ) : null}
      <Link
        href="/"
        onClick={onNavigate}
        className="flex min-h-11 items-center cyber-chamfer-sm px-3 text-sm font-semibold text-primary-container hover:bg-primary-container/10"
      >
        مشاهده فروشگاه
      </Link>
      {user ? <LogoutButton /> : null}
    </div>
  );
}

export function AccountShellClient({
  title,
  subtitle,
  children,
  active,
  actions,
  user,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  active?: string;
  actions?: React.ReactNode;
  user: { name: string; email: string } | null;
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
        <div className="mx-auto flex max-w-[1440px] items-center gap-2">
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-controls="account-mobile-nav"
            onClick={() => setMenuOpen(true)}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center cyber-chamfer-sm border border-outline bg-surface text-on-surface hover:border-primary-container"
          >
            <Icon name="menu" className="h-5 w-5" />
            <span className="sr-only">منوی حساب</span>
          </button>
          <div className="min-w-0 flex-1">
            <BrandLogo size="sm" href="/account" />
          </div>
          <Link
            href="/"
            className="inline-flex h-11 items-center cyber-chamfer-sm px-2.5 text-xs font-semibold text-primary-container"
          >
            فروشگاه
          </Link>
        </div>
      </header>

      {menuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal aria-labelledby={titleId}>
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="بستن منو"
            onClick={() => setMenuOpen(false)}
          />
          <aside
            id="account-mobile-nav"
            className="absolute inset-y-0 right-0 flex w-[min(100%,20rem)] flex-col bg-surface p-4 shadow-xl supports-[padding:max(0px)]:pb-[max(1rem,env(safe-area-inset-bottom))] supports-[padding:max(0px)]:pt-[max(1rem,env(safe-area-inset-top))]"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <BrandLogo size="sm" href="/account" />
                <p id={titleId} className="mt-1 text-sm text-on-surface-variant">
                  پنل کاربری
                  {user ? ` · ${user.name}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center cyber-chamfer-sm border border-outline"
              >
                <Icon name="close" className="h-4 w-4" />
                <span className="sr-only">بستن</span>
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <NavLinks active={active} pathname={pathname} onNavigate={() => setMenuOpen(false)} />
            </div>
            <div className="mt-4 shrink-0">
              <FooterBlock user={user} onNavigate={() => setMenuOpen(false)} />
            </div>
          </aside>
        </div>
      ) : null}

      <div className="mx-auto grid max-w-[1440px] grid-cols-1 min-w-0 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="hidden border-surface-variant bg-surface lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:overflow-hidden lg:border-l lg:p-5">
          <div className="mb-6 shrink-0">
            <BrandLogo size="sm" href="/account" />
            <p className="mt-1 text-sm text-on-surface-variant">
              پنل کاربری
              {user ? ` · خوش آمدید، ${user.name}` : ""}
            </p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pe-1">
            <NavLinks active={active} pathname={pathname} />
          </div>
          <div className="mt-6 shrink-0">
            <FooterBlock user={user} />
          </div>
        </aside>

        <div className="min-w-0 p-3 sm:p-5 lg:p-8">
          <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
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
