import Link from "next/link";
import { Icon } from "@/components/icon";
import { formatToman } from "@/lib/format";

export type DealItem = {
  id: string;
  slug: string;
  title: string;
  price: number;
  image: string;
  badge?: string | null;
};

export function DealsRail({ items }: { items: DealItem[] }) {
  if (!items.length) return null;

  return (
    <section className="home-section-enter home-band-circuit max-w-full overflow-x-hidden border-y border-outline-variant/50">
      <div className="mx-auto max-w-[1280px] min-w-0 px-page py-home">
        <div className="mb-6 flex items-end justify-between gap-3 border-b border-outline-variant/40 pb-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent-tertiary" dir="ltr">
              // DEALS::RAIL
            </p>
            <h2 className="mt-1 text-fluid-title font-bold text-on-surface">پیشنهادهای ویژه</h2>
            <p className="mt-1 text-sm text-on-surface-variant">محصولات نشان‌دار و آماده خرید</p>
          </div>
          <Link
            href="/shop"
            prefetch
            className="focus-cta cyber-chamfer-sm flex items-center gap-1 border border-outline-variant bg-surface-container-lowest px-3 py-1.5 text-sm font-semibold text-primary-container transition-all duration-200 hover:border-primary-container hover:shadow-[var(--box-shadow-neon-sm)]"
          >
            مشاهده فروشگاه
            <Icon name="arrow_forward" className="h-4 w-4 rotate-180" />
          </Link>
        </div>
        <div className="max-w-full min-w-0 overflow-x-auto pb-1 no-scrollbar">
          <div className="flex gap-3">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/product/${item.slug}`}
              prefetch
              className="group cyber-chamfer-sm flex min-w-[220px] max-w-[260px] flex-1 items-center gap-3 border border-outline-variant bg-surface-container-lowest p-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary-container/50 hover:shadow-[var(--box-shadow-neon-sm)]"
            >
              <div className="relative h-16 w-16 shrink-0 overflow-hidden border border-outline-variant bg-surface-container-low cyber-chamfer-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image || "/placeholder.svg"} alt="" className="h-full w-full object-cover p-1" />
              </div>
              <div className="min-w-0 flex-1">
                {item.badge && (
                  <span className="mb-1 inline-block cyber-chamfer-sm bg-primary-container/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-primary-container">
                    {item.badge}
                  </span>
                )}
                <p className="line-clamp-2 text-sm font-semibold text-on-surface group-hover:text-primary-container">{item.title}</p>
                <p className="mt-1 text-sm font-bold text-primary-container">
                  {formatToman(item.price)}{" "}
                  <span className="text-[10px] font-normal text-on-surface-variant">تومان</span>
                </p>
              </div>
            </Link>
          ))}
          </div>
        </div>
      </div>
    </section>
  );
}
