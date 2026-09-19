"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icon";
import {
  enrichDescription,
  formatReviewDate,
  mockDownloadsForProduct,
  mockQaForProduct,
  mockReviewsForProduct,
  ratingSummary,
} from "@/lib/product-mock";

function siteNavOffset() {
  if (typeof document === "undefined") return 48;
  const nav = document.querySelector<HTMLElement>("[data-site-nav-sticky]");
  return Math.round(nav?.getBoundingClientRect().height ?? 48);
}

type TabId = "description" | "specs" | "downloads" | "reviews" | "qa";

type Article = {
  id: string;
  slug: string;
  title: string;
  category: string;
  image: string;
};

type FileItem = { id: string; name: string; url: string };
type Review = {
  id: string;
  rating: number;
  body: string;
  user: { name: string };
  createdAt?: string | Date;
};

export function ProductDetailSections({
  slug,
  title,
  description,
  brand,
  type,
  files,
  reviews,
  specs,
  articles,
}: {
  slug: string;
  title: string;
  description: string;
  brand?: string | null;
  type: string;
  files: FileItem[];
  reviews: Review[];
  specs: { k: string; v: string }[];
  articles: Article[];
}) {
  const [tab, setTab] = useState<TabId>("description");
  const [pinned, setPinned] = useState(false);
  const [navOffset, setNavOffset] = useState(48);
  const [barHeight, setBarHeight] = useState(0);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const normalizedReviews = mockReviewsForProduct(
    slug,
    reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      body: r.body,
      user: r.user,
      createdAt:
        typeof r.createdAt === "string"
          ? r.createdAt
          : r.createdAt
            ? new Date(r.createdAt).toISOString()
            : undefined,
    })),
    8,
  );
  const summary = ratingSummary(normalizedReviews);
  const qa = mockQaForProduct(slug, title, brand);
  const downloadCards = mockDownloadsForProduct(slug, type, files);
  const fullDescription = enrichDescription(description, title, brand);
  const paragraphs = fullDescription.split(/\n+/).filter(Boolean);

  useEffect(() => {
    const el = document.getElementById(tab);
    if (!el || tab === "description") return;
    const offset = siteNavOffset() + (barRef.current?.offsetHeight ?? 56) + 12;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: "smooth" });
  }, [tab]);

  useEffect(() => {
    const sync = () => {
      const offset = siteNavOffset();
      setNavOffset(offset);
      if (barRef.current) setBarHeight(barRef.current.offsetHeight);

      const start = sentinelRef.current?.getBoundingClientRect().top ?? 0;
      const end = endRef.current?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY;
      setPinned(start <= offset && end > offset + 8);
    };

    sync();
    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      window.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, []);

  const tabs: { id: TabId; label: string }[] = [
    { id: "description", label: "معرفی و بررسی" },
    { id: "specs", label: "مشخصات فنی" },
    { id: "downloads", label: "دانلودها و مستندات" },
    { id: "reviews", label: `نظرات کاربران (${summary.total})` },
    { id: "qa", label: "پرسش و پاسخ" },
  ];

  const tabBar = (
    <div
      ref={barRef}
      className={
        pinned
          ? "no-scrollbar fixed inset-x-0 z-40 border-b border-outline-variant/30 bg-background/95 pt-3 shadow-[var(--box-shadow-neon-sm)] backdrop-blur"
          : "no-scrollbar relative z-30 mb-8 border-b border-outline-variant/30 bg-background/95 pt-4 backdrop-blur"
      }
      style={pinned ? { top: navOffset } : undefined}
    >
      <div className="mx-auto flex max-w-[1280px] items-center gap-8 overflow-x-auto px-page">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={
              tab === t.id
                ? "shrink-0 cursor-pointer border-b-2 border-primary pb-3 text-sm font-bold whitespace-nowrap text-primary"
                : "shrink-0 cursor-pointer border-b-2 border-transparent pb-3 text-sm font-semibold whitespace-nowrap text-on-surface-variant transition-colors hover:text-primary"
            }
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="mt-20 border-t border-outline-variant/20 pt-12">
      <div ref={sentinelRef} aria-hidden className="h-0" />
      {pinned ? <div aria-hidden style={{ height: barHeight }} className="mb-8" /> : null}
      {tabBar}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-12 lg:col-span-9">
          <section id="description" className="scroll-mt-36">
            <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold text-on-surface">
              <Icon name="description" className="h-5 w-5 text-primary" />
              معرفی محصول
            </h2>
            <div className="max-w-none space-y-4 text-base leading-8 text-on-surface-variant">
              {paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>

          <section id="specs" className="scroll-mt-36">
            <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold text-on-surface">
              <Icon name="settings_ethernet" className="h-5 w-5 text-primary" />
              مشخصات فنی
            </h2>
            <div className="cyber-chamfer overflow-hidden border border-outline bg-surface-container-lowest shadow-[var(--box-shadow-neon-sm)]">
              {specs.map((row) => (
                <div
                  key={row.k}
                  className="grid grid-cols-1 border-b border-outline/20 transition-colors last:border-0 hover:bg-surface-container-low md:grid-cols-3"
                >
                  <div className="border-l border-outline/20 bg-surface-container-low p-4 font-mono text-sm font-semibold text-on-surface-variant md:col-span-1">
                    {row.k}
                  </div>
                  <div className="p-4 text-base text-on-surface md:col-span-2">{row.v}</div>
                </div>
              ))}
            </div>
          </section>

          <section id="downloads" className="scroll-mt-36">
            <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold text-on-surface">
              <Icon name="download" className="h-5 w-5 text-primary" />
              مستندات و فایل‌های راهنما
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {downloadCards.map((f) => (
                <a
                  key={f.id}
                  href={f.url}
                  className="ambient-card group flex items-center gap-4 cyber-chamfer border border-outline p-4 transition-colors hover:border-primary-container hover:shadow-[var(--box-shadow-neon-sm)]"
                >
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${f.tone}`}>
                    <Icon name={f.icon} className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-on-surface transition-colors group-hover:text-primary">
                      {f.name}
                    </h4>
                    <p className="mt-1 text-xs text-on-surface-variant">{f.meta}</p>
                  </div>
                  <Icon name="download" className="h-5 w-5 text-on-surface-variant group-hover:text-primary" />
                </a>
              ))}
            </div>
          </section>

          <section id="reviews" className="scroll-mt-36">
            <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold text-on-surface">
              <Icon name="star" className="h-5 w-5 text-primary" />
              نظرات کاربران
            </h2>

            <div className="mb-6 grid grid-cols-1 gap-4 cyber-chamfer border border-outline bg-surface-container-lowest p-5 shadow-[var(--box-shadow-neon-sm)] md:grid-cols-[160px_1fr]">
              <div className="flex flex-col items-center justify-center border-b border-outline-variant/20 pb-4 md:border-b-0 md:border-l md:pb-0 md:pl-4">
                <p className="text-4xl font-black text-on-surface">
                  {summary.avg.toFixed(1).replace(".", "٫")}
                </p>
                <div className="mt-1 flex items-center gap-0.5 text-primary-container">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Icon
                      key={i}
                      name="star"
                      className={`h-4 w-4 ${i < Math.round(summary.avg) ? "opacity-100" : "opacity-25"}`}
                    />
                  ))}
                </div>
                <p className="mt-2 text-xs text-on-surface-variant">از {summary.total} دیدگاه</p>
              </div>
              <div className="space-y-2">
                {summary.buckets.map((b) => (
                  <div key={b.star} className="flex items-center gap-3 text-xs">
                    <span className="w-10 text-on-surface-variant">{b.star} ستاره</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-container">
                      <div
                        className="h-full rounded-full bg-primary-container"
                        style={{ width: `${b.pct}%` }}
                      />
                    </div>
                    <span className="w-8 text-left text-on-surface-variant">{b.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {normalizedReviews.map((r) => (
                <article
                  key={r.id}
                  className="ambient-card cyber-chamfer border border-outline p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container/15 text-sm font-bold text-primary">
                        {r.user.name.slice(0, 1)}
                      </div>
                      <div>
                        <p className="font-semibold text-on-surface">{r.user.name}</p>
                        <p className="text-xs text-on-surface-variant">{formatReviewDate(r.createdAt)}</p>
                      </div>
                    </div>
                    <span className="flex items-center gap-0.5 rounded-full bg-primary-container/10 px-2 py-1 text-sm font-bold text-primary-container">
                      <Icon name="star" className="h-4 w-4" />
                      {r.rating}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-on-surface-variant">{r.body}</p>
                </article>
              ))}
            </div>
          </section>

          <section id="qa" className="scroll-mt-36">
            <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold text-on-surface">
              <Icon name="mail" className="h-5 w-5 text-primary" />
              پرسش و پاسخ
            </h2>
            <div className="space-y-3">
              {qa.map((item) => (
                <div
                  key={item.id}
                  className="ambient-card cyber-chamfer border border-outline p-5"
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-on-surface-variant">
                    <span className="font-semibold text-on-surface">{item.asker}</span>
                    <span>·</span>
                    <span>{item.daysAgo} روز پیش</span>
                  </div>
                  <p className="text-sm font-bold text-on-surface">س: {item.question}</p>
                  <div className="mt-3 cyber-chamfer-sm bg-surface-container-low p-3 text-sm leading-7 text-on-surface-variant">
                    <span className="font-bold text-primary">پاسخ Facksten: </span>
                    {item.answer}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="hidden lg:col-span-3 lg:block">
          <div className="ambient-card sticky top-28 space-y-8 cyber-chamfer border border-outline p-6">
            <div>
              <h3 className="mb-1 text-sm font-semibold text-on-surface">مقالات مرتبط</h3>
              <p className="mb-4 text-xs text-on-surface-variant">مجله Facksten</p>
              <ul className="space-y-4">
                {articles.slice(0, 4).map((a) => (
                  <li key={a.id}>
                    <Link href={`/articles/${a.slug}`} className="group flex gap-3">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded bg-surface-container">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={a.image || "/placeholder.svg"}
                          alt=""
                          className="h-full w-full object-cover transition-transform group-hover:scale-110"
                        />
                      </div>
                      <div>
                        <h4 className="line-clamp-2 text-xs font-semibold text-on-surface group-hover:text-primary">
                          {a.title}
                        </h4>
                        <p className="mt-1 text-[11px] text-on-surface-variant">{a.category}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="border-t border-outline-variant/30 pt-4">
              <h3 className="mb-2 text-sm font-semibold text-on-surface">نیاز به کمک دارید؟</h3>
              <p className="mb-3 text-xs leading-6 text-on-surface-variant">
                سوال فنی دارید؟ از تیکت پشتیبانی بپرسید.
              </p>
              <Link
                href="/account/tickets"
                className="bg-cta focus-cta cyber-chamfer-sm inline-flex px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wide shadow-[var(--box-shadow-neon-sm)]"
              >
                ارسال تیکت
              </Link>
            </div>
          </div>
        </aside>
      </div>
      <div ref={endRef} aria-hidden className="h-0" />
    </div>
  );
}
