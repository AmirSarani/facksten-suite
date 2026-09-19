"use client";

import Link from "next/link";
import { useCompare } from "@/components/compare-provider";
import { Icon } from "@/components/icon";

export function CompareBar() {
  const { items, clear, remove, ready } = useCompare();
  if (!ready || items.length === 0) return null;

  const href = `/compare?ids=${encodeURIComponent(items.map((i) => i.slug).join(","))}`;

  return (
    <div className="fixed right-0 bottom-0 left-0 z-50 border-t border-outline bg-surface-container-lowest/95 px-4 py-3 shadow-[var(--box-shadow-neon-sm)] backdrop-blur">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex -space-x-2 space-x-reverse">
            {items.map((it) => (
              <div
                key={it.slug}
                className="cyber-chamfer-sm relative h-10 w-10 overflow-hidden border-2 border-outline bg-surface-container-low"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.image || "/placeholder.svg"} alt="" className="h-full w-full object-contain p-0.5" />
                <button
                  type="button"
                  aria-label="حذف"
                  onClick={() => remove(it.slug)}
                  className="absolute -top-1 -left-1 flex h-4 w-4 cursor-pointer items-center justify-center bg-error text-[10px] text-on-primary"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <span className="hidden font-mono text-xs uppercase tracking-wider text-on-surface-variant md:block">
            {items.length} کالا برای مقایسه
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={clear}
            className="cursor-pointer font-mono text-xs uppercase tracking-wider text-primary-container hover:underline"
          >
            حذف همه
          </button>
          <Link
            href={href}
            className="cyber-chamfer-sm bg-cta focus-cta inline-flex min-h-11 cursor-pointer items-center gap-2 px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-[0.15em] shadow-[var(--box-shadow-neon)]"
          >
            مقایسه {items.length} کالا
            <Icon name="schema" className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
