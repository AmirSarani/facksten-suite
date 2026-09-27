"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "@/components/icon";

export type CatalogPart = {
  slug: string;
  name: string;
  category: string;
  status: "simulated" | "wireable" | "3d-only";
};

const CATEGORY_LABEL: Record<string, string> = {
  board: "بُرد",
  passive: "قطعات پسیو",
  led: "LED",
  input: "ورودی",
  actuator: "خروجی و محرک",
  sensor: "سنسور",
  display: "نمایشگر",
  misc: "سایر",
};

const STATUS_META: Record<
  CatalogPart["status"],
  { label: string; hint: string; badge: string; dot: string }
> = {
  simulated: {
    label: "شبیه‌سازی کامل",
    hint: "رفتار واقعی دارد؛ کد شما آن را کنترل می‌کند.",
    badge: "border-accent-tertiary/50 text-accent-tertiary",
    dot: "bg-accent-tertiary",
  },
  wireable: {
    label: "فقط سیم‌کشی",
    hint: "می‌شود وصل کرد و اعتبارسنجی شود؛ رفتار زنده ندارد.",
    badge: "border-primary-container/50 text-primary-container",
    dot: "bg-primary-container",
  },
  "3d-only": {
    label: "مدل سه‌بعدی",
    hint: "فقط برای نمایش؛ سیم‌کشی و شبیه‌سازی ندارد.",
    badge: "border-outline text-on-surface-variant",
    dot: "bg-on-surface-variant",
  },
};

export function PartsCatalog({ parts }: { parts: CatalogPart[] }) {
  const [category, setCategory] = useState<string>("all");
  const [query, setQuery] = useState("");

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of parts) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
    return [...counts.entries()];
  }, [parts]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return parts.filter(
      (p) =>
        (category === "all" || p.category === category) &&
        (!q || p.name.toLowerCase().includes(q) || p.slug.includes(q)),
    );
  }, [parts, category, query]);

  const chip = (active: boolean) =>
    `cyber-chamfer-sm inline-flex min-h-9 cursor-pointer items-center gap-1.5 border px-3 py-1.5 text-xs font-semibold transition-all duration-150 focus-cta ${
      active
        ? "border-primary-container bg-primary-container/10 text-primary-container shadow-[var(--box-shadow-neon-sm)]"
        : "border-outline text-on-surface-variant hover:border-primary-container/50 hover:text-on-surface"
    }`;

  return (
    <div>
      <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="دسته قطعات">
          <button type="button" role="tab" aria-selected={category === "all"} onClick={() => setCategory("all")} className={chip(category === "all")}>
            همه
            <span className="font-mono text-[10px] opacity-70">{parts.length}</span>
          </button>
          {categories.map(([key, count]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={category === key}
              onClick={() => setCategory(key)}
              className={chip(category === key)}
            >
              {CATEGORY_LABEL[key] ?? key}
              <span className="font-mono text-[10px] opacity-70">{count}</span>
            </button>
          ))}
        </div>

        <label className="relative block">
          <span className="sr-only">جستجوی قطعه</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجوی قطعه، مثلاً LED یا سروو…"
            className="cyber-chamfer-sm h-11 w-full border border-outline bg-surface-container-low py-2 pr-10 pl-4 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary-container focus:shadow-[var(--box-shadow-neon-sm)] focus:outline-none"
          />
          <Icon name="search" className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-primary-container" />
        </label>
      </div>

      <ul className="mb-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-on-surface-variant" aria-label="راهنمای نشان‌ها">
        {(Object.keys(STATUS_META) as CatalogPart["status"][]).map((k) => (
          <li key={k} className="flex items-center gap-2">
            <span className={`size-2 rounded-full ${STATUS_META[k].dot}`} aria-hidden />
            <strong className="font-semibold text-on-surface">{STATUS_META[k].label}</strong>
            <span className="hidden sm:inline">— {STATUS_META[k].hint}</span>
          </li>
        ))}
      </ul>

      {visible.length === 0 ? (
        <div className="cyber-chamfer border border-outline bg-surface-container-low p-8 text-center text-sm text-on-surface-variant">
          قطعه‌ای پیدا نشد.{" "}
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setCategory("all");
            }}
            className="cursor-pointer text-primary-container underline"
          >
            پاک کردن فیلترها
          </button>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((p) => {
            const meta = STATUS_META[p.status];
            return (
              <li key={p.slug}>
                <Link
                  href={`/lab/workspace?part=${p.slug}`}
                  className="cyber-chamfer-sm group flex min-h-16 items-center justify-between gap-3 border border-outline bg-surface-container-lowest px-4 py-3 transition-all duration-150 hover:border-primary-container hover:shadow-[var(--box-shadow-neon-sm)] focus-cta"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-on-surface group-hover:text-primary-container">{p.name}</span>
                    <span className="mt-0.5 block text-[11px] text-on-surface-variant">{CATEGORY_LABEL[p.category] ?? p.category}</span>
                  </span>
                  <span className={`shrink-0 border px-2 py-0.5 font-mono text-[10px] ${meta.badge}`}>{meta.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
