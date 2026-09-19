"use client";

/** Lightweight placeholder / JSON stub viewer — full R3F optional later */
export function ModelViewer({ url, title }: { url: string; title: string }) {
  if (url.endsWith(".json") || url.includes("placeholder")) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-2 bg-gradient-to-br from-surface to-surface-container">
        <div
          className="h-16 w-16 animate-[spin_12s_linear_infinite] rounded-lg border-2 border-primary/40 bg-primary/10 shadow-[var(--box-shadow-neon-sm)]"
          title={title}
        />
        <p className="text-[11px] text-on-surface-variant">پیش‌نمایش ۳D ساده — {title}</p>
        <p className="text-[10px] text-on-surface-variant/70">تبدیل GLB کامل در اسکریپت sync</p>
      </div>
    );
  }
  return (
    <div className="flex h-40 items-center justify-center text-xs text-on-surface-variant">
      <a href={url} className="text-primary underline" target="_blank" rel="noreferrer">
        دانلود مدل
      </a>
    </div>
  );
}
