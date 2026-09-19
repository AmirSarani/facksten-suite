import Link from "next/link";
import { Icon } from "@/components/icon";

const POINTS = [
  "قطعات را بکشید، سیم‌کشی کنید و مدار بسازید",
  "کد آردوینو بنویسید و Blink را واقعاً شبیه‌سازی کنید",
  "قالب آماده اجرا کنید و BOM را یکجا به سبد بفرستید",
] as const;

/**
 * Home promo for Virtual Parts Lab — early, eye-catching, shop design language.
 */
export function LabPromo() {
  return (
    <section
      className="home-section-enter relative overflow-x-hidden border-y border-primary-container/30 bg-background"
      aria-labelledby="lab-promo-title"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 cyber-grid opacity-35" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 65% 90% at 0% 40%, rgba(0,212,255,0.12) 0%, transparent 55%), radial-gradient(ellipse 50% 70% at 100% 60%, rgba(255,122,0,0.16) 0%, transparent 50%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/4 top-0 h-32 w-32 -translate-x-1/2 rounded-full bg-accent-tertiary/15 blur-3xl"
      />

      <div className="relative mx-auto grid max-w-[1280px] gap-6 px-page py-8 sm:gap-8 sm:py-10 lg:grid-cols-[1.15fr_auto] lg:items-center lg:gap-10">
        <div dir="rtl" className="min-w-0 space-y-3 sm:space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <p
              className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-accent-tertiary"
              dir="ltr"
            >
              // LAB::VIRTUAL
            </p>
            <span className="cyber-chamfer-sm border border-accent-tertiary/40 bg-accent-tertiary/10 px-2 py-0.5 font-mono text-[10px] text-accent-tertiary">
              جدید
            </span>
            <span className="cyber-chamfer-sm border border-primary-container/40 bg-primary-container/10 px-2 py-0.5 font-mono text-[10px] text-primary-container">
              رایگان در مرورگر
            </span>
          </div>

          <h2 id="lab-promo-title" className="text-fluid-title font-bold text-on-surface text-balance">
            آزمایشگاه مجازی قطعات
          </h2>
          <p className="max-w-2xl text-sm leading-7 text-on-surface-variant sm:text-base sm:leading-7">
            قبل از خرید، مدار را در مرورگر بسازید و تست کنید: برد آردوینو، LED، سنسور و سیم‌کشی
            پین‌به‌پین — با اجرای واقعی کد و مانیتور سریال. از منوی سایت هم با عنوان «آزمایشگاه مجازی»
            در دسترس است.
          </p>

          <ul className="space-y-1.5 pt-1" aria-label="قابلیت‌های آزمایشگاه">
            {POINTS.map((line) => (
              <li key={line} className="flex items-start gap-2 text-sm text-on-surface-variant">
                <span className="mt-0.5 font-mono text-accent-tertiary" aria-hidden>
                  &gt;
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center lg:flex-col lg:items-stretch">
          <Link
            href="/lab"
            prefetch
            className="bg-cta shadow-cta focus-cta cyber-chamfer-sm inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-on-primary transition-all duration-200 active:scale-[0.98] sm:w-auto lg:w-full"
          >
            ورود به آزمایشگاه
            <Icon name="memory" className="h-4 w-4" />
          </Link>
          <Link
            href="/lab/workspace"
            prefetch
            className="focus-cta cyber-chamfer-sm inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 border border-outline-variant bg-surface-container-lowest/80 px-5 py-3 text-sm font-semibold text-on-surface transition-colors duration-200 hover:border-primary-container/50 hover:shadow-[var(--box-shadow-neon-sm)] sm:w-auto lg:w-full"
          >
            شروع ساخت پروژه
            <Icon name="arrow_forward" className="h-4 w-4 rotate-180" />
          </Link>
          <p
            className="text-center font-mono text-[10px] tracking-wider text-on-surface-variant lg:text-start"
            dir="ltr"
          >
            /lab · simulate before you buy
          </p>
        </div>
      </div>
    </section>
  );
}
