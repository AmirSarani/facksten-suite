import { Icon } from "@/components/icon";

const PORTFOLIO_URL = (process.env.NEXT_PUBLIC_PORTFOLIO_URL || "http://77.221.156.164/portfolio").replace(
  /\/$/,
  "",
);

const POINTS = [
  "طراحی و توسعه وب‌سایت و محصول دیجیتال",
  "تیم کامل: طراحی، فرانت، بک‌اند و سخت‌افزار",
  "نمونه‌کارهای واقعی استودیو فکستن",
] as const;

/**
 * Early home promo: shop sells parts; studio also builds sites & systems.
 * Placed after hero/trust — visible soon, not buried in the hero.
 */
export function PortfolioPromo() {
  return (
    <section
      className="home-section-enter relative overflow-x-hidden border-y border-outline-variant/60 bg-surface-container-lowest"
      aria-labelledby="portfolio-promo-title"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 cyber-grid opacity-40" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 80% at 100% 50%, rgba(255,122,0,0.14) 0%, transparent 55%), radial-gradient(ellipse 40% 50% at 0% 80%, rgba(0,212,255,0.08) 0%, transparent 50%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-primary-container/20 blur-3xl"
      />

      <div className="relative mx-auto grid max-w-[1280px] gap-6 px-page py-8 sm:gap-8 sm:py-10 lg:grid-cols-[1.2fr_auto] lg:items-center lg:gap-10">
        <div dir="rtl" className="min-w-0 space-y-3 sm:space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <p
              className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-primary-container"
              dir="ltr"
            >
              // STUDIO::PORTFOLIO
            </p>
            <span className="cyber-chamfer-sm border border-primary-container/40 bg-primary-container/10 px-2 py-0.5 font-mono text-[10px] text-primary-container">
              خدمات طراحی وب
            </span>
          </div>

          <h2
            id="portfolio-promo-title"
            className="text-fluid-title font-bold text-on-surface text-balance"
          >
            فروشگاه قطعات فقط یکی از کارهای ماست
          </h2>
          <p className="max-w-2xl text-sm leading-7 text-on-surface-variant sm:text-base sm:leading-7">
            علاوه بر بستر فروش الکترونیک، استودیو فکستن وب‌سایت و سیستم‌های دیجیتال طراحی و پیاده‌سازی
            می‌کند — با تیم کامل تا پروژه از ایده تا تحویل جلو برود. اگر به‌دنبال ساخت سایت یا همکاری
            محصولی هستید، نمونه‌کارها را ببینید.
          </p>

          <ul className="space-y-1.5 pt-1" aria-label="خدمات استودیو">
            {POINTS.map((line) => (
              <li key={line} className="flex items-start gap-2 text-sm text-on-surface-variant">
                <span className="mt-0.5 font-mono text-primary-container" aria-hidden>
                  &gt;
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center lg:flex-col lg:items-stretch">
          <a
            href={PORTFOLIO_URL}
            className="bg-cta shadow-cta focus-cta cyber-chamfer-sm inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-on-primary transition-all duration-200 active:scale-[0.98] sm:w-auto lg:w-full"
          >
            مشاهده نمونه کارها
            <Icon name="arrow_forward" className="h-4 w-4 rotate-180" />
          </a>
          <a
            href={`${PORTFOLIO_URL}/contact`}
            className="focus-cta cyber-chamfer-sm inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 border border-outline-variant bg-background/80 px-5 py-3 text-sm font-semibold text-on-surface transition-colors duration-200 hover:border-primary-container/50 hover:shadow-[var(--box-shadow-neon-sm)] sm:w-auto lg:w-full"
          >
            درخواست مشاوره طراحی
          </a>
          <p className="text-center font-mono text-[10px] tracking-wider text-on-surface-variant lg:text-start" dir="ltr">
            portfolio · studio systems
          </p>
        </div>
      </div>
    </section>
  );
}
