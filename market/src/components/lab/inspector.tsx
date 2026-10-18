"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import type { ComponentDef, PlacedPart, WireDef } from "@/lab/types";
import { Icon } from "@/components/icon";
import { formatToman } from "@/lib/format";
import { SimStatusBadge } from "./sim-status-badge";

const ModelViewer = dynamic(() => import("./model-viewer").then((m) => m.ModelViewer), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center font-mono text-[11px] text-on-surface-variant">
      &gt; بارگذاری مدل سه‌بعدی…
    </div>
  ),
});

const SIGNAL_DOT: Record<string, string> = {
  gnd: "bg-zinc-900 ring-1 ring-zinc-500",
  vcc: "bg-rose-600",
  digital: "bg-blue-500",
  analog: "bg-violet-500",
  pwm: "bg-amber-500",
};

const STOCK_LABEL = { "in-stock": "موجود", "out-of-stock": "ناموجود", unknown: "نامشخص" } as const;

const iconBtn =
  "focus-cta cyber-chamfer-sm inline-flex min-h-9 flex-1 cursor-pointer items-center justify-center gap-1.5 border border-outline px-2 py-1.5 text-xs font-semibold text-on-surface transition-colors hover:border-primary-container hover:text-primary-container";

export type InspectorProps = {
  part: PlacedPart | null;
  def: ComponentDef | null;
  lit: boolean;
  wire: WireDef | null;
  wireEnds: { from: string; to: string } | null;
  summary: { parts: number; wires: number; errors: number; warnings: number };
  selectionCount: number;
  onRotate: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onWireColor: (color: string) => void;
  onWireStraighten: () => void;
};

/** Jumper colours by convention: red +, black GND, then signal colours. */
const WIRE_COLORS: { color: string; name: string }[] = [
  { color: "#e11d48", name: "قرمز (+)" },
  { color: "#111111", name: "مشکی (GND)" },
  { color: "#3b82f6", name: "آبی" },
  { color: "#22c55e", name: "سبز" },
  { color: "#eab308", name: "زرد" },
  { color: "#f97316", name: "نارنجی" },
  { color: "#a855f7", name: "بنفش" },
  { color: "#f8fafc", name: "سفید" },
];

