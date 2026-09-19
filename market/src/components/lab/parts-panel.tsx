"use client";

import { useMemo, useState } from "react";
import type { ComponentCategory, ComponentDef } from "@/lab/types";
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

export function PartsPanel({
  components,
  onAdd,
}: {
  components: ComponentDef[];
  onAdd: (c: ComponentDef) => void;
}) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<(typeof CATS)[number]["id"]>("all");

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return components.filter((c) => {
      if (cat !== "all" && c.category !== cat) return false;
      if (!qq) return true;
      return (
        c.name.toLowerCase().includes(qq) ||
        c.slug.includes(qq) ||
        c.description.includes(q)
      );
    });
  }, [components, q, cat]);

  return (
    <div className="flex h-full flex-col gap-2 overflow-hidden">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="جستجوی قطعه…"
        className="w-full rounded border border-outline bg-surface-container px-2 py-1.5 text-sm text-on-surface outline-none focus:border-primary"
      />
      <div className="flex flex-wrap gap-1">
        {CATS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCat(c.id)}
            className={`rounded px-2 py-0.5 text-[11px] ${
              cat === c.id
                ? "bg-primary-container text-on-primary"
                : "bg-surface-container text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>
      <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
        {filtered.length === 0 && (
          <li className="p-3 text-center text-xs text-on-surface-variant">قطعه‌ای یافت نشد</li>
        )}
        {filtered.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => onAdd(c)}
              className="flex w-full flex-col gap-1 rounded border border-outline bg-surface-container-low px-2 py-2 text-right transition hover:border-primary/60"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-on-surface">{c.name}</span>
                <SimStatusBadge status={c.simulationStatus} />
              </div>
              <span className="line-clamp-2 text-[11px] text-on-surface-variant">{c.description}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
