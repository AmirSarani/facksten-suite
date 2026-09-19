"use client";

import dynamic from "next/dynamic";
import type { ComponentDef, PlacedPart } from "@/lab/types";
import { SimStatusBadge } from "./sim-status-badge";
import { formatToman } from "@/lib/format";

const ModelViewer = dynamic(() => import("./model-viewer").then((m) => m.ModelViewer), {
  ssr: false,
  loading: () => (
    <div className="flex h-40 items-center justify-center text-xs text-on-surface-variant">
      بارگذاری مدل…
    </div>
  ),
});

export function Inspector({
  part,
  def,
}: {
  part: PlacedPart | null;
  def: ComponentDef | null;
}) {
  if (!part || !def) {
    return (
      <div className="p-3 text-xs text-on-surface-variant">
        قطعه‌ای را روی بوم انتخاب کنید تا مشخصات و پین‌اوت نمایش داده شود.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-3 text-sm">
      <div>
        <h3 className="font-bold text-on-surface">{def.name}</h3>
        <div className="mt-1">
          <SimStatusBadge status={def.simulationStatus} />
        </div>
      </div>
      <p className="text-xs leading-5 text-on-surface-variant">{def.description}</p>

      <div className="rounded border border-outline bg-surface-container-low p-2">
        {def.modelUrl ? (
          <ModelViewer url={def.modelUrl} title={def.name} />
        ) : (
          <div className="flex h-36 flex-col items-center justify-center gap-1 text-xs text-on-surface-variant">
            <span>مدل سه‌بعدی به‌زودی</span>
            {def.sourceUrl && (
              <a
                href={def.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                منبع CAD (Adafruit)
              </a>
            )}
          </div>
        )}
      </div>

      <div>
        <h4 className="mb-1 text-xs font-semibold text-primary">پین‌اوت</h4>
        <ul className="max-h-40 space-y-0.5 overflow-y-auto text-[11px]">
          {def.pins.map((p) => (
            <li key={p.id} className="flex justify-between gap-2 border-b border-outline/40 py-0.5">
              <span>{p.label}</span>
              <span className="font-mono text-on-surface-variant">
                {p.signal}
                {p.arduinoPin != null ? ` · ${p.arduinoPin}` : ""}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <dl className="grid grid-cols-2 gap-1 text-[11px]">
        <dt className="text-on-surface-variant">ولتاژ</dt>
        <dd>
          {def.voltageRange.min}–{def.voltageRange.max} V
        </dd>
        <dt className="text-on-surface-variant">مجوز</dt>
        <dd className="truncate">{def.license}</dd>
        <dt className="text-on-surface-variant">قیمت فروشگاه</dt>
        <dd>
          {def.price != null ? `${formatToman(def.price)} تومان` : "—"}
        </dd>
        <dt className="text-on-surface-variant">موجودی</dt>
        <dd>
          {def.stockStatus === "in-stock"
            ? "موجود"
            : def.stockStatus === "out-of-stock"
              ? "ناموجود"
              : "نامشخص"}
        </dd>
      </dl>
    </div>
  );
}
