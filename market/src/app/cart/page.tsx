"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icon";
import { useCart } from "@/components/cart-provider";
import { formatToman } from "@/lib/format";

type Line = {
  qty: number;
  product: {
    id: string;
    slug: string;
    title: string;
    price: number;
    image?: string;
    brand?: string | null;
    type?: string;
  };
};

export default function CartPage() {
  const { refresh } = useCart();
  const [items, setItems] = useState<Line[]>([]);
  const [loading, setLoading] = useState(true);
  const [coupon, setCoupon] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/cart");
    if (res.ok) {
      const data = await res.json();
      setItems(data.items ?? []);
    } else {
      setItems([]);
    }
    setLoading(false);
    await refresh();
  }

  useEffect(() => {
    void load();
  }, []);

  async function setQty(productId: string, qty: number) {
    await fetch("/api/cart", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, qty }),
    });
    await load();
  }

  const count = items.reduce((s, l) => s + l.qty, 0);
  const subtotal = items.reduce((s, l) => s + l.product.price * l.qty, 0);
  const shipping = subtotal >= 1_000_000 || subtotal === 0 ? 0 : 45_000;
  const total = subtotal + shipping;

  if (loading) return <div className="p-20 text-center text-on-surface-variant">در حال بارگذاری...</div>;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-[800px] px-margin-mobile py-20 text-center">
        <h1 className="text-3xl font-bold">سبد خرید شما</h1>
        <p className="mt-4 text-on-surface-variant">سبد خرید خالی است.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/shop" className="bg-cta focus-cta cyber-chamfer-sm px-6 py-3 font-mono text-sm font-semibold uppercase tracking-wide shadow-[var(--box-shadow-neon-sm)]">
            رفتن به فروشگاه
          </Link>
          <Link href="/login" className="cyber-chamfer-sm border border-outline px-6 py-3 font-mono text-sm font-semibold uppercase tracking-wide transition-colors hover:border-primary-container hover:text-primary-container">
            ورود به حساب
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="mx-auto grid max-w-[1280px] grid-cols-1 gap-6 px-margin-mobile py-10 md:px-margin-desktop lg:grid-cols-12">
      <div className="lg:col-span-12">
        <h1 className="mb-1 text-3xl font-bold text-on-surface">سبد خرید شما</h1>
        <p className="text-base text-on-surface-variant">{count} کالا در سبد خرید شما موجود است.</p>
      </div>

      <div className="flex flex-col gap-4 lg:col-span-8">
        {items.map((line) => (
          <article
            key={line.product.id}
            className="ambient-card group relative flex flex-col items-center gap-4 cyber-chamfer p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--box-shadow-neon)] sm:flex-row"
          >
            <div className="h-32 w-full shrink-0 overflow-hidden cyber-chamfer-sm bg-surface-container-low sm:w-32">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={line.product.image || "/placeholder.svg"}
                alt={line.product.title}
                className="h-full w-full object-contain p-2"
              />
            </div>
            <div className="flex h-full w-full flex-1 flex-col justify-between">
              <div className="mb-4 flex w-full items-start justify-between">
                <div>
                  <Link href={`/product/${line.product.slug}`}>
                    <h3 className="mb-1 text-xl font-semibold text-on-surface hover:text-primary">
                      {line.product.title}
                    </h3>
                  </Link>
                  <div className="flex gap-2">
                    {line.product.brand && (
                      <span className="cyber-chamfer-sm bg-surface-container-low px-2 py-1 font-mono text-xs text-on-surface-variant">
                        {line.product.brand}
                      </span>
                    )}
                    <span className="cyber-chamfer-sm bg-surface-container-low px-2 py-1 font-mono text-xs text-on-surface-variant">
                      {line.product.type === "DIGITAL" ? "دانلود آنی" : "ارسال فوری"}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="حذف کالا"
                  className="p-1 text-on-surface-variant hover:text-error"
                  onClick={() => setQty(line.product.id, 0)}
                >
                  <Icon name="delete" className="h-5 w-5" />
                </button>
              </div>
              <div className="flex w-full items-end justify-between">
                <div className="flex items-center gap-3 cyber-chamfer-sm border border-outline bg-surface-container p-1">
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center hover:text-primary"
                    onClick={() => setQty(line.product.id, line.qty + 1)}
                  >
                    +
                  </button>
                  <span className="w-4 text-center text-lg font-medium">{line.qty}</span>
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center text-on-surface-variant hover:text-error"
                    onClick={() => setQty(line.product.id, line.qty - 1)}
                  >
                    −
                  </button>
                </div>
                <div className="text-left text-xl font-bold text-primary">
                  {formatToman(line.product.price * line.qty)}{" "}
                  <span className="text-sm font-normal text-on-surface-variant">تومان</span>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      <aside className="h-max lg:sticky lg:top-32 lg:col-span-4">
        <div className="cyber-chamfer flex flex-col gap-5 border border-outline bg-surface-container-lowest p-8 shadow-[var(--box-shadow-neon-sm)]">
          <h2 className="mb-1 border-b border-outline pb-3 font-mono text-xl font-semibold uppercase tracking-wide text-on-surface">
            خلاصه سفارش
          </h2>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-on-surface-variant">قیمت کالاها ({count})</span>
              <span className="font-medium">{formatToman(subtotal)} تومان</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-on-surface-variant">هزینه ارسال</span>
              <span className="font-medium">
                {shipping === 0 ? "رایگان" : `${formatToman(shipping)} تومان`}
              </span>
            </div>
          </div>
          <div className="relative w-full">
            <input
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              className="cyber-chamfer-sm w-full border border-outline bg-surface-container-lowest px-4 py-2 font-mono text-base focus:border-primary-container focus:shadow-[var(--box-shadow-neon-sm)] focus:outline-none"
              placeholder="کد تخفیف"
              type="text"
            />
            <button
              type="button"
              className="absolute top-1 bottom-1 left-1 cyber-chamfer-sm bg-surface-container px-4 font-mono text-sm text-on-surface-variant transition-colors hover:text-primary-container"
            >
              ثبت
            </button>
          </div>
          <hr className="border-surface-variant" />
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xl font-bold text-on-surface">جمع کل</span>
            <div className="text-left">
              <span className="text-2xl font-black text-primary">{formatToman(total)}</span>
              <span className="mr-1 text-sm text-on-surface-variant">تومان</span>
            </div>
          </div>
          <Link
            href="/checkout/shipping"
            className="bg-cta focus-cta cyber-chamfer-sm flex w-full items-center justify-center gap-2 py-4 font-mono text-xl font-semibold uppercase tracking-wide shadow-[var(--box-shadow-neon)] transition-colors active:scale-[0.98]"
          >
            ثبت سفارش
            <Icon name="arrow_back" className="h-5 w-5" />
          </Link>
          <p className="flex items-center justify-center gap-2 text-center text-xs text-on-surface-variant">
            <Icon name="lock" className="h-4 w-4" />
            پرداخت امن از طریق درگاه‌های بانکی معتبر
          </p>
        </div>
      </aside>
    </main>
  );
}
