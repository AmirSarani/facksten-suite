"use client";

import { useMemo, useState } from "react";
import type { ComponentCategory, ComponentDef } from "@/lab/types";
import { Icon } from "@/components/icon";
import { PartThumb } from "@/lab/visuals/part-art";
import { PART_DRAG_MIME } from "./board-canvas";
import { SimStatusBadge } from "./sim-status-badge";

const CATS: { id: ComponentCategory | "all"; label: string }[] = [
  { id: "all", label: "همه" },
  { id: "board", label: "برد" },
  { id: "passive", label: "پسیو" },
  { id: "led", label: "LED" },
  { id: "input", label: "ورودی" },
  { id: "actuator", label: "محرک" },
  { id: "sensor", label: "سنسور" },
  { id: "display", label: "نمایشگر" },
];

/** Parts palette: drag a card onto the bench, or tap/click it to drop it in the middle. */
export function PartsPanel({ components, onAdd }: { components: ComponentDef[]; onAdd: (c: ComponentDef) => void }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<(typeof CATS)[number]["id"]>("all");

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of components) m.set(c.category, (m.get(c.category) ?? 0) + 1);
    return m;
  }, [components]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return components.filter((c) => {
      if (cat !== "all" && c.category !== cat) return false;
      if (!qq) return true;
      return c.name.toLowerCase().includes(qq) || c.slug.includes(qq) || c.description.includes(q.trim());
    });
  }, [components, q, cat]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="space-y-2 border-b border-outline p-3">
        <label className="relative block">
          <span className="sr-only">جستجوی قطعه</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            type="search"
            placeholder="جستجوی قطعه…"
            className="cyber-chamfer-sm h-10 w-full border border-outline bg-surface-container-low py-2 pr-9 pl-3 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary-container focus:outline-none"
          />
          <Icon name="search" className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-primary-container" />
        </label>
        <div className="flex flex-wrap gap-1" role="tablist" aria-label="دسته قطعات">
          {CATS.filter((c) => c.id === "all" || counts.has(c.id)).map((c) => (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={cat === c.id}
              onClick={() => setCat(c.id)}
              className={`cursor-pointer border px-2 py-1 text-[11px] font-semibold transition-colors ${
                cat === c.id
                  ? "border-primary-container bg-primary-container/10 text-primary-container"
                  : "border-transparent text-on-surface-variant hover:border-outline hover:text-on-surface"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <p className="px-3 pt-2 font-mono text-[10px] text-on-surface-variant">&gt; بکشید روی بوم، یا بزنید تا وسط اضافه شود</p>

      <ul className="grid min-h-0 flex-1 auto-rows-min grid-cols-2 gap-2 overflow-y-auto p-3">
        {filtered.length === 0 && <li className="col-span-2 p-4 text-center text-xs text-on-surface-variant">قطعه‌ای یافت نشد</li>}
        {filtered.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData(PART_DRAG_MIME, c.id);
                e.dataTransfer.effectAllowed = "copy";
              }}
              onClick={() => onAdd(c)}
              title={c.description}
              className="focus-cta cyber-chamfer-sm group flex w-full cursor-grab flex-col items-stretch gap-1.5 border border-outline bg-surface-container-lowest p-2 text-right transition-all duration-150 hover:border-primary-container hover:shadow-[var(--box-shadow-neon-sm)] active:cursor-grabbing"
            >
              <span className="flex h-16 items-center justify-center bg-[radial-gradient(ellipse_at_center,var(--surface-container)_0%,transparent_70%)]">
                <PartThumb def={c} className="h-full w-auto max-w-full transition-transform duration-150 group-hover:scale-105" />
              </span>
              <span className="line-clamp-2 min-h-8 text-[11px] font-semibold leading-4 text-on-surface">{c.name}</span>
              <SimStatusBadge status={c.simulationStatus} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
