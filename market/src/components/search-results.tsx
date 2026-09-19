"use client";

import Link from "next/link";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { useCompare } from "@/components/compare-provider";
import { Icon } from "@/components/icon";
import { formatToman } from "@/lib/format";

export type SearchProduct = {
  id: string;
  slug: string;
  title: string;
  price: number;
  type: "HARDWARE" | "DIGITAL";
  brand?: string | null;
  image: string;
  inStock: boolean;
  badge?: string | null;
};

export function SearchResultsClient({
  q,
  products,
  brand,
  inStockOnly,
}: {
  q: string;
  products: SearchProduct[];
  brand?: string;
  inStockOnly?: boolean;
}) {
  const { toggle, has } = useCompare();

  return (
    <>
      <div className="cyber-chamfer mb-4 flex flex-col items-start justify-between gap-3 border border-outline bg-surface-container-lowest p-3 shadow-[var(--box-shadow-neon-sm)] md:flex-row md:items-center">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-on-surface-variant">فیلترهای فعال:</span>
          {brand && (
            <Link
              href={`/search?q=${encodeURIComponent(q)}`}
              className="inline-flex items-center gap-1 cyber-chamfer-sm border border-outline bg-surface-container-low px-2 py-1 font-mono text-xs"
            >
              {brand}
              <span className="text-on-surface-variant">×</span>
            </Link>
          )}
          {inStockOnly && (
            <span className="cyber-chamfer-sm border border-outline bg-surface-container-low px-2 py-1 font-mono text-xs">فقط موجود</span>
          )}
          {!brand && !inStockOnly && <span className="text-on-surface-variant">—</span>}
          {(brand || inStockOnly) && (
            <Link href={`/search?q=${encodeURIComponent(q)}`} className="mr-2 text-xs font-semibold text-primary hover:underline">
              حذف همه
            </Link>
          )}
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-on-surface-variant">
            مرتب‌سازی:
            <select
              className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-1.5 font-mono text-sm text-primary-container outline-none focus:border-primary-container focus:shadow-[var(--box-shadow-neon-sm)]"
              defaultValue="relevant"
            >
              <option value="relevant">مرتبط‌ترین</option>
              <option value="price_asc">ارزان‌ترین</option>
              <option value="price_desc">گران‌ترین</option>
              <option value="newest">جدیدترین</option>
            </select>
          </label>
          <span className="text-sm text-on-surface-variant">{products.length} کالا یافت شد</span>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="cyber-chamfer border border-dashed border-outline p-12 text-center text-on-surface-variant">نتیجه‌ای یافت نشد.</div>
      ) : (
        <div className="mb-28 grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => (
            <article
              key={p.id}
              className="group relative flex flex-col overflow-hidden cyber-chamfer border border-outline bg-surface-container-lowest shadow-[var(--box-shadow-neon-sm)] transition-all hover:border-primary-container hover:shadow-[var(--box-shadow-neon)]"
            >
              <button
                type="button"
                aria-label="علاقه‌مندی"
                className="absolute top-2 left-2 z-10 rounded-full bg-surface-container/50 p-1 text-on-surface-variant hover:text-primary"
              >
                <Icon name="favorite" className="h-4 w-4" />
              </button>
              <label className="absolute top-2 right-2 z-10 flex cursor-pointer items-center gap-1 rounded-full border border-outline-variant/30 bg-surface-container/80 px-1.5 py-0.5 text-[10px] text-on-surface-variant backdrop-blur">
                <input
                  type="checkbox"
                  checked={has(p.slug)}
                  onChange={() => toggle({ slug: p.slug, title: p.title, image: p.image })}
                  className="h-3 w-3 accent-primary-container"
                />
                مقایسه
              </label>
              <Link href={`/product/${p.slug}`} className="relative block bg-surface-container-low pt-[100%]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.image || "/placeholder.svg"}
                  alt={p.title}
                  className="absolute inset-0 h-full w-full object-contain p-4"
                />
              </Link>
              <div className="flex flex-1 flex-col p-3">
                {p.brand && <p className="mb-1 text-[10px] text-on-surface-variant">{p.brand}</p>}
                <Link href={`/product/${p.slug}`}>
                  <h3 className="mb-2 line-clamp-2 text-sm font-semibold">{p.title}</h3>
                </Link>
                <div className="mb-2 flex flex-wrap gap-1">
                  <span className="cyber-chamfer-sm bg-surface-container-high px-1.5 py-0.5 font-mono text-[10px] text-on-surface-variant">
                    {p.type === "DIGITAL" ? "دیجیتال" : "سخت‌افزار"}
                  </span>
                  {p.badge && (
                    <span className="cyber-chamfer-sm bg-primary-container/10 px-1.5 py-0.5 font-mono text-[10px] text-primary-container">
                      {p.badge}
                    </span>
                  )}
                </div>
                <div className="mt-auto flex items-center justify-between gap-2">
                  <span className="text-lg font-bold text-primary">
                    {formatToman(p.price)}
                    <span className="mr-1 text-xs font-normal text-on-surface-variant">تومان</span>
                  </span>
                  <AddToCartButton productId={p.id} inStock={p.inStock} round />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}

export function SearchSidebar({
  q,
  brands,
  currentBrand,
  inStockOnly,
}: {
  q: string;
  brands: { name: string; count: number }[];
  currentBrand?: string;
  inStockOnly?: boolean;
}) {
  const base = `/search?q=${encodeURIComponent(q)}`;

  return (
    <aside className="w-full shrink-0 lg:w-64">
      <div className="sticky top-28 space-y-4 cyber-chamfer border border-outline bg-surface-container-lowest p-5 shadow-[var(--box-shadow-neon-sm)]">
        <div>
          <h3 className="mb-3 text-sm font-bold">برند</h3>
          <div className="max-h-48 space-y-2 overflow-y-auto">
            {brands.map((b) => {
              const on = currentBrand === b.name;
              const href = on ? base : `${base}&brand=${encodeURIComponent(b.name)}`;
              return (
                <Link key={b.name} href={href} className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary">
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded border ${
                      on ? "border-primary-container bg-primary-container text-on-primary" : "border-outline"
                    }`}
                  >
                    {on ? "✓" : ""}
                  </span>
                  <span className={on ? "font-semibold text-primary" : ""}>
                    {b.name} ({b.count})
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-bold">موجودی</h3>
          <Link
            href={inStockOnly ? base : `${base}&stock=1`}
            className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary"
          >
            <span
              className={`flex h-4 w-4 items-center justify-center rounded border ${
                inStockOnly ? "border-primary-container bg-primary-container text-on-primary" : "border-outline"
              }`}
            >
              {inStockOnly ? "✓" : ""}
            </span>
            فقط کالاهای موجود
          </Link>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-bold">محدوده قیمت</h3>
          <div className="grid grid-cols-2 gap-2">
            <input placeholder="از" className="cyber-chamfer-sm border border-outline bg-surface-container-lowest px-2 py-1.5 font-mono text-xs focus:border-primary-container focus:outline-none" />
            <input placeholder="تا" className="cyber-chamfer-sm border border-outline bg-surface-container-lowest px-2 py-1.5 font-mono text-xs focus:border-primary-container focus:outline-none" />
          </div>
          <button
            type="button"
            className="bg-cta focus-cta cyber-chamfer-sm mt-2 w-full py-2 font-mono text-xs font-semibold uppercase tracking-wide"
          >
            اعمال محدوده
          </button>
        </div>
        <Link href="/compare" className="block text-center text-sm font-semibold text-primary hover:underline">
          صفحه مقایسه
        </Link>
      </div>
    </aside>
  );
}
