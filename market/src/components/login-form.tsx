"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UI_IMAGES } from "@/lib/media";

const DEMO_ACCOUNTS = [
  { label: "ادمین", email: "admin@facksten.com", hint: "کنسول مدیریت" },
  { label: "همکار", email: "partner@facksten.com", hint: "فروشنده" },
  { label: "مشتری", email: "user@facksten.com", hint: "خریدار" },
] as const;

const DEMO_PASSWORD = "Pass123!";

const fieldClass =
  "cyber-chamfer-sm w-full min-h-11 border border-outline bg-surface-container-lowest px-4 py-3 font-mono text-sm text-primary-container outline-none transition focus:border-primary-container focus:shadow-[var(--box-shadow-neon)]";

export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());
    const url = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "خطا در ورود");
      return;
    }
    const next = search.get("next") || data.redirect || "/";
    router.push(next);
    router.refresh();
  }

  function fillDemo(demoEmail: string) {
    setMode("login");
    setEmail(demoEmail);
    setPassword(DEMO_PASSWORD);
    setError("");
  }

  return (
    <div className="auth-page relative isolate min-h-dvh max-w-[100vw] overflow-x-hidden">
      <div className="absolute inset-0 -z-10 bg-background" />
      <div className="absolute inset-0 -z-10 opacity-90 hero-circuit" />

      <div dir="ltr" className="mx-auto grid min-h-dvh max-w-[1280px] items-stretch lg:grid-cols-2">
        <aside className="auth-visual relative hidden min-h-dvh overflow-hidden lg:block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={UI_IMAGES.aboutLab}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/60 to-background/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />

          <div dir="rtl" className="auth-visual-enter relative z-10 flex h-full flex-col justify-between p-10 xl:p-14">
            <BrandLogo href="/" size="lg" tone="light" />
            <div className="max-w-md space-y-4">
              <p className="cyber-glitch text-3xl font-extrabold leading-snug text-on-surface xl:text-4xl" data-text="قطعات دقیق.">
                قطعات دقیق.
                <br />
                خرید مطمئن.
              </p>
              <p className="cyber-cursor text-sm leading-7 text-on-surface-variant xl:text-base">
                به حساب فکستن وارد شوید تا سفارش‌ها، دانلودها و پنل فروش را در یک جا مدیریت کنید.
              </p>
              <ul className="space-y-2 pt-2 font-mono text-xs uppercase tracking-wider text-on-surface-variant">
                <li className="flex items-center gap-2">
                  <Icon name="check_circle" className="h-4 w-4 text-primary-container" />
                  پیگیری لحظه‌ای سفارش و ارسال
                </li>
                <li className="flex items-center gap-2">
                  <Icon name="check_circle" className="h-4 w-4 text-primary-container" />
                  دسترسی به فایل‌های دیجیتال خریداری‌شده
                </li>
                <li className="flex items-center gap-2">
                  <Icon name="check_circle" className="h-4 w-4 text-primary-container" />
                  پشتیبانی و تیکت از داخل حساب
                </li>
              </ul>
            </div>
          </div>
        </aside>

        <section dir="rtl" className="auth-form-enter flex min-w-0 flex-col justify-center px-page py-6 sm:py-10 lg:px-12 lg:py-12 xl:px-16">
          <div className="mx-auto w-full min-w-0 max-w-[420px]">
            <div className="mb-8 lg:hidden">
              <BrandLogo href="/" size="md" />
            </div>

            <Card variant="terminal" className="mb-6 p-1">
              <div className="flex gap-1 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setError("");
                  }}
                  className={`cyber-chamfer-sm flex-1 cursor-pointer py-2.5 font-mono text-xs font-bold uppercase tracking-wider transition ${
                    mode === "login"
                      ? "bg-primary-container text-on-primary shadow-[var(--box-shadow-neon-sm)]"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  ورود
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("register");
                    setError("");
                  }}
                  className={`cyber-chamfer-sm flex-1 cursor-pointer py-2.5 font-mono text-xs font-bold uppercase tracking-wider transition ${
                    mode === "register"
                      ? "bg-primary-container text-on-primary shadow-[var(--box-shadow-neon-sm)]"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  ثبت‌نام
                </button>
              </div>
            </Card>

            <h1 className="text-2xl font-extrabold text-on-surface sm:text-3xl">
              {mode === "login" ? "خوش آمدید" : "ساخت حساب جدید"}
            </h1>
            <p className="mt-2 text-sm leading-7 text-on-surface-variant">
              {mode === "login"
                ? "ایمیل و رمز عبور خود را وارد کنید تا به پنل مربوطه هدایت شوید."
                : "در کمتر از یک دقیقه به‌عنوان مشتری ثبت‌نام کنید."}
            </p>

            {mode === "login" && (
              <div className="mt-5">
                <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-on-surface-variant">
                  &gt; ورود سریع نمونه
                </p>
                <div className="grid grid-cols-1 gap-2 xs:grid-cols-3 min-[360px]:grid-cols-3">
                  {DEMO_ACCOUNTS.map((a) => (
                    <button
                      key={a.email}
                      type="button"
                      onClick={() => fillDemo(a.email)}
                      className="cyber-chamfer-sm cursor-pointer border border-outline bg-surface-container-lowest px-2 py-2.5 text-center transition hover:border-primary-container hover:shadow-[var(--box-shadow-neon-sm)]"
                    >
                      <span className="block text-xs font-bold text-on-surface">{a.label}</span>
                      <span className="mt-0.5 block font-mono text-[10px] text-on-surface-variant">{a.hint}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              {mode === "register" && (
                <label className="block">
                  <span className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                    نام کامل
                  </span>
                  <input name="name" required autoComplete="name" placeholder="مثلاً سارا محمدی" className={fieldClass} />
                </label>
              )}

              <label className="block">
                <span className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                  ایمیل
                </span>
                <div className="relative">
                  <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-primary-container">
                    <Icon name="mail" className="h-4 w-4" />
                  </span>
                  <input
                    name="email"
                    type="email"
                    required
                    dir="ltr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    placeholder="you@email.com"
                    className={`${fieldClass} pr-4 pl-10 text-left`}
                  />
                </div>
              </label>

              {mode === "register" && (
                <label className="block">
                  <span className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                    موبایل (اختیاری)
                  </span>
                  <input
                    name="phone"
                    dir="ltr"
                    autoComplete="tel"
                    placeholder="09xxxxxxxxx"
                    className={`${fieldClass} text-left`}
                  />
                </label>
              )}

              <label className="block">
                <span className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                  رمز عبور
                </span>
                <div className="relative">
                  <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-primary-container">
                    <Icon name="lock" className="h-4 w-4" />
                  </span>
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    dir="ltr"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    placeholder="حداقل ۶ کاراکتر"
                    className={`${fieldClass} pr-14 pl-10 text-left`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer font-mono text-[10px] font-bold uppercase text-on-surface-variant hover:text-primary-container"
                    aria-label={showPassword ? "مخفی کردن رمز" : "نمایش رمز"}
                  >
                    {showPassword ? "مخفی" : "نمایش"}
                  </button>
                </div>
              </label>

              {error && (
                <div className="alert-danger cyber-chamfer-sm px-3 py-2.5 text-sm" role="alert">
                  {error}
                </div>
              )}

              <Button type="submit" variant="glitch" disabled={loading} className="mt-1 w-full" data-text={mode === "login" ? "ورود به حساب" : "ایجاد حساب"}>
                {loading ? (
                  "لطفاً صبر کنید…"
                ) : (
                  <>
                    {mode === "login" ? "ورود به حساب" : "ایجاد حساب"}
                    <Icon name="arrow_forward" className="h-4 w-4 rotate-180" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-outline pt-6 text-sm">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 font-semibold text-on-surface-variant transition hover:text-primary-container"
              >
                <Icon name="arrow_forward" className="h-4 w-4" />
                بازگشت به فروشگاه
              </Link>
              <Link href="/contact" className="text-on-surface-variant hover:text-primary-container">
                نیاز به کمک؟
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
