import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { Icon } from "@/components/icon";
import { ReviewDeleteButton } from "@/components/review-delete-button";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

export const metadata = { title: "نظرات محصولات" };

type Props = {
  searchParams: Promise<{ q?: string; page?: string; rating?: string; sort?: string }>;
};

const PAGE_SIZE = 20;

function StarRow({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const cls = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} از ۵`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Icon
          key={i}
          name="star"
          className={`${cls} ${i < rating ? "text-primary-container" : "text-surface-variant"}`}
        />
      ))}
    </span>
  );
}

function relativeFa(date: Date) {
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 60) return `${Math.max(1, mins)} دقیقه پیش`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours} ساعت پیش`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} روز پیش`;
  return date.toLocaleDateString("fa-IR");
}

function buildQuery(opts: { q?: string; rating?: string; sort?: string; page?: number }) {
  const p = new URLSearchParams();
  if (opts.q) p.set("q", opts.q);
  if (opts.rating) p.set("rating", opts.rating);
  if (opts.sort && opts.sort !== "newest") p.set("sort", opts.sort);
  if (opts.page && opts.page > 1) p.set("page", String(opts.page));
  const qs = p.toString();
  return qs ? `/admin/reviews?${qs}` : "/admin/reviews";
}

export default async function AdminReviewsPage({ searchParams }: Props) {
  await requireUser(["ADMIN"]);
  const sp = await searchParams;
  const q = sp.q?.trim();
  const page = Math.max(1, Number(sp.page) || 1);
  const ratingFilter = [1, 2, 3, 4, 5].includes(Number(sp.rating)) ? Number(sp.rating) : undefined;
  const sort = sp.sort === "oldest" || sp.sort === "low" || sp.sort === "high" ? sp.sort : "newest";

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const where: Prisma.ReviewWhereInput = {
    ...(ratingFilter ? { rating: ratingFilter } : {}),
    ...(q
      ? {
          OR: [
            { body: { contains: q } },
            { user: { name: { contains: q } } },
            { user: { email: { contains: q } } },
            { product: { title: { contains: q } } },
            { product: { slug: { contains: q } } },
          ],
        }
      : {}),
  };

  const orderBy: Prisma.ReviewOrderByWithRelationInput =
    sort === "oldest"
      ? { createdAt: "asc" }
      : sort === "low"
        ? { rating: "asc" }
        : sort === "high"
          ? { rating: "desc" }
          : { createdAt: "desc" };

  const [totalFiltered, reviews, totalAll, avgAgg, byRating, recent7, lowCount, lowRecent, topGroups] =
    await Promise.all([
      prisma.review.count({ where }),
      prisma.review.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          product: { select: { id: true, title: true, slug: true } },
        },
        orderBy,
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.review.count(),
      prisma.review.aggregate({ _avg: { rating: true } }),
      prisma.review.groupBy({ by: ["rating"], _count: { _all: true } }),
      prisma.review.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.review.count({ where: { rating: { lte: 2 } } }),
      prisma.review.findMany({
        where: { rating: { lte: 2 } },
        include: {
          user: { select: { id: true, name: true } },
          product: { select: { id: true, title: true, slug: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 4,
      }),
      prisma.review.groupBy({
        by: ["productId"],
        _count: { _all: true },
        _avg: { rating: true },
        orderBy: { _count: { productId: "desc" } },
        take: 5,
      }),
    ]);

  const ratingCounts = Object.fromEntries(byRating.map((r) => [r.rating, r._count._all])) as Record<
    number,
    number
  >;
  const avg = avgAgg._avg.rating ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));

  const topProducts = await prisma.product.findMany({
    where: { id: { in: topGroups.map((g) => g.productId) } },
    select: { id: true, title: true, slug: true },
  });
  const productMap = Object.fromEntries(topProducts.map((p) => [p.id, p]));

  const primaryKpis = [
    {
      label: "کل نظرات",
      value: String(totalAll),
      href: "/admin/reviews#reviews-list",
      hint: "ثبت‌شده در سایت",
      icon: "check_circle" as const,
    },
    {
      label: "میانگین امتیاز",
      value: avg.toFixed(1),
      href: "/admin/reviews?sort=high#reviews-list",
      hint: "از ۵",
      icon: "star" as const,
    },
    {
      label: "۷ روز اخیر",
      value: String(recent7),
      href: "/admin/reviews#reviews-list",
      hint: "نظر جدید",
      icon: "mail" as const,
    },
    {
      label: "کم‌امتیاز",
      value: String(lowCount),
      href: "/admin/reviews?sort=low#reviews-list",
      hint: "۱ و ۲ ستاره",
      icon: "inventory_2" as const,
    },
  ];

  return (
    <AdminShell
      title="نظرات"
      subtitle="نظارت بر بازخورد محصولات و امتیازها"
      active="/admin/reviews"
      actions={
        <>
          <a
            href="#reviews-list"
            className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-2 text-sm font-semibold text-on-surface hover:border-primary-container hover:text-primary-container"
          >
            برو به لیست
          </a>
          <Link
            href="/admin/products"
            className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-2 text-sm font-semibold text-on-surface hover:border-primary-container hover:text-primary-container"
          >
            محصولات
          </Link>
          <Link
            href="/admin/reviews?sort=low#reviews-list"
            className="cyber-chamfer-sm bg-cta px-3 py-2 text-sm font-semibold text-on-primary"
          >
            کم‌امتیازها
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

      <div className="mt-6 grid gap-4 lg:grid-cols-5 lg:gap-5">
        <section className="cyber-chamfer border border-outline bg-surface-container-lowest p-4 sm:p-5 lg:col-span-3">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-base font-bold">توزیع امتیاز</h2>
              <p className="mt-0.5 text-xs text-on-surface-variant">کلیک برای فیلتر لیست</p>
            </div>
            <div className="flex items-center gap-2">
              <StarRow rating={Math.round(avg)} size="md" />
              <span className="text-sm font-bold tabular-nums">{avg.toFixed(2)}</span>
            </div>
          </div>
          <ul className="space-y-2.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = ratingCounts[star] ?? 0;
              const pct = totalAll ? Math.round((count / totalAll) * 100) : 0;
              const active = ratingFilter === star;
              return (
                <li key={star}>
                  <Link
                    href={buildQuery({
                      q,
                      rating: active ? undefined : String(star),
                      sort,
                    }) + "#reviews-list"}
                    className={`block rounded-xl px-2 py-1.5 transition-colors ${
                      active ? "bg-primary-container/10" : "hover:bg-surface-container-low"
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                      <span className="flex items-center gap-2 font-semibold">
                        <StarRow rating={star} />
                        <span className="text-on-surface-variant">{star} ستاره</span>
                      </span>
                      <span className="tabular-nums text-on-surface-variant">
                        {count} · {pct}٪
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-surface-container-high">
                      <div
                        className="h-full rounded-full bg-primary-container"
                        style={{ width: `${Math.max(pct, count ? 2 : 0)}%` }}
                      />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="cyber-chamfer border border-outline bg-surface-container-lowest p-4 sm:p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold">نیازمند بررسی</h2>
              <p className="mt-0.5 text-xs text-on-surface-variant">نظرات ۱ و ۲ ستاره</p>
            </div>
            <span className="alert-danger px-2.5 py-0.5 text-[11px] font-bold">
              {lowCount}
            </span>
          </div>
          <ul className="space-y-2">
            {lowRecent.map((r) => (
              <li key={r.id}>
                <div className="cyber-chamfer-sm alert-danger px-3 py-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/admin/users/${r.user.id}`}
                      className="text-sm font-semibold text-primary-container hover:underline"
                    >
                      {r.user.name}
                    </Link>
                    <StarRow rating={r.rating} />
                  </div>
                  <Link
                    href={`/product/${r.product.slug}`}
                    className="mt-1 block truncate text-xs text-on-surface-variant hover:text-primary-container"
                  >
                    {r.product.title}
                  </Link>
                  <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-on-surface">{r.body}</p>
                </div>
              </li>
            ))}
            {!lowRecent.length ? (
              <li className="cyber-chamfer-sm border border-dashed border-outline px-3 py-6 text-center text-sm text-on-surface-variant">
                نظر کم‌امتیازی نیست.
              </li>
            ) : null}
          </ul>
        </section>
      </div>

      <section className="mt-6 cyber-chamfer border border-outline bg-surface-container-lowest p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold">محصولات با بیشترین نظر</h2>
            <p className="mt-0.5 text-xs text-on-surface-variant">بر اساس تعداد بازخورد</p>
          </div>
          <Link href="/admin/products" className="text-xs font-semibold text-primary-container hover:underline">
            کاتالوگ
          </Link>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {topGroups.map((g, idx) => {
            const p = productMap[g.productId];
            if (!p) return null;
            return (
              <Link
                key={g.productId}
                href={`/product/${p.slug}`}
                className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-3 hover:border-primary-container/40"
              >
                <p className="text-[11px] font-bold text-on-surface-variant">#{idx + 1}</p>
                <p className="mt-1 line-clamp-2 text-sm font-semibold leading-6">{p.title}</p>
                <p className="mt-2 text-[11px] tabular-nums text-on-surface-variant">
                  {g._count._all} نظر · میانگین {(g._avg.rating ?? 0).toFixed(1)}
                </p>
              </Link>
            );
          })}
          {!topGroups.length ? (
            <p className="col-span-full py-4 text-center text-sm text-on-surface-variant">هنوز نظری نیست.</p>
          ) : null}
        </div>
      </section>

      <section id="reviews-list" className="mt-8 scroll-mt-4 border-t border-outline pt-6">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold">لیست نظرات</h2>
            <p className="mt-0.5 text-sm text-on-surface-variant">
              {totalFiltered} مورد
              {ratingFilter ? ` · ${ratingFilter} ستاره` : ""}
              {q ? ` · «${q}»` : ""}
            </p>
          </div>
        </div>

        <form className="mb-4 flex flex-wrap items-center gap-2 cyber-chamfer border border-outline bg-surface-container-lowest p-3">
          <div className="relative min-w-[200px] flex-1">
            <Icon
              name="search"
              className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-on-surface-variant"
            />
            <input
              name="q"
              defaultValue={q}
              placeholder="متن نظر، کاربر، ایمیل یا نام محصول"
              className="w-full cyber-chamfer-sm border border-outline bg-surface-container-lowest-container-low py-2.5 pr-10 pl-3 text-sm outline-none focus:border-primary-container"
            />
          </div>
          <select
            name="rating"
            defaultValue={ratingFilter ? String(ratingFilter) : ""}
            className="cyber-chamfer-sm border border-outline bg-surface-container-lowest-container-low px-3 py-2.5 text-sm outline-none focus:border-primary-container"
          >
            <option value="">همه امتیازها</option>
            {[5, 4, 3, 2, 1].map((s) => (
              <option key={s} value={s}>
                {s} ستاره
              </option>
            ))}
          </select>
          <select
            name="sort"
            defaultValue={sort}
            className="cyber-chamfer-sm border border-outline bg-surface-container-lowest-container-low px-3 py-2.5 text-sm outline-none focus:border-primary-container"
          >
            <option value="newest">جدیدترین</option>
            <option value="oldest">قدیمی‌ترین</option>
            <option value="high">بالاترین امتیاز</option>
            <option value="low">پایین‌ترین امتیاز</option>
          </select>
          <button
            type="submit"
            className="cyber-chamfer-sm bg-cta px-4 py-2.5 text-sm font-semibold text-on-primary"
          >
            اعمال
          </button>
          {(q || ratingFilter || sort !== "newest") && (
            <Link
              href="/admin/reviews#reviews-list"
              className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-2.5 text-sm font-semibold hover:border-primary-container hover:text-primary-container"
            >
              پاک کردن
            </Link>
          )}
        </form>

        <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
          {[
            { label: "همه", rating: undefined as number | undefined },
            { label: "۵★", rating: 5 },
            { label: "۴★", rating: 4 },
            { label: "۳★", rating: 3 },
            { label: "۲★", rating: 2 },
            { label: "۱★", rating: 1 },
          ].map((chip) => {
            const active = (chip.rating ?? 0) === (ratingFilter ?? 0);
            return (
              <Link
                key={chip.label}
                href={
                  buildQuery({
                    q,
                    rating: chip.rating ? String(chip.rating) : undefined,
                    sort,
                  }) + "#reviews-list"
                }
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  active
                    ? "border-primary-container bg-cta text-on-primary"
                    : "border-outline bg-surface-container-low text-on-surface-variant hover:border-primary-container"
                }`}
              >
                {chip.label}
                <span
                  className={`rounded-md px-1.5 py-0.5 tabular-nums ${
                    active ? "bg-on-primary/20" : "bg-surface-container-low"
                  }`}
                >
                  {chip.rating ? (ratingCounts[chip.rating] ?? 0) : totalAll}
                </span>
              </Link>
            );
          })}
        </div>

        <div className="cyber-chamfer border border-outline bg-surface-container-lowest">
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[780px] text-sm">
              <thead className="border-b border-outline bg-surface-container font-mono text-[11px] uppercase tracking-wider text-on-surface-variant">
                <tr>
                  <th className="px-4 py-3 text-right font-medium">کاربر</th>
                  <th className="px-4 py-3 text-right font-medium">محصول</th>
                  <th className="px-4 py-3 text-right font-medium">امتیاز</th>
                  <th className="px-4 py-3 text-right font-medium">متن نظر</th>
                  <th className="px-4 py-3 text-right font-medium">زمان</th>
                  <th className="px-4 py-3 text-right font-medium">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((r) => (
                  <tr key={r.id} className="border-t border-outline align-top hover:bg-surface-container-low/40">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/users/${r.user.id}`}
                        className="font-semibold text-primary-container hover:underline"
                      >
                        {r.user.name}
                      </Link>
                      <span className="mt-0.5 block text-[11px] text-on-surface-variant" dir="ltr">
                        {r.user.email}
                      </span>
                    </td>
                    <td className="max-w-[200px] px-4 py-3">
                      <Link href={`/product/${r.product.slug}`} className="font-semibold hover:text-primary-container">
                        <span className="line-clamp-2">{r.product.title}</span>
                      </Link>
                      <Link
                        href={`/admin/products/${r.product.id}`}
                        className="mt-1 inline-block text-[11px] font-semibold text-primary-container hover:underline"
                      >
                        ویرایش محصول
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <StarRow rating={r.rating} />
                      <span className="mt-1 block text-[11px] tabular-nums text-on-surface-variant">
                        {r.rating}/۵
                      </span>
                    </td>
                    <td className="max-w-[280px] px-4 py-3 text-on-surface-variant">
                      <p className="line-clamp-3 text-sm leading-6 text-on-surface">{r.body}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-on-surface-variant">
                      <span className="block">{relativeFa(r.createdAt)}</span>
                      <span className="mt-0.5 block tabular-nums">
                        {new Date(r.createdAt).toLocaleDateString("fa-IR")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-2">
                        <Link
                          href={`/product/${r.product.slug}#reviews`}
                          className="cyber-chamfer-sm border border-outline bg-surface-container-low px-2.5 py-1.5 text-center text-xs font-semibold hover:border-primary-container"
                        >
                          در سایت
                        </Link>
                        <ReviewDeleteButton id={r.id} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-outline md:hidden">
            {reviews.map((r) => (
              <article key={r.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      href={`/admin/users/${r.user.id}`}
                      className="font-semibold text-primary-container hover:underline"
                    >
                      {r.user.name}
                    </Link>
                    <Link
                      href={`/product/${r.product.slug}`}
                      className="mt-1 block truncate text-xs text-on-surface-variant hover:text-primary-container"
                    >
                      {r.product.title}
                    </Link>
                  </div>
                  <StarRow rating={r.rating} />
                </div>
                <p className="mt-2 text-sm leading-7 text-on-surface">{r.body}</p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] text-on-surface-variant">{relativeFa(r.createdAt)}</span>
                  <div className="flex gap-2">
                    <Link
                      href={`/product/${r.product.slug}`}
                      className="cyber-chamfer-sm border border-outline bg-surface-container-low px-2.5 py-1 text-xs font-semibold hover:border-primary-container"
                    >
                      محصول
                    </Link>
                    <ReviewDeleteButton id={r.id} />
                  </div>
                </div>
              </article>
            ))}
          </div>

          {!reviews.length ? (
            <p className="p-10 text-center text-sm text-on-surface-variant">نظری با این فیلتر پیدا نشد.</p>
          ) : null}
        </div>

        {totalPages > 1 ? (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm">
            {page > 1 ? (
              <Link
                href={buildQuery({ q, rating: ratingFilter ? String(ratingFilter) : undefined, sort, page: page - 1 }) + "#reviews-list"}
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
                href={buildQuery({ q, rating: ratingFilter ? String(ratingFilter) : undefined, sort, page: page + 1 }) + "#reviews-list"}
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
