import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { Icon } from "@/components/icon";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { estimateReadMinutes } from "@/lib/article-content";

export const metadata = { title: "مقالات ادمین" };

type Props = { searchParams: Promise<{ published?: string; q?: string; category?: string }> };

export default async function AdminArticlesPage({ searchParams }: Props) {
  await requireUser(["ADMIN"]);
  const sp = await searchParams;
  const q = sp.q?.trim();
  const published = sp.published === "1" ? true : sp.published === "0" ? false : undefined;
  const category = sp.category?.trim();

  const [articles, totalAll, publishedCount, draftCount, allForCats, noCoverCount] = await Promise.all([
    prisma.article.findMany({
      where: {
        ...(published != null ? { published } : {}),
        ...(category ? { category } : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: q } },
                { category: { contains: q } },
                { slug: { contains: q } },
                { excerpt: { contains: q } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.article.count(),
    prisma.article.count({ where: { published: true } }),
    prisma.article.count({ where: { published: false } }),
    prisma.article.findMany({ select: { category: true }, distinct: ["category"] }),
    prisma.article.count({ where: { image: "" } }),
  ]);

  const categorySuggestions = allForCats.map((a) => a.category).filter(Boolean);

  function href(opts: { published?: string; q?: string; category?: string }) {
    const p = new URLSearchParams();
    if (opts.q) p.set("q", opts.q);
    if (opts.published) p.set("published", opts.published);
    if (opts.category) p.set("category", opts.category);
    const s = p.toString();
    return s ? `/admin/articles?${s}` : "/admin/articles";
  }

  const chips = [
    { label: "همه", href: href({ q }) + "#articles-list", active: published == null && !category, count: totalAll },
    {
      label: "منتشر",
      href: href({ q, published: "1" }) + "#articles-list",
      active: published === true && !category,
      count: publishedCount,
    },
    {
      label: "پیش‌نویس",
      href: href({ q, published: "0" }) + "#articles-list",
      active: published === false && !category,
      count: draftCount,
    },
  ];

  return (
    <AdminShell
      title="مقالات"
      subtitle="مدیریت محتوا، کاور و انتشار در آرشیو"
      active="/admin/articles"
      actions={
        <>
          <Link
            href="/articles"
            className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-2 text-sm font-semibold text-on-surface hover:border-primary-container hover:text-primary-container"
          >
            آرشیو سایت
          </Link>
          <Link
            href="/admin/articles/new"
            className="cyber-chamfer-sm bg-cta px-3 py-2 text-sm font-semibold text-on-primary"
          >
            مقاله جدید
          </Link>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: "کل مقالات",
            value: String(totalAll),
            hint: "در پنل",
            href: "/admin/articles#articles-list",
            icon: "folder_zip" as const,
          },
          {
            label: "منتشرشده",
            value: String(publishedCount),
            hint: "روی سایت",
            href: href({ published: "1" }) + "#articles-list",
            icon: "check_circle" as const,
          },
          {
            label: "پیش‌نویس",
            value: String(draftCount),
            hint: "نیازمند تکمیل",
            href: href({ published: "0" }) + "#articles-list",
            icon: "description" as const,
          },
          {
            label: "بدون کاور",
            value: String(noCoverCount),
            hint: `${categorySuggestions.length} دسته محتوا`,
            href: "/admin/articles#articles-list",
            icon: "photo_camera" as const,
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

      {(draftCount > 0 || noCoverCount > 0) && (
        <section className="mt-5 grid gap-2 sm:grid-cols-2">
          {draftCount > 0 ? (
            <Link
              href={href({ published: "0" }) + "#articles-list"}
              className="cyber-chamfer-sm alert-warn px-3.5 py-3 hover:border-primary-container/40"
            >
              <p className="text-[11px] font-bold text-on-surface-variant">نیازمند اقدام</p>
              <p className="mt-1 text-sm font-semibold">{draftCount} پیش‌نویس در انتظار انتشار</p>
            </Link>
          ) : null}
          {noCoverCount > 0 ? (
            <div className="cyber-chamfer-sm alert-info px-3.5 py-3">
              <p className="text-[11px] font-bold text-on-surface-variant">کیفیت کارت</p>
              <p className="mt-1 text-sm font-semibold">{noCoverCount} مقاله بدون تصویر کاور</p>
            </div>
          ) : null}
        </section>
      )}

      <section id="articles-list" className="mt-6 scroll-mt-4">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold">آرشیو پنل</h2>
            <p className="mt-0.5 text-sm text-on-surface-variant">
              {articles.length} مورد
              {q ? ` · «${q}»` : ""}
              {category ? ` · ${category}` : ""}
              {published === true ? " · منتشر" : ""}
              {published === false ? " · پیش‌نویس" : ""}
            </p>
          </div>
        </div>

        <div className="mb-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
              <span
                className={`rounded-md px-1.5 py-0.5 tabular-nums ${chip.active ? "bg-on-primary/20" : "bg-surface-container-low"}`}
              >
                {chip.count}
              </span>
            </Link>
          ))}
          {categorySuggestions.slice(0, 8).map((cat) => (
            <Link
              key={cat}
              href={href({ q, category: cat, published: sp.published }) + "#articles-list"}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                category === cat
                  ? "border-primary-container/60 bg-primary-container/10 text-primary-container"
                  : "border-outline bg-surface text-on-surface-variant"
              }`}
            >
              {cat}
            </Link>
          ))}
        </div>

        <form
          method="get"
          action="/admin/articles"
          className="mb-4 flex flex-wrap items-center gap-2 cyber-chamfer border border-outline bg-surface-container-lowest p-3"
        >
          {category ? <input type="hidden" name="category" value={category} /> : null}
          <div className="relative min-w-[180px] flex-1">
            <Icon
              name="search"
              className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-on-surface-variant"
            />
            <input
              name="q"
              defaultValue={q}
              placeholder="جستجو در عنوان، دسته، اسلاگ یا خلاصه"
              className="w-full cyber-chamfer-sm border border-outline bg-surface-container-lowest-container-low py-2.5 pr-10 pl-3 text-sm outline-none focus:border-primary-container"
            />
          </div>
          <select
            name="published"
            defaultValue={sp.published ?? ""}
            className="cyber-chamfer-sm border border-outline bg-surface-container-lowest-container-low px-3 py-2.5 text-sm outline-none focus:border-primary-container"
          >
            <option value="">همه وضعیت‌ها</option>
            <option value="1">منتشر</option>
            <option value="0">پیش‌نویس</option>
          </select>
          <button
            type="submit"
            className="cyber-chamfer-sm bg-cta px-4 py-2.5 text-sm font-semibold text-on-primary"
          >
            اعمال
          </button>
          {(q || published != null || category) && (
            <Link
              href="/admin/articles#articles-list"
              className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-2.5 text-sm font-semibold hover:border-primary-container hover:text-primary-container"
            >
              پاک کردن
            </Link>
          )}
        </form>

        <div className="cyber-chamfer border border-outline bg-surface-container-lowest">
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b border-outline bg-surface-container font-mono text-[11px] uppercase tracking-wider text-on-surface-variant">
                <tr>
                  <th className="px-4 py-3 text-right font-medium">مقاله</th>
                  <th className="px-4 py-3 text-right font-medium">دسته</th>
                  <th className="px-4 py-3 text-right font-medium">وضعیت</th>
                  <th className="px-4 py-3 text-right font-medium">تاریخ</th>
                  <th className="px-4 py-3 text-right font-medium">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {articles.map((a) => {
                  const mins = estimateReadMinutes(a.body || a.excerpt);
                  return (
                    <tr key={a.id} className="border-t border-outline hover:bg-surface-container-low/40">
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-3">
                          <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-surface-container-low">
                            {a.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={a.image} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full items-center justify-center text-[9px] text-on-surface-variant">
                                بدون کاور
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/admin/articles/${a.id}`}
                              className="line-clamp-1 font-semibold text-primary-container hover:underline"
                            >
                              {a.title}
                            </Link>
                            <p className="mt-0.5 line-clamp-1 text-[11px] text-on-surface-variant">{a.excerpt}</p>
                            <p className="mt-0.5 text-[11px] text-on-surface-variant">
                              <span dir="ltr">{a.slug}</span> · {mins} دقیقه
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={href({ category: a.category }) + "#articles-list"}
                          className="rounded-md bg-surface-container-low px-1.5 py-0.5 text-[10px] font-bold text-on-surface-variant hover:text-primary-container"
                        >
                          {a.category}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            a.published ? "alert-ok" : "alert-warn"
                          }`}
                        >
                          {a.published ? "منتشر" : "پیش‌نویس"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-on-surface-variant">{a.dateLabel}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          <Link
                            href={`/admin/articles/${a.id}`}
                            className="cyber-chamfer-sm border border-outline bg-surface-container-low px-2.5 py-1.5 text-xs font-semibold hover:border-primary-container"
                          >
                            ویرایش
                          </Link>
                          <Link
                            href={`/articles/${a.slug}`}
                            className="cyber-chamfer-sm border border-outline bg-surface-container-low px-2.5 py-1.5 text-xs font-semibold text-primary-container hover:border-primary-container"
                          >
                            مشاهده
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-outline md:hidden">
            {articles.map((a) => (
              <div key={a.id} className="p-4">
                <div className="flex gap-3">
                  <div className="h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-surface-container-low">
                    {a.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[10px] text-on-surface-variant">
                        بدون کاور
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap gap-1.5">
                      <span className="rounded-md bg-surface-container-low px-1.5 py-0.5 text-[10px] font-bold text-on-surface-variant">
                        {a.category}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          a.published ? "alert-ok" : "alert-warn"
                        }`}
                      >
                        {a.published ? "منتشر" : "پیش‌نویس"}
                      </span>
                    </div>
                    <Link href={`/admin/articles/${a.id}`} className="font-semibold text-primary-container">
                      {a.title}
                    </Link>
                    <p className="mt-1 line-clamp-2 text-xs text-on-surface-variant">{a.excerpt}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Link
                        href={`/admin/articles/${a.id}`}
                        className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-1.5 text-xs font-semibold hover:border-primary-container"
                      >
                        ویرایش
                      </Link>
                      <Link
                        href={`/articles/${a.slug}`}
                        className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-1.5 text-xs font-semibold hover:border-primary-container text-primary-container"
                      >
                        مشاهده
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {!articles.length ? (
            <div className="p-10 text-center">
              <p className="text-sm text-on-surface-variant">مقاله‌ای با این فیلتر پیدا نشد.</p>
              <Link
                href="/admin/articles/new"
                className="mt-3 inline-flex cyber-chamfer-sm bg-cta px-4 py-2 text-sm font-semibold text-on-primary"
              >
                نوشتن مقاله جدید
              </Link>
            </div>
          ) : null}
        </div>
      </section>
    </AdminShell>
  );
}
