import Link from "next/link";
import { AccountShell } from "@/components/account-shell";
import { AccountReviewCard } from "@/components/account-review-card";
import { Icon } from "@/components/icon";
import { OrderReviewForm } from "@/components/order-review-form";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { productImagePath } from "@/lib/media";

export const metadata = { title: "نظرات من" };

type Props = { searchParams: Promise<{ rating?: string; q?: string }> };

function buildHref(opts: { q?: string; rating?: string }) {
  const p = new URLSearchParams();
  if (opts.q) p.set("q", opts.q);
  if (opts.rating) p.set("rating", opts.rating);
  const s = p.toString();
  return s ? `/account/reviews?${s}` : "/account/reviews";
}

export default async function ReviewsPage({ searchParams }: Props) {
  const user = await requireUser(["CUSTOMER", "ADMIN"]);
  if (!user) return null;
  const sp = await searchParams;
  const q = sp.q?.trim();
  const ratingFilter = [1, 2, 3, 4, 5].includes(Number(sp.rating)) ? Number(sp.rating) : undefined;

  const [allReviews, completedItems] = await Promise.all([
    prisma.review.findMany({
      where: { userId: user.id },
      include: { product: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.orderItem.findMany({
      where: {
        type: "HARDWARE",
        order: { userId: user.id, status: "COMPLETED" },
      },
      include: { product: { select: { id: true, title: true, slug: true, active: true } } },
      orderBy: { id: "desc" },
    }),
  ]);

  const reviewedIds = new Set(allReviews.map((r) => r.productId));
  const pendingMap = new Map<string, { productId: string; title: string; slug: string }>();
  for (const item of completedItems) {
    if (reviewedIds.has(item.productId)) continue;
    if (!pendingMap.has(item.productId)) {
      pendingMap.set(item.productId, {
        productId: item.productId,
        title: item.product.title,
        slug: item.product.slug,
      });
    }
  }
  const pending = Array.from(pendingMap.values()).slice(0, 6);

  const reviews = allReviews.filter((r) => {
    if (ratingFilter && r.rating !== ratingFilter) return false;
    if (!q) return true;
    const hay = `${r.product.title} ${r.body} ${r.product.brand ?? ""}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  const avg =
    allReviews.length > 0
      ? Math.round((allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length) * 10) / 10
      : 0;
  const byRating = [5, 4, 3, 2, 1].map((n) => ({
    rating: n,
    count: allReviews.filter((r) => r.rating === n).length,
  }));
  const recent30 = allReviews.filter(
    (r) => r.createdAt.getTime() >= Date.now() - 30 * 24 * 60 * 60 * 1000,
  ).length;

  return (
    <AccountShell
      title="نظرات من"
      subtitle="نظرات ثبت‌شده و محصولات در انتظار امتیاز"
      active="/account/reviews"
      actions={
        <>
          <a
            href="#my-reviews"
            className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-2 text-sm font-semibold text-on-surface hover:border-primary-container hover:text-primary-container"
          >
            نظرات من
          </a>
          <Link
            href="/account/orders?status=COMPLETED"
            className="cyber-chamfer-sm bg-cta px-3 py-2 text-sm font-semibold text-on-primary"
          >
            سفارش‌های تکمیل‌شده
          </Link>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: "کل نظرات",
            value: String(allReviews.length),
            hint: `${recent30} در ۳۰ روز اخیر`,
            icon: "star" as const,
            href: "/account/reviews#my-reviews",
          },
          {
            label: "میانگین امتیاز",
            value: allReviews.length ? String(avg) : "—",
            hint: "از ۵",
            icon: "check_circle" as const,
            href: "/account/reviews#my-reviews",
          },
          {
            label: "در انتظار نظر",
            value: String(pendingMap.size),
            hint: "سفارش تکمیل‌شده بدون نظر",
            icon: "support_agent" as const,
            href: "#pending-reviews",
          },
          {
            label: "۵ ستاره",
            value: String(byRating[0]?.count ?? 0),
            hint: "بالاترین امتیاز",
            icon: "favorite" as const,
            href: buildHref({ rating: "5" }) + "#my-reviews",
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

      <section className="mt-5 cyber-chamfer border border-outline bg-surface-container-lowest p-4 sm:p-5">
        <h2 className="mb-3 text-base font-bold">توزیع امتیازها</h2>
        <div className="space-y-2">
          {byRating.map((row) => {
            const pct = allReviews.length ? Math.round((row.count / allReviews.length) * 100) : 0;
            return (
              <Link
                key={row.rating}
                href={buildHref({ q, rating: String(row.rating) }) + "#my-reviews"}
                className="flex items-center gap-3 rounded-xl px-1 py-1 hover:bg-surface-container-low/60"
              >
                <span className="w-10 text-xs font-bold tabular-nums">{row.rating}★</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-container-low">
                  <span
                    className="block h-full rounded-full bg-primary-container"
                    style={{ width: `${pct}%` }}
                  />
                </span>
                <span className="w-10 text-left text-xs tabular-nums text-on-surface-variant">{row.count}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {pending.length > 0 ? (
        <section id="pending-reviews" className="mt-6 scroll-mt-4">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-base font-bold">در انتظار ثبت نظر</h2>
              <p className="mt-0.5 text-xs text-on-surface-variant">محصولات سخت‌افزاری از سفارش‌های تکمیل‌شده</p>
            </div>
            <span className="alert-warn cyber-chamfer-sm px-2.5 py-0.5 text-[11px] font-bold">
              {pendingMap.size} مورد
            </span>
          </div>
          <div className="space-y-3">
            {pending.map((p) => (
              <div key={p.productId} className="cyber-chamfer alert-warn p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <Link href={`/product/${p.slug}`} className="font-semibold hover:text-primary-container">
                    {p.title}
                  </Link>
                  <Link
                    href={`/product/${p.slug}`}
                    className="text-xs font-semibold text-primary-container hover:underline"
                  >
                    صفحه محصول
                  </Link>
                </div>
                <OrderReviewForm productId={p.productId} productTitle={p.title} />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section id="my-reviews" className="mt-8 scroll-mt-4 border-t border-outline pt-6">
        <div className="mb-3">
          <h2 className="text-lg font-bold">نظرات ثبت‌شده</h2>
          <p className="mt-0.5 text-sm text-on-surface-variant">
            {reviews.length} مورد
            {ratingFilter ? ` · ${ratingFilter} ستاره` : ""}
            {q ? ` · «${q}»` : ""}
          </p>
        </div>

        <div className="mb-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {[
            { label: "همه", rating: undefined as number | undefined, count: allReviews.length },
            ...byRating.map((r) => ({ label: `${r.rating} ستاره`, rating: r.rating, count: r.count })),
          ].map((chip) => {
            const active = (ratingFilter ?? 0) === (chip.rating ?? 0);
            return (
              <Link
                key={chip.label}
                href={buildHref({ q, rating: chip.rating ? String(chip.rating) : undefined }) + "#my-reviews"}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  active
                    ? "border-primary-container bg-cta text-on-primary"
                    : "border-outline bg-surface-container-low text-on-surface-variant hover:border-primary-container"
                }`}
              >
                {chip.label}
                <span
                  className={`rounded-md px-1.5 py-0.5 tabular-nums ${active ? "bg-on-primary/20" : "bg-surface-container-low"}`}
                >
                  {chip.count}
                </span>
              </Link>
            );
          })}
        </div>

        <form
          method="get"
          action="/account/reviews"
          className="mb-4 flex flex-wrap items-center gap-2 cyber-chamfer border border-outline bg-surface-container-lowest p-3"
        >
          {ratingFilter ? <input type="hidden" name="rating" value={ratingFilter} /> : null}
          <div className="relative min-w-[160px] flex-1">
            <Icon
              name="search"
              className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-on-surface-variant"
            />
            <input
              name="q"
              defaultValue={q}
              placeholder="جستجو در محصول یا متن نظر"
              className="w-full cyber-chamfer-sm border border-outline bg-surface-container-lowest-container-low py-2.5 pr-10 pl-3 text-sm outline-none focus:border-primary-container"
            />
          </div>
          <button
            type="submit"
            className="cyber-chamfer-sm bg-cta px-4 py-2.5 text-sm font-semibold text-on-primary"
          >
            اعمال
          </button>
          {(q || ratingFilter) && (
            <Link
              href="/account/reviews#my-reviews"
              className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-2.5 text-sm font-semibold hover:border-primary-container hover:text-primary-container"
            >
              پاک کردن
            </Link>
          )}
        </form>

        {!allReviews.length ? (
          <div className="cyber-chamfer border border-dashed border-outline bg-surface-container-low p-10 text-center">
            <p className="text-sm text-on-surface-variant">هنوز نظری ثبت نکرده‌اید.</p>
            <Link
              href="/account/orders?status=COMPLETED"
              className="mt-3 inline-flex cyber-chamfer-sm bg-cta px-4 py-2 text-sm font-semibold text-on-primary"
            >
              مشاهده سفارش‌های تکمیل‌شده
            </Link>
          </div>
        ) : !reviews.length ? (
          <div className="cyber-chamfer border border-dashed border-outline bg-surface-container-low p-10 text-center">
            <p className="text-sm text-on-surface-variant">نظری با این فیلتر پیدا نشد.</p>
            <Link
              href="/account/reviews#my-reviews"
              className="mt-3 inline-flex text-sm font-semibold text-primary-container hover:underline"
            >
              پاک کردن فیلترها
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => (
              <AccountReviewCard
                key={r.id}
                review={{
                  id: r.id,
                  rating: r.rating,
                  body: r.body,
                  createdAt: r.createdAt.toISOString(),
                  product: {
                    id: r.product.id,
                    slug: r.product.slug,
                    title: r.product.title,
                    brand: r.product.brand,
                    image: r.product.image || productImagePath(r.product.slug, r.product.title),
                  },
                }}
              />
            ))}
          </div>
        )}
      </section>
    </AccountShell>
  );
}
