import Link from "next/link";
import { Icon } from "@/components/icon";

/** Full-bleed orange neon composition — one job CTA strip. */
export function PromoBand() {
  return (
    <section className="home-section-enter relative overflow-hidden max-w-full bg-cta shadow-[var(--box-shadow-neon-lg)]">
      <div aria-hidden className="pointer-events-none absolute inset-0 cyber-grid opacity-30" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, transparent, transparent 18px, rgba(10,10,15,0.15) 18px, rgba(10,10,15,0.15) 19px), repeating-linear-gradient(0deg, transparent, transparent 18px, rgba(10,10,15,0.15) 18px, rgba(10,10,15,0.15) 19px)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-16 top-1/2 h-48 w-48 -translate-y-1/2 bg-on-primary/10 blur-2xl"
      />
      <div className="relative mx-auto flex max-w-[1280px] flex-col items-start justify-between gap-5 px-page py-8 sm:flex-row sm:items-center sm:py-10">
        <div className="min-w-0 max-w-2xl">
          <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.25em] text-on-primary/70" dir="ltr">
            // PROMO::ACTIVE
          </p>
          <p className="text-fluid-title font-bold text-on-primary text-balance">قطعه درست، برای پروژه درست</p>
          <p className="mt-1.5 text-sm leading-6 text-on-primary/85 sm:text-base">
            از انبار فکستن بخرید — اصالت کالا و پشتیبانی فنی قبل از سفارش.
          </p>
        </div>
        <Link
          href="/shop"
          prefetch
          className="focus-cta cyber-chamfer inline-flex shrink-0 cursor-pointer items-center gap-2 border border-on-primary/20 bg-surface-container-lowest px-5 py-3 text-sm font-semibold text-on-surface shadow-[var(--box-shadow-neon-sm)] transition-all duration-200 hover:border-primary-container hover:shadow-[var(--box-shadow-neon)] active:scale-[0.98]"
        >
          ورود به فروشگاه
          <Icon name="arrow_forward" className="h-4 w-4 rotate-180" />
        </Link>
      </div>
    </section>
  );
}
