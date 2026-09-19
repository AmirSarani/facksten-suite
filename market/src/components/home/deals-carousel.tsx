"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icon";
import { formatToman, discountPercent } from "@/lib/format";

export type CarouselDeal = {
  id: string;
  slug: string;
  title: string;
  price: number;
  image: string;
  badge?: string | null;
  compareAtPrice?: number | null;
};

export function DealsCarousel({ items }: { items: CarouselDeal[] }) {
  const slides = items.slice(0, 8);
  const count = slides.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const go = useCallback(
    (next: number) => {
      if (!count) return;
      setIndex(((next % count) + count) % count);
    },
    [count],
  );

  useEffect(() => {
    if (count < 2 || paused) return;
    timerRef.current = setInterval(() => go(index + 1), 4500);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [count, paused, index, go]);

  if (!count) return null;

  const active = slides[index]!;
  const discount = discountPercent(active.price, active.compareAtPrice);

  return (
    <section className="overflow-x-hidden home-section-enter home-band-circuit border-y border-outline-variant/50">
      <div className="mx-auto max-w-[1280px] px-page py-home">
        <div className="mb-4 flex items-end justify-between gap-3 border-b border-outline-variant/40 pb-4 sm:mb-5">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent-tertiary" dir="ltr">
              // DEALS::CAROUSEL
            </p>
            <h2 className="mt-1 text-fluid-title font-bold text-on-surface">پیشنهادهای ویژه</h2>
            <p className="mt-1 text-sm text-on-surface-variant">تخفیف‌های محدود — اسلاید بزنید یا صبر کنید تا خودکار عوض شود</p>
          </div>
          <Link
            href="/shop?sort=popular"
            prefetch
            className="focus-cta cyber-chamfer-sm flex shrink-0 items-center gap-1 border border-outline-variant bg-surface-container-lowest px-3 py-1.5 text-sm font-semibold text-primary-container transition-all duration-200 hover:border-primary-container hover:shadow-[var(--box-shadow-neon-sm)]"
          >
            فروشگاه
            <Icon name="arrow_forward" className="h-4 w-4 rotate-180" />
          </Link>
        </div>

        <div
          className="relative overflow-hidden cyber-chamfer border border-outline-variant bg-surface-container-lowest shadow-[var(--box-shadow-neon-sm)]"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPaused(false);
          }}
        >
          <div className="grid">
            {slides.map((item, i) => {
              const d = discountPercent(item.price, item.compareAtPrice);
              const isActive = i === index;
              return (
                <div
                  key={item.id}
                  className={`col-start-1 row-start-1 transition-opacity duration-500 ease-out ${
                    isActive ? "z-[1] opacity-100" : "z-0 pointer-events-none opacity-0"
                  }`}
                  aria-hidden={!isActive}
                >
                  <Link
                    href={`/product/${item.slug}`}
                    prefetch
                    tabIndex={isActive ? 0 : -1}
                    className="grid h-full grid-cols-1 sm:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden bg-surface-container-low sm:aspect-auto sm:min-h-[240px]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.image || "/placeholder.svg"}
                        alt=""
                        className="h-full w-full object-cover object-center"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent sm:bg-gradient-to-l sm:from-transparent sm:via-transparent sm:to-black/10" />
                      {(d > 0 || item.badge) && (
                        <span className="absolute top-3 right-3 cyber-chamfer-sm bg-cta px-2.5 py-1 text-xs font-bold text-on-primary shadow-cta">
                          {d > 0 ? `${d}٪ تخفیف` : item.badge}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col justify-center gap-3 p-5 sm:p-7 md:p-8">
                      <p className="font-mono text-xs font-semibold uppercase tracking-wide text-accent-tertiary">مدار تخفیف</p>
                      <h3 className="text-lg font-bold text-on-surface text-balance sm:text-xl md:text-2xl">
                        {item.title}
                      </h3>
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="text-2xl font-extrabold text-on-surface">
                          {formatToman(item.price)}{" "}
                          <span className="text-xs font-normal text-on-surface-variant">تومان</span>
                        </span>
                        {item.compareAtPrice && item.compareAtPrice > item.price ? (
                          <span className="text-sm text-on-surface-variant line-through">
                            {formatToman(item.compareAtPrice)}
                          </span>
                        ) : null}
                      </div>
                      <span className="inline-flex w-fit cursor-pointer items-center gap-2 cyber-chamfer-sm bg-cta px-4 py-2.5 text-sm font-semibold text-on-primary shadow-cta transition-colors duration-200">
                        مشاهده پیشنهاد
                        <Icon name="arrow_forward" className="h-4 w-4 rotate-180" />
                      </span>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>

          {count > 1 ? (
            <>
              <button
                type="button"
                aria-label="قبلی"
                onClick={() => go(index - 1)}
                className="focus-cta absolute top-1/2 right-2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center cyber-chamfer-sm border border-outline-variant bg-surface-container-lowest/95 text-on-surface shadow-[var(--box-shadow-neon-sm)] backdrop-blur-sm transition hover:border-primary-container/50 hover:text-primary-container sm:right-3"
              >
                <Icon name="chevron_left" className="h-5 w-5 rotate-180" />
              </button>
              <button
                type="button"
                aria-label="بعدی"
                onClick={() => go(index + 1)}
                className="focus-cta absolute top-1/2 left-2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center cyber-chamfer-sm border border-outline-variant bg-surface-container-lowest/95 text-on-surface shadow-[var(--box-shadow-neon-sm)] backdrop-blur-sm transition hover:border-primary-container/50 hover:text-primary-container sm:left-3"
              >
                <Icon name="chevron_left" className="h-5 w-5" />
              </button>
            </>
          ) : null}
        </div>

        {count > 1 ? (
          <div className="mt-3 flex items-center justify-center gap-2" role="tablist" aria-label="اسلایدهای پیشنهاد">
            {slides.map((item, i) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`پیشنهاد ${i + 1}`}
                onClick={() => go(i)}
                className={`h-2 cursor-pointer transition-all duration-200 ${
                  i === index ? "w-6 bg-cta shadow-[var(--box-shadow-neon-sm)]" : "w-2 bg-surface-container-high hover:bg-outline-variant"
                }`}
              />
            ))}
          </div>
        ) : null}

        {/* Compact snap strip for remaining deals — breaks monotony of the hero slide */}
        {slides.length > 1 ? (
          <div className="mt-4 max-w-full min-w-0 overflow-x-auto pb-1 no-scrollbar">
          <div className="flex snap-x snap-mandatory gap-3">
            {slides.map((item, i) => {
              const d = discountPercent(item.price, item.compareAtPrice);
              return (
                <button
                  key={`thumb-${item.id}`}
                  type="button"
                  onClick={() => go(i)}
                  className={`group cyber-chamfer-sm flex w-[min(72vw,220px)] shrink-0 snap-start cursor-pointer items-center gap-3 border p-2.5 text-right transition-all duration-200 ${
                    i === index
                      ? "border-cta bg-surface-container-lowest shadow-[var(--box-shadow-neon-sm)]"
                      : "border-outline-variant bg-surface-container-lowest/80 hover:border-primary-container/35"
                  }`}
                >
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden border border-outline-variant bg-surface-container-low cyber-chamfer-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.image || "/placeholder.svg"} alt="" className="h-full w-full object-cover p-0.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    {(d > 0 || item.badge) && (
                      <span className="mb-0.5 inline-block cyber-chamfer-sm bg-primary-container/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-primary-container">
                        {d > 0 ? `${d}٪` : item.badge}
                      </span>
                    )}
                    <p className="line-clamp-1 text-xs font-semibold text-on-surface">{item.title}</p>
                  </div>
                </button>
              );
            })}
          </div>
          </div>
        ) : null}

        {/* Keep discount in aria for screen readers when slide changes */}
        <span className="sr-only">
          {discount > 0 ? `تخفیف ${discount} درصد` : active.badge || ""}
        </span>
      </div>
    </section>
  );
}
