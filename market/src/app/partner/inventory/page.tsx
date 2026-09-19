import Link from "next/link";
import { PartnerShell } from "@/components/partner-shell";
import { Icon } from "@/components/icon";
import { ProductQuickStock } from "@/components/product-quick-stock";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatToman } from "@/lib/format";
import { PRODUCT_TYPE_FA } from "@/lib/panel";

export const metadata = { title: "موجودی همکار" };

type Props = {
  searchParams: Promise<{ q?: string; stock?: string; type?: string; active?: string }>;
};

const LOW = 5;

export default async function PartnerInventoryPage({ searchParams }: Props) {
  const user = await requireUser(["PARTNER", "ADMIN"]);
  if (!user) return null;
  const sp = await searchParams;
  const q = sp.q?.trim();
  const stockFilter = sp.stock === "low" || sp.stock === "out" ? sp.stock : undefined;
  const type = sp.type === "HARDWARE" || sp.type === "DIGITAL" ? sp.type : undefined;
  const active = sp.active === "1" ? true : sp.active === "0" ? false : undefined;

  const allProducts = await prisma.product.findMany({
    where: user.role === "ADMIN" ? { sellerId: { not: null } } : { sellerId: user.id },
    include: { category: true },
    orderBy: { updatedAt: "desc" },
  });

  const lowStockAll = allProducts.filter((p) => p.active && p.stock > 0 && p.stock <= LOW).length;
  const outAll = allProducts.filter((p) => p.active && p.stock <= 0).length;
  const activeAll = allProducts.filter((p) => p.active).length;
  const hardwareAll = allProducts.filter((p) => p.type === "HARDWARE").length;
  const digitalAll = allProducts.filter((p) => p.type === "DIGITAL").length;
  const stockValue = allProducts.reduce((s, p) => s + p.price * Math.max(0, p.stock), 0);

  let products = allProducts;
  if (type) products = products.filter((p) => p.type === type);
  if (active != null) products = products.filter((p) => p.active === active);
  if (stockFilter === "low") products = products.filter((p) => p.stock > 0 && p.stock <= LOW);
  if (stockFilter === "out") products = products.filter((p) => p.stock <= 0);
  if (q) {
    const qq = q.toLowerCase();
    products = products.filter(
      (p) =>
        p.title.toLowerCase().includes(qq) ||
        p.sku.toLowerCase().includes(qq) ||
        (p.brand ?? "").toLowerCase().includes(qq) ||
        (p.category?.name ?? "").includes(q),
    );
  }

  function href(opts: { q?: string; stock?: string; type?: string; active?: string }) {
    const p = new URLSearchParams();
    if (opts.q) p.set("q", opts.q);
    if (opts.stock) p.set("stock", opts.stock);
    if (opts.type) p.set("type", opts.type);
    if (opts.active) p.set("active", opts.active);
    const s = p.toString();
    return s ? `/partner/inventory?${s}` : "/partner/inventory";
  }

  const chips = [
    { label: "همه", href: href({ q }) + "#inv-list", active: !stockFilter && !type && active == null, count: allProducts.length },
    { label: "فعال", href: href({ q, active: "1" }) + "#inv-list", active: active === true, count: activeAll },
    { label: "کم‌موجودی", href: href({ q, stock: "low" }) + "#inv-list", active: stockFilter === "low", count: lowStockAll },
    { label: "ناموجود", href: href({ q, stock: "out" }) + "#inv-list", active: stockFilter === "out", count: outAll },
    { label: "سخت‌افزار", href: href({ q, type: "HARDWARE" }) + "#inv-list", active: type === "HARDWARE", count: hardwareAll },
    { label: "دیجیتال", href: href({ q, type: "DIGITAL" }) + "#inv-list", active: type === "DIGITAL", count: digitalAll },
  ];

  return (
    <PartnerShell
      title="مدیریت موجودی"
      subtitle={`${allProducts.length} کالا · ارزش انبار ${formatToman(stockValue)} تومان`}
      active="/partner/inventory"
      actions={
        <Link
          href="/partner/inventory/new"
          className="cyber-chamfer-sm bg-cta px-3 py-2 text-sm font-semibold text-on-primary"
        >
          محصول جدید
        </Link>
      }
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: "کل کالا",
            value: String(allProducts.length),
            hint: `${activeAll} فعال`,
            href: "/partner/inventory#inv-list",
            icon: "inventory_2" as const,
          },
          {
            label: "کم‌موجودی",
            value: String(lowStockAll),
            hint: `≤ ${LOW} عدد`,
            href: href({ stock: "low" }) + "#inv-list",
            icon: "remove" as const,
          },
          {
            label: "ناموجود",
            value: String(outAll),
            hint: "نیاز به تأمین",
            href: href({ stock: "out" }) + "#inv-list",
            icon: "local_shipping" as const,
          },
          {
            label: "ارزش انبار",
            value: formatToman(stockValue),
            hint: "قیمت × موجودی",
            href: "/partner/inventory#inv-list",
            icon: "payments" as const,
          },
        ].map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="cyber-chamfer border border-outline bg-surface-container-lowest p-4 transition-colors hover:border-primary-container"
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <p className="text-xs font-medium text-on-surface-variant">{c.label}</p>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center cyber-chamfer-sm bg-primary-container/10 text-primary-container">
                <Icon name={c.icon} className="h-3.5 w-3.5" />
              </span>
            </div>
            <p className="text-xl font-bold tabular-nums tracking-tight sm:text-2xl">{c.value}</p>
            <p className="mt-1 text-[11px] text-on-surface-variant">{c.hint}</p>
          </Link>
        ))}
      </div>

      {(lowStockAll > 0 || outAll > 0) && (
        <section className="mt-5 grid gap-2 sm:grid-cols-2">
          {outAll > 0 ? (
            <Link
              href={href({ stock: "out" }) + "#inv-list"}
              className="cyber-chamfer-sm border alert-danger px-3.5 py-3 hover:border-primary-container/40"
            >
              <p className="text-[11px] font-bold text-on-surface-variant">ناموجود</p>
              <p className="mt-1 text-sm font-semibold">{outAll} کالا موجودی صفر دارد</p>
            </Link>
          ) : null}
          {lowStockAll > 0 ? (
            <Link
              href={href({ stock: "low" }) + "#inv-list"}
              className="cyber-chamfer-sm alert-warn px-3.5 py-3 hover:border-primary-container/40"
            >
              <p className="text-[11px] font-bold text-on-surface-variant">کم‌موجودی</p>
              <p className="mt-1 text-sm font-semibold">{lowStockAll} کالا کمتر از {LOW} عدد</p>
            </Link>
          ) : null}
        </section>
      )}

      <section id="inv-list" className="mt-6 scroll-mt-4">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold">کاتالوگ شما</h2>
            <p className="mt-0.5 text-sm text-on-surface-variant">{products.length} مورد در این فیلتر</p>
          </div>
          <Link
            href="/partner/inventory/new"
            className="text-sm font-semibold text-primary-container hover:underline"
          >
            + ثبت محصول
          </Link>
        </div>

        <div className="mb-3 max-w-full min-w-0 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {chips.map((chip) => (
            <Link
              key={chip.label}
              href={chip.href}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                chip.active
                  ? "border-primary-container bg-cta text-on-primary"
                  : "border-outline bg-surface-container-low text-on-surface-variant hover:border-primary-container"
              }`}
            >
              {chip.label}
              <span className={`rounded-md px-1.5 py-0.5 tabular-nums ${chip.active ? "bg-on-primary/20" : "bg-surface-container-low"}`}>
                {chip.count}
              </span>
            </Link>
          ))}
        </div>

        <form
          method="get"
          action="/partner/inventory"
          className="mb-4 flex flex-wrap items-center gap-2 cyber-chamfer border border-outline bg-surface-container-lowest p-3"
        >
          {stockFilter ? <input type="hidden" name="stock" value={stockFilter} /> : null}
          {type ? <input type="hidden" name="type" value={type} /> : null}
          {active != null ? <input type="hidden" name="active" value={active ? "1" : "0"} /> : null}
          <div className="relative min-w-0 flex-1 basis-[160px]">
            <Icon
              name="search"
              className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-on-surface-variant"
            />
            <input
              name="q"
              defaultValue={q}
              placeholder="جستجو عنوان، SKU، برند یا دسته"
              className="w-full cyber-chamfer-sm border border-outline bg-surface-container-lowest-container-low py-2.5 pr-10 pl-3 text-sm outline-none focus:border-primary-container"
            />
          </div>
          <button
            type="submit"
            className="cyber-chamfer-sm bg-cta px-4 py-2.5 text-sm font-semibold text-on-primary"
          >
            اعمال
          </button>
          {(q || stockFilter || type || active != null) && (
            <Link
              href="/partner/inventory#inv-list"
              className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-2.5 text-sm font-semibold hover:border-primary-container hover:text-primary-container"
            >
              پاک کردن
            </Link>
          )}
        </form>

        <div className="space-y-3">
          {products.map((p) => {
            const low = p.stock > 0 && p.stock <= LOW;
            const out = p.stock <= 0;
            return (
              <article
                key={p.id}
                className="cyber-chamfer border border-outline bg-surface-container-lowest p-4 transition-colors hover:border-primary-container/40"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="h-20 w-20 shrink-0 overflow-hidden cyber-chamfer-sm border border-outline bg-surface-container-lowest-container-low sm:h-24 sm:w-24">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.image || "/placeholder.svg"}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold leading-6">{p.title}</p>
                        <p className="mt-1 text-xs text-on-surface-variant">
                          {PRODUCT_TYPE_FA[p.type] ?? p.type}
                          {p.category ? ` · ${p.category.name}` : " · بدون دسته"}
                          {p.brand ? ` · ${p.brand}` : ""}
                          {" · "}
                          <span dir="ltr">{p.sku}</span>
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            p.active ? "alert-ok" : "alert-warn"
                          }`}
                        >
                          {p.active ? "فعال" : "غیرفعال"}
                        </span>
                        {out ? (
                          <span className="alert-danger px-2 py-0.5 text-[10px] font-bold">
                            ناموجود
                          </span>
                        ) : low ? (
                          <span className="alert-warn px-2 py-0.5 text-[10px] font-bold">
                            کم‌موجودی
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <p className="mt-2 text-sm font-bold tabular-nums text-primary-container">
                      {formatToman(p.price)} تومان
                      <span className="ms-2 text-xs font-medium text-on-surface-variant">
                        · موجودی {p.stock}
                      </span>
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link
                        href={`/product/${p.slug}`}
                        className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-1.5 text-xs font-semibold hover:border-primary-container"
                      >
                        مشاهده در فروشگاه
                      </Link>
                    </div>
                    <div className="mt-3 border-t border-outline pt-3">
                      <ProductQuickStock
                        productId={p.id}
                        stock={p.stock}
                        price={p.price}
                        active={p.active}
                        apiBase="/api/partner/products"
                      />
                    </div>
                  </div>
                </div>
              </article>
            );
          })}

          {!products.length ? (
            <div className="cyber-chamfer border border-dashed border-outline bg-surface-container-low p-10 text-center">
              <p className="text-sm text-on-surface-variant">
                {allProducts.length ? "کالایی با این فیلتر نیست." : "هنوز محصولی ثبت نکرده‌اید."}
              </p>
              <Link
                href="/partner/inventory/new"
                className="mt-3 inline-flex cyber-chamfer-sm bg-cta px-4 py-2 text-sm font-semibold text-on-primary"
              >
                ثبت محصول جدید
              </Link>
            </div>
          ) : null}
        </div>
      </section>
    </PartnerShell>
  );
}
