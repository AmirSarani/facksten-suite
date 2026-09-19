"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Icon, type IconName } from "@/components/icon";
import { shopHref, type ShopCategoryNode } from "@/components/shop-catalog";
import { formatToman } from "@/lib/format";

type Sp = Record<string, string | undefined>;

function FilterCheck({ checked }: { checked: boolean }) {
  return (
    <span
      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
        checked
          ? "border-primary-container bg-primary-container text-on-primary"
          : "border-outline-variant bg-surface-container-lowest"
      }`}
      aria-hidden
    >
      {checked ? (
        <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M2.5 6.5 5 9l4.5-5.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null}
    </span>
  );
}

function FilterRadio({ checked }: { checked: boolean }) {
  return (
    <span
      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors ${
        checked ? "border-primary-container" : "border-outline-variant"
      }`}
      aria-hidden
    >
      {checked ? <span className="h-2 w-2 rounded-full bg-primary-container" /> : null}
    </span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5 border-b border-surface-variant pb-5 last:mb-0 last:border-0 last:pb-0">
      <h3 className="mb-3 text-sm font-semibold text-on-surface">{title}</h3>
      {children}
    </div>
  );
}

function PriceRangeForm({
  basePath,
  sp,
  priceMin,
  priceMax,
}: {
  basePath: string;
  sp: Sp;
  priceMin: number;
  priceMax: number;
}) {
  const router = useRouter();
  const [min, setMin] = useState(sp.minPrice ?? "");
  const [max, setMax] = useState(sp.maxPrice ?? "");

  useEffect(() => {
    setMin(sp.minPrice ?? "");
    setMax(sp.maxPrice ?? "");
  }, [sp.minPrice, sp.maxPrice]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const clean = (v: string) => {
      const n = Number(String(v).replace(/[^\d]/g, ""));
      return Number.isFinite(n) && n > 0 ? String(n) : undefined;
    };
    router.push(
      shopHref(basePath, sp, {
        minPrice: clean(min),
        maxPrice: clean(max),
        page: undefined,
      }),
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <div className="flex items-center gap-2">
        <label className="sr-only" htmlFor="filter-min-price">
          حداقل قیمت
        </label>
        <input
          id="filter-min-price"
          inputMode="numeric"
          placeholder={priceMin ? formatToman(priceMin) : "از"}
          value={min}
          onChange={(e) => setMin(e.target.value.replace(/[^\d]/g, ""))}
          className="cyber-chamfer-sm w-full border border-outline bg-surface-container-lowest px-2.5 py-2 font-mono text-xs text-primary-container outline-none focus:border-primary-container focus:shadow-[var(--box-shadow-neon-sm)]"
        />
        <span className="shrink-0 text-xs text-on-surface-variant">تا</span>
        <label className="sr-only" htmlFor="filter-max-price">
          حداکثر قیمت
        </label>
        <input
          id="filter-max-price"
          inputMode="numeric"
          placeholder={priceMax ? formatToman(priceMax) : "تا"}
          value={max}
          onChange={(e) => setMax(e.target.value.replace(/[^\d]/g, ""))}
          className="cyber-chamfer-sm w-full border border-outline bg-surface-container-lowest px-2.5 py-2 font-mono text-xs text-primary-container outline-none focus:border-primary-container focus:shadow-[var(--box-shadow-neon-sm)]"
        />
      </div>
      <button
        type="submit"
        className="bg-cta focus-cta cyber-chamfer-sm w-full py-2 font-mono text-xs font-semibold uppercase tracking-wide"
      >
        اعمال قیمت
      </button>
    </form>
  );
}

export function ShopFilters({
  basePath,
  categories,
  brands,
  sp,
  activeCategorySlug,
  priceBounds,
}: {
  basePath: string;
  categories: ShopCategoryNode[];
  brands: string[];
  sp: Sp;
  activeCategorySlug?: string;
  priceBounds?: { min: number; max: number };
}) {
  const [open, setOpen] = useState(false);
  const qs = (extra: Sp) => shopHref(basePath, sp, extra);
  const keepOnCategory = (slug: string) =>
    shopHref(`/shop/category/${slug}`, {
      sort: sp.sort,
      brand: sp.brand,
      q: sp.q,
      inStock: sp.inStock,
      view: sp.view,
      minPrice: sp.minPrice,
      maxPrice: sp.maxPrice,
      isNew: sp.isNew,
      isPopular: sp.isPopular,
      onSale: sp.onSale,
      type: sp.type,
    }, {});

  const allShopHref = shopHref(
    "/shop",
    {
      sort: sp.sort,
      brand: sp.brand,
      q: sp.q,
      inStock: sp.inStock,
      view: sp.view,
      minPrice: sp.minPrice,
      maxPrice: sp.maxPrice,
      isNew: sp.isNew,
      isPopular: sp.isPopular,
      onSale: sp.onSale,
    },
    { type: undefined },
  );

  const clearHref = basePath === "/shop" ? "/shop" : basePath;

  const priceMin = priceBounds?.min ?? 0;
  const priceMax = priceBounds?.max ?? 0;

  const pricePresets = useMemo(() => {
    const max = priceMax || 5_000_000;
    const steps = [
      { label: "زیر ۱۰۰ هزار", min: undefined, max: "100000" },
      { label: "۱۰۰ تا ۵۰۰ هزار", min: "100000", max: "500000" },
      { label: "۵۰۰ هزار تا ۲ میلیون", min: "500000", max: "2000000" },
      { label: "بالای ۲ میلیون", min: "2000000", max: undefined },
    ];
    return steps.filter((s) => {
      const hi = s.max ? Number(s.max) : Infinity;
      const lo = s.min ? Number(s.min) : 0;
      return lo <= max && hi >= (priceMin || 0);
    });
  }, [priceMin, priceMax]);

  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; href: string }[] = [];
    if (sp.type === "digital") {
      chips.push({ key: "type", label: "دیجیتال", href: qs({ type: undefined, page: undefined }) });
    } else if (sp.type === "hardware") {
      chips.push({ key: "type", label: "سخت‌افزار", href: qs({ type: undefined, page: undefined }) });
    }
    if (sp.inStock === "1") {
      chips.push({ key: "stock", label: "فقط موجود", href: qs({ inStock: undefined, page: undefined }) });
    }
    if (sp.isNew === "1") {
      chips.push({ key: "new", label: "جدید", href: qs({ isNew: undefined, page: undefined }) });
    }
    if (sp.isPopular === "1") {
      chips.push({ key: "popular", label: "پرطرفدار", href: qs({ isPopular: undefined, page: undefined }) });
    }
    if (sp.onSale === "1") {
      chips.push({ key: "sale", label: "تخفیف‌دار", href: qs({ onSale: undefined, page: undefined }) });
    }
    if (sp.brand) {
      chips.push({ key: "brand", label: sp.brand, href: qs({ brand: undefined, page: undefined }) });
    }
    if (sp.minPrice || sp.maxPrice) {
      const from = sp.minPrice ? formatToman(Number(sp.minPrice)) : "۰";
      const to = sp.maxPrice ? formatToman(Number(sp.maxPrice)) : "∞";
      chips.push({
        key: "price",
        label: `${from} – ${to}`,
        href: qs({ minPrice: undefined, maxPrice: undefined, page: undefined }),
      });
    }
    if (sp.q) {
      chips.push({ key: "q", label: `جستجو: ${sp.q}`, href: qs({ q: undefined, page: undefined }) });
    }
    return chips;
  }, [sp, basePath]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasFilters = activeChips.length > 0;

  const body = (
    <>
      <div className="mb-5 flex items-center justify-between border-b border-surface-variant pb-3">
        <h2 className="text-lg font-semibold text-on-surface sm:text-xl">فیلترها</h2>
        <Link
          href={clearHref}
          className={`text-xs font-semibold transition-colors ${
            hasFilters || activeCategorySlug
              ? "text-primary-container hover:underline"
              : "pointer-events-none text-on-surface-variant/40"
          }`}
        >
          پاک کردن
        </Link>
      </div>

      {hasFilters ? (
        <div className="mb-5 flex flex-wrap gap-1.5 border-b border-surface-variant pb-5">
          {activeChips.map((chip) => (
            <Link
              key={chip.key}
              href={chip.href}
              className="inline-flex max-w-full items-center gap-1 rounded-full bg-primary-container/10 px-2.5 py-1 text-[11px] font-medium text-primary-container transition-colors hover:bg-primary-container/20"
            >
              <span className="truncate">{chip.label}</span>
              <Icon name="close" className="h-3 w-3 shrink-0 opacity-70" />
            </Link>
          ))}
        </div>
      ) : null}

      <Section title="نوع محصول">
        <div className="space-y-2">
          {(
            [
              { value: undefined, label: "همه", href: qs({ type: undefined, page: undefined }) },
              {
                value: "hardware",
                label: "سخت‌افزار",
                href: qs({ type: "hardware", page: undefined }),
              },
              {
                value: "digital",
                label: "دیجیتال",
                href: qs({ type: "digital", page: undefined }),
              },
            ] as const
          ).map((opt) => {
            const checked = (sp.type || undefined) === opt.value;
            return (
              <Link
                key={opt.label}
                href={opt.href}
                className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors ${
                  checked
                    ? "bg-primary-container/10 font-semibold text-primary-container"
                    : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                }`}
              >
                <FilterRadio checked={checked} />
                {opt.label}
              </Link>
            );
          })}
        </div>
      </Section>

      <Section title="دسته‌بندی">
        <div className="space-y-1">
          <Link
            href={allShopHref}
            className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors ${
              !activeCategorySlug
                ? "bg-primary-container/10 font-semibold text-primary-container"
                : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
            }`}
          >
            همه محصولات
          </Link>
          {categories.map((c) => {
            const active = activeCategorySlug === c.slug;
            const childActive = c.children.some((ch) => ch.slug === activeCategorySlug);
            return (
              <div key={c.id} className="min-w-0">
                <Link
                  href={keepOnCategory(c.slug)}
                  className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors ${
                    active
                      ? "bg-primary-container/10 font-semibold text-primary-container"
                      : childActive
                        ? "font-semibold text-on-surface"
                        : "text-on-surface hover:bg-surface-container-high"
                  }`}
                >
                  <Icon name={(c.icon as IconName) || "memory"} className="h-4 w-4 shrink-0 opacity-80" />
                  <span className="truncate">{c.name}</span>
                </Link>
                {c.children.length > 0 && (
                  <div className="mr-4 mt-0.5 space-y-0.5 border-r border-surface-variant pr-2">
                    {c.children.map((child) => {
                      const childOn = activeCategorySlug === child.slug;
                      return (
                        <Link
                          key={child.id}
                          href={keepOnCategory(child.slug)}
                          className={`block truncate rounded-md px-2 py-1 text-xs transition-colors ${
                            childOn
                              ? "bg-primary-container/10 font-semibold text-primary-container"
                              : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                          }`}
                        >
                          {child.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="محدوده قیمت">
        <div className="mb-3 space-y-1.5">
          {pricePresets.map((preset) => {
            const active = (sp.minPrice || "") === (preset.min || "") && (sp.maxPrice || "") === (preset.max || "");
            return (
              <Link
                key={preset.label}
                href={qs({
                  minPrice: preset.min,
                  maxPrice: preset.max,
                  page: undefined,
                })}
                className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors ${
                  active
                    ? "bg-primary-container/10 font-semibold text-primary-container"
                    : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                }`}
              >
                <FilterRadio checked={active} />
                {preset.label}
              </Link>
            );
          })}
        </div>
        <PriceRangeForm basePath={basePath} sp={sp} priceMin={priceMin} priceMax={priceMax} />
        {priceMin > 0 && priceMax > 0 ? (
          <p className="mt-2 text-[10px] text-on-surface-variant">
            بازه فعلی کاتالوگ: {formatToman(priceMin)} تا {formatToman(priceMax)} تومان
          </p>
        ) : null}
      </Section>

      <Section title="موجودی">
        <Link
          href={qs({ inStock: sp.inStock === "1" ? undefined : "1", page: undefined })}
          className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors ${
            sp.inStock === "1"
              ? "bg-primary-container/10 font-semibold text-primary-container"
              : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
          }`}
        >
          <FilterCheck checked={sp.inStock === "1"} />
          فقط کالاهای موجود
        </Link>
      </Section>

      <Section title="ویژگی‌ها">
        <div className="space-y-1.5">
          {(
            [
              { key: "isNew" as const, label: "محصولات جدید", on: sp.isNew === "1" },
              { key: "isPopular" as const, label: "پرطرفدار", on: sp.isPopular === "1" },
              { key: "onSale" as const, label: "تخفیف‌دار", on: sp.onSale === "1" },
            ] as const
          ).map((item) => (
            <Link
              key={item.key}
              href={qs({ [item.key]: item.on ? undefined : "1", page: undefined })}
              className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors ${
                item.on
                  ? "bg-primary-container/10 font-semibold text-primary-container"
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
              }`}
            >
              <FilterCheck checked={item.on} />
              {item.label}
            </Link>
          ))}
        </div>
      </Section>

      {brands.length > 0 ? (
        <Section title="برند">
          <div className="max-h-52 space-y-1 overflow-y-auto pe-1">
            {brands.map((b) => {
              const on = sp.brand === b;
              return (
                <Link
                  key={b}
                  href={qs({ brand: on ? undefined : b, page: undefined })}
                  className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors ${
                    on
                      ? "bg-primary-container/10 font-semibold text-primary-container"
                      : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                  }`}
                  title={b}
                >
                  <FilterCheck checked={on} />
                  <span className="truncate">{b}</span>
                </Link>
              );
            })}
          </div>
        </Section>
      ) : null}
    </>
  );

  return (
    <aside className="w-full shrink-0 lg:w-64">
      <button
        type="button"
        className="mb-3 flex w-full items-center justify-between cyber-chamfer border border-outline bg-surface-container-lowest px-4 py-3 font-mono text-sm font-semibold uppercase tracking-wide lg:hidden"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          فیلتر و دسته‌بندی
          {hasFilters ? (
            <span className="cyber-chamfer-sm bg-primary-container px-1.5 py-0.5 font-mono text-[10px] font-bold text-on-primary shadow-[var(--box-shadow-neon-sm)]">
              {activeChips.length}
            </span>
          ) : null}
        </span>
        <Icon name="chevron_left" className={`h-4 w-4 transition-transform ${open ? "-rotate-90" : ""}`} />
      </button>

      <div
        className={`cyber-chamfer border border-outline bg-surface-container-lowest p-4 shadow-[var(--box-shadow-neon-sm)] sm:p-6 lg:sticky lg:top-28 ${
          open ? "block" : "hidden lg:block"
        }`}
      >
        {body}
      </div>
    </aside>
  );
}
