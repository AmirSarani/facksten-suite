"use client";

import { useCart } from "@/components/cart-provider";
import { Icon } from "@/components/icon";

const compactInStock =
  "bg-cta focus-cta inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 cyber-chamfer-sm px-3 py-2 text-sm font-semibold transition-colors duration-200 active:scale-[0.98]";
const compactOut =
  "inline-flex shrink-0 cursor-not-allowed items-center justify-center gap-1.5 cyber-chamfer-sm bg-surface-container px-3 py-2 text-sm font-semibold text-on-surface-variant";

export function AddToCartButton({
  productId,
  inStock,
  label = "افزودن به سبد",
  className,
  round,
}: {
  productId: string;
  inStock: boolean;
  label?: string;
  className?: string;
  /** Compact shop/card CTA (icon + short label) — same style across store. */
  round?: boolean;
}) {
  const { addProductId } = useCart();

  async function onAdd() {
    const res = await addProductId(productId);
    if (!res.ok) alert(res.error ?? "خطا");
  }

  if (round) {
    const compactLabel = label === "افزودن به سبد" ? "افزودن" : label;
    return (
      <button
        type="button"
        disabled={!inStock}
        onClick={onAdd}
        className={inStock ? compactInStock : compactOut}
        aria-label={label}
      >
        <Icon name="add_shopping_cart" className="h-4 w-4" />
        {compactLabel}
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={!inStock}
      onClick={onAdd}
      className={
        className ??
        (inStock
          ? "bg-cta focus-cta mt-6 flex w-full cursor-pointer items-center justify-center gap-2 cyber-chamfer-sm py-3 text-sm font-semibold transition-colors duration-200"
          : "mt-6 flex w-full cursor-not-allowed items-center justify-center gap-2 cyber-chamfer-sm bg-surface-container py-3 text-sm font-semibold text-on-surface-variant")
      }
    >
      <Icon name="add_shopping_cart" className="h-4 w-4" />
      {label}
    </button>
  );
}
