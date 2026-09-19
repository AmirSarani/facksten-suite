import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { Icon } from "@/components/icon";
import { ProductActiveToggle } from "@/components/product-active-toggle";
import { ProductDeleteButton } from "@/components/product-delete-button";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatToman } from "@/lib/format";
import { PRODUCT_TYPE_FA } from "@/lib/panel";
import type { Prisma } from "@/generated/prisma/client";

export const metadata = { title: "محصولات ادمین" };

type Props = {
  searchParams: Promise<{
    q?: string;
    type?: string;
    active?: string;
    category?: string;
    stock?: string;
    flag?: string;
    sort?: string;
    page?: string;
  }>;
};

const PAGE_SIZE = 24;

function buildHref(opts: {
  q?: string;
  type?: string;
  active?: string;
  category?: string;
  stock?: string;
  flag?: string;
  sort?: string;
  page?: number;
}) {
  const params = new URLSearchParams();
  if (opts.q) params.set("q", opts.q);
  if (opts.type) params.set("type", opts.type);
  if (opts.active) params.set("active", opts.active);
  if (opts.category) params.set("category", opts.category);
  if (opts.stock) params.set("stock", opts.stock);
  if (opts.flag) params.set("flag", opts.flag);
  if (opts.sort && opts.sort !== "updated") params.set("sort", opts.sort);
  if (opts.page && opts.page > 1) params.set("page", String(opts.page));
  const s = params.toString();
  return s ? `/admin/products?${s}` : "/admin/products";
}

function stockTone(stock: number, inStock: boolean) {
  if (!inStock || stock <= 0) return "alert-danger";
  if (stock <= 5) return "alert-warn";
  return "alert-ok";
}

