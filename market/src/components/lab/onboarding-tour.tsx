"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { PlacePartsArt, RunBuyArt, WireUpArt, WriteCodeArt } from "./step-illustrations";

const STEPS: { art: ReactNode; title: string; text: string }[] = [
  { art: <PlacePartsArt />, title: "۱. قطعه بچینید", text: "از ستون «قطعات» یک کارت را روی بوم بکشید (یا فقط رویش بزنید). قطعه را با کشیدن جابه‌جا کنید؛ R می‌چرخاندش." },
  { art: <WireUpArt />, title: "۲. سیم بکشید", text: "روی یک پین بزنید، بعد روی پین مقصد. پین‌هایی که اتصالشان مجاز است روشن می‌شوند و اتصال‌های خطرناک رد می‌شوند." },
  { art: <WriteCodeArt />, title: "۳. کد بنویسید و اجرا کنید", text: "کد Arduino را در تب «کد» بنویسید و دکمه‌ی نارنجی «اجرا» را بزنید. خروجی Serial.println در تب «سریال» می‌آید." },
  { art: <RunBuyArt />, title: "۴. قطعات را بخرید", text: "تب «لیست قطعات» همه‌ی قطعه‌های پروژه را با قیمت فروشگاه نشان می‌دهد؛ با یک کلیک به سبد اضافه‌شان کنید." },
];

export function OnboardingTour({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [i, setI] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setI((v) => Math.min(STEPS.length - 1, v + 1));
      if (e.key === "ArrowRight") setI((v) => Math.max(0, v - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  const step = STEPS[i];
  const last = i === STEPS.length - 1;

  const finish = () => {
    setI(0);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-background/70 p-3 backdrop-blur-sm sm:items-center">
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lab-tour-title"
        className="cyber-chamfer w-full max-w-md overflow-hidden border border-primary-container/50 bg-surface-container-lowest shadow-[var(--box-shadow-neon)] outline-none"
      >
        <div className="border-b border-outline">{step.art}</div>
        <div className="p-5">
          <p dir="ltr" className="mb-1 text-right font-mono text-[10px] uppercase tracking-[0.2em] text-primary-container">
            &gt; QUICK_START {i + 1}/{STEPS.length}
          </p>
          <h2 id="lab-tour-title" className="text-lg font-extrabold text-on-surface">{step.title}</h2>
          <p className="mt-2 min-h-[4.5rem] text-sm leading-7 text-on-surface-variant">{step.text}</p>

          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="flex gap-1.5" aria-hidden>
              {STEPS.map((_, k) => (
                <span key={k} className={`h-1.5 transition-all ${k === i ? "w-6 bg-primary-container" : "w-1.5 bg-outline"}`} />
              ))}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={finish} className="cursor-pointer px-3 py-2 text-xs text-on-surface-variant hover:text-on-surface">
                رد شدن
              </button>
              {i > 0 && (
                <button type="button" onClick={() => setI(i - 1)} className="focus-cta cyber-chamfer-sm cursor-pointer border border-outline px-3 py-2 text-xs font-semibold text-on-surface hover:border-primary-container">
                  قبلی
                </button>
              )}
              <button
                type="button"
                onClick={() => (last ? finish() : setI(i + 1))}
                className="bg-cta focus-cta cyber-chamfer-sm cursor-pointer px-4 py-2 text-xs font-bold"
              >
                {last ? "شروع کنیم" : "بعدی"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
