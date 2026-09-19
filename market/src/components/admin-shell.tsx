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
    label: "عملیات",
    items: [
      { href: "/admin", label: "داشبورد", icon: "schema" },
      { href: "/admin/orders", label: "سفارش‌ها", icon: "shopping_cart" },
      { href: "/admin/tickets", label: "تیکت‌ها", icon: "mail" },
      { href: "/admin/reviews", label: "نظرات", icon: "check_circle" },
    ],
  },
  {
    label: "کاتالوگ",
    items: [
      { href: "/admin/categories", label: "دسته‌بندی‌ها", icon: "inventory_2" },
      { href: "/admin/products", label: "محصولات", icon: "memory" },
      { href: "/admin/products/new", label: "محصول جدید", icon: "new_releases" },
    ],
  },
  {
    label: "محتوا و سیستم",
    items: [
      { href: "/admin/articles", label: "مقالات", icon: "folder_zip" },
      { href: "/admin/users", label: "کاربران", icon: "person" },
      { href: "/admin/settings", label: "تنظیمات سایت", icon: "settings_ethernet" },
    ],
  },
];

function isActive(active: string | undefined, href: string) {
  if (!active) return href === "/admin";
  if (href === "/admin") return active === "/admin";
  if (href === "/admin/products/new") return active === "/admin/products/new";
  if (href === "/admin/products")
    return active === "/admin/products" || (active.startsWith("/admin/products/") && active !== "/admin/products/new");
  if (href === "/admin/articles") return active === "/admin/articles" || active.startsWith("/admin/articles/");
  return active === href || active.startsWith(`${href}/`);
}

function NavLinks({
  active,
  onNavigate,
  stacked,
}: {
  active?: string;
  onNavigate?: () => void;
  stacked?: boolean;
}) {
  return (
    <nav className={stacked ? "min-h-0 space-y-4 overflow-y-auto overscroll-contain pe-1" : "space-y-4"}>
      {navGroups.map((group) => (
        <div key={group.label}>
          <p className="mb-1.5 px-2 text-[11px] font-bold tracking-wide text-on-surface-variant uppercase">
            {group.label}
          </p>
          <div className={stacked ? "flex flex-col gap-0.5" : "flex flex-col gap-0.5"}>
            {group.items.map((l) => {
              const on = isActive(active, l.href);
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

function FooterLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="space-y-2 border-t border-surface-variant pt-4">
      <Link
        href="/"
        onClick={onNavigate}
        className="flex min-h-11 items-center cyber-chamfer-sm px-3 text-sm font-semibold text-primary-container hover:bg-primary-container/10"
      >
        مشاهده فروشگاه
      </Link>
      <LogoutButton />
    </div>
  );
}

export function AdminShell({
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
      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 border-b border-surface-variant/80 bg-surface/95 px-3 py-2.5 backdrop-blur supports-[padding:max(0px)]:pt-[max(0.625rem,env(safe-area-inset-top))] lg:hidden">
        <div className="mx-auto flex max-w-[1440px] items-center gap-2">
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-controls="admin-mobile-nav"
            onClick={() => setMenuOpen(true)}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center cyber-chamfer-sm border border-outline bg-surface text-on-surface hover:border-primary-container"
          >
            <Icon name="menu" className="h-5 w-5" />
            <span className="sr-only">منوی کنسول</span>
          </button>
          <div className="min-w-0 flex-1">
            <BrandLogo size="sm" href="/admin" />
          </div>
          <Link
            href="/"
            className="inline-flex h-11 items-center cyber-chamfer-sm px-2.5 text-xs font-semibold text-primary-container"
          >
            فروشگاه
          </Link>
        </div>
      </header>

      {/* Mobile drawer */}
      {menuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal aria-labelledby={titleId}>
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="بستن منو"
            onClick={() => setMenuOpen(false)}
          />
          <aside
            id="admin-mobile-nav"
            className="absolute inset-y-0 right-0 flex w-[min(100%,20rem)] flex-col bg-surface p-4 shadow-xl supports-[padding:max(0px)]:pb-[max(1rem,env(safe-area-inset-bottom))] supports-[padding:max(0px)]:pt-[max(1rem,env(safe-area-inset-top))]"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <BrandLogo size="sm" href="/admin" />
                <p id={titleId} className="mt-1 text-sm text-on-surface-variant">
                  کنسول مدیریت
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
              <NavLinks active={active} onNavigate={() => setMenuOpen(false)} stacked />
            </div>
            <div className="mt-4 shrink-0">
              <FooterLinks onNavigate={() => setMenuOpen(false)} />
            </div>
          </aside>
        </div>
      ) : null}

      <div className="mx-auto grid max-w-[1440px] grid-cols-1 min-w-0 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* Desktop sidebar */}
        <aside className="hidden border-surface-variant bg-surface lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:overflow-hidden lg:border-l lg:p-5">
          <div className="mb-6 shrink-0">
            <BrandLogo size="sm" href="/admin" />
            <p className="mt-1 text-sm text-on-surface-variant">کنسول مدیریت</p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pe-1">
            <NavLinks active={active} stacked />
          </div>
          <div className="mt-6 shrink-0">
            <FooterLinks />
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
