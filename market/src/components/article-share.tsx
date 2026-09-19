"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";

export function ArticleShareBar({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  async function nativeShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url: window.location.href });
        return;
      } catch {
        /* user cancelled or unsupported */
      }
    }
    await copyLink();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold text-on-surface-variant">اشتراک‌گذاری</span>
      <button
        type="button"
        onClick={() => void copyLink()}
        className="focus-cta inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-surface-variant bg-surface-container-lowest px-3 py-1.5 text-xs font-semibold text-on-surface transition-colors duration-200 hover:border-primary-container/40 hover:text-primary-container"
      >
        <Icon name="link" className="h-3.5 w-3.5 text-primary-container" />
        {copied ? "کپی شد" : "کپی لینک"}
      </button>
      <button
        type="button"
        onClick={() => void nativeShare()}
        className="focus-cta inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-surface-variant bg-surface-container-lowest px-3 py-1.5 text-xs font-semibold text-on-surface transition-colors duration-200 hover:border-primary-container/40 hover:text-primary-container"
      >
        <Icon name="share" className="h-3.5 w-3.5 text-primary-container" />
        اشتراک
      </button>
    </div>
  );
}
