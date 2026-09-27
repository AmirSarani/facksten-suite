"use client";

import { useEffect, useRef } from "react";
import type { BomLine, ComponentDef, WiringIssue } from "@/lab/types";
import { Icon, type IconName } from "@/components/icon";
import { formatToman } from "@/lib/format";
import { PartThumb } from "@/lab/visuals/part-art";
import { CodeEditor } from "./code-editor";

export type BottomTab = "code" | "serial" | "log" | "issues" | "bom";
export type LogEntry = { id: number; level: "info" | "ok" | "warn" | "error"; text: string };

type Props = {
  tab: BottomTab;
  onTab: (t: BottomTab) => void;
  code: string;
  onCodeChange: (code: string) => void;
  serial: string;
  onClearSerial: () => void;
  logs: LogEntry[];
  onClearLogs: () => void;
  issues: WiringIssue[];
  onFocusIssue: (issue: WiringIssue) => void;
  bom: BomLine[];
  defs: Map<string, ComponentDef>;
  bomBusy: boolean;
  onAddBom: () => void;
  /** Hide the tab strip (mobile sheet renders its own). */
  bare?: boolean;
};

const SEVERITY: Record<WiringIssue["severity"], { label: string; cls: string; icon: IconName }> = {
  error: { label: "خطا", cls: "border-error/50 text-error", icon: "close" },
  warning: { label: "هشدار", cls: "border-amber-400/50 text-amber-300", icon: "bolt" },
  hint: { label: "نکته", cls: "border-accent-tertiary/50 text-accent-tertiary", icon: "check_circle" },
};

const LOG_COLOR: Record<LogEntry["level"], string> = {
  info: "text-on-surface-variant",
  ok: "text-accent-tertiary",
  warn: "text-amber-300",
  error: "text-error",
};

