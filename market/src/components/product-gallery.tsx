"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/icon";
import { galleryFor } from "@/lib/media";

const AUTO_MS = 4000;

type Props = {
  title: string;
  image: string;
  slug?: string;
  badge?: string | null;
  isDigital?: boolean;
  digitalIcon?: string | null;
};

export function ProductGallery({ title, image, slug, badge, isDigital, digitalIcon }: Props) {
  const gallery = galleryFor(slug || "", image);
  const thumbs = gallery.map((src, i) => ({
    src,
    video: false as boolean,
  }));
  if (gallery.length >= 4) {
    thumbs[thumbs.length - 1] = { ...thumbs[thumbs.length - 1], video: true };
  }

  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const canAutoplay = thumbs.length > 1 && !(isDigital && !image);

  useEffect(() => {
    if (!canAutoplay || paused) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % thumbs.length);
    }, AUTO_MS);
    return () => window.clearInterval(id);
  }, [canAutoplay, paused, thumbs.length]);

  function select(i: number) {
    setActive(i);
  }

  return (
    <div
      className="flex flex-col gap-4"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPaused(false);
      }}
    >
      <div className="ambient-card cyber-chamfer group relative flex aspect-square cursor-zoom-in items-center justify-center p-4">
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
          {(badge || "ویژه") && (
            <span className="cyber-chamfer-sm bg-primary-container px-2 py-1 font-mono text-xs font-semibold text-on-primary shadow-[var(--box-shadow-neon-sm)]">
              {badge || "ویژه"}
            </span>
          )}
        </div>
        {isDigital && !image ? (
          <Icon
            name={(digitalIcon as "folder_zip") || "folder_zip"}
            className="h-24 w-24 text-primary-container transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={thumbs[active]?.src || active}
            src={thumbs[active]?.src || "/placeholder.svg"}
            alt={title}
            className="h-full w-full object-contain object-center transition-opacity duration-500 group-hover:scale-105"
          />
        )}
        {canAutoplay ? (
          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
            {thumbs.map((_, i) => (
              <button
                key={`dot-${i}`}
                type="button"
                aria-label={`تصویر ${i + 1}`}
                aria-current={active === i}
                onClick={() => select(i)}
                className={`h-1.5 rounded-full transition-all ${
                  active === i ? "w-5 bg-primary-container" : "w-1.5 bg-on-surface/25 hover:bg-on-surface/40"
                }`}
              />
            ))}
          </div>
        ) : null}
      </div>

      <div className="no-scrollbar flex items-center gap-4 overflow-x-auto py-1">
        {thumbs.map((t, i) => (
          <button
            key={`${t.src}-${i}`}
            type="button"
            onClick={() => select(i)}
            className={`ambient-card relative h-20 w-20 shrink-0 cyber-chamfer-sm p-1 ${
              active === i
                ? "border-2 border-primary-container"
                : "border border-transparent opacity-70 hover:border-outline-variant hover:opacity-100"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={t.src} alt="" className="h-full w-full rounded object-contain" />
            {t.video && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-on-primary">
                <Icon name="play_circle" className="h-8 w-8" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
