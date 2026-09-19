import type { Metadata } from "next";
import { Icon } from "@/components/icon";

export const metadata: Metadata = {
  title: "ارسال و تحویل",
  description: "شرایط ارسال سفارش‌های فکستن از انبار تهران",
};

export default function ShippingPage() {
  return (
    <main className="cyber-grid mx-auto max-w-3xl px-margin-mobile py-10 md:px-margin-desktop">
      <div className="cyber-chamfer border border-outline bg-surface-container-lowest p-8 shadow-[var(--box-shadow-neon-sm)]">
        <p className="mb-2 font-mono text-xs font-bold uppercase tracking-[0.2em] text-primary-container">logistics://delivery</p>
        <h1 className="font-mono text-3xl font-bold uppercase tracking-wide text-on-surface">ارسال و تحویل</h1>
        <div className="mt-6 space-y-4 text-sm leading-7 text-on-surface-variant">
          <p className="flex items-start gap-2">
            <Icon name="local_shipping" className="mt-0.5 h-4 w-4 shrink-0 text-primary-container" />
            سفارش‌های سخت‌افزاری از انبار تهران آماده‌سازی و ارسال می‌شوند.
          </p>
          <p className="alert-info cyber-chamfer-sm p-4 text-sm leading-7">
            برای خریدهای بالای ۱٬۰۰۰٬۰۰۰ تومان، هزینه ارسال در مسیرهای اصلی رایگان است.
          </p>
          <p className="flex items-start gap-2">
            <Icon name="download" className="mt-0.5 h-4 w-4 shrink-0 text-accent-tertiary" />
            محصولات دیجیتال بلافاصله پس از پرداخت در بخش دانلودهای حساب کاربری فعال می‌شوند.
          </p>
          <p>زمان آماده‌سازی معمول ۱ تا ۲ روز کاری است؛ زمان تحویل به شهر مقصد بستگی دارد.</p>
        </div>
      </div>
    </main>
  );
}
