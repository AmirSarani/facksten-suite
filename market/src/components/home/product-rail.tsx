import Link from "next/link";
import { Icon } from "@/components/icon";
import {
  DigitalProductCard,
  HardwareProductCard,
  HomeFeaturedCard,
  type CardProduct,
} from "@/components/product-cards";
import { discountPercent } from "@/lib/format";

export type RailProduct = CardProduct & {
  compareAtPrice?: number | null;
  isNew?: boolean;
  isPopular?: boolean;
};

function railBadge(p: RailProduct) {
  const d = discountPercent(p.price, p.compareAtPrice);
  if (d > 0) return `${d}٪`;
  if (p.isNew) return "جدید";
  if (p.isPopular) return "پرطرفدار";
  return p.badge;
}

const TONE_CLASS: Record<"default" | "muted" | "circuit", string> = {
  default: "border-t border-outline-variant/40",
  muted: "border-t border-outline-variant/40 bg-surface-container-low",
  circuit: "home-band-circuit border-y border-outline-variant/50",
};

function ProductCell({ p }: { p: RailProduct }) {
  const product = { ...p, badge: railBadge(p) };
  if (p.type === "DIGITAL") {
    return <DigitalProductCard product={product} variant="home" />;
  }
  return <HardwareProductCard product={product} variant="home" />;
}

export function ProductRail({
  title,
  subtitle,
  href,
  items,
  tone = "default",
  layout = "grid",
}: {
  title: string;
  subtitle?: string;
  href: string;
  items: RailProduct[];
  tone?: "default" | "muted" | "circuit";
  /** snap = horizontal new arrivals; grid = dense popular; feature = spotlight + 3 */
  layout?: "snap" | "grid" | "feature";
}) {
  if (!items.length) return null;

  const slice = layout === "snap" ? items.slice(0, 8) : items.slice(0, 4);
  const [feature, ...rest] = slice;

  return (
    <section className={`home-section-enter overflow-x-hidden ${TONE_CLASS[tone]}`}>
      <div className="mx-auto max-w-[1280px] min-w-0 px-page py-home">
        <div className="mb-4 flex items-end justify-between gap-3 border-b border-outline-variant/40 pb-4 sm:mb-5">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent-tertiary" dir="ltr">
              // RAIL::{layout.toUpperCase()}
            </p>
            <h2 className="mt-1 text-fluid-title font-bold text-on-surface text-balance">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-on-surface-variant line-clamp-2">{subtitle}</p>}
          </div>
          <Link
            href={href}
            prefetch
            className="focus-cta cyber-chamfer-sm flex shrink-0 cursor-pointer items-center gap-1 border border-outline-variant bg-surface-container-lowest px-3 py-1.5 text-sm font-semibold text-primary-container transition-all duration-200 hover:border-primary-container hover:shadow-[var(--box-shadow-neon-sm)]"
          >
            همه
            <Icon name="arrow_forward" className="h-4 w-4 rotate-180" />
          </Link>
        </div>

        {layout === "snap" ? (
          <div className="max-w-full min-w-0 overflow-x-auto pb-1 no-scrollbar">
            <div className="flex snap-x snap-mandatory gap-3 sm:gap-4">
              {slice.map((p) => (
                <div key={p.id} className="w-[min(72vw,220px)] shrink-0 snap-start sm:w-[240px]">
                  <ProductCell p={p} />
                </div>
              ))}
            </div>
          </div>
        ) : layout === "feature" && feature ? (
          <div className="flex flex-col gap-3 sm:gap-4">
            <HomeFeaturedCard
              product={{ ...feature, badge: railBadge(feature) }}
              eyebrow="پیشنهاد خانواده آردوینو"
            />
            {rest.length > 0 ? (
              <div
                className={`grid gap-3 sm:gap-4 ${
                  rest.length >= 3 ? "grid-cols-2 md:grid-cols-3" : rest.length === 2 ? "grid-cols-2" : "grid-cols-1 sm:max-w-xs"
                }`}
              >
                {rest.slice(0, 3).map((p) => (
                  <ProductCell key={p.id} p={p} />
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-3.5 md:grid-cols-4 md:gap-4">
            {slice.map((p) => (
              <ProductCell key={p.id} p={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
