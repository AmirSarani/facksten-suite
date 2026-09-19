"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart-provider";
import { Icon } from "@/components/icon";
import { formatToman } from "@/lib/format";

export function ProductBuyBox({
  productId,
  price,
  compareAtPrice,
  packQty = 1,
  inStock,
  stock,
  labSlug,
}: {
  productId: string;
  price: number;
  compareAtPrice?: number | null;
  packQty?: number;
  inStock: boolean;
  stock: number;
  labSlug?: string | null;
}) {
  const [qty, setQty] = useState(1);
  const { addProductId } = useCart();
  const router = useRouter();

  const discountPercent =
    compareAtPrice && compareAtPrice > price
      ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
      : 0;
  const unit = Math.round(price / Math.max(1, packQty));

  async function addToCart() {
    const res = await addProductId(productId, qty);
    if (!res.ok) {
      alert(res.error ?? "خطا");
      return;
    }
  }

  async function buyNow() {
    await addToCart();
    router.push("/cart");
  }

  async function addWishlist() {
    const res = await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    if (res.status === 401) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (!res.ok) alert("خطا در افزودن به علاقه‌مندی");
  }

  return (
    <div className="ambient-card cyber-chamfer flex flex-col gap-6 border border-outline p-6">
      <div>
        {discountPercent > 0 && compareAtPrice != null && (
          <div className="mb-1 flex items-center justify-end gap-2">
            <span className="cyber-chamfer-sm bg-primary-container px-2 py-0.5 font-mono text-[12px] font-bold text-on-primary">
              {discountPercent}٪ تخفیف
            </span>
            <span className="text-sm text-on-surface-variant line-through">{formatToman(compareAtPrice)}</span>
          </div>
        )}
        <div className="flex items-baseline justify-end gap-1">
          <span className="text-[40px] leading-[56px] font-black text-on-surface">{formatToman(price)}</span>
          <span className="text-sm text-on-surface-variant">تومان</span>
        </div>
        {packQty > 1 && (
          <p className="mt-1 text-left text-xs text-on-surface-variant">
            قیمت واحد ≈ {formatToman(unit)} تومان · بسته {packQty} تایی
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container text-primary">
            <Icon name="inventory_2" className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-on-surface">{inStock ? "موجود در انبار" : "ناموجود"}</p>
            <p className="text-xs text-on-surface-variant">
              {inStock ? `${stock} عدد آماده ارسال` : "به‌محض تأمین اطلاع‌رسانی می‌شود"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container text-primary">
            <Icon name="local_shipping" className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-on-surface">ارسال سریع</p>
            <p className="text-xs text-on-surface-variant">از انبار تهران</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container text-primary">
            <Icon name="verified_user" className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-on-surface">ضمانت اصالت</p>
            <p className="text-xs text-on-surface-variant">۷ روز مهلت مرجوعی</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between cyber-chamfer-sm border border-outline bg-surface-container px-3 py-2">
        <span className="text-sm text-on-surface-variant">تعداد</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center cyber-chamfer-sm border border-outline transition-colors hover:border-primary-container hover:text-primary-container"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            aria-label="کاهش"
          >
            <Icon name="remove" className="h-4 w-4" />
          </button>
          <span className="w-8 text-center font-bold">{qty}</span>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center cyber-chamfer-sm border border-outline transition-colors hover:border-primary-container hover:text-primary-container"
            onClick={() => setQty((q) => q + 1)}
            aria-label="افزایش"
          >
            <Icon name="add" className="h-4 w-4" />
          </button>
        </div>
      </div>

      <button
        type="button"
        disabled={!inStock}
        onClick={addToCart}
        className={
          inStock
            ? "bg-cta focus-cta cyber-chamfer-sm flex w-full items-center justify-center gap-2 py-3 font-mono text-sm font-semibold uppercase tracking-wide shadow-[var(--box-shadow-neon)]"
            : "cyber-chamfer-sm flex w-full cursor-not-allowed items-center justify-center gap-2 bg-surface-container py-3 font-mono text-sm font-semibold text-on-surface-variant"
        }
      >
        <Icon name="add_shopping_cart" className="h-4 w-4" />
        افزودن به سبد
      </button>
      <button
        type="button"
        disabled={!inStock}
        onClick={buyNow}
        className="cyber-chamfer-sm flex w-full items-center justify-center gap-2 border border-outline py-3 font-mono text-sm font-semibold uppercase tracking-wide transition-colors hover:border-primary-container hover:text-primary-container"
      >
        خرید سریع
      </button>
      {labSlug && (
        <Link
          href={`/lab/workspace?part=${encodeURIComponent(labSlug)}`}
          className="cyber-chamfer-sm flex w-full items-center justify-center gap-2 border border-primary/40 bg-primary/10 py-3 font-mono text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
        >
          <Icon name="memory" className="h-4 w-4" />
          تست در آزمایشگاه
        </Link>
      )}
      <button type="button" onClick={addWishlist} className="text-sm font-semibold text-primary hover:underline">
        افزودن به علاقه‌مندی
      </button>
    </div>
  );
}