export function BottomPanel(p: Props) {
  const errors = p.issues.filter((i) => i.severity === "error").length;
  const tabs: { id: BottomTab; label: string; icon: IconName; badge?: number; tone?: string }[] = [
    { id: "code", label: "کد", icon: "integration_instructions" },
    { id: "serial", label: "سریال", icon: "settings_ethernet" },
    { id: "log", label: "گزارش", icon: "description" },
    { id: "issues", label: "بررسی مدار", icon: "verified_user", badge: p.issues.filter((i) => i.severity !== "hint").length, tone: errors ? "bg-error" : "bg-amber-400" },
    { id: "bom", label: "لیست قطعات", icon: "shopping_cart", badge: p.bom.reduce((s, l) => s + l.qty, 0), tone: "bg-on-surface-variant" },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface-container-lowest">
      {!p.bare && (
        <div className="flex shrink-0 items-stretch gap-0.5 overflow-x-auto border-b border-outline px-2 no-scrollbar" role="tablist">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={p.tab === t.id}
              onClick={() => p.onTab(t.id)}
              className={`relative flex shrink-0 cursor-pointer items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-colors ${
                p.tab === t.id ? "text-primary-container" : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <Icon name={t.icon} className="h-4 w-4" />
              {t.label}
              {t.badge ? (
                <span className={`min-w-4 px-1 text-center font-mono text-[10px] font-bold text-background ${t.tone}`}>{t.badge.toLocaleString("fa-IR")}</span>
              ) : null}
              {p.tab === t.id && <span className="absolute inset-x-2 bottom-0 h-0.5 bg-primary-container shadow-[var(--box-shadow-neon-sm)]" />}
            </button>
          ))}
        </div>
      )}

      <div className="min-h-0 flex-1">
        {p.tab === "code" && <CodeEditor value={p.code} onChange={p.onCodeChange} />}
        {p.tab === "serial" && <SerialView text={p.serial} onClear={p.onClearSerial} />}
        {p.tab === "log" && <LogView logs={p.logs} onClear={p.onClearLogs} />}
        {p.tab === "issues" && <IssuesView issues={p.issues} onFocus={p.onFocusIssue} />}
        {p.tab === "bom" && <BomView bom={p.bom} defs={p.defs} busy={p.bomBusy} onAdd={p.onAddBom} />}
      </div>
    </div>
  );
}

export function useAutoScroll<T extends HTMLElement>(dep: unknown) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [dep]);
  return ref;
}

function PaneHeader({ title, onClear, clearDisabled }: { title: string; onClear?: () => void; clearDisabled?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-outline/60 px-3 py-1.5">
      <span className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">{title}</span>
      {onClear && (
        <button type="button" onClick={onClear} disabled={clearDisabled} className="cursor-pointer text-[11px] text-on-surface-variant hover:text-primary-container disabled:opacity-30">
          پاک کردن
        </button>
      )}
    </div>
  );
}

function SerialView({ text, onClear }: { text: string; onClear: () => void }) {
  const ref = useAutoScroll<HTMLPreElement>(text);
  return (
    <div className="flex h-full flex-col">
      <PaneHeader title="Serial Monitor · 9600 baud" onClear={onClear} clearDisabled={!text} />
      <pre ref={ref} dir="ltr" className="min-h-0 flex-1 overflow-auto whitespace-pre-wrap p-3 font-mono text-xs leading-5 text-accent-tertiary">
        {text || <span className="text-on-surface-variant/60">{"> هنوز خروجی‌ای نیامده. Serial.println(...) در کد، اینجا نمایش داده می‌شود."}</span>}
      </pre>
    </div>
  );
}

function LogView({ logs, onClear }: { logs: LogEntry[]; onClear: () => void }) {
  const ref = useAutoScroll<HTMLOListElement>(logs.length);
  return (
    <div className="flex h-full flex-col">
      <PaneHeader title="Build & Run Log" onClear={onClear} clearDisabled={!logs.length} />
      <ol ref={ref} className="min-h-0 flex-1 space-y-0.5 overflow-auto p-3 font-mono text-xs leading-5">
        {logs.length === 0 && <li className="text-on-surface-variant/60">&gt; گزارش کامپایل و اجرا اینجا می‌آید.</li>}
        {logs.map((l) => (
          <li key={l.id} className={`whitespace-pre-wrap ${LOG_COLOR[l.level]}`}>
            <span className="text-primary-container">&gt;</span> {l.text}
          </li>
        ))}
      </ol>
    </div>
  );
}

function IssuesView({ issues, onFocus }: { issues: WiringIssue[]; onFocus: (i: WiringIssue) => void }) {
  if (!issues.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
        <Icon name="check_circle" className="h-8 w-8 text-accent-tertiary" />
        <p className="text-sm font-semibold text-on-surface">سیم‌کشی سالم است</p>
        <p className="text-xs text-on-surface-variant">مشکلی مثل اتصال کوتاه، LED بی‌مقاومت یا GND جدا پیدا نشد.</p>
      </div>
    );
  }
  return (
    <ul className="h-full space-y-2 overflow-auto p-3">
      {issues.map((i, idx) => {
        const s = SEVERITY[i.severity];
        const focusable = !!(i.partIds?.length || i.wireIds?.length);
        return (
          <li key={`${i.code}-${idx}`}>
            <button
              type="button"
              disabled={!focusable}
              onClick={() => onFocus(i)}
              className={`cyber-chamfer-sm flex w-full items-start gap-2 border bg-surface-container-low p-2.5 text-right text-xs leading-6 transition-colors ${s.cls} ${focusable ? "cursor-pointer hover:bg-surface-container" : "cursor-default"}`}
            >
              <span className={`shrink-0 border px-1.5 font-mono text-[10px] ${s.cls}`}>{s.label}</span>
              <span className="flex-1 text-on-surface">{i.message}</span>
              {focusable && <span className="shrink-0 text-[10px] text-on-surface-variant">نمایش روی بوم</span>}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function BomView({ bom, defs, busy, onAdd }: { bom: BomLine[]; defs: Map<string, ComponentDef>; busy: boolean; onAdd: () => void }) {
  const priced = bom.filter((b) => b.price != null && b.productId);
  const total = priced.reduce((s, b) => s + (b.price ?? 0) * b.qty, 0);
  const buyable = bom.some((b) => b.productId);
  if (!bom.length) {
    return <p className="p-6 text-center text-xs text-on-surface-variant">هنوز قطعه‌ای در پروژه نیست.</p>;
  }
  return (
    <div className="flex h-full flex-col">
      <ul className="min-h-0 flex-1 divide-y divide-outline/50 overflow-auto">
        {bom.map((b) => {
          const def = defs.get(b.componentId);
          return (
            <li key={b.componentId} className="flex items-center gap-3 px-3 py-2">
              <span className="flex size-10 shrink-0 items-center justify-center bg-surface-container-low">
                {def ? <PartThumb def={def} className="h-8 w-8" /> : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold text-on-surface">{b.name}</span>
                <span className="text-[10px] text-on-surface-variant">
                  {b.productId ? (b.stockStatus === "out-of-stock" ? "ناموجود در فروشگاه" : "در فروشگاه موجود") : "در فروشگاه نیست"}
                </span>
              </span>
              <span className="font-mono text-xs text-on-surface-variant">×{b.qty.toLocaleString("fa-IR")}</span>
              <span className="w-24 text-left font-mono text-xs text-on-surface">{b.price != null ? formatToman(b.price * b.qty) : "—"}</span>
            </li>
          );
        })}
      </ul>
      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-outline p-3">
        <div className="text-xs">
          <span className="text-on-surface-variant">جمع قطعات موجود: </span>
          <strong className="font-mono text-on-surface">{formatToman(total)} تومان</strong>
        </div>
        <button
          type="button"
          onClick={onAdd}
          disabled={busy || !buyable}
          className="bg-cta focus-cta cyber-chamfer-sm inline-flex min-h-9 cursor-pointer items-center gap-2 px-4 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Icon name="add_shopping_cart" className="h-4 w-4" />
          {busy ? "در حال افزودن…" : "افزودن همه به سبد"}
        </button>
      </div>
    </div>
  );
}
