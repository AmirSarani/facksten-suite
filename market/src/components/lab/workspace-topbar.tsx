"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { EngineStatus } from "@/lab/engine/types";
import { LAB_TEMPLATES } from "@/lab/templates";
import { Icon } from "@/components/icon";

const STATUS: Record<EngineStatus, { label: string; dot: string }> = {
  idle: { label: "آماده", dot: "bg-on-surface-variant" },
  loading: { label: "بارگذاری…", dot: "bg-amber-400 animate-pulse" },
  running: { label: "در حال اجرا", dot: "bg-accent-tertiary animate-pulse" },
  paused: { label: "مکث", dot: "bg-amber-400" },
  stopped: { label: "متوقف", dot: "bg-on-surface-variant" },
  error: { label: "خطا", dot: "bg-error" },
};

const DIFF = { easy: "ساده", medium: "متوسط", hard: "پیشرفته" } as const;

/** Small inline glyphs the shared icon set doesn't have. */
function Glyph({ d, className = "h-4 w-4" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d={d} />
    </svg>
  );
}
const G = {
  play: "M8 5v14l11-7z",
  stop: "M6 6h12v12H6z",
  pause: "M6 5h4v14H6zm8 0h4v14h-4z",
  reset: "M12 5V1L7 6l5 5V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z",
  undo: "M12.5 8c-2.6 0-5 1-6.8 2.6L2 7v9h9l-3.6-3.6A7.5 7.5 0 0 1 20.9 16l2.4-.8A10 10 0 0 0 12.5 8z",
  redo: "M18.4 10.6A10 10 0 0 0 1.1 15.2l2.4.8A7.5 7.5 0 0 1 16.6 12.4L13 16h9V7z",
  more: "M12 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm0 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4z",
  help: "M11 18h2v-2h-2v2zm1-16a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm0-14a4 4 0 0 0-4 4h2a2 2 0 1 1 4 0c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5a4 4 0 0 0-4-4z",
};

