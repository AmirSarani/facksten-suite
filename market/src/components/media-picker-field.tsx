"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icon";

type MediaItem = { url: string; name: string };

export function MediaPickerField({
  value,
  onChange,
  folder,
  label = "تصویر",
}: {
  value?: string;
  onChange: (url: string) => void;
  folder: "products" | "articles";
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [gallery, setGallery] = useState<MediaItem[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(false);

  const uploadFile = useCallback(
    async (file: File) => {
      setError("");
      if (!file.type.startsWith("image/")) {
        setError("فقط فایل تصویری مجاز است");
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setError("حداکثر حجم ۲ مگابایت است");
        return;
      }

      setUploading(true);
      setProgress(20);
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", folder);

      try {
        setProgress(55);
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        const data = await res.json().catch(() => ({}));
        setProgress(100);
        if (!res.ok) {
          setError(data.error ?? "آپلود ناموفق بود");
          return;
        }
        onChange(data.url as string);
      } catch {
        setError("خطا در ارتباط با سرور");
      } finally {
        setUploading(false);
        setTimeout(() => setProgress(0), 400);
      }
    },
    [folder, onChange],
  );

  async function openGallery() {
    setGalleryOpen(true);
    setLoadingGallery(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/media?folder=${folder}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "بارگذاری گالری ناموفق");
        return;
      }
      setGallery((data.items as MediaItem[]) ?? []);
    } finally {
      setLoadingGallery(false);
    }
  }

  useEffect(() => {
    if (!galleryOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setGalleryOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [galleryOpen]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-on-surface">{label}</p>
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-xs font-semibold text-error hover:underline"
          >
            حذف تصویر
          </button>
        ) : null}
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) void uploadFile(file);
        }}
        className={`relative overflow-hidden cyber-chamfer border-2 border-dashed transition ${
          dragOver ? "border-primary-container bg-primary-container/5" : "border-outline bg-surface-container-low/40"
        }`}
      >
        {value ? (
          <div className="relative aspect-[16/10] w-full bg-surface">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 flex flex-wrap gap-2 bg-gradient-to-t from-black/55 to-transparent p-3">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="rounded-lg bg-surface-container-lowest/95 px-3 py-1.5 text-xs font-bold text-on-surface"
              >
                جایگزینی
              </button>
              <button type="button" onClick={() => void openGallery()} className="rounded-lg bg-surface-container-lowest/95 px-3 py-1.5 text-xs font-bold text-on-surface">
                گالری
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 px-4 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-container/15 text-primary-container">
              <Icon name="photo_camera" className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-on-surface">تصویر را بکشید و رها کنید</p>
              <p className="mt-1 text-xs text-on-surface-variant">JPG، PNG، WEBP یا GIF · حداکثر ۲MB</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="cyber-chamfer-sm bg-cta px-4 py-2 text-sm font-semibold text-on-primary"
              >
                انتخاب از سیستم
              </button>
              <button
                type="button"
                onClick={() => void openGallery()}
                className="cyber-chamfer-sm border border-outline bg-surface-container-lowest px-4 py-2 text-sm font-semibold hover:border-primary"
              >
                انتخاب از گالری
              </button>
            </div>
          </div>
        )}

        {uploading && (
          <div className="absolute inset-x-0 bottom-0 h-1.5 bg-surface-variant">
            <div className="h-full bg-primary-container transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void uploadFile(file);
          e.target.value = "";
        }}
      />

      {error && <p className="text-sm text-error">{error}</p>}
      {value ? (
        <p className="truncate text-xs text-on-surface-variant" dir="ltr">
          {value}
        </p>
      ) : null}

      {galleryOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={() => setGalleryOpen(false)}>
          <div
            className="max-h-[80vh] w-full max-w-3xl overflow-hidden cyber-chamfer border border-outline bg-surface-container-lowest shadow-[var(--box-shadow-neon)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-outline px-4 py-3">
              <h3 className="font-bold">گالری رسانه</h3>
              <button type="button" onClick={() => setGalleryOpen(false)} className="rounded-lg border px-3 py-1 text-sm font-semibold">
                بستن
              </button>
            </div>
            <div className="max-h-[65vh] overflow-y-auto p-4">
              {loadingGallery && <p className="text-sm text-on-surface-variant">در حال بارگذاری…</p>}
              {!loadingGallery && gallery.length === 0 && (
                <p className="cyber-chamfer-sm border border-dashed border-outline p-8 text-center text-sm text-on-surface-variant">فایلی در گالری نیست.</p>
              )}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {gallery.map((item) => (
                  <button
                    key={item.url}
                    type="button"
                    onClick={() => {
                      onChange(item.url);
                      setGalleryOpen(false);
                    }}
                    className={`overflow-hidden cyber-chamfer-sm border border-outline text-left transition hover:border-primary-container ${
                      value === item.url ? "border-primary-container ring-2 ring-primary-container/30" : "border-outline"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.url} alt="" className="aspect-square w-full object-cover" />
                    <p className="truncate px-2 py-1 text-[10px] text-on-surface-variant" dir="ltr">
                      {item.name}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