export default async function AdminProductsPage({ searchParams }: Props) {
  await requireUser(["ADMIN"]);
  const sp = await searchParams;
  const q = sp.q?.trim();
  const page = Math.max(1, Number(sp.page) || 1);
  const sort = sp.sort === "price_asc" || sp.sort === "price_desc" || sp.sort === "stock" || sp.sort === "title" ? sp.sort : "updated";

  const where: Prisma.ProductWhereInput = {
    ...(q
      ? {
          OR: [
            { title: { contains: q } },
            { sku: { contains: q } },
            { brand: { contains: q } },
            { slug: { contains: q } },
            { mpn: { contains: q } },
          ],
        }
      : {}),
    ...(sp.type === "HARDWARE" || sp.type === "DIGITAL" ? { type: sp.type } : {}),
    ...(sp.active === "1" ? { active: true } : sp.active === "0" ? { active: false } : {}),
    ...(sp.category ? { categoryId: sp.category } : {}),
    ...(sp.stock === "low" ? { stock: { lte: 5 }, type: "HARDWARE" } : {}),
    ...(sp.stock === "out" ? { OR: [{ stock: { lte: 0 } }, { inStock: false }] } : {}),
    ...(sp.stock === "ok" ? { stock: { gt: 5 }, inStock: true } : {}),
    ...(sp.flag === "new" ? { isNew: true } : {}),
    ...(sp.flag === "featured" ? { isFeatured: true } : {}),
    ...(sp.flag === "popular" ? { isPopular: true } : {}),
    ...(sp.flag === "uncategorized" ? { categoryId: null } : {}),
    ...(sp.flag === "partner" ? { sellerId: { not: null } } : {}),
  };

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    sort === "price_asc"
      ? { price: "asc" }
      : sort === "price_desc"
        ? { price: "desc" }
        : sort === "stock"
          ? { stock: "asc" }
          : sort === "title"
            ? { title: "asc" }
            : { updatedAt: "desc" };

  const [total, products, categories, totalAll, activeCount, inactiveCount, hardwareCount, digitalCount, lowStock, outStock, noCat, partnerCount] =
    await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: { seller: { select: { id: true, name: true } }, category: { select: { id: true, name: true, slug: true } } },
        orderBy,
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.category.findMany({
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        select: { id: true, name: true, slug: true, parentId: true },
      }),
      prisma.product.count(),
      prisma.product.count({ where: { active: true } }),
      prisma.product.count({ where: { active: false } }),
      prisma.product.count({ where: { type: "HARDWARE" } }),
      prisma.product.count({ where: { type: "DIGITAL" } }),
      prisma.product.count({ where: { stock: { lte: 5 }, type: "HARDWARE", active: true } }),
      prisma.product.count({ where: { OR: [{ stock: { lte: 0 } }, { inStock: false }], type: "HARDWARE" } }),
      prisma.product.count({ where: { categoryId: null } }),
      prisma.product.count({ where: { sellerId: { not: null } } }),
    ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const catById = Object.fromEntries(categories.map((c) => [c.id, c]));

  const primaryKpis = [
    {
      label: "کل محصولات",
      value: String(totalAll),
      href: "/admin/products#products-list",
      hint: `${activeCount} فعال`,
      icon: "inventory_2" as const,
    },
    {
      label: "سخت‌افزار",
      value: String(hardwareCount),
      href: buildHref({ type: "HARDWARE" }) + "#products-list",
      hint: `${digitalCount} دیجیتال`,
      icon: "memory" as const,
    },
    {
      label: "موجودی کم",
      value: String(lowStock),
      href: buildHref({ stock: "low" }) + "#products-list",
      hint: "≤۵ · سخت‌افزار فعال",
      icon: "local_shipping" as const,
    },
    {
      label: "بدون دسته",
      value: String(noCat),
      href: buildHref({ flag: "uncategorized" }) + "#products-list",
      hint: "نیازمند اختصاص",
      icon: "schema" as const,
    },
  ];

  const chips = [
    { label: "همه", href: "/admin/products#products-list", active: !sp.type && !sp.active && !sp.stock && !sp.flag && !sp.category && !q, count: totalAll },
    { label: "فعال", href: buildHref({ active: "1" }) + "#products-list", active: sp.active === "1", count: activeCount },
    { label: "غیرفعال", href: buildHref({ active: "0" }) + "#products-list", active: sp.active === "0", count: inactiveCount },
    { label: "سخت‌افزار", href: buildHref({ type: "HARDWARE" }) + "#products-list", active: sp.type === "HARDWARE", count: hardwareCount },
    { label: "دیجیتال", href: buildHref({ type: "DIGITAL" }) + "#products-list", active: sp.type === "DIGITAL", count: digitalCount },
    { label: "موجودی کم", href: buildHref({ stock: "low" }) + "#products-list", active: sp.stock === "low", count: lowStock },
    { label: "ناموجود", href: buildHref({ stock: "out" }) + "#products-list", active: sp.stock === "out", count: outStock },
    { label: "بدون دسته", href: buildHref({ flag: "uncategorized" }) + "#products-list", active: sp.flag === "uncategorized", count: noCat },
    { label: "همکار", href: buildHref({ flag: "partner" }) + "#products-list", active: sp.flag === "partner", count: partnerCount },
  ];

  return (
    <AdminShell
      title="محصولات"
      subtitle="کاتالوگ، موجودی و وضعیت نمایش در فروشگاه"
      active="/admin/products"
      actions={
        <>
          <Link
            href="/admin/categories"
            className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-2 text-sm font-semibold text-on-surface hover:border-primary-container hover:text-primary-container"
          >
            دسته‌بندی‌ها
          </Link>
          <a
            href="#products-list"
            className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-2 text-sm font-semibold text-on-surface hover:border-primary-container hover:text-primary-container"
          >
            برو به لیست
          </a>
          <Link
            href="/admin/products/new"
            className="cyber-chamfer-sm bg-cta px-3 py-2 text-sm font-semibold text-on-primary"
          >
            محصول جدید
          </Link>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {primaryKpis.map((c) => (
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

      {(lowStock > 0 || outStock > 0 || noCat > 0) && (
        <section className="mt-5">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-base font-bold">نیازمند اقدام</h2>
            <span className="alert-warn cyber-chamfer-sm px-2.5 py-0.5 text-[11px] font-bold">
              {[lowStock > 0, outStock > 0, noCat > 0].filter(Boolean).length} مورد
            </span>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {lowStock > 0 ? (
              <Link
                href={buildHref({ stock: "low" }) + "#products-list"}
                className="cyber-chamfer-sm alert-warn px-3.5 py-3 hover:border-primary-container/40"
              >
                <p className="text-[11px] font-bold text-on-surface-variant">موجودی بحرانی</p>
                <p className="mt-1 text-sm font-semibold">{lowStock} محصول سخت‌افزاری ≤۵ عدد</p>
              </Link>
            ) : null}
            {outStock > 0 ? (
              <Link
                href={buildHref({ stock: "out" }) + "#products-list"}
                className="cyber-chamfer-sm alert-danger px-3.5 py-3 hover:border-primary-container/40"
              >
                <p className="text-[11px] font-bold text-on-surface-variant">ناموجود</p>
                <p className="mt-1 text-sm font-semibold">{outStock} مورد بدون موجودی</p>
              </Link>
            ) : null}
            {noCat > 0 ? (
              <Link
                href={buildHref({ flag: "uncategorized" }) + "#products-list"}
                className="cyber-chamfer-sm alert-info px-3.5 py-3 hover:border-primary-container/40"
              >
                <p className="text-[11px] font-bold text-on-surface-variant">بدون دسته‌بندی</p>
                <p className="mt-1 text-sm font-semibold">{noCat} محصول در منو دیده نمی‌شود</p>
              </Link>
            ) : null}
          </div>
        </section>
      )}

      <div className="mt-5 max-w-full min-w-0 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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

      <section id="products-list" className="mt-6 scroll-mt-4">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold">لیست محصولات</h2>
            <p className="mt-0.5 text-sm text-on-surface-variant">
              {total} مورد
              {q ? ` · «${q}»` : ""}
              {sp.type ? ` · ${PRODUCT_TYPE_FA[sp.type] ?? sp.type}` : ""}
              {sp.category && catById[sp.category] ? ` · ${catById[sp.category].name}` : ""}
            </p>
          </div>
        </div>

        <form className="mb-4 flex flex-wrap items-center gap-2 cyber-chamfer border border-outline bg-surface-container-lowest p-3">
          {sp.stock ? <input type="hidden" name="stock" value={sp.stock} /> : null}
          {sp.flag ? <input type="hidden" name="flag" value={sp.flag} /> : null}
          <div className="relative min-w-0 flex-1 basis-[180px]">
            <Icon
              name="search"
              className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-on-surface-variant"
            />
            <input
              name="q"
              defaultValue={q}
              placeholder="عنوان، SKU، برند، اسلاگ یا MPN"
              className="w-full cyber-chamfer-sm border border-outline bg-surface-container-lowest-container-low py-2.5 pr-10 pl-3 text-sm outline-none focus:border-primary-container"
            />
          </div>
          <select
            name="type"
            defaultValue={sp.type ?? ""}
            className="cyber-chamfer-sm border border-outline bg-surface-container-lowest-container-low px-3 py-2.5 text-sm outline-none focus:border-primary-container"
          >
            <option value="">همه انواع</option>
            <option value="HARDWARE">سخت‌افزار</option>
            <option value="DIGITAL">دیجیتال</option>
          </select>
          <select
            name="active"
            defaultValue={sp.active ?? ""}
            className="cyber-chamfer-sm border border-outline bg-surface-container-lowest-container-low px-3 py-2.5 text-sm outline-none focus:border-primary-container"
          >
            <option value="">وضعیت نمایش</option>
            <option value="1">فعال</option>
            <option value="0">غیرفعال</option>
          </select>
          <select
            name="category"
            defaultValue={sp.category ?? ""}
            className="max-w-[180px] cyber-chamfer-sm border border-outline bg-surface-container-lowest-container-low px-3 py-2.5 text-sm outline-none focus:border-primary-container"
          >
            <option value="">همه دسته‌ها</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.parentId ? `↳ ${c.name}` : c.name}
              </option>
            ))}
          </select>
          <select
            name="sort"
            defaultValue={sort}
            className="cyber-chamfer-sm border border-outline bg-surface-container-lowest-container-low px-3 py-2.5 text-sm outline-none focus:border-primary-container"
          >
            <option value="updated">آخرین به‌روزرسانی</option>
            <option value="title">نام</option>
            <option value="price_asc">ارزان‌ترین</option>
            <option value="price_desc">گران‌ترین</option>
            <option value="stock">کمترین موجودی</option>
          </select>
          <button
            type="submit"
            className="cyber-chamfer-sm bg-cta px-4 py-2.5 text-sm font-semibold text-on-primary"
          >
            اعمال
          </button>
          {(q || sp.type || sp.active || sp.category || sp.stock || sp.flag || sort !== "updated") && (
            <Link
              href="/admin/products#products-list"
              className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-2.5 text-sm font-semibold hover:border-primary-container hover:text-primary-container"
            >
              پاک کردن
            </Link>
          )}
        </form>

        <div className="cyber-chamfer border border-outline bg-surface-container-lowest">
          <div className="table-scroll hidden max-w-full min-w-0 overflow-x-auto lg:block">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="border-b border-outline bg-surface-container font-mono text-[11px] uppercase tracking-wider text-on-surface-variant">
                <tr>
                  <th className="px-4 py-3 text-right font-medium">محصول</th>
                  <th className="px-4 py-3 text-right font-medium">نوع / دسته</th>
                  <th className="px-4 py-3 text-right font-medium">قیمت</th>
                  <th className="px-4 py-3 text-right font-medium">موجودی</th>
                  <th className="px-4 py-3 text-right font-medium">وضعیت</th>
                  <th className="px-4 py-3 text-right font-medium">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-t border-outline hover:bg-surface-container-low/40">
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-3">
                        <div className="h-12 w-12 shrink-0 overflow-hidden cyber-chamfer-sm border border-outline bg-surface-container-lowest-container-low">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={p.image || "/placeholder.svg"}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/admin/products/${p.id}`}
                            className="line-clamp-2 font-semibold hover:text-primary-container"
                          >
                            {p.title}
                          </Link>
                          <p className="mt-0.5 text-[11px] text-on-surface-variant" dir="ltr">
                            {p.sku}
                            {p.brand ? ` · ${p.brand}` : ""}
                          </p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {p.isNew ? (
                              <span className="alert-info px-1.5 py-0.5 text-[10px] font-bold">جدید</span>
                            ) : null}
                            {p.isFeatured ? (
                              <span className="alert-info px-1.5 py-0.5 text-[10px] font-bold">ویژه</span>
                            ) : null}
                            {p.isPopular ? (
                              <span className="rounded-md bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold text-orange-900">پرفروش</span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold">{PRODUCT_TYPE_FA[p.type] ?? p.type}</span>
                      <span className="mt-0.5 block text-[11px] text-on-surface-variant">
                        {p.category ? p.category.name : "بدون دسته"}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-on-surface-variant">
                        {p.seller ? `همکار: ${p.seller.name}` : "فروشگاه مرکزی"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold tabular-nums">{formatToman(p.price)}</span>
                      {p.compareAtPrice && p.compareAtPrice > p.price ? (
                        <span className="mt-0.5 block text-[11px] tabular-nums text-on-surface-variant line-through">
                          {formatToman(p.compareAtPrice)}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      {p.type === "DIGITAL" ? (
                        <span className="alert-info px-2 py-0.5 text-[10px] font-bold">دیجیتال</span>
                      ) : (
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums ${stockTone(p.stock, p.inStock)}`}>
                          {p.stock}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <ProductActiveToggle productId={p.id} active={p.active} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <Link
                          href={`/admin/products/${p.id}`}
                          className="cyber-chamfer-sm border border-outline bg-surface-container-low px-2.5 py-1.5 text-xs font-semibold hover:border-primary-container"
                        >
                          ویرایش
                        </Link>
                        <Link
                          href={`/product/${p.slug}`}
                          className="cyber-chamfer-sm border border-outline bg-surface-container-low px-2.5 py-1.5 text-xs font-semibold hover:border-primary-container"
                        >
                          سایت
                        </Link>
                        <ProductDeleteButton productId={p.id} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-outline lg:hidden">
            {products.map((p) => (
              <article key={p.id} className="p-4">
                <div className="flex gap-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden cyber-chamfer-sm border border-outline bg-surface-container-lowest-container-low">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.image || "/placeholder.svg"} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/products/${p.id}`} className="font-semibold leading-6 hover:text-primary-container">
                      {p.title}
                    </Link>
                    <p className="mt-1 text-xs text-on-surface-variant">
                      {formatToman(p.price)} تومان · {PRODUCT_TYPE_FA[p.type]}
                      {p.category ? ` · ${p.category.name}` : ""}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <ProductActiveToggle productId={p.id} active={p.active} />
                      {p.type === "HARDWARE" ? (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums ${stockTone(p.stock, p.inStock)}`}>
                          موجودی {p.stock}
                        </span>
                      ) : null}
                      {p.isNew ? <span className="alert-info px-1.5 py-0.5 text-[10px] font-bold">جدید</span> : null}
                      {p.isFeatured ? (
                        <span className="alert-info px-1.5 py-0.5 text-[10px] font-bold">ویژه</span>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={`/admin/products/${p.id}`}
                    className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-1.5 text-xs font-semibold hover:border-primary-container"
                  >
                    ویرایش
                  </Link>
                  <Link href={`/product/${p.slug}`} className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-1.5 text-xs font-semibold hover:border-primary-container">
                    سایت
                  </Link>
                  <ProductDeleteButton productId={p.id} />
                </div>
              </article>
            ))}
          </div>

          {!products.length ? (
            <p className="p-10 text-center text-sm text-on-surface-variant">محصولی با این فیلتر پیدا نشد.</p>
          ) : null}
        </div>

        {totalPages > 1 ? (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm">
            {page > 1 ? (
              <Link
                href={
                  buildHref({
                    q,
                    type: sp.type,
                    active: sp.active,
                    category: sp.category,
                    stock: sp.stock,
                    flag: sp.flag,
                    sort,
                    page: page - 1,
                  }) + "#products-list"
                }
                className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-1.5 font-semibold hover:border-primary-container"
              >
                قبلی
              </Link>
            ) : null}
            <span className="text-on-surface-variant">
              صفحه {page} از {totalPages}
            </span>
            {page < totalPages ? (
              <Link
                href={
                  buildHref({
                    q,
                    type: sp.type,
                    active: sp.active,
                    category: sp.category,
                    stock: sp.stock,
                    flag: sp.flag,
                    sort,
                    page: page + 1,
                  }) + "#products-list"
                }
                className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-1.5 font-semibold hover:border-primary-container"
              >
                بعدی
              </Link>
            ) : null}
          </div>
        ) : null}
      </section>
    </AdminShell>
  );
}
