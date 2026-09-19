"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckoutSteps } from "@/components/checkout-steps";
import { Icon } from "@/components/icon";
import { formatToman } from "@/lib/format";

type Line = {
  qty: number;
  product: { id: string; title: string; price: number };
};

export default function ShippingPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [delivery, setDelivery] = useState<"fast" | "normal">("fast");
  const [items, setItems] = useState<Line[]>([]);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/cart");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items ?? []);
      }
    })();
  }, []);

  const count = items.reduce((s, l) => s + l.qty, 0);
  const subtotal = items.reduce((s, l) => s + l.product.price * l.qty, 0);
  const shippingCost = delivery === "fast" ? 50_000 : 0;
  const total = subtotal + shippingCost;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const payload = {
      shippingName: String(fd.get("shippingName") || "گیرنده"),
      shippingPhone: String(fd.get("shippingPhone") || ""),
      shippingAddr: String(fd.get("shippingAddr") || ""),
      postalCode: String(fd.get("postalCode") || ""),
      delivery,
      paymentMethod: "mock",
    };
    sessionStorage.setItem("facksten_checkout", JSON.stringify(payload));
    setLoading(false);
    router.push("/checkout/payment");
  }

  return (
    <div className="mx-auto max-w-[1280px] px-margin-mobile py-10 md:px-margin-desktop">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-on-surface">تکمیل خرید</h1>
        <p className="flex items-center gap-1.5 text-sm text-on-surface-variant">
          <Icon name="lock" className="h-4 w-4 text-primary-container" />
          پرداخت امن
        </p>
      </div>
      <CheckoutSteps current={1} />

      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-8">
          <div className="cyber-chamfer border border-outline bg-surface-container-lowest p-6 shadow-[var(--box-shadow-neon-sm)]">
            <h2 className="mb-4 font-mono text-xl font-semibold uppercase tracking-wide text-on-surface">آدرس تحویل</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block md:col-span-2">
                <span className="mb-1 block text-sm font-semibold text-on-surface-variant">آدرس کامل</span>
                <textarea
                  name="shippingAddr"
                  required
                  rows={3}
                  placeholder="استان، شهر، خیابان، کوچه، پلاک، واحد"
                  className="cyber-chamfer-sm w-full resize-none border border-outline bg-surface-container-lowest px-4 py-3 font-mono text-sm focus:border-primary-container focus:shadow-[var(--box-shadow-neon-sm)] focus:outline-none"
                />
              </label>
              <input type="hidden" name="shippingName" value="گیرنده" />
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-on-surface-variant">کد پستی</span>
                <input
                  name="postalCode"
                  className="cyber-chamfer-sm w-full border border-outline bg-surface-container-lowest px-4 py-3 font-mono text-sm focus:border-primary-container focus:outline-none"
                  placeholder="کد پستی ۱۰ رقمی"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-on-surface-variant">شماره تماس گیرنده</span>
                <input
                  name="shippingPhone"
                  required
                  dir="ltr"
                  type="tel"
                  placeholder="09--"
                  className="cyber-chamfer-sm w-full border border-outline bg-surface-container-lowest px-4 py-3 text-left font-mono text-sm focus:border-primary-container focus:outline-none"
                />
              </label>
            </div>
          </div>

          <div className="cyber-chamfer border border-outline bg-surface-container-lowest p-6 shadow-[var(--box-shadow-neon-sm)]">
            <h2 className="mb-4 font-mono text-xl font-semibold uppercase tracking-wide text-on-surface">زمان ارسال</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <button
                type="button"
                onClick={() => setDelivery("fast")}
                className={`relative flex items-center justify-between cyber-chamfer-sm p-4 text-right transition-colors ${
                  delivery === "fast"
                    ? "border-2 border-primary-container shadow-[var(--box-shadow-neon-sm)]"
                    : "border border-outline opacity-80 hover:border-primary-container/50"
                }`}
              >
                <div className="flex flex-col gap-1">
                  <span className="flex items-center gap-1 text-sm font-semibold text-primary-container">
                    <Icon name="local_shipping" className="h-4 w-4" />
                    ارسال سریع
                  </span>
                  <span className="text-xs text-on-surface-variant">تحویل فردا، ۹ صبح تا ۱۲ ظهر</span>
                </div>
                <span className="text-sm font-semibold">۵۰,۰۰۰ تومان</span>
              </button>
              <button
                type="button"
                onClick={() => setDelivery("normal")}
                className={`relative flex items-center justify-between cyber-chamfer-sm p-4 text-right transition-colors ${
                  delivery === "normal"
                    ? "border-2 border-primary-container shadow-[var(--box-shadow-neon-sm)]"
                    : "border border-outline opacity-80 hover:border-primary-container/50"
                }`}
              >
                <div className="flex flex-col gap-1">
                  <span className="flex items-center gap-1 text-sm font-semibold text-on-surface">ارسال عادی</span>
                  <span className="text-xs text-on-surface-variant">تحویل ۳ تا ۵ روز کاری آینده</span>
                </div>
                <span className="text-sm font-semibold">رایگان</span>
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-error">{error}</p>}
        </div>

        <aside className="cyber-chamfer h-fit border border-outline bg-surface-container-lowest p-6 shadow-[var(--box-shadow-neon-sm)] lg:sticky lg:top-[100px] lg:col-span-4">
          <h2 className="mb-4 border-b border-outline pb-3 font-mono text-xl font-semibold uppercase tracking-wide">خلاصه سفارش</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-on-surface-variant">قیمت کالاها ({count})</span>
              <span className="font-medium">{formatToman(subtotal)} تومان</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">هزینه ارسال</span>
              <span className="font-medium">
                {shippingCost === 0 ? "رایگان" : `${formatToman(shippingCost)} تومان`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">تخفیف کالاها</span>
              <span className="font-medium">۰ تومان</span>
            </div>
          </div>
          <hr className="my-4 border-surface-variant" />
          <div className="mb-5 flex items-center justify-between">
            <span className="text-lg font-bold">مبلغ قابل پرداخت</span>
            <span className="text-xl font-black text-primary">{formatToman(total)} تومان</span>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-cta focus-cta cyber-chamfer-sm flex w-full items-center justify-center gap-2 py-3.5 font-mono text-sm font-semibold uppercase tracking-wide shadow-[var(--box-shadow-neon)] disabled:opacity-60"
          >
            ادامه به پرداخت
            <Icon name="arrow_back" className="h-4 w-4" />
          </button>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-on-surface-variant">
            <Icon name="lock" className="h-3.5 w-3.5" />
            پرداخت امن Facksten
          </p>
        </aside>
      </form>
    </div>
  );
}
