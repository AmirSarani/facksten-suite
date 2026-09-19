"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { useCompare } from "@/components/compare-provider";
import { Icon } from "@/components/icon";
import { formatToman } from "@/lib/format";

type Product = {
  id: string;
  slug: string;
  title: string;
  price: number;
  brand: string | null;
  image: string;
  inStock: boolean;
  stock: number;
  badge: string | null;
  type: string;
};

const MAX_SLOTS = 4;

export function CompareClient({ catalog }: { catalog: Product[] }) {
  const searchParams = useSearchParams();
  const { slugs, remove, toggle, ready } = useCompare();
  const [query, setQuery] = useState("");
  const [localSlugs, setLocalSlugs] = useState<string[]>([]);

  useEffect(() => {
    const fromUrl = (searchParams.get("ids") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (fromUrl.length) {
      setLocalSlugs(fromUrl.slice(0, MAX_SLOTS));
      return;
    }
    if (ready) setLocalSlugs(slugs.slice(0, MAX_SLOTS));
  }, [searchParams, slugs, ready]);

  const selected = useMemo(() => {
    return localSlugs
      .map((slug) => catalog.find((p) => p.slug === slug))
      .filter(Boolean) as Product[];
  }, [localSlugs, catalog]);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return catalog.filter((p) => !localSlugs.includes(p.slug)).slice(0, 6);
    return catalog
      .filter(
        (p) =>
          !localSlugs.includes(p.slug) &&
          (p.title.toLowerCase().includes(q) || (p.brand || "").toLowerCase().includes(q)),
      )
      .slice(0, 8);
  }, [query, catalog, localSlugs]);

  function addSlug(slug: string) {
    if (localSlugs.includes(slug) || localSlugs.length >= MAX_SLOTS) return;
    setLocalSlugs((prev) => [...prev, slug]);
    toggle(slug);
    setQuery("");
  }

  function dropSlug(slug: string) {
    setLocalSlugs((prev) => prev.filter((s) => s !== slug));
    remove(slug);
  }

  const slots = Array.from({ length: MAX_SLOTS }, (_, i) => selected[i] ?? null);

  const rows: { label: string; value: (p: Product) => string }[] = [
    { label: "قیمت", value: (p) => `${formatToman(p.price)} تومان` },
    { label: "برند", value: (p) => p.brand || "—" },
    { label: "نوع", value: (p) => (p.type === "DIGITAL" ? "دیجیتال" : "سخت‌افزار") },
    { label: "موجودی", value: (p) => (p.inStock ? `موجود (${p.stock})` : "ناموجود") },
    { label: "نشان", value: (p) => p.badge || "—" },
    {
      label: "مناسب برای",
      value: (p) =>
        p.brand === "Arduino"
          ? "آموزش و نمونه‌سازی"
          : p.brand === "Espressif"
            ? "IoT و وای‌فای"
            : p.brand === "Raspberry Pi"
              ? "لینوکس و سرور سبک"
              : "پروژه‌های عمومی",
    },
  ];

  return (
    <div className="mx-auto max-w-[1280px] px-margin-mobile py-10 md:px-margin-desktop">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="mb-1 text-3xl font-extrabold text-on-surface md:text-[40px] md:leading-[56px]">
            مقایسه محصولات
          </h1>
          <p className="text-base text-on-surface-variant">
            بررسی دقیق مشخصات فنی و ویژگی‌های محصولات
          </p>
        </div>
        <div className="relative w-full md:w-72">
          <div className="flex items-center gap-2 cyber-chamfer border border-outline bg-surface-container-lowest px-3 py-2 focus-within:border-primary-container focus-within:shadow-[var(--box-shadow-neon-sm)]">
            <Icon name="new_releases" className="h-5 w-5 text-primary-container" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent font-mono text-sm text-primary-container outline-none placeholder:text-on-surface-variant"
              placeholder="افزودن محصول برای مقایسه..."
            />
          </div>
          {(query || suggestions.length > 0) && localSlugs.length < MAX_SLOTS && (
            <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto cyber-chamfer border border-outline bg-surface-container-lowest shadow-[var(--box-shadow-neon)]">
              {suggestions.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => addSlug(p.slug)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-right text-sm hover:bg-surface-container-low"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.image || "/placeholder.svg"} alt="" className="h-10 w-10 object-contain" />
                    <span className="line-clamp-1">{p.title}</span>
                  </button>
                </li>
              ))}
              {suggestions.length === 0 && (
                <li className="px-3 py-2 text-sm text-on-surface-variant">موردی یافت نشد</li>
              )}
            </ul>
          )}
        </div>
      </div>

      <div className="cyber-chamfer overflow-hidden border border-outline bg-surface-container-lowest shadow-[var(--box-shadow-neon-sm)]">
        <div className="table-scroll max-w-full min-w-0 overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-right text-sm">
            <thead className="sticky top-[88px] z-10">
              <tr>
                <th className="w-1/5 border-b border-l border-surface-variant bg-surface-container-lowest p-6 align-top">
                  <div className="mb-2 text-xl font-semibold text-on-surface">مشخصات فنی</div>
                  <p className="text-xs text-on-surface-variant">تا ۴ محصول را کنار هم ببینید</p>
                </th>
                {slots.map((p, i) => (
                  <th
                    key={p?.id ?? `empty-${i}`}
                    className="relative w-1/5 border-b border-l border-surface-variant/50 p-6 align-top last:border-l-0"
                  >
                    {p ? (
                      <div className="group flex flex-col items-center text-center">
                        <button
                          type="button"
                          onClick={() => dropSlug(p.slug)}
                          className="absolute top-3 right-3 rounded-full p-1 text-on-surface-variant opacity-0 hover:bg-error-container/20 hover:text-error group-hover:opacity-100"
                          aria-label="حذف"
                        >
                          ×
                        </button>
                        <div className="mb-3 flex h-32 w-32 items-center justify-center overflow-hidden cyber-chamfer-sm bg-surface-container-low">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.image || "/placeholder.svg"} alt="" className="h-full w-full object-contain p-2" />
                        </div>
                        <Link href={`/product/${p.slug}`} className="mb-2 line-clamp-2 text-sm font-semibold hover:text-primary">
                          {p.title}
                        </Link>
                        <div className="mb-4 text-xl font-bold text-primary">
                          {formatToman(p.price)} <span className="text-xs font-normal">تومان</span>
                        </div>
                        {p.inStock ? (
                          <AddToCartButton
                            productId={p.id}
                            inStock
                            label="افزودن به سبد"
                            className="bg-cta focus-cta cyber-chamfer-sm flex w-full items-center justify-center gap-2 py-2.5 font-mono text-sm font-semibold uppercase tracking-wide shadow-[var(--box-shadow-neon-sm)]"
                          />
                        ) : (
                          <span className="cyber-chamfer-sm w-full border border-outline py-2.5 font-mono text-sm font-semibold uppercase tracking-wide text-on-surface-variant">
                            موجود شد خبرم کن
                          </span>
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setQuery(" ")}
                        className="flex h-full min-h-[280px] w-full flex-col items-center justify-center gap-2 cyber-chamfer border border-dashed border-outline text-on-surface-variant transition-colors hover:border-primary-container hover:text-primary-container"
                      >
                        <Icon name="new_releases" className="h-8 w-8" />
                        <span className="text-sm font-semibold">افزودن محصول</span>
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {selected.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-on-surface-variant">
                    هنوز محصولی انتخاب نشده. از جستجو بالا یا صفحه{" "}
                    <Link href="/search" className="text-primary hover:underline">
                      نتایج جستجو
                    </Link>{" "}
                    مقایسه را شروع کنید.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.label} className="hover:bg-surface-variant/30">
                    <td className="border-b border-l border-surface-variant/50 p-4 font-medium text-on-surface-variant">
                      {row.label}
                    </td>
                    {slots.map((p, i) => (
                      <td
                        key={`${row.label}-${p?.id ?? i}`}
                        className="border-b border-l border-surface-variant/50 p-4 text-on-surface last:border-l-0"
                      >
                        {p ? row.value(p) : "—"}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
