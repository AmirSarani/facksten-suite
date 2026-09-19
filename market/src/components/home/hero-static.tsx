import Link from "next/link";
import { Icon } from "@/components/icon";

type Props = {
  heroTitle: string;
  heroSubtitle: string;
  heroCtaLabel: string;
  heroCtaHref: string;
};

const HUD_STATS = [
  { label: "SKU", value: "2,400+" },
  { label: "SHIP", value: "24H" },
  { label: "SUPPORT", value: "LIVE" },
];

const TRUST_LINES = ["موجودی گسترده قطعات", "دسته‌بندی فنی و دقیق", "ارسال سریع به سراسر کشور"];

/** Static homepage hero — brand thesis, value prop, and CTAs. No WebGL. */
export function HeroStatic({ heroTitle, heroSubtitle, heroCtaLabel, heroCtaHref }: Props) {
  return (
    <section
      className="relative isolate min-h-[min(88svh,560px)] w-full overflow-hidden bg-background cyber-grid md:min-h-[520px] lg:min-h-[580px]"
      aria-label={heroTitle}
    >
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 30% 50%, rgba(255,122,0,0.12) 0%, transparent 55%), radial-gradient(ellipse 50% 40% at 85% 20%, rgba(0,212,255,0.06) 0%, transparent 50%)",
        }}
      />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-30 home-hero-circuit-fade sm:w-2/5" aria-hidden>
        <div className="h-full w-full hero-circuit opacity-60" />
      </div>
      <div
        className="pointer-events-none absolute left-1/2 top-[48%] h-[min(50vw,320px)] w-[min(50vw,320px)] max-w-[100%] -translate-x-1/2 -translate-y-1/2 opacity-50 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(255,122,0,0.22) 0%, transparent 68%)" }}
        aria-hidden
      />

      <div className="relative mx-auto flex h-full min-h-[inherit] max-w-[1280px] flex-col justify-center px-page py-12 sm:py-16">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-12">
          <div dir="rtl" className="max-w-xl space-y-4 sm:max-w-2xl sm:space-y-5">
            <p
              className="font-mono text-xs font-bold uppercase tracking-[0.35em] text-primary-container"
              dir="ltr"
            >
              // FACKSTEN
            </p>
            <h1
              className="cyber-glitch text-fluid-hero font-extrabold text-on-surface text-balance"
              data-text={heroTitle}
            >
              {heroTitle}
            </h1>
            <p className="cyber-cursor text-fluid-lead max-w-xl text-on-surface-variant text-pretty">{heroSubtitle}</p>
            <ul className="space-y-1.5 pt-0.5" aria-label="مزایای فکستن">
              {TRUST_LINES.map((line) => (
                <li key={line} className="flex items-start gap-2 text-sm text-on-surface-variant sm:text-[0.9375rem]">
                  <span className="mt-0.5 font-mono text-primary-container" aria-hidden>
                    &gt;
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-2.5 pt-1 sm:flex-row sm:flex-wrap sm:gap-3 sm:pt-2">
              <Link
                href={heroCtaHref || "/shop"}
                className="bg-cta shadow-cta focus-cta cyber-chamfer-sm inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-on-primary transition-all duration-200 active:scale-95 sm:w-auto sm:px-6 sm:py-3"
              >
                {heroCtaLabel || "مشاهده فروشگاه"}
                <Icon name="arrow_forward" className="h-4 w-4" />
              </Link>
              <Link
                href="/shop/category/arduino"
                className="focus-cta cyber-chamfer-sm inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 border border-outline-variant bg-surface-container-lowest/80 px-5 py-2.5 text-sm font-semibold text-on-surface transition-colors duration-200 hover:border-primary-container/50 hover:shadow-[var(--box-shadow-neon-sm)] sm:w-auto sm:px-6 sm:py-3"
              >
                بردهای آردوینو
              </Link>
            </div>
          </div>

          {/* HUD panel — desktop only */}
          <aside className="hidden lg:block" aria-label="وضعیت سیستم">
            <div className="cyber-chamfer border border-outline-variant bg-surface-container-lowest/90 p-5 shadow-[var(--box-shadow-neon-sm)] backdrop-blur-sm">
              <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.25em] text-accent-tertiary">
                SYS::STATUS
              </p>
              <ul className="space-y-3">
                {HUD_STATS.map((s) => (
                  <li
                    key={s.label}
                    className="flex items-center justify-between gap-4 border-b border-outline-variant/60 pb-3 last:border-0 last:pb-0"
                  >
                    <span className="font-mono text-xs text-on-surface-variant">{s.label}</span>
                    <span className="font-mono text-sm font-bold text-primary-container">{s.value}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-center gap-2 font-mono text-[10px] text-accent-secondary">
                <span className="inline-block h-1.5 w-1.5 animate-pulse bg-primary-container shadow-[var(--box-shadow-neon-sm)]" />
                ONLINE
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
