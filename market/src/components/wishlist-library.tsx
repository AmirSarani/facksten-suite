"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { Icon } from "@/components/icon";
import { formatToman } from "@/lib/format";
import { PRODUCT_TYPE_FA } from "@/lib/panel";

export type WishlistItemView = {
  id: string;
  productId: string;
  title: string;
  slug: string;
  price: number;
  compareAtPrice?: number | null;
  type: "HARDWARE" | "DIGITAL";
  inStock: boolean;
  active: boolean;
  image: string;
  brand?: string | null;
  badge?: string | null;
};

const filters = [
  { id: "all", label: "همه" },
  { id: "HARDWARE", label: "سخت‌افزار" },
  { id: "DIGITAL", label: "دیجیتال" },
  { id: "inStock", label: "موجود" },
  { id: "out", label: "ناموجود" },
] as const;

export function WishlistLibrary({ items }: { items: WishlistItemView[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]["id"]>("all");
  const [removing, setRemoving] = useState<string | null>(null);

  const counts = useMemo(() => {
    return {
      all: items.length,
      HARDWARE: items.filter((i) => i.type === "HARDWARE").length,
      DIGITAL: items.filter((i) => i.type === "DIGITAL").length,
      inStock: items.filter((i) => i.inStock && i.active).length,
      out: items.filter((i) => !i.inStock || !i.active).length,
    };
  }, [items]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return items.filter((i) => {
      if (filter === "HARDWARE" && i.type !== "HARDWARE") return false;
      if (filter === "DIGITAL" && i.type !== "DIGITAL") return false;
      if (filter === "inStock" && !(i.inStock && i.active)) return false;
      if (filter === "out" && i.inStock && i.active) return false;
      if (!term) return true;
      return (
        i.title.toLowerCase().includes(term) ||
        (i.brand ?? "").toLowerCase().includes(term) ||
        i.slug.toLowerCase().includes(term)
      );
    });
  }, [items, q, filter]);

  async function remove(productId: string) {
    setRemoving(productId);
    await fetch("/api/wishlist", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    setRemoving(null);
    router.refresh();
  }

  if (!items.length) {
    return (
      <div className="cyber-chamfer border border-dashed border-outline bg-surface-container-low p-10 text-center">
        <p className="text-sm text-on-surface-variant">لیست علاقه‌مندی خالی است.</p>
        <Link
          href="/shop"
          className="mt-3 inline-flex cyber-chamfer-sm bg-cta px-4 py-2 text-sm font-semibold text-on-primary"
        >
          رفتن به فروشگاه
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 grid grid-cols-1 gap-3 cyber-chamfer border border-outline bg-surface-container-lowest p-3">
        <div className="-mx-1 flex min-w-0 gap-2 overflow-x-auto px-1 pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {filters.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  active
                    ? "border-primary-container bg-cta text-on-primary"
                    : "border-outline bg-surface-container-low text-on-surface-variant hover:border-primary-container"
                }`}
              >
                {f.label}
                <span
                  className={`rounded-md px-1.5 py-0.5 tabular-nums ${active ? "bg-on-primary/20" : "bg-surface-container-low"}`}
                >
                  {counts[f.id]}
                </span>
              </button>
            );
          })}
        </div>
        <div className="relative w-full min-w-0">
          <Icon
            name="search"
            className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-on-surface-variant"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="جستجوی نام یا برند..."
            className="w-full min-w-0 cyber-chamfer-sm border border-outline bg-surface-container-lowest-container-low py-2.5 pr-10 pl-3 text-sm outline-none focus:border-primary-container"
          />
        </div>
      </div>

      <p className="mb-3 text-sm text-on-surface-variant">
        {filtered.length} مورد
        {filter !== "all" ? ` · ${filters.find((f) => f.id === filter)?.label}` : ""}
        {q.trim() ? ` · «${q.trim()}»` : ""}
      </p>

      {!filtered.length ? (
        <div className="cyber-chamfer border border-dashed border-outline bg-surface-container-low p-10 text-center">
          <p className="text-sm text-on-surface-variant">موردی با این فیلتر پیدا نشد.</p>
          <button
            type="button"
            onClick={() => {
              setQ("");
              setFilter("all");
            }}
            className="mt-3 text-sm font-semibold text-primary-container hover:underline"
          >
            پاک کردن فیلترها
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const available = item.inStock && item.active;
            const discount =
              item.compareAtPrice && item.compareAtPrice > item.price
                ? Math.round(((item.compareAtPrice - item.price) / item.compareAtPrice) * 100)
                : 0;
            return (
              <article
                key={item.id}
                className="flex flex-col gap-4 cyber-chamfer border border-outline bg-surface-container-lowest p-3 sm:flex-row sm:items-center sm:p-4"
              >
                <Link
                  href={`/product/${item.slug}`}
                  className="relative flex h-28 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface-container-low sm:h-24 sm:w-28"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image || "/placeholder.svg"}
                    alt={item.title}
                    className={`max-h-full max-w-full object-contain p-2 ${available ? "" : "opacity-50"}`}
                    loading="lazy"
                  />
                  {!available ? (
                    <span className="absolute top-2 left-2 rounded-md bg-error-container px-1.5 py-0.5 text-[10px] font-bold text-error">
                      ناموجود
                    </span>
                  ) : null}
                </Link>

                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap gap-1.5">
                    <span className="rounded-md bg-surface-container-low px-1.5 py-0.5 text-[10px] font-bold text-on-surface-variant">
                      {PRODUCT_TYPE_FA[item.type] ?? item.type}
                    </span>
                    {item.badge ? (
                      <span className="rounded-md bg-primary-container/10 px-1.5 py-0.5 text-[10px] font-bold text-primary-container">
                        {item.badge}
                      </span>
                    ) : null}
                    {discount > 0 ? (
                      <span className="alert-ok px-1.5 py-0.5 text-[10px] font-bold">
                        {discount}٪ تخفیف
                      </span>
                    ) : null}
                  </div>
                  <Link href={`/product/${item.slug}`} className="font-bold hover:text-primary-container">
                    {item.title}
                  </Link>
                  {item.brand ? (
                    <p className="mt-0.5 text-xs text-on-surface-variant">{item.brand}</p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap items-baseline gap-2">
                    <p className="text-lg font-extrabold tabular-nums">
                      {formatToman(item.price)}{" "}
                      <span className="text-xs font-normal text-on-surface-variant">تومان</span>
                    </p>
                    {discount > 0 && item.compareAtPrice ? (
                      <span className="text-xs text-on-surface-variant line-through tabular-nums">
                        {formatToman(item.compareAtPrice)}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:flex-col sm:items-stretch lg:flex-row">
                  <AddToCartButton
                    productId={item.productId}
                    inStock={available}
                    label="افزودن به سبد"
                    className={
                      available
                        ? "bg-cta focus-cta inline-flex cursor-pointer items-center justify-center gap-1.5 cyber-chamfer-sm px-4 py-2.5 text-sm font-semibold transition-colors"
                        : "inline-flex cursor-not-allowed items-center justify-center gap-1.5 cyber-chamfer-sm bg-surface-container px-4 py-2.5 text-sm font-semibold text-on-surface-variant"
                    }
                  />
                  <Link
                    href={`/product/${item.slug}`}
                    className="inline-flex items-center justify-center cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-2.5 text-sm font-semibold hover:border-primary-container hover:text-primary-container"
                  >
                    جزئیات
                  </Link>
                  <button
                    type="button"
                    disabled={removing === item.productId}
                    onClick={() => void remove(item.productId)}
                    className="inline-flex items-center justify-center gap-1.5 cyber-chamfer-sm alert-danger px-3 py-2.5 text-sm font-semibold text-error hover:bg-error-container/40 disabled:opacity-60"
                  >
                    <Icon name="delete" className="h-4 w-4" />
                    حذف
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
