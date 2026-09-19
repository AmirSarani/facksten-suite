import Link from "next/link";
import { DigitalProductCard, HardwareProductCard, type CardProduct } from "@/components/product-cards";
import { ShopSortSelect } from "@/components/shop-sort-select";
import { formatToman, discountPercent, unitPrice } from "@/lib/format";

export type ShopCategoryNode = {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  isPassive: boolean;
  children: { id: string; slug: string; name: string; isPassive: boolean }[];
};

type ProductRow = CardProduct & {
  sku?: string | null;
  packQty?: number;
  compareAtPrice?: number | null;
  isNew?: boolean;
  isPopular?: boolean;
  category?: { isPassive?: boolean } | null;
};

function productBadges(p: ProductRow): string[] {
  const badges: string[] = [];
  const disc = discountPercent(p.price, p.compareAtPrice);
  if (disc > 0) badges.push(`${disc}٪`);
  if (p.isNew) badges.push("جدید");
  if (p.isPopular) badges.push("پرطرفدار");
  if (p.badge && !badges.includes(p.badge)) badges.push(p.badge);
  return badges.slice(0, 2);
}

export function toCardProduct(p: ProductRow): CardProduct {
  const badges = productBadges(p);
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    price: p.price,
    type: p.type,
    inStock: p.inStock,
    image: p.image,
    brand: p.brand,
    icon: p.icon,
    fileLabel: p.fileLabel,
    fileSize: p.fileSize,
    badge: badges[0] ?? p.badge,
  };
}

export function shopHref(
  basePath: string,
  current: Record<string, string | undefined>,
  extra: Record<string, string | undefined>,
) {
  const p = new URLSearchParams();
  const merged = { ...current, ...extra };
  Object.entries(merged).forEach(([k, v]) => {
    if (v) p.set(k, v);
  });
  const s = p.toString();
  return s ? `${basePath}?${s}` : basePath;
}

export function ShopToolbar({
  basePath,
  sp,
  from,
  to,
  total,
  view,
  preferList,
}: {
  basePath: string;
  sp: Record<string, string | undefined>;
  from: number;
  to: number;
  total: number;
  view?: string;
  preferList?: boolean;
}) {
  const currentView = view || (preferList ? "list" : "grid");
  return (
    <div className="cyber-chamfer mb-4 flex flex-col items-stretch justify-between gap-3 border border-outline bg-surface-container-lowest p-3 shadow-[var(--box-shadow-neon-sm)] sm:mb-6 sm:flex-row sm:items-center">
      <div className="font-mono text-sm text-on-surface-variant">
        نمایش {from}–{to} از {total} محصول
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="flex overflow-hidden cyber-chamfer-sm border border-outline">
          <Link
            href={shopHref(basePath, sp, { view: "grid", page: undefined })}
            className={`px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-wide ${currentView === "grid" ? "bg-primary-container text-on-primary shadow-[var(--box-shadow-neon-sm)]" : "bg-surface text-on-surface-variant hover:text-primary-container"}`}
          >
            گرید
          </Link>
          <Link
            href={shopHref(basePath, sp, { view: "list", page: undefined })}
            className={`px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-wide ${currentView === "list" ? "bg-primary-container text-on-primary shadow-[var(--box-shadow-neon-sm)]" : "bg-surface text-on-surface-variant hover:text-primary-container"}`}
          >
            لیست
          </Link>
        </div>
        <ShopSortSelect current={sp.sort} basePath={basePath} baseParams={sp} />
      </div>
    </div>
  );
}

export function ShopPagination({
  basePath,
  sp,
  page,
  totalPages,
}: {
  basePath: string;
  sp: Record<string, string | undefined>;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).slice(
    Math.max(0, page - 3),
    Math.min(totalPages, page + 2),
  );
  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
      {page > 1 && (
        <Link
          href={shopHref(basePath, sp, { page: String(page - 1) })}
          className="cyber-chamfer-sm border border-outline px-3 py-1.5 text-sm transition-colors hover:border-primary-container hover:text-primary-container"
        >
          قبلی
        </Link>
      )}
      {pages.map((p) => (
        <Link
          key={p}
          href={shopHref(basePath, sp, { page: String(p) })}
          className={`cyber-chamfer-sm px-3 py-1.5 text-sm ${
            p === page
              ? "bg-primary-container font-bold text-on-primary shadow-[var(--box-shadow-neon-sm)]"
              : "border border-outline hover:border-primary-container hover:text-primary-container"
          }`}
        >
          {p}
        </Link>
      ))}
      {page < totalPages && (
        <Link
          href={shopHref(basePath, sp, { page: String(page + 1) })}
          className="cyber-chamfer-sm border border-outline px-3 py-1.5 text-sm transition-colors hover:border-primary-container hover:text-primary-container"
        >
          بعدی
        </Link>
      )}
    </div>
  );
}

export function ProductListTable({ products }: { products: ProductRow[] }) {
  return (
    <div className="cyber-chamfer overflow-x-auto border border-outline bg-surface-container-lowest shadow-[var(--box-shadow-neon-sm)]">
      <table className="min-w-full text-sm">
        <thead className="border-b border-outline bg-surface-container text-right font-mono text-xs uppercase tracking-wide text-on-surface-variant">
          <tr>
            <th className="px-3 py-3 font-semibold">کالا</th>
            <th className="px-3 py-3 font-semibold">SKU</th>
            <th className="px-3 py-3 font-semibold">بسته</th>
            <th className="px-3 py-3 font-semibold">قیمت واحد</th>
            <th className="px-3 py-3 font-semibold">قیمت</th>
            <th className="px-3 py-3 font-semibold">وضعیت</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => {
            const pack = p.packQty || 1;
            return (
              <tr key={p.id} className="border-b border-outline/70 transition-colors hover:bg-surface-container/50">
                <td className="px-3 py-3">
                  <Link href={`/product/${p.slug}`} className="font-semibold text-on-surface hover:text-primary">
                    {p.title}
                  </Link>
                  {p.brand && <div className="text-[11px] text-on-surface-variant">{p.brand}</div>}
                </td>
                <td className="px-3 py-3 font-mono text-xs text-on-surface-variant">{p.sku}</td>
                <td className="px-3 py-3">{pack}</td>
                <td className="px-3 py-3">{formatToman(unitPrice(p.price, pack))}</td>
                <td className="px-3 py-3 font-bold text-primary">{formatToman(p.price)}</td>
                <td className="px-3 py-3">
                  <span className={p.inStock ? "text-primary-container" : "text-error"}>{p.inStock ? "موجود" : "ناموجود"}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function ProductGrid({ products }: { products: ProductRow[] }) {
  return (
    <div className="mb-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((p) =>
        p.type === "DIGITAL" ? (
          <DigitalProductCard key={p.id} product={toCardProduct(p)} />
        ) : (
          <HardwareProductCard key={p.id} product={toCardProduct(p)} />
        ),
      )}
    </div>
  );
}
