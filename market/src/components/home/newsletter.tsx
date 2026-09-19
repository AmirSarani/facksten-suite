"use client";

import { FormEvent, useState } from "react";
import { Icon } from "@/components/icon";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setDone(true);
    setEmail("");
  }

  return (
    <section className="home-section-enter border-t border-outline-variant/60 bg-surface-container-low">
      <div className="mx-auto max-w-[1280px] px-page py-home">
        <div className="flex flex-col items-start justify-between gap-6 border border-outline-variant bg-surface-container-lowest cyber-chamfer px-5 py-8 sm:px-8 sm:py-10 md:flex-row md:items-center">
          <div className="max-w-xl min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-accent-tertiary" dir="ltr">
              &gt; NEWSLETTER::SUBSCRIBE
            </p>
            <h2 className="mt-2 text-fluid-title font-bold text-on-surface">خبرنامه فنی Facksten</h2>
            <p className="mt-2 text-sm leading-7 text-on-surface-variant">
              موجودی قطعات جدید، کدهای آموزشی و تخفیف‌های محدود را در ایمیل‌تان دریافت کنید.
            </p>
          </div>
          {done ? (
            <p className="flex items-center gap-2 cyber-chamfer-sm border border-primary-container/40 bg-primary-container/10 px-4 py-3 text-sm font-semibold text-primary-container shadow-[var(--box-shadow-neon-sm)]">
              <Icon name="check_circle" className="h-5 w-5 text-primary-container" />
              ثبت شد — به‌زودی خبر می‌دهیم.
            </p>
          ) : (
            <form onSubmit={onSubmit} className="flex w-full max-w-md flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center font-mono text-xs text-accent-tertiary" aria-hidden>
                  $
                </span>
                <input
                  type="email"
                  required
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="focus-cta w-full cyber-chamfer-sm border border-outline-variant bg-background py-3 pl-4 pr-8 text-left font-mono text-sm text-on-surface outline-none transition-colors duration-200 placeholder:text-on-surface-variant/60 focus:border-primary-container focus:shadow-[var(--box-shadow-neon-sm)]"
                />
              </div>
              <button
                type="submit"
                className="bg-cta focus-cta cyber-glitch cyber-chamfer-sm inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-on-primary shadow-cta transition-colors duration-200"
                data-text="عضویت"
              >
                عضویت
                <Icon name="send" className="h-4 w-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
