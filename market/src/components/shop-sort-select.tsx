"use client";

import { useRouter } from "next/navigation";

export function ShopSortSelect({
  current,
  baseParams,
  basePath = "/shop",
}: {
  current?: string;
  baseParams: Record<string, string | undefined>;
  basePath?: string;
}) {
  const router = useRouter();

  function onChange(value: string) {
    const p = new URLSearchParams();
    Object.entries(baseParams).forEach(([k, v]) => {
      if (v && k !== "sort" && k !== "page") p.set(k, v);
    });
    if (value) p.set("sort", value);
    const s = p.toString();
    router.push(s ? `${basePath}?${s}` : basePath);
  }

  return (
    <label className="flex items-center gap-2 text-sm text-on-surface-variant">
      مرتب‌سازی:
      <select
        value={current ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="cyber-chamfer-sm border border-outline bg-surface-container-lowest px-3 py-1.5 font-mono text-sm text-primary-container outline-none focus:border-primary-container focus:shadow-[var(--box-shadow-neon-sm)]"
      >
        <option value="">جدیدترین</option>
        <option value="popular">پرفروش‌ترین</option>
        <option value="price_asc">ارزان‌ترین</option>
        <option value="price_desc">گران‌ترین</option>
      </select>
    </label>
  );
}
