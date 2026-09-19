"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon, type IconName } from "@/components/icon";
import {
  FAQ_CATEGORIES,
  FAQ_POPULAR,
  type FaqCategoryId,
  type FaqItem,
} from "@/lib/faq";
import { SITE } from "@/lib/site";

const QUICK_LINKS: { href: string; label: string; body: string; icon: IconName }[] = [
  {
    href: "/account/orders",
    label: "پیگیری سفارش",
    body: "وضعیت و کد رهگیری سفارش‌های شما",
    icon: "local_shipping",
  },
  {
    href: "/shipping",
    label: "ارسال و تحویل",
    body: "زمان آماده‌سازی و ارسال رایگان",
    icon: "inventory_2",
  },
  {
    href: "/returns",
    label: "مرجوعی کالا",
    body: "شرایط بازگشت و تعویض",
    icon: "verified_user",
  },
  {
    href: "/contact",
    label: "تماس با ما",
    body: "تلفن، ایمیل و فرم ارتباط",
    icon: "support_agent",
  },
];

export function FaqClient({ items }: { items: FaqItem[] }) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<FaqCategoryId | "all">("shipping");
  const [openId, setOpenId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const map = Object.fromEntries(FAQ_CATEGORIES.map((c) => [c.id, 0])) as Record<
      FaqCategoryId,
      number
    >;
    for (const f of items) map[f.cat] = (map[f.cat] ?? 0) + 1;
    return map;
  }, [items]);

  const searching = query.trim().length > 0;

  const filtered = useMemo(() => {
    const q = query.trim();
    return items.filter((f) => {
      const matchCat = searching || cat === "all" || f.cat === cat;
      const matchQ = !q || f.q.includes(q) || f.a.includes(q);
      return matchCat && matchQ;
    });
  }, [items, cat, query, searching]);

  const activeCat = FAQ_CATEGORIES.find((c) => c.id === cat);

  return (
    <div>
      <section className="hero-circuit flex flex-col items-center px-margin-mobile py-14 text-center md:px-margin-desktop md:py-16">
        <p className="mb-3 text-xs font-semibold tracking-wide text-primary-container">مرکز راهنما</p>
        <h1 className="mb-4 text-3xl font-extrabold text-on-surface md:text-[40px] md:leading-[56px]">
          چطور می‌توانیم به شما کمک کنیم؟
        </h1>
        <p className="mb-8 max-w-2xl text-base text-on-surface-variant md:text-lg">
          جستجو در راهنمای خرید و پاسخ به سوالات رایج درباره {SITE.name}.
        </p>
        <div className="relative w-full max-w-3xl">
          <label htmlFor="faq-search" className="sr-only">
            جستجوی سوال
          </label>
          <input
            id="faq-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="cyber-chamfer-sm w-full border-2 border-outline bg-surface-container-lowest py-4 pr-12 pl-6 font-mono text-base text-primary-container shadow-[var(--box-shadow-neon-sm)] focus:border-primary-container focus:shadow-[var(--box-shadow-neon)] focus:outline-none md:text-lg"
            placeholder="سوال خود را جستجو کنید (مثال: پیگیری سفارش)..."
          />
          <Icon name="search" className="absolute top-4 right-4 h-7 w-7 text-on-surface-variant" />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute top-4 left-4 text-xs font-semibold text-on-surface-variant hover:text-primary-container"
            >
              پاک کردن
            </button>
          ) : null}
        </div>
        <div className="mt-5 flex max-w-3xl flex-wrap items-center justify-center gap-2">
          <span className="text-xs text-on-surface-variant">موضوعات پرتکرار:</span>
          {FAQ_POPULAR.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => {
                setQuery(p.q);
                setCat("all");
              }}
              className="rounded-full border border-surface-variant bg-surface-container-lowest px-3 py-1 text-xs font-medium text-on-surface transition-colors hover:border-primary-container hover:text-primary-container"
            >
              {p.label}
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-[1280px] grid-cols-2 gap-3 px-margin-mobile pb-4 sm:grid-cols-4 md:px-margin-desktop">
        {QUICK_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group flex flex-col gap-2 cyber-chamfer border border-outline bg-surface-container-lowest p-4 text-right shadow-[var(--box-shadow-neon-sm)] transition-colors hover:border-primary-container hover:shadow-[var(--box-shadow-neon)]"
          >
            <Icon
              name={link.icon}
              className="h-5 w-5 text-primary-container transition-transform group-hover:scale-110"
            />
            <span className="text-sm font-semibold text-on-surface">{link.label}</span>
            <span className="text-xs leading-5 text-on-surface-variant">{link.body}</span>
          </Link>
        ))}
      </section>

      <section className="mx-auto grid max-w-[1280px] grid-cols-1 gap-6 px-margin-mobile py-8 md:grid-cols-12 md:px-margin-desktop md:py-10">
        <aside className="hidden md:col-span-3 md:block">
          <div className="sticky top-24 cyber-chamfer border border-outline bg-surface-container-lowest p-5 shadow-[var(--box-shadow-neon-sm)]">
            <h3 className="mb-3 border-b border-outline pb-3 font-mono text-xl font-semibold uppercase tracking-wide">
              دسته‌بندی‌ها
            </h3>
            <ul className="space-y-1.5">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setCat("all");
                    setQuery("");
                  }}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg p-2.5 text-right text-sm transition-colors ${
                    cat === "all" && !searching
                      ? "bg-primary-container/10 font-bold text-primary"
                      : "text-secondary hover:text-primary"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Icon name="inventory_2" className="h-5 w-5" />
                    همه سوالات
                  </span>
                  <span className="text-[11px] tabular-nums text-on-surface-variant">{items.length}</span>
                </button>
              </li>
              {FAQ_CATEGORIES.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setCat(c.id);
                      setQuery("");
                    }}
                    className={`flex w-full items-center justify-between gap-2 rounded-lg p-2.5 text-right text-sm transition-colors ${
                      cat === c.id && !searching
                        ? "bg-primary-container/10 font-bold text-primary"
                        : "text-secondary hover:text-primary"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Icon name={c.icon} className="h-5 w-5 shrink-0" />
                      {c.label}
                    </span>
                    <span className="text-[11px] tabular-nums text-on-surface-variant">
                      {counts[c.id]}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <div className="space-y-4 md:col-span-9">
          <div className="mb-2 flex flex-wrap gap-2 md:hidden">
            <button
              type="button"
              onClick={() => {
                setCat("all");
                setQuery("");
              }}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                cat === "all" && !searching
                  ? "bg-primary-container/10 font-bold text-primary-container"
                  : "bg-surface-container text-on-surface"
              }`}
            >
              همه ({items.length})
            </button>
            {FAQ_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setCat(c.id);
                  setQuery("");
                }}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  cat === c.id && !searching
                    ? "bg-primary-container text-on-primary shadow-[var(--box-shadow-neon-sm)]"
                    : "bg-surface-container text-on-surface"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="mb-4 flex items-start gap-3 border-b-2 border-primary-container/30 pb-3">
            <Icon
              name={searching ? "search" : activeCat?.icon || "inventory_2"}
              className="mt-0.5 h-8 w-8 shrink-0 text-primary-container"
            />
            <div>
              <h2 className="text-xl font-bold md:text-2xl">
                {searching
                  ? `نتایج جستجو برای «${query.trim()}»`
                  : cat === "all"
                    ? "همه سوالات"
                    : activeCat?.label}
              </h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                {searching
                  ? `${filtered.length} مورد پیدا شد`
                  : cat === "all"
                    ? `${items.length} سوال در ${FAQ_CATEGORIES.length} دسته‌بندی`
                    : activeCat?.description}
              </p>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="cyber-chamfer border border-dashed border-outline p-8 text-center">
              <p className="font-semibold text-on-surface">موردی یافت نشد.</p>
              <p className="mt-2 text-sm text-on-surface-variant">
                عبارت دیگری امتحان کنید یا با پشتیبانی تماس بگیرید.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setCat("all");
                  }}
                  className="cyber-chamfer-sm border border-outline px-4 py-2 font-mono text-sm font-semibold uppercase tracking-wide transition-colors hover:border-primary-container"
                >
                  مشاهده همه سوالات
                </button>
                <Link
                  href="/account/tickets"
                  className="bg-cta focus-cta cyber-chamfer-sm px-4 py-2 font-mono text-sm font-semibold uppercase tracking-wide shadow-[var(--box-shadow-neon-sm)]"
                >
                  ارسال تیکت
                </Link>
              </div>
            </div>
          ) : (
            filtered.map((item) => {
              const isOpen = openId === item.id;
              const catMeta = FAQ_CATEGORIES.find((c) => c.id === item.cat);
              return (
                <details
                  key={item.id}
                  open={isOpen}
                  onToggle={(e) => {
                    const el = e.currentTarget;
                    setOpenId(el.open ? item.id : null);
                  }}
                  className="group overflow-hidden cyber-chamfer border border-outline bg-surface-container-lowest shadow-[var(--box-shadow-neon-sm)]"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 font-semibold text-on-surface marker:content-none">
                    <span className="flex min-w-0 flex-col gap-1.5 text-right">
                      {searching || cat === "all" ? (
                        <span className="text-[11px] font-medium text-primary-container">
                          {catMeta?.label}
                        </span>
                      ) : null}
                      <span>{item.q}</span>
                    </span>
                    <span className="shrink-0 text-on-surface-variant transition group-open:rotate-180">▾</span>
                  </summary>
                  <div className="bg-surface-container-low/50 px-5 pb-5 text-base leading-7 text-on-surface-variant">
                    {item.a}
                  </div>
                </details>
              );
            })
          )}

          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            <HelpStat icon="local_shipping" title="ارسال از تهران" body="آماده‌سازی ۱–۲ روز کاری" />
            <HelpStat icon="payments" title="پرداخت امن" body="درگاه بانکی و فاکتور سفارش" />
            <HelpStat icon="support_agent" title="پشتیبانی فنی" body="راهنمایی انتخاب قطعه" />
          </div>

          <div className="mt-8 cyber-chamfer border border-outline bg-surface-container-high px-6 py-10 text-center md:px-8">
            <h3 className="font-mono text-2xl font-bold uppercase tracking-wide text-on-surface">هنوز سوالی دارید؟</h3>
            <p className="mt-2 text-on-surface-variant">
              تیم پشتیبانی {SITE.name} آماده پاسخگویی است.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/account/tickets"
                className="bg-cta focus-cta inline-flex cyber-chamfer-sm px-6 py-3 font-mono text-sm font-semibold uppercase tracking-wide shadow-[var(--box-shadow-neon-sm)]"
              >
                ارسال تیکت پشتیبانی
              </Link>
              <Link
                href="/contact"
                className="inline-flex cyber-chamfer-sm border border-outline bg-surface-container-lowest px-6 py-3 font-mono text-sm font-semibold uppercase tracking-wide text-on-surface transition-colors hover:border-primary-container hover:text-primary-container"
              >
                صفحه تماس
              </Link>
            </div>
            <p className="mt-4 text-xs text-on-surface-variant">
              {SITE.phone} · {SITE.email}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function HelpStat({
  icon,
  title,
  body,
}: {
  icon: IconName;
  title: string;
  body: string;
}) {
  return (
    <div className="cyber-chamfer border border-outline bg-surface-container-lowest p-4 text-right shadow-[var(--box-shadow-neon-sm)]">
      <Icon name={icon} className="mb-2 h-5 w-5 text-primary-container" />
      <p className="text-sm font-semibold text-on-surface">{title}</p>
      <p className="mt-1 text-xs text-on-surface-variant">{body}</p>
    </div>
  );
}