export function Inspector({
  part, def, lit, wire, wireEnds, summary, selectionCount, onRotate, onDuplicate, onDelete, onWireColor, onWireStraighten,
}: InspectorProps) {
  if (selectionCount > 1) {
    return (
      <div className="space-y-4 p-4 text-sm">
        <Heading kicker="SELECTION" title={`${selectionCount.toLocaleString("fa-IR")} مورد انتخاب شده`} />
        <p className="text-xs leading-6 text-on-surface-variant">
          با کشیدن هر کدام، همه با هم جابه‌جا می‌شوند. کلیدهای جهت‌نما یک سوراخ جابه‌جا می‌کنند (با Shift پنج سوراخ).
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={onRotate} className={iconBtn} title="چرخش ۹۰ درجه (R)">
            <Icon name="rotate_right" className="h-4 w-4" />
            چرخش
          </button>
          <button type="button" onClick={onDuplicate} className={iconBtn} title="کپی (Ctrl+D)">
            <Icon name="content_copy" className="h-4 w-4" />
            کپی
          </button>
          <button type="button" onClick={onDelete} className={`${iconBtn} hover:border-error hover:text-error`} title="حذف (Del)">
            <Icon name="delete" className="h-4 w-4" />
            حذف
          </button>
        </div>
      </div>
    );
  }

  if (wire && wireEnds) {
    return (
      <div className="space-y-4 p-4 text-sm">
        <Heading kicker="WIRE" title="سیم انتخاب‌شده" />
        <div dir="ltr" className="cyber-chamfer-sm flex items-center gap-2 border border-outline bg-surface-container-low p-3 font-mono text-xs">
          <span className="truncate text-on-surface">{wireEnds.from}</span>
          <span className="h-0.5 flex-1" style={{ background: wire.color === "#111111" ? "#52525b" : wire.color }} />
          <span className="truncate text-on-surface">{wireEnds.to}</span>
        </div>
        <section>
          <h4 className="mb-2 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-primary-container">
            <Icon name="palette" className="h-3.5 w-3.5" />
            رنگ سیم
          </h4>
          <div className="grid grid-cols-8 gap-1.5" role="radiogroup" aria-label="رنگ سیم">
            {WIRE_COLORS.map((c) => (
              <button
                key={c.color}
                type="button"
                role="radio"
                aria-checked={wire.color === c.color}
                aria-label={c.name}
                title={c.name}
                onClick={() => onWireColor(c.color)}
                className={`aspect-square cursor-pointer rounded-full border-2 transition-transform hover:scale-110 ${wire.color === c.color ? "border-primary-container" : "border-outline"}`}
                style={{ background: c.color === "#111111" ? "#27272a" : c.color }}
              />
            ))}
          </div>
        </section>
        <p className="text-[11px] leading-6 text-on-surface-variant">
          {wire.points?.length
            ? `${wire.points.length.toLocaleString("fa-IR")} نقطه‌ی خم. دستگیره‌ها را بکشید؛ دوبار کلیک روی خم آن را حذف می‌کند.`
            : "سیم آزاد (بدون خم). روی دستگیره‌ی + وسط سیم بکشید تا خم بسازید."}
        </p>
        {wire.points?.length ? (
          <button type="button" onClick={onWireStraighten} className={`${iconBtn} w-full`}>
            حذف همه‌ی خم‌ها
          </button>
        ) : null}
        <button type="button" onClick={onDelete} className={`${iconBtn} w-full hover:border-error hover:text-error`}>
          <Icon name="delete" className="h-4 w-4" />
          حذف سیم
          <kbd className="font-mono text-[10px] opacity-60">Del</kbd>
        </button>
      </div>
    );
  }

  if (!part || !def) {
    return (
      <div className="space-y-4 p-4 text-sm">
        <Heading kicker="PROJECT" title="خلاصه پروژه" />
        <dl className="grid grid-cols-2 gap-2 text-xs">
          <Stat label="قطعه" value={summary.parts} />
          <Stat label="سیم" value={summary.wires} />
          <Stat label="خطا" value={summary.errors} tone={summary.errors ? "error" : "ok"} />
          <Stat label="هشدار" value={summary.warnings} tone={summary.warnings ? "warn" : "ok"} />
        </dl>
        <div className="cyber-chamfer-sm border border-outline bg-surface-container-low p-3 text-xs leading-6 text-on-surface-variant">
          <p className="mb-1 font-bold text-on-surface">راهنمای سریع</p>
          <ul className="list-inside list-disc space-y-0.5">
            <li>قطعه را از فهرست قطعات روی بوم بکشید.</li>
            <li>از یک پین تا پین مقصد بکشید (یا روی هر دو بزنید). وسط راه با کلیک خم بسازید.</li>
            <li>پایه‌ی قطعه را روی سوراخ بردبورد بگذارید تا بدون سیم وصل شود.</li>
            <li>Shift+کشیدن روی فضای خالی چند قطعه را با هم انتخاب می‌کند.</li>
            <li>قطعه را انتخاب کنید تا مدل سه‌بعدی و پین‌اوتش را ببینید.</li>
            <li>
              میان‌بُرها: <kbd className="font-mono">R</kbd> چرخش، <kbd className="font-mono">Del</kbd> حذف،{" "}
              <kbd className="font-mono">Ctrl+C/V/D</kbd> کپی، <kbd className="font-mono">←↑→↓</kbd> جابه‌جایی،{" "}
              <kbd className="font-mono">Ctrl+Z</kbd> واگرد.
            </li>
          </ul>
        </div>
      </div>
    );
  }

  const shopHref = def.productId && def.catalogSlug ? `/product/${def.catalogSlug}` : null;

  return (
    <div className="space-y-4 p-4 text-sm">
      <div className="flex items-start justify-between gap-2">
        <Heading kicker="PART" title={def.name} />
        <SimStatusBadge status={def.simulationStatus} />
      </div>

      <div className="cyber-chamfer relative h-52 overflow-hidden border border-outline bg-[radial-gradient(ellipse_at_center,var(--surface-container)_0%,var(--background)_75%)]">
        <ModelViewer def={def} lit={lit} />
        <span className="pointer-events-none absolute bottom-2 left-2 font-mono text-[10px] text-on-surface-variant/80">
          بکشید تا بچرخد
        </span>
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={onRotate} className={iconBtn} title="چرخش ۹۰ درجه (R)">
          <Icon name="rotate_right" className="h-4 w-4" />
          چرخش
        </button>
        <button type="button" onClick={onDuplicate} className={iconBtn} title="کپی قطعه">
          <Icon name="content_copy" className="h-4 w-4" />
          کپی
        </button>
        <button type="button" onClick={onDelete} className={`${iconBtn} hover:border-error hover:text-error`} title="حذف (Del)">
          <Icon name="delete" className="h-4 w-4" />
          حذف
        </button>
      </div>

      <p className="text-xs leading-6 text-on-surface-variant">{def.description}</p>

      <section>
        <h4 className="mb-2 font-mono text-[11px] uppercase tracking-widest text-primary-container">&gt; پین‌اوت</h4>
        {def.pins.some((p) => p.signal === "passive") ? (
          <p className="text-[11px] leading-6 text-on-surface-variant">
            {def.pins.length.toLocaleString("fa-IR")} سوراخ. هر ستون دو گروه ۵تایی دارد (a–e و f–j) که داخلشان به هم وصل‌اند؛ ریل‌های + و − در طول برد سراسری‌اند. نشانگر را روی هر سوراخ ببرید تا مسیرش سبز شود.
          </p>
        ) : (
        <ul className="max-h-48 space-y-1 overflow-y-auto pe-1 text-[11px]">
          {def.pins.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-2 border-b border-outline/40 py-1">
              <span className="flex items-center gap-2">
                <span className={`size-2 shrink-0 rounded-full ${SIGNAL_DOT[p.signal] ?? "bg-sky-500"}`} aria-hidden />
                <span className="font-mono text-on-surface" dir="ltr">{p.label}</span>
              </span>
              <span className="font-mono text-on-surface-variant" dir="ltr">
                {p.signal}
                {p.arduinoPin != null ? ` · ${p.arduinoPin}` : ""}
              </span>
            </li>
          ))}
        </ul>
        )}
      </section>

      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[11px]">
        <dt className="text-on-surface-variant">ولتاژ کاری</dt>
        <dd dir="ltr" className="text-right font-mono">{def.voltageRange.min}–{def.voltageRange.max} V</dd>
        <dt className="text-on-surface-variant">قیمت فروشگاه</dt>
        <dd>{def.price != null ? `${formatToman(def.price)} تومان` : "—"}</dd>
        <dt className="text-on-surface-variant">موجودی</dt>
        <dd>{STOCK_LABEL[def.stockStatus]}</dd>
        <dt className="text-on-surface-variant">مجوز مدل</dt>
        <dd className="leading-5">{def.license}</dd>
      </dl>

      {def.sourceUrl && (
        <a
          href={def.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-[11px] text-on-surface-variant underline hover:text-primary-container"
        >
          <Icon name="link" className="h-3.5 w-3.5" />
          منبع مدل سه‌بعدی
        </a>
      )}

      {shopHref ? (
        <Link href={shopHref} className="bg-cta focus-cta cyber-chamfer-sm flex min-h-10 items-center justify-center gap-2 text-xs font-bold">
          <Icon name="shopping_cart" className="h-4 w-4" />
          مشاهده در فروشگاه
        </Link>
      ) : null}
    </div>
  );
}

function Heading({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="min-w-0">
      <p dir="ltr" className="text-right font-mono text-[10px] uppercase tracking-[0.2em] text-primary-container">{`> ${kicker}`}</p>
      <h3 className="truncate text-base font-bold text-on-surface">{title}</h3>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "ok" | "warn" | "error" }) {
  const color = tone === "error" ? "text-error" : tone === "warn" ? "text-amber-300" : "text-on-surface";
  return (
    <div className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-2">
      <dt className="text-on-surface-variant">{label}</dt>
      <dd className={`font-mono text-lg font-bold ${color}`}>{value.toLocaleString("fa-IR")}</dd>
    </div>
  );
}
