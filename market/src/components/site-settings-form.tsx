"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon, type IconName } from "@/components/icon";
import type { HomeConfig } from "@/lib/catalog";

type FaqRow = { q: string; a: string };
type TabKey = "contact" | "faq" | "home";

const field =
  "mt-1 w-full cyber-chamfer-sm border border-outline bg-surface-container-lowest-container-low px-3 py-2.5 text-sm outline-none focus:border-primary-container";

const TABS: { key: TabKey; label: string; hint: string; icon: IconName }[] = [
  { key: "contact", label: "تماس", hint: "فوتر و صفحه تماس", icon: "call" },
  { key: "faq", label: "سوالات متداول", hint: "صفحه /faq", icon: "support_agent" },
  { key: "home", label: "صفحه اصلی", hint: "هیرو و ریل‌ها", icon: "home_iot_device" },
];

export function SiteSettingsForm({
  initial,
  categories,
}: {
  initial: {
    phone: string;
    email: string;
    address: string;
    faq: FaqRow[];
    home: HomeConfig;
  };
  categories: { slug: string; name: string }[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("contact");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [phone, setPhone] = useState(initial.phone);
  const [email, setEmail] = useState(initial.email);
  const [address, setAddress] = useState(initial.address);
  const [faq, setFaq] = useState<FaqRow[]>(initial.faq.length ? initial.faq : [{ q: "", a: "" }]);
  const [stripSlugs, setStripSlugs] = useState<string[]>(initial.home.stripCategorySlugs);
  const [heroTitle, setHeroTitle] = useState(initial.home.heroTitle);
  const [heroSubtitle, setHeroSubtitle] = useState(initial.home.heroSubtitle);
  const [heroCtaLabel, setHeroCtaLabel] = useState(initial.home.heroCtaLabel);
  const [heroCtaHref, setHeroCtaHref] = useState(initial.home.heroCtaHref);
  const [showDeals, setShowDeals] = useState(initial.home.showDeals);
  const [showNew, setShowNew] = useState(initial.home.showNew);
  const [showPopular, setShowPopular] = useState(initial.home.showPopular);
  const [showDigital, setShowDigital] = useState(initial.home.showDigital);

  const filledFaq = useMemo(() => faq.filter((f) => f.q.trim() && f.a.trim()).length, [faq]);
  const railsOn = [showDeals, showNew, showPopular, showDigital].filter(Boolean).length;
  const contactReady = Boolean(phone.trim() && email.trim() && address.trim());

  function toggleStrip(slug: string) {
    setStripSlugs((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
  }

  function moveFaq(idx: number, dir: -1 | 1) {
    setFaq((rows) => {
      const next = [...rows];
      const j = idx + dir;
      if (j < 0 || j >= next.length) return rows;
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    setErr("");

    const cleanFaq = faq
      .map((f) => ({ q: f.q.trim(), a: f.a.trim() }))
      .filter((f) => f.q && f.a);

    const home: HomeConfig = {
      heroTitle: heroTitle.trim(),
      heroSubtitle: heroSubtitle.trim(),
      heroCtaLabel: heroCtaLabel.trim(),
      heroCtaHref: heroCtaHref.trim() || "/shop",
      stripCategorySlugs: stripSlugs,
      showDeals,
      showPopular,
      showNew,
      showDigital,
    };

    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        faq: cleanFaq,
        home,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErr(data.error ?? "ذخیره نشد");
      return;
    }
    setMsg("تنظیمات ذخیره شد");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: "تماس",
            value: contactReady ? "کامل" : "ناقص",
            hint: contactReady ? "آماده نمایش در فروشگاه" : "تلفن، ایمیل یا آدرس خالی است",
            icon: "call" as const,
            onClick: () => setTab("contact"),
          },
          {
            label: "سوالات FAQ",
            value: String(filledFaq),
            hint: "مورد سفارشی در /faq",
            icon: "support_agent" as const,
            onClick: () => setTab("faq"),
          },
          {
            label: "ریل‌های خانه",
            value: `${railsOn}/۴`,
            hint: "تخفیف، جدید، پرفروش، دیجیتال",
            icon: "inventory_2" as const,
            onClick: () => setTab("home"),
          },
          {
            label: "نوار دسته",
            value: stripSlugs.length ? String(stripSlugs.length) : "پیش‌فرض",
            hint: stripSlugs.length ? "دسته انتخاب‌شده" : "۶ دسته اول",
            icon: "account_tree" as const,
            onClick: () => setTab("home"),
          },
        ].map((c) => (
          <button
            key={c.label}
            type="button"
            onClick={c.onClick}
            className="cyber-chamfer border border-outline bg-surface-container-lowest p-4 text-right transition-colors hover:border-primary-container"
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <p className="text-xs font-medium text-on-surface-variant">{c.label}</p>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center cyber-chamfer-sm bg-primary-container/10 text-primary-container">
                <Icon name={c.icon} className="h-3.5 w-3.5" />
              </span>
            </div>
            <p className="text-xl font-bold tracking-tight sm:text-2xl">{c.value}</p>
            <p className="mt-1 text-[11px] text-on-surface-variant">{c.hint}</p>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/"
          target="_blank"
          className="cyber-chamfer-sm border border-outline bg-surface-container-lowest px-3 py-2 text-xs font-semibold hover:border-primary"
        >
          پیش‌نمایش خانه
        </Link>
        <Link
          href="/contact"
          target="_blank"
          className="cyber-chamfer-sm border border-outline bg-surface-container-lowest px-3 py-2 text-xs font-semibold hover:border-primary"
        >
          صفحه تماس
        </Link>
        <Link
          href="/faq"
          target="_blank"
          className="cyber-chamfer-sm border border-outline bg-surface-container-lowest px-3 py-2 text-xs font-semibold hover:border-primary"
        >
          صفحه FAQ
        </Link>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors ${
              tab === t.key
                ? "border-primary-container bg-cta text-on-primary"
                : "border-outline bg-surface-container-low text-on-surface-variant hover:border-primary-container"
            }`}
          >
            <Icon name={t.icon} className="h-4 w-4" />
            <span>{t.label}</span>
            <span className={`hidden text-[11px] font-medium sm:inline ${tab === t.key ? "text-on-primary/80" : ""}`}>
              · {t.hint}
            </span>
          </button>
        ))}
      </div>

      {/* Contact */}
      <div id="tab-contact" className={tab === "contact" ? "grid gap-4 lg:grid-cols-[1fr_280px]" : "hidden"}>
        <section className="cyber-chamfer border border-outline bg-surface-container-lowest p-4 sm:p-5">
          <div className="mb-4">
            <h2 className="text-base font-bold">اطلاعات تماس فروشگاه</h2>
            <p className="mt-0.5 text-sm text-on-surface-variant">در فوتر و صفحه «تماس با ما» نمایش داده می‌شود.</p>
          </div>
          <div className="space-y-4">
            <label className="block text-xs font-semibold text-on-surface-variant">
              تلفن پشتیبانی
              <div className="relative mt-1">
                <Icon name="call" className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                <input
                  name="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  dir="ltr"
                  placeholder="۰۲۱-۱۲۳۴۵۶۷۸"
                  className={`${field} mt-0 pr-10 text-left`}
                  required
                />
              </div>
            </label>
            <label className="block text-xs font-semibold text-on-surface-variant">
              ایمیل سازمانی
              <div className="relative mt-1">
                <Icon name="mail" className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                <input
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  dir="ltr"
                  placeholder="info@facksten.com"
                  className={`${field} mt-0 pr-10 text-left`}
                  required
                />
              </div>
            </label>
            <label className="block text-xs font-semibold text-on-surface-variant">
              آدرس دفتر
              <div className="relative mt-1">
                <Icon name="location_on" className="pointer-events-none absolute top-3 right-3 h-4 w-4 text-on-surface-variant" />
                <textarea
                  name="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  placeholder="تهران، …"
                  className={`${field} mt-0 resize-y pr-10`}
                  required
                />
              </div>
            </label>
          </div>
        </section>

        <aside className="cyber-chamfer border border-outline bg-surface-container-lowest-container-low/60 p-4 sm:p-5">
          <p className="text-[11px] font-bold text-on-surface-variant">پیش‌نمایش کارت تماس</p>
          <div className="mt-3 space-y-3 text-sm">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center cyber-chamfer-sm bg-primary-container/10 text-primary-container">
                <Icon name="call" className="h-3.5 w-3.5" />
              </span>
              <div>
                <p className="text-[11px] text-on-surface-variant">تلفن</p>
                <p className="font-semibold" dir="ltr">
                  {phone.trim() || "—"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center cyber-chamfer-sm bg-primary-container/10 text-primary-container">
                <Icon name="mail" className="h-3.5 w-3.5" />
              </span>
              <div>
                <p className="text-[11px] text-on-surface-variant">ایمیل</p>
                <p className="font-semibold break-all" dir="ltr">
                  {email.trim() || "—"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center cyber-chamfer-sm bg-primary-container/10 text-primary-container">
                <Icon name="location_on" className="h-3.5 w-3.5" />
              </span>
              <div>
                <p className="text-[11px] text-on-surface-variant">آدرس</p>
                <p className="font-semibold leading-6">{address.trim() || "—"}</p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* FAQ */}
      <div id="tab-faq" className={tab === "faq" ? "space-y-4" : "hidden"}>
        <section className="cyber-chamfer border border-outline bg-surface-container-lowest p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-base font-bold">سوالات سفارشی FAQ</h2>
              <p className="mt-0.5 text-sm text-on-surface-variant">
                این موارد به راهنمای ثابت سایت اضافه می‌شوند · {filledFaq} مورد آماده
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFaq((rows) => [...rows, { q: "", a: "" }])}
              className="cyber-chamfer-sm bg-cta px-3 py-2 text-sm font-semibold text-on-primary"
            >
              + سوال جدید
            </button>
          </div>

          <div className="space-y-3">
            {faq.map((row, idx) => (
              <div key={idx} className="cyber-chamfer-sm border border-outline bg-surface-container-lowest-container-low/40 p-3 sm:p-4">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded-md bg-surface px-2 py-0.5 text-[11px] font-bold text-on-surface-variant">
                    سوال {idx + 1}
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveFaq(idx, -1)}
                      className="rounded-lg border border-outline px-2 py-1 text-[11px] font-semibold disabled:opacity-40"
                    >
                      بالا
                    </button>
                    <button
                      type="button"
                      disabled={idx === faq.length - 1}
                      onClick={() => moveFaq(idx, 1)}
                      className="rounded-lg border border-outline px-2 py-1 text-[11px] font-semibold disabled:opacity-40"
                    >
                      پایین
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFaq((rows) => (rows.length <= 1 ? [{ q: "", a: "" }] : rows.filter((_, i) => i !== idx)))
                      }
                      className="rounded-lg border border-error/40 px-2 py-1 text-[11px] font-semibold text-error"
                    >
                      حذف
                    </button>
                  </div>
                </div>
                <label className="block text-xs font-semibold text-on-surface-variant">
                  سوال
                  <input
                    value={row.q}
                    onChange={(e) => setFaq((rows) => rows.map((r, i) => (i === idx ? { ...r, q: e.target.value } : r)))}
                    placeholder="مثلاً هزینه ارسال چقدر است؟"
                    className={field}
                  />
                </label>
                <label className="mt-3 block text-xs font-semibold text-on-surface-variant">
                  پاسخ
                  <textarea
                    value={row.a}
                    onChange={(e) => setFaq((rows) => rows.map((r, i) => (i === idx ? { ...r, a: e.target.value } : r)))}
                    placeholder="پاسخ کامل و قابل فهم برای مشتری"
                    rows={3}
                    className={`${field} leading-6`}
                  />
                </label>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Home */}
      <div id="tab-home" className={tab === "home" ? "grid gap-4 lg:grid-cols-[1fr_280px]" : "hidden"}>
        <div className="space-y-4">
          <section className="cyber-chamfer border border-outline bg-surface-container-lowest p-4 sm:p-5">
            <div className="mb-4">
              <h2 className="text-base font-bold">هیرو صفحه اصلی</h2>
              <p className="mt-0.5 text-sm text-on-surface-variant">عنوان، توضیح و دکمه اقدام اول صفحه.</p>
            </div>
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-on-surface-variant">
                عنوان هیرو
                <input value={heroTitle} onChange={(e) => setHeroTitle(e.target.value)} className={field} />
              </label>
              <label className="block text-xs font-semibold text-on-surface-variant">
                زیرعنوان
                <textarea
                  value={heroSubtitle}
                  onChange={(e) => setHeroSubtitle(e.target.value)}
                  rows={3}
                  className={`${field} leading-6`}
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-semibold text-on-surface-variant">
                  متن دکمه
                  <input value={heroCtaLabel} onChange={(e) => setHeroCtaLabel(e.target.value)} className={field} />
                </label>
                <label className="block text-xs font-semibold text-on-surface-variant">
                  لینک دکمه
                  <input
                    value={heroCtaHref}
                    onChange={(e) => setHeroCtaHref(e.target.value)}
                    dir="ltr"
                    placeholder="/shop"
                    className={`${field} text-left`}
                  />
                </label>
              </div>
            </div>
          </section>

          <section className="cyber-chamfer border border-outline bg-surface-container-lowest p-4 sm:p-5">
            <div className="mb-3">
              <h2 className="text-base font-bold">ریل‌های محتوا</h2>
              <p className="mt-0.5 text-sm text-on-surface-variant">بخش‌هایی که روی صفحه اصلی نمایش داده می‌شوند.</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {(
                [
                  { key: "deals", label: "ریل تخفیف / ویژه", checked: showDeals, set: setShowDeals },
                  { key: "new", label: "ریل محصولات جدید", checked: showNew, set: setShowNew },
                  { key: "popular", label: "ریل پرفروش", checked: showPopular, set: setShowPopular },
                  { key: "digital", label: "بخش دیجیتال", checked: showDigital, set: setShowDigital },
                ] as const
              ).map((item) => (
                <label
                  key={item.key}
                  className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-3 py-3 text-sm font-semibold transition-colors ${
                    item.checked
                      ? "border-primary-container/40 bg-primary-container/5 text-on-surface"
                      : "border-outline bg-surface-container-low/40 text-on-surface-variant"
                  }`}
                >
                  <span>{item.label}</span>
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={(e) => item.set(e.target.checked)}
                    className="h-4 w-4 accent-[var(--primary-container)]"
                  />
                </label>
              ))}
            </div>
          </section>

          <section className="cyber-chamfer border border-outline bg-surface-container-lowest p-4 sm:p-5">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="text-base font-bold">نوار دسته‌بندی خانه</h2>
                <p className="mt-0.5 text-sm text-on-surface-variant">
                  {stripSlugs.length
                    ? `${stripSlugs.length} دسته انتخاب شده`
                    : "بدون انتخاب = ۶ دسته اول به‌صورت پیش‌فرض"}
                </p>
              </div>
              {stripSlugs.length ? (
                <button
                  type="button"
                  onClick={() => setStripSlugs([])}
                  className="text-xs font-semibold text-primary-container hover:underline"
                >
                  پاک کردن انتخاب
                </button>
              ) : null}
            </div>
            <div className="grid max-h-64 gap-1.5 overflow-y-auto rounded-xl border border-outline p-3 sm:grid-cols-2">
              {categories.map((c) => {
                const on = stripSlugs.includes(c.slug);
                return (
                  <label
                    key={c.slug}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm ${
                      on ? "bg-primary-container/10 font-semibold text-primary-container" : "hover:bg-surface-container"
                    }`}
                  >
                    <input type="checkbox" checked={on} onChange={() => toggleStrip(c.slug)} className="accent-[var(--primary-container)]" />
                    <span className="truncate">{c.name}</span>
                  </label>
                );
              })}
              {!categories.length ? (
                <p className="col-span-full py-6 text-center text-sm text-on-surface-variant">دسته‌ای ثبت نشده.</p>
              ) : null}
            </div>
          </section>
        </div>

        <aside className="h-fit cyber-chamfer border border-outline bg-surface-container-lowest-container-low/60 p-4 sm:p-5 lg:sticky lg:top-4">
          <p className="text-[11px] font-bold text-on-surface-variant">پیش‌نمایش هیرو</p>
          <div className="mt-3 space-y-2">
            <p className="text-base font-extrabold leading-7 text-balance">{heroTitle.trim() || "عنوان هیرو"}</p>
            <p className="text-sm leading-6 text-on-surface-variant text-pretty">
              {heroSubtitle.trim() || "زیرعنوان هیرو اینجا دیده می‌شود."}
            </p>
            <span className="inline-flex cyber-chamfer-sm bg-cta px-3 py-1.5 text-xs font-semibold text-on-primary">
              {heroCtaLabel.trim() || "مشاهده فروشگاه"}
            </span>
            <p className="pt-1 text-[11px] text-on-surface-variant" dir="ltr">
              → {heroCtaHref.trim() || "/shop"}
            </p>
          </div>
          <div className="mt-4 border-t border-outline pt-3 text-xs text-on-surface-variant">
            <p>
              ریل‌های فعال: <span className="font-semibold text-on-surface">{railsOn} از ۴</span>
            </p>
            <p className="mt-1">
              نوار دسته:{" "}
              <span className="font-semibold text-on-surface">
                {stripSlugs.length ? `${stripSlugs.length} مورد` : "پیش‌فرض"}
              </span>
            </p>
          </div>
        </aside>
      </div>

      <div className="sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-3 cyber-chamfer border border-outline bg-surface-container-lowest/95 p-3 shadow-lg backdrop-blur">
        <div className="min-w-0 text-sm">
          {msg ? <p className="font-semibold text-primary-container">{msg}</p> : null}
          {err ? <p className="font-semibold text-error">{err}</p> : null}
          {!msg && !err ? (
            <p className="text-on-surface-variant">تغییرات هر سه بخش با یک ذخیره اعمال می‌شود.</p>
          ) : null}
        </div>
        <button
          type="submit"
          disabled={saving}
          className="cyber-chamfer-sm bg-cta px-4 py-2.5 text-sm font-semibold text-on-primary disabled:opacity-60"
        >
          {saving ? "در حال ذخیره…" : "ذخیره تنظیمات"}
        </button>
      </div>
    </form>
  );
}
