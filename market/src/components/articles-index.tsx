"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArticleCard } from "@/components/article-card";
import { Icon } from "@/components/icon";

export type ArticlesIndexItem = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  image: string;
  minutes: number;
};

export function ArticlesIndex({ articles }: { articles: ArticlesIndexItem[] }) {
  const categories = useMemo(() => {
    const set = new Set(articles.map((a) => a.category).filter(Boolean));
    return ["همه", ...Array.from(set)];
  }, [articles]);

  const [active, setActive] = useState("همه");

  const filtered = useMemo(
    () => (active === "همه" ? articles : articles.filter((a) => a.category === active)),
    [active, articles],
  );

  const [featured, ...rest] = filtered;

  return (
    <div className="mx-auto max-w-[1280px] px-page py-10 sm:py-12">
      <header className="mb-8 max-w-3xl sm:mb-10">
        <p className="mb-2 text-xs font-bold tracking-wide text-primary-container">دانش فنی فکستن</p>
        <h1 className="text-fluid-hero font-extrabold text-on-surface text-balance">مقالات آموزشی</h1>
        <p className="mt-3 text-sm leading-7 text-on-surface-variant sm:text-base">
          راهنماهای عملی الکترونیک، آردوینو، IoT و ابزار — برای مهندسان، دانشجویان و سازندگان.
        </p>
      </header>

      {categories.length > 1 ? (
        <div className="mb-8 flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => {
            const on = cat === active;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActive(cat)}
                className={`focus-cta shrink-0 snap-start cursor-pointer cyber-chamfer-sm px-4 py-2 font-mono text-sm font-semibold uppercase tracking-wide transition-colors duration-200 ${
                  on
                    ? "bg-cta text-on-primary shadow-[var(--box-shadow-neon-sm)]"
                    : "border border-outline bg-surface-container-lowest text-on-surface-variant hover:border-primary-container hover:text-primary-container"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      ) : null}

      {!filtered.length ? (
        <div className="cyber-chamfer border border-dashed border-outline bg-surface-container-low px-6 py-16 text-center">
          <p className="text-sm font-semibold text-on-surface">مقاله‌ای در این دسته نیست</p>
          <button
            type="button"
            onClick={() => setActive("همه")}
            className="mt-3 text-sm font-semibold text-primary-container hover:underline"
          >
            مشاهده همه مقالات
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {featured ? (
            <article className="group overflow-hidden cyber-chamfer border border-outline bg-surface-container-lowest shadow-[var(--box-shadow-neon-sm)] transition-all hover:border-primary-container hover:shadow-[var(--box-shadow-neon)]">
              <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
                <Link
                  href={`/articles/${featured.slug}`}
                  prefetch
                  className="relative aspect-[16/10] overflow-hidden bg-surface-container-low md:aspect-auto md:min-h-[280px]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={featured.image}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </Link>
                <div className="flex flex-col justify-center p-5 sm:p-7 md:p-8">
                  <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
                    <span className="rounded-full bg-primary-container/10 px-2.5 py-1 text-primary-container">
                      {featured.category}
                    </span>
                    <span className="text-on-surface-variant">{featured.minutes} دقیقه مطالعه</span>
                    <span className="text-on-surface-variant">· {featured.date}</span>
                  </div>
                  <Link href={`/articles/${featured.slug}`} prefetch>
                    <h2 className="text-xl font-extrabold text-on-surface text-balance transition-colors group-hover:text-primary sm:text-2xl md:text-[28px] md:leading-10">
                      {featured.title}
                    </h2>
                  </Link>
                  <p className="mt-3 line-clamp-3 text-sm leading-7 text-on-surface-variant sm:text-base">
                    {featured.excerpt}
                  </p>
                  <Link
                    href={`/articles/${featured.slug}`}
                    prefetch
                    className="focus-cta mt-5 inline-flex w-fit cursor-pointer items-center gap-1.5 text-sm font-bold text-primary-container hover:underline"
                  >
                    خواندن مقاله
                    <Icon name="arrow_forward" className="h-4 w-4 rotate-180" />
                  </Link>
                </div>
              </div>
            </article>
          ) : null}

          {rest.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((a) => (
                <ArticleCard
                  key={a.id}
                  article={{
                    id: a.id,
                    slug: a.slug,
                    title: a.title,
                    excerpt: a.excerpt,
                    category: a.category,
                    date: a.date,
                    image: a.image,
                  }}
                  minutes={a.minutes}
                />
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
