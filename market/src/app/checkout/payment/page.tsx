"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icon";
import { formatToman } from "@/lib/format";

type Line = {
  qty: number;
  product: { id: string; title: string; price: number; image?: string };
};

const methods = [
  {
    id: "zarinpal",
    title: "پرداخت اینترنتی (درگاه زرین‌پال)",
    desc: "پرداخت امن و سریع با تمامی کارت‌های عضو شتاب",
    badge: "شتاب",
  },
  {
    id: "card",
    title: "کارت به کارت",
    desc: "پس از انتقال وجه، رسید آن را بارگذاری کنید. (نیاز به تایید ادمین)",
  },
] as const;

export default function PaymentPage() {
  const router = useRouter();
  const [method, setMethod] = useState<(typeof methods)[number]["id"]>("zarinpal");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
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

  const subtotal = items.reduce((s, l) => s + l.product.price * l.qty, 0);
  const shipping = subtotal >= 1_000_000 || subtotal === 0 ? 0 : 45_000;
  const discount =
    couponApplied && coupon.trim().toUpperCase() === "FACKSTEN" ? Math.min(50_000, subtotal) : 0;
  const total = Math.max(0, subtotal + shipping - discount);

  async function pay() {
    setLoading(true);
    setError("");
    const raw = sessionStorage.getItem("facksten_checkout");
    if (!raw) {
      setError("ابتدا آدرس را تکمیل کنید");
      setLoading(false);
      return;
    }
    const shippingData = JSON.parse(raw);
    const label = methods.find((m) => m.id === method)?.title ?? method;
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...shippingData,
        paymentMethod: label,
        coupon: couponApplied ? coupon : undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "پرداخت ناموفق");
      return;
    }
    sessionStorage.removeItem("facksten_checkout");
    router.push(data.redirect);
  }

  return (
    <div className="mx-auto max-w-[1280px] px-margin-mobile py-10 md:px-margin-desktop">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <Link href="/cart" className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary">
          <Icon name="arrow_forward" className="h-4 w-4" />
          بازگشت به سبد خرید
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-on-surface md:text-[40px]">پرداخت و تکمیل سفارش</h1>
        <p className="text-on-surface-variant">لطفا روش پرداخت خود را انتخاب کنید و سفارش را نهایی کنید.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-8">
          <section className="cyber-chamfer border border-outline bg-surface-container-lowest p-6 shadow-[var(--box-shadow-neon-sm)] md:p-8">
            <h2 className="mb-6 flex items-center gap-2 font-mono text-xl font-semibold uppercase tracking-wide">
              <Icon name="verified_user" className="h-5 w-5 text-primary" />
              روش پرداخت
            </h2>
            <div className="flex flex-col gap-3">
              {methods.map((m) => {
                const on = method === m.id;
                return (
                  <label key={m.id} className="relative cursor-pointer">
                    <input
                      type="radio"
                      name="payment_method"
                      className="sr-only"
                      checked={on}
                      onChange={() => setMethod(m.id)}
                    />
                    <div
                      className={`flex items-start gap-4 cyber-chamfer-sm border p-4 transition-all md:p-5 ${
                        on
                          ? "border-primary-container bg-surface-container-low/80 shadow-[var(--box-shadow-neon-sm)]"
                          : "border-outline hover:border-primary-container/40"
                      }`}
                    >
                      <div
                        className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                          on ? "border-primary-container" : "border-outline"
                        }`}
                      >
                        <div
                          className={`h-2.5 w-2.5 rounded-full transition-transform ${
                            on ? "scale-100 bg-primary-container" : "scale-0 bg-transparent"
                          }`}
                        />
                      </div>
                      <div className="flex flex-1 flex-col justify-between gap-3 sm:flex-row sm:items-center">
                        <div>
                          <p className="font-semibold text-on-surface">{m.title}</p>
                          <p className="mt-1 text-sm text-on-surface-variant">{m.desc}</p>
                        </div>
                        {"badge" in m && m.badge && (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-surface-container-high text-[10px] font-bold text-on-surface-variant">
                            {m.badge}
                          </div>
                        )}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </section>

          <section className="cyber-chamfer border border-outline bg-surface-container-lowest p-6 shadow-[var(--box-shadow-neon-sm)]">
            <h2 className="mb-4 font-mono text-xl font-semibold uppercase tracking-wide">کد تخفیف</h2>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={coupon}
                onChange={(e) => {
                  setCoupon(e.target.value);
                  setCouponApplied(false);
                }}
                className="cyber-chamfer-sm flex-1 border border-outline bg-surface-container-lowest px-4 py-3 font-mono text-sm focus:border-primary-container focus:outline-none"
                placeholder="کد تخفیف خود را وارد کنید"
              />
              <button
                type="button"
                onClick={() => setCouponApplied(true)}
                className="cyber-chamfer-sm border border-outline px-6 py-3 font-mono text-sm font-semibold uppercase tracking-wide transition-colors hover:border-primary-container hover:text-primary-container"
              >
                ثبت کد
              </button>
            </div>
            {couponApplied && discount > 0 && (
              <p className="mt-2 text-sm text-primary">کد تخفیف اعمال شد (−{formatToman(discount)} تومان)</p>
            )}
            {couponApplied && discount === 0 && coupon && (
              <p className="mt-2 text-sm text-error">کد تخفیف معتبر نیست</p>
            )}
          </section>

          {error && <p className="text-sm text-error">{error}</p>}
        </div>

        <aside className="cyber-chamfer h-fit border border-outline bg-surface-container-lowest p-6 shadow-[var(--box-shadow-neon-sm)] lg:sticky lg:top-24 lg:col-span-4">
          <h2 className="mb-4 border-b border-outline pb-3 font-mono text-xl font-semibold uppercase tracking-wide">خلاصه سفارش</h2>
          <div className="mb-4 max-h-60 space-y-3 overflow-y-auto">
            {items.length === 0 ? (
              <p className="text-sm text-on-surface-variant">سبد خالی است یا وارد نشده‌اید.</p>
            ) : (
              items.map((l) => (
                <div key={l.product.id} className="flex items-center justify-between gap-2 py-1">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden cyber-chamfer-sm bg-surface-container-low">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={l.product.image || "/placeholder.svg"}
                        alt=""
                        className="h-full w-full object-contain p-1"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="line-clamp-1 text-sm font-semibold">{l.product.title}</p>
                      <p className="text-xs text-on-surface-variant">{l.qty} عدد</p>
                    </div>
                  </div>
                  <p className="shrink-0 text-sm font-semibold">{formatToman(l.product.price * l.qty)}</p>
                </div>
              ))
            )}
          </div>
          <hr className="my-3 border-surface-variant" />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-on-surface-variant">مبلغ کل کالاها</span>
              <span>{formatToman(subtotal)} تومان</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">هزینه ارسال</span>
              <span>{shipping === 0 ? "رایگان" : `${formatToman(shipping)} تومان`}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-primary">
                <span>تخفیف</span>
                <span>- {formatToman(discount)} تومان</span>
              </div>
            )}
          </div>
          <hr className="my-3 border-surface-variant" />
          <div className="mb-5 flex items-center justify-between gap-2">
            <span className="text-lg font-bold">مبلغ قابل پرداخت</span>
            <span className="text-2xl font-black text-primary">{formatToman(total)} تومان</span>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={pay}
            className="bg-cta focus-cta cyber-chamfer-sm flex w-full items-center justify-center gap-2 py-4 font-mono text-sm font-semibold uppercase tracking-wide shadow-[var(--box-shadow-neon)] transition active:scale-[0.98] disabled:opacity-60"
          >
            <Icon name="lock" className="h-4 w-4" />
            {loading ? "در حال ثبت..." : "پرداخت امن و ثبت سفارش"}
          </button>
          <p className="mt-3 flex items-center justify-center gap-1 text-center text-xs text-on-surface-variant">
            <Icon name="verified_user" className="h-3.5 w-3.5" />
            پرداخت شما توسط درگاه امن تضمین می‌شود.
          </p>
        </aside>
      </div>
    </div>
  );
}