function Menu({ label, trigger, children }: { label: string; trigger: ReactNode; children: (close: () => void) => ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        title={label}
        onClick={() => setOpen((v) => !v)}
        className={`${ghostBtn} ${open ? "border-primary-container text-primary-container" : ""}`}
      >
        {trigger}
      </button>
      {open && (
        <div role="menu" className="cyber-chamfer absolute top-[calc(100%+6px)] left-0 z-50 w-64 border border-outline bg-surface-container-lowest p-1.5 shadow-[var(--box-shadow-neon-sm)]">
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

const ghostBtn =
  "focus-cta inline-flex h-9 min-w-9 cursor-pointer items-center justify-center gap-1.5 border border-transparent px-2 text-xs font-semibold text-on-surface-variant transition-colors hover:border-outline hover:text-on-surface disabled:pointer-events-none disabled:opacity-30";
const menuItem =
  "flex w-full cursor-pointer items-center gap-2 px-2.5 py-2 text-right text-xs text-on-surface transition-colors hover:bg-primary-container/10 hover:text-primary-container";

export type TopbarProps = {
  name: string;
  onRename: (name: string) => void;
  saved: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  status: EngineStatus;
  compiling: boolean;
  onRun: () => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  speed: number;
  onSpeed: (v: number) => void;
  errors: number;
  warnings: number;
  onShowIssues: () => void;
  simpleMode: boolean;
  onToggleMode: () => void;
  onLoadTemplate: (id: string) => void;
  onNewProject: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onShare: () => void;
  onHelp: () => void;
};

export function WorkspaceTopbar(p: TopbarProps) {
  const running = p.status === "running";
  const paused = p.status === "paused";
  const st = STATUS[p.status];
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-outline bg-surface-container-lowest px-2 sm:px-3">
      {/* identity */}
      <Link href="/lab" className={`${ghostBtn} shrink-0`} title="بازگشت به آزمایشگاه" aria-label="بازگشت به آزمایشگاه">
        <Icon name="arrow_forward" className="h-4 w-4" />
        <span className="hidden xl:inline">آزمایشگاه</span>
      </Link>
      <div className="flex min-w-0 flex-1 items-center gap-2 lg:flex-none">
        <input
          value={p.name}
          onChange={(e) => p.onRename(e.target.value)}
          aria-label="نام پروژه"
          maxLength={120}
          className="h-9 w-full min-w-0 border border-transparent bg-transparent px-2 text-sm font-bold text-on-surface outline-none hover:border-outline focus:border-primary-container lg:w-56"
        />
        <span className={`hidden shrink-0 items-center gap-1 text-[11px] sm:flex ${p.saved ? "text-on-surface-variant" : "text-amber-300"}`} title={p.saved ? "در مرورگر شما ذخیره شد" : "در حال ذخیره…"}>
          <span className={`size-1.5 rounded-full ${p.saved ? "bg-accent-tertiary" : "bg-amber-400"}`} />
          {p.saved ? "ذخیره شد" : "ذخیره…"}
        </span>
      </div>

      {/* run controls — centre stage */}
      <div className="flex shrink-0 items-center gap-1 lg:mx-auto">
        {running || paused ? (
          <button type="button" onClick={p.onStop} className="focus-cta cyber-chamfer-sm inline-flex h-10 cursor-pointer items-center gap-2 border border-error bg-error/15 px-4 font-mono text-sm font-bold text-error transition-colors hover:bg-error/25">
            <Glyph d={G.stop} />
            <span className="hidden sm:inline">توقف</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={p.onRun}
            disabled={p.compiling}
            className="bg-cta focus-cta cyber-chamfer-sm inline-flex h-10 cursor-pointer items-center gap-2 px-5 font-mono text-sm font-bold shadow-[var(--box-shadow-neon)] disabled:cursor-wait disabled:opacity-70"
            title="کامپایل و اجرا (Ctrl+Enter)"
          >
            <Glyph d={G.play} />
            {p.compiling ? "کامپایل…" : "اجرا"}
          </button>
        )}
        <button
          type="button"
          className={`${ghostBtn} max-sm:hidden`}
          onClick={paused ? p.onResume : p.onPause}
          disabled={!running && !paused}
          title={paused ? "ادامه" : "مکث"}
          aria-label={paused ? "ادامه" : "مکث"}
        >
          <Glyph d={paused ? G.play : G.pause} />
        </button>
        <button type="button" className={`${ghostBtn} max-sm:hidden`} onClick={p.onReset} title="ریست میکروکنترلر" aria-label="ریست">
          <Glyph d={G.reset} />
        </button>
        <label className="hidden items-center gap-1 text-[11px] text-on-surface-variant md:flex" title="سرعت شبیه‌سازی">
          <span className="sr-only">سرعت</span>
          <select
            value={p.speed}
            onChange={(e) => p.onSpeed(Number(e.target.value))}
            className="h-9 cursor-pointer border border-outline bg-surface-container-low px-1.5 font-mono text-[11px] text-on-surface focus:border-primary-container focus:outline-none"
          >
            {[0.25, 0.5, 1, 2, 4, 8].map((v) => (
              <option key={v} value={v}>
                ×{v}
              </option>
            ))}
          </select>
        </label>
        <span className="hidden items-center gap-1.5 px-1 font-mono text-[11px] text-on-surface-variant lg:flex">
          <span className={`size-2 rounded-full ${st.dot}`} />
          {st.label}
        </span>
      </div>

      {/* utilities */}
      <div className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          onClick={p.onShowIssues}
          className={`${ghostBtn} ${p.errors ? "!text-error" : p.warnings ? "!text-amber-300" : ""}`}
          title="بررسی مدار"
          aria-label={`بررسی مدار: ${p.errors} خطا، ${p.warnings} هشدار`}
        >
          <Icon name={p.errors ? "close" : "verified_user"} className="h-4 w-4" />
          <span className="font-mono">{p.errors || p.warnings ? (p.errors + p.warnings).toLocaleString("fa-IR") : "✓"}</span>
        </button>
        <button type="button" className={`${ghostBtn} max-md:hidden`} onClick={p.onUndo} disabled={!p.canUndo} title="واگرد (Ctrl+Z)" aria-label="واگرد">
          <Glyph d={G.undo} />
        </button>
        <button type="button" className={`${ghostBtn} max-md:hidden`} onClick={p.onRedo} disabled={!p.canRedo} title="ازنو (Ctrl+Shift+Z)" aria-label="ازنو">
          <Glyph d={G.redo} />
        </button>

        <Menu label="قالب‌های آماده" trigger={<><Icon name="schema" className="h-4 w-4" /><span className="hidden lg:inline">قالب‌ها</span></>}>
          {(close) => (
            <>
              <p className="px-2.5 pb-1 pt-0.5 font-mono text-[10px] text-on-surface-variant">&gt; جایگزین پروژه فعلی می‌شود (قابل واگرد)</p>
              {LAB_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="menuitem"
                  className={menuItem}
                  onClick={() => {
                    close();
                    p.onLoadTemplate(t.id);
                  }}
                >
                  <span className="flex-1">{t.name}</span>
                  <span className="font-mono text-[10px] text-on-surface-variant">{DIFF[t.difficulty]}</span>
                </button>
              ))}
            </>
          )}
        </Menu>

        <Menu label="گزینه‌های بیشتر" trigger={<Glyph d={G.more} />}>
          {(close) => (
            <>
              <button type="button" role="menuitem" className={`${menuItem} md:hidden`} onClick={() => { close(); p.onUndo(); }} disabled={!p.canUndo}>
                <Glyph d={G.undo} /> واگرد
              </button>
              <button type="button" role="menuitem" className={menuItem} onClick={() => { close(); p.onNewProject(); }}>
                <Icon name="add" className="h-4 w-4" /> پروژه جدید (خالی)
              </button>
              <button type="button" role="menuitem" className={menuItem} onClick={() => { close(); p.onToggleMode(); }}>
                <Icon name="lock" className="h-4 w-4" />
                <span className="flex-1">حالت {p.simpleMode ? "ساده (با محافظ)" : "حرفه‌ای"}</span>
                <span className="font-mono text-[10px] text-primary-container">تغییر</span>
              </button>
              <div className="my-1 h-px bg-outline" />
              <button type="button" role="menuitem" className={menuItem} onClick={() => { close(); p.onExport(); }}>
                <Icon name="download" className="h-4 w-4" /> ذخیره فایل پروژه (JSON)
              </button>
              <button type="button" role="menuitem" className={menuItem} onClick={() => fileRef.current?.click()}>
                <Icon name="folder_zip" className="h-4 w-4" /> باز کردن فایل پروژه
              </button>
              <button type="button" role="menuitem" className={menuItem} onClick={() => { close(); p.onShare(); }}>
                <Icon name="link" className="h-4 w-4" /> کپی لینک (فقط همین مرورگر)
              </button>
              <div className="my-1 h-px bg-outline" />
              <button type="button" role="menuitem" className={menuItem} onClick={() => { close(); p.onHelp(); }}>
                <Glyph d={G.help} /> راهنمای شروع
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  close();
                  if (f) p.onImport(f);
                }}
              />
            </>
          )}
        </Menu>
      </div>
    </header>
  );
}
