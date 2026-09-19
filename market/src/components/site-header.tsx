"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useId, useRef, useState } from "react";
import { AuthNavLinks } from "@/components/auth-nav-links";
import { BrandLogo } from "@/components/brand-logo";
import { Icon, resolveIconName } from "@/components/icon";
import { useCart } from "@/components/cart-provider";
import { SITE, getHeaderNav, type NavItem } from "@/lib/site";

export type HeaderCategory = {
  slug: string;
  name: string;
  icon?: string | null;
  children: { slug: string; name: string; icon?: string | null }[];
};

function navActive(pathname: string, href: string, type: string | null) {
  if (href.startsWith("#")) return false;
  if (href === "/shop?type=digital") {
    return pathname === "/shop" && type === "digital";
  }
  if (href === "/shop") {
    // Don't treat digital filter as generic shop active
    if (pathname === "/shop" && type === "digital") return false;
    return pathname === "/shop" || pathname.startsWith("/shop/category") || pathname.startsWith("/product");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function HeaderNavAnchor({
  item,
  className,
  onClick,
}: {
  item: NavItem;
  className: string;
  onClick?: () => void;
}) {
  if (item.external) {
    return (
      <a href={item.href} rel="noopener noreferrer" className={className} onClick={onClick}>
        {item.label}
      </a>
    );
  }
  return (
    <Link href={item.href} prefetch className={className} onClick={onClick}>
      {item.label}
    </Link>
  );
}

export function SiteHeader({ categories = [] }: { categories?: HeaderCategory[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { count } = useCart();
  const [q, setQ] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [catsOpen, setCatsOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const [headerH, setHeaderH] = useState(112);
  const shopType = searchParams.get("type");
  const catsRef = useRef<HTMLDivElement>(null);
  const catsPanelId = useId();
  const headerNav = getHeaderNav();

  useEffect(() => {
    setMenuOpen(false);
    setCatsOpen(false);
  }, [pathname, shopType]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const measure = () => {
      setHeaderH(Math.ceil(header.getBoundingClientRect().height));
    };

    let compact = false;
    let ticking = false;

    const applyCompact = (next: boolean) => {
      if (next === compact) return;
      compact = next;
      header.classList.toggle("is-compact", next);
      header.querySelectorAll("[data-compact-hide]").forEach((node) => {
        node.setAttribute("aria-hidden", next ? "true" : "false");
      });
      // Remeasure after the CSS transition settles — avoids mid-animation jank
      window.setTimeout(measure, 560);
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY || document.documentElement.scrollTop || 0;
        // Hysteresis: hide later, show only near top — fewer toggles, smoother feel
        if (!compact && y > 56) applyCompact(true);
        else if (compact && y < 12) applyCompact(false);
        ticking = false;
      });
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
    };
  }, []);


  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!catsRef.current?.contains(e.target as Node)) setCatsOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setCatsOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const query = q.trim();
    router.push(query ? `/search?q=${encodeURIComponent(query)}` : "/search");
    setMenuOpen(false);
  }

  return (
    <>
      <header
        ref={headerRef}
        className="site-header fixed inset-x-0 top-0 z-50 max-w-[100vw] overflow-x-hidden border-b border-outline bg-surface-container-lowest/95 shadow-[var(--box-shadow-neon-sm)] backdrop-blur-xl supports-[backdrop-filter]:bg-surface-container-lowest/90"
      >
      <div className="site-header-collapse border-b border-outline bg-surface-container" data-compact-hide>
        <div className="site-header-collapse__inner">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-3 px-page py-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-on-surface-variant">
          <span className="flex min-w-0 items-center gap-1.5 truncate">
            <Icon name="local_shipping" className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">ارسال رایگان بالای ۱ میلیون تومان</span>
          </span>
          <div className="flex shrink-0 items-center gap-3 sm:gap-4">
            <Link href="/account/orders" prefetch className="flex items-center gap-1 transition-colors hover:text-primary-container">
              <Icon name="location_on" className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">پیگیری سفارش</span>
              <span className="sm:hidden">پیگیری</span>
            </Link>
            <Link href="/faq" prefetch className="hidden items-center gap-1 transition-colors hover:text-primary sm:flex">
              پشتیبانی
            </Link>
          </div>
        </div>
        </div>
      </div>

      <div className="border-b border-outline bg-surface-container-lowest">
        <div className="site-header-main-grid mx-auto grid max-w-[1280px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-page py-2.5 sm:gap-4 sm:py-3">
          <div className="flex min-w-0 items-center gap-1">
            <button
              type="button"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center cyber-chamfer-sm border border-outline text-primary-container hover:border-primary-container hover:bg-primary-container/10 lg:hidden"
              aria-label={menuOpen ? "بستن منو" : "باز کردن منو"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <Icon name={menuOpen ? "close" : "menu"} className="h-6 w-6" />
            </button>
            <BrandLogo size="md" className="min-w-0" />
          </div>

          <form
            onSubmit={onSearch}
            data-compact-hide
            className="site-header-search-desktop relative mx-auto hidden w-full max-w-xl lg:block"
          >
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="cyber-chamfer-sm h-11 w-full border border-outline bg-surface-container-low py-2 pr-10 pl-4 font-mono text-sm text-primary-container placeholder:text-on-surface-variant/50 focus:border-primary-container focus:shadow-[var(--box-shadow-neon-sm)] focus:outline-none"
              placeholder="جستجو در محصولات…"
              type="search"
            />
            <button type="submit" className="absolute top-1/2 right-3 -translate-y-1/2 text-primary-container" aria-label="جستجو">
              <Icon name="search" className="h-5 w-5" />
            </button>
          </form>

          <div className="flex items-center justify-end gap-0.5 text-primary-container sm:gap-1">
            <div className="hidden sm:block">
              <AuthNavLinks />
            </div>
            <Link
              href="/account/wishlist"
              prefetch
              className="focus-cta hidden h-10 w-10 cursor-pointer cyber-chamfer-sm items-center justify-center border border-transparent text-primary-container transition-all duration-150 hover:border-primary-container/40 hover:bg-primary-container/10 sm:inline-flex"
              aria-label="علاقه‌مندی"
            >
              <Icon name="favorite" className="h-5 w-5" />
            </Link>
            <Link
              href="/cart"
              prefetch
              className="focus-cta relative inline-flex h-10 w-10 cursor-pointer cyber-chamfer-sm items-center justify-center border border-transparent text-primary-container transition-all duration-150 hover:border-primary-container/40 hover:bg-primary-container/10"
              aria-label="سبد خرید"
            >
              <Icon name="shopping_cart" className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center bg-cta px-0.5 font-mono text-[10px] font-bold text-on-primary shadow-[var(--box-shadow-neon-sm)]">
                  {count > 9 ? "۹+" : count}
                </span>
              )}
            </Link>
          </div>
        </div>

        <div className="site-header-collapse border-t border-surface-variant/70 lg:hidden" data-compact-hide>
          <div className="site-header-collapse__inner">
          <div className="px-page py-2.5">
          <form onSubmit={onSearch} className="relative">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="cyber-chamfer-sm h-11 w-full border border-outline bg-surface-container-low py-2 pr-10 pl-4 font-mono text-sm text-primary-container focus:border-primary-container focus:shadow-[var(--box-shadow-neon-sm)] focus:outline-none"
              placeholder="جستجو در محصولات…"
              type="search"
            />
            <button type="submit" className="absolute top-1/2 right-3 -translate-y-1/2 text-primary-container" aria-label="جستجو">
              <Icon name="search" className="h-5 w-5" />
            </button>
          </form>
          </div>
          </div>
        </div>
      </div>

      {/* Secondary nav: desktop only — lives inside sticky header */}
      <div
        data-site-nav-sticky
        className="hidden overflow-x-hidden border-t border-outline lg:block"
      >
        <nav className="mx-auto flex max-w-[1280px] items-center gap-1 px-page py-2">
          <div className="relative shrink-0" ref={catsRef}>
            <button
              type="button"
              aria-expanded={catsOpen}
              aria-controls={catsPanelId}
              onClick={() => setCatsOpen((v) => !v)}
              className={`inline-flex items-center gap-1.5 cyber-chamfer-sm px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                catsOpen || pathname.startsWith("/shop/category")
                  ? "border border-primary-container/40 bg-primary-container/10 text-primary-container shadow-[var(--box-shadow-neon-sm)]"
                  : "border border-transparent text-on-surface hover:border-outline hover:bg-surface-container"
              }`}
            >
              <Icon name="menu" className="h-4 w-4" />
              دسته‌بندی
              <Icon name="chevron_left" className={`h-3.5 w-3.5 transition-transform ${catsOpen ? "-rotate-90" : "rotate-0"}`} />
            </button>
            {catsOpen && (
              <div
                id={catsPanelId}
                className="absolute top-[calc(100%+8px)] right-0 z-50 w-[min(96vw,880px)] cyber-chamfer overflow-hidden border border-outline bg-surface-container-lowest shadow-[var(--box-shadow-neon)]"
              >
                <div className="grid grid-cols-1 md:grid-cols-[1fr_200px]">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-5 p-5 sm:grid-cols-3 lg:grid-cols-4">
                    {categories.map((c) => {
                      const icon = resolveIconName(c.icon, "memory");
                      return (
                        <div key={c.slug} className="min-w-0">
                          <Link
                            href={`/shop/category/${c.slug}`}
                            className="mb-2 flex items-center gap-2 text-sm font-bold text-on-surface transition-colors hover:text-primary-container"
                            onClick={() => setCatsOpen(false)}
                          >
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center cyber-chamfer-sm bg-primary-container/10 text-primary-container">
                              <Icon name={icon} className="h-4 w-4" />
                            </span>
                            <span className="truncate">{c.name}</span>
                          </Link>
                          {c.children.length > 0 ? (
                            <ul className="space-y-1 pr-1">
                              {c.children.map((child) => (
                                <li key={child.slug}>
                                  <Link
                                    href={`/shop/category/${child.slug}`}
                                    className="block truncate rounded-md px-1 py-0.5 text-xs text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary-container"
                                    onClick={() => setCatsOpen(false)}
                                  >
                                    {child.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-[11px] text-on-surface-variant/70">مشاهده همه اقلام این دسته</p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex flex-col gap-3 border-t border-surface-variant bg-surface-container-low/60 p-4 md:border-t-0 md:border-r">
                    <p className="text-xs font-bold text-on-surface">میانبرها</p>
                    <Link
                      href="/shop?type=digital"
                      onClick={() => setCatsOpen(false)}
                      className="cyber-chamfer-sm border border-surface-variant bg-surface-container-lowest p-3 transition-colors hover:border-primary-container/40"
                    >
                      <Icon name="download" className="mb-1.5 h-4 w-4 text-primary-container" />
                      <p className="text-xs font-semibold text-on-surface">محصولات دیجیتال</p>
                      <p className="mt-0.5 text-[11px] leading-4 text-on-surface-variant">سورس، PCB و لایسنس</p>
                    </Link>
                    <Link
                      href="/shop?sort=popular"
                      onClick={() => setCatsOpen(false)}
                      className="cyber-chamfer-sm border border-surface-variant bg-surface-container-lowest p-3 transition-colors hover:border-primary-container/40"
                    >
                      <Icon name="bolt" className="mb-1.5 h-4 w-4 text-primary-container" />
                      <p className="text-xs font-semibold text-on-surface">پرفروش‌ها</p>
                      <p className="mt-0.5 text-[11px] leading-4 text-on-surface-variant">قطعات پرتقاضای کارگاه</p>
                    </Link>
                    <Link
                      href="/articles"
                      onClick={() => setCatsOpen(false)}
                      className="cyber-chamfer-sm border border-surface-variant bg-surface-container-lowest p-3 transition-colors hover:border-primary-container/40"
                    >
                      <Icon name="schema" className="mb-1.5 h-4 w-4 text-primary-container" />
                      <p className="text-xs font-semibold text-on-surface">مقالات فنی</p>
                      <p className="mt-0.5 text-[11px] leading-4 text-on-surface-variant">راهنمای انتخاب و راه‌اندازی</p>
                    </Link>
                    <Link
                      href="/shop"
                      onClick={() => setCatsOpen(false)}
                      className="mt-auto inline-flex items-center justify-center cyber-chamfer-sm bg-primary-container px-3 py-2.5 text-xs font-bold text-on-primary transition-colors hover:bg-[var(--cta-hover)]"
                    >
                      همه محصولات {SITE.name}
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          <span className="mx-1 h-4 w-px shrink-0 bg-surface-variant" />

          <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto no-scrollbar">
            {headerNav.map((item) => {
              const active = !item.external && navActive(pathname, item.href, shopType);
              return (
                <HeaderNavAnchor
                  key={item.label}
                  item={item}
                  className={
                    active
                      ? "shrink-0 cyber-chamfer-sm bg-primary-container/10 px-3 py-1.5 text-sm font-bold whitespace-nowrap text-primary"
                      : "shrink-0 cyber-chamfer-sm px-3 py-1.5 text-sm font-semibold whitespace-nowrap text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary-container"
                  }
                />
              );
            })}
          </div>
        </nav>

      </div>
      </header>
      <div data-site-header-spacer aria-hidden className="shrink-0 transition-[height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" style={{ height: headerH }} />


      {menuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button type="button" className="absolute inset-0 bg-on-surface/40" aria-label="بستن منو" onClick={() => setMenuOpen(false)} />
          <aside className="absolute top-0 right-0 flex h-full w-[min(88vw,340px)] flex-col bg-surface-container-lowest shadow-xl">
            <div className="flex items-center justify-between border-b border-surface-variant px-4 py-4">
              <BrandLogo size="sm" href={null} />
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center cyber-chamfer-sm hover:bg-surface-container"
                aria-label="بستن"
                onClick={() => setMenuOpen(false)}
              >
                <Icon name="close" className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto overscroll-contain p-3">
              <Link
                href="/"
                prefetch
                onClick={() => setMenuOpen(false)}
                className={`cyber-chamfer-sm px-3 py-3 text-sm font-semibold ${
                  pathname === "/" ? "border border-primary-container/40 bg-primary-container/10 text-primary-container shadow-[var(--box-shadow-neon-sm)]" : "border border-transparent text-on-surface hover:border-outline hover:bg-surface-container"
                }`}
              >
                خانه
              </Link>
              {headerNav.map((item) => {
                const active = !item.external && navActive(pathname, item.href, shopType);
                return (
                  <HeaderNavAnchor
                    key={item.label}
                    item={item}
                    className={`cyber-chamfer-sm px-3 py-3 text-sm font-semibold ${
                      active ? "border border-primary-container/40 bg-primary-container/10 text-primary-container shadow-[var(--box-shadow-neon-sm)]" : "border border-transparent text-on-surface hover:border-outline hover:bg-surface-container"
                    }`}
                    onClick={() => setMenuOpen(false)}
                  />
                );
              })}
              <div className="my-2 border-t border-surface-variant pt-2">
                <p className="px-3 pb-2 text-xs font-bold text-on-surface-variant">دسته‌بندی محصولات</p>
                {categories.map((c) => (
                  <div key={c.slug} className="mb-2">
                    <Link
                      href={`/shop/category/${c.slug}`}
                      prefetch
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 cyber-chamfer-sm px-3 py-2.5 text-sm font-semibold text-on-surface hover:bg-surface-container"
                    >
                      <Icon name={resolveIconName(c.icon)} className="h-4 w-4 text-primary-container" />
                      {c.name}
                    </Link>
                    {c.children.length > 0 && (
                      <div className="mr-3 space-y-0.5 border-r border-surface-variant pr-3">
                        {c.children.map((child) => (
                          <Link
                            key={child.slug}
                            href={`/shop/category/${child.slug}`}
                            onClick={() => setMenuOpen(false)}
                            className="block cyber-chamfer-sm px-3 py-1.5 text-xs text-on-surface-variant hover:text-primary-container"
                          >
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                <Link
                  href="/shop"
                  onClick={() => setMenuOpen(false)}
                  className="mt-2 block cyber-chamfer-sm bg-primary-container/10 px-3 py-2.5 text-center text-sm font-bold text-primary-container"
                >
                  مشاهده همه محصولات
                </Link>
              </div>
            </nav>
            <div className="grid grid-cols-2 gap-2 border-t border-surface-variant p-3">
              <Link
                href="/login"
                prefetch
                onClick={() => setMenuOpen(false)}
                className="cyber-chamfer-sm border border-surface-variant px-3 py-2.5 text-center text-sm font-semibold"
              >
                ورود
              </Link>
              <Link
                href="/cart"
                prefetch
                onClick={() => setMenuOpen(false)}
                className="bg-cta focus-cta cursor-pointer cyber-chamfer-sm px-3 py-2.5 text-center text-sm font-semibold transition-colors duration-200"
              >
                سبد ({count})
              </Link>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
