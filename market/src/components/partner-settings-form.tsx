"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icon";
import { ROLE_FA } from "@/lib/panel";

type PartnerUser = {
  name: string;
  email: string;
  phone: string;
  role: string;
  notifyEmail: boolean;
  notifySms: boolean;
  createdAt: string;
};

export function PartnerSettingsForm({ user }: { user: PartnerUser }) {
  const router = useRouter();
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [passMsg, setPassMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [notifyMsg, setNotifyMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [savingNotify, setSavingNotify] = useState(false);

  async function saveProfile(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/account/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        phone: fd.get("phone"),
      }),
    });
    setSavingProfile(false);
    setProfileMsg(res.ok ? { ok: true, text: "اطلاعات حساب ذخیره شد." } : { ok: false, text: "ذخیره انجام نشد. دوباره تلاش کنید." });
    if (res.ok) router.refresh();
  }

  async function saveNotifications(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSavingNotify(true);
    setNotifyMsg(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/account/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: user.name,
        phone: user.phone,
        notifyEmail: fd.get("notifyEmail") === "on",
        notifySms: fd.get("notifySms") === "on",
      }),
    });
    setSavingNotify(false);
    setNotifyMsg(res.ok ? { ok: true, text: "ترجیحات اطلاع‌رسانی ذخیره شد." } : { ok: false, text: "ذخیره انجام نشد." });
    if (res.ok) router.refresh();
  }

  async function changePassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPassMsg(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const next = String(fd.get("next") ?? "");
    const confirm = String(fd.get("confirm") ?? "");
    if (next.length < 6) {
      setPassMsg({ ok: false, text: "رمز جدید باید حداقل ۶ کاراکتر باشد." });
      return;
    }
    if (next !== confirm) {
      setPassMsg({ ok: false, text: "تکرار رمز با رمز جدید یکسان نیست." });
      return;
    }
    setSavingPass(true);
    const res = await fetch("/api/account/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current: fd.get("current"), next }),
    });
    const data = await res.json().catch(() => ({}));
    setSavingPass(false);
    if (res.ok) {
      setPassMsg({ ok: true, text: "رمز عبور با موفقیت به‌روز شد." });
      form.reset();
    } else {
      setPassMsg({ ok: false, text: typeof data.error === "string" ? data.error : "خطا در تغییر رمز." });
    }
  }

  const inputClass =
    "w-full cyber-chamfer-sm border border-outline bg-surface-container-lowest-container-low px-3 py-2.5 text-sm outline-none focus:border-primary-container disabled:opacity-60";

  return (
    <div className="mt-6 grid gap-5 lg:grid-cols-3">
      <div className="space-y-5 lg:col-span-2">
        <form id="profile" onSubmit={saveProfile} className="scroll-mt-4 cyber-chamfer border border-outline bg-surface-container-lowest p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-bold">اطلاعات حساب همکار</h2>
              <p className="mt-0.5 text-xs text-on-surface-variant">نام و شماره تماس نمایش‌داده‌شده در سفارش و پشتیبانی</p>
            </div>
            <span className="rounded-full bg-primary-container/10 px-2.5 py-0.5 text-[11px] font-bold text-primary-container">
              {ROLE_FA[user.role] ?? user.role}
            </span>
          </div>

          <div className="mb-5 flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center cyber-chamfer bg-primary-container/15 text-2xl font-bold text-primary-container">
              {user.name.trim().slice(0, 1) || "؟"}
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold">{user.name}</p>
              <p className="truncate text-xs text-on-surface-variant" dir="ltr">
                {user.email}
              </p>
              <p className="mt-1 text-[11px] text-on-surface-variant">
                عضویت: {new Date(user.createdAt).toLocaleDateString("fa-IR")}
              </p>
            </div>
          </div>

          {profileMsg ? (
            <p
              className={`mb-3 cyber-chamfer-sm px-3 py-2 text-sm font-semibold ${
                profileMsg.ok ? "alert-ok" : "alert-danger"
              }`}
            >
              {profileMsg.text}
            </p>
          ) : null}

          <div className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-on-surface-variant">نام نمایشی</span>
              <input name="name" defaultValue={user.name} required minLength={2} className={inputClass} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-on-surface-variant">ایمیل (غیرقابل تغییر)</span>
              <input value={user.email} disabled dir="ltr" className={`${inputClass} text-left`} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-on-surface-variant">شماره تماس</span>
              <input
                name="phone"
                defaultValue={user.phone}
                dir="ltr"
                placeholder="09xxxxxxxxx"
                className={`${inputClass} text-left`}
              />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-outline pt-4">
            <button
              type="submit"
              disabled={savingProfile}
              className="cyber-chamfer-sm bg-cta px-4 py-2.5 text-sm font-semibold text-on-primary disabled:opacity-60"
            >
              {savingProfile ? "در حال ذخیره…" : "ذخیره اطلاعات"}
            </button>
            <p className="text-[11px] text-on-surface-variant">ایمیل برای ورود ثابت است و از پشتیبانی تغییر می‌کند.</p>
          </div>
        </form>

        <form
          id="notifications"
          onSubmit={saveNotifications}
          className="scroll-mt-4 cyber-chamfer border border-outline bg-surface-container-lowest p-4 sm:p-5"
        >
          <div className="mb-4">
            <h2 className="text-base font-bold">اطلاع‌رسانی</h2>
            <p className="mt-0.5 text-xs text-on-surface-variant">اعلان فروش، موجودی و تیکت‌های مشتریان</p>
          </div>

          {notifyMsg ? (
            <p
              className={`mb-3 cyber-chamfer-sm px-3 py-2 text-sm font-semibold ${
                notifyMsg.ok ? "alert-ok" : "alert-danger"
              }`}
            >
              {notifyMsg.text}
            </p>
          ) : null}

          <label className="mb-3 flex cursor-pointer items-start justify-between gap-3 rounded-xl border border-outline/80 bg-surface-container-low/40 px-3.5 py-3">
            <span>
              <span className="flex items-center gap-2 text-sm font-semibold">
                <Icon name="mail" className="h-4 w-4 text-primary-container" />
                ایمیل اطلاع‌رسانی
              </span>
              <span className="mt-1 block text-xs text-on-surface-variant">خلاصه فروش و تیکت‌های جدید</span>
            </span>
            <input name="notifyEmail" type="checkbox" defaultChecked={user.notifyEmail} className="mt-1 accent-[var(--primary-container)]" />
          </label>
          <label className="mb-4 flex cursor-pointer items-start justify-between gap-3 rounded-xl border border-outline/80 bg-surface-container-low/40 px-3.5 py-3">
            <span>
              <span className="flex items-center gap-2 text-sm font-semibold">
                <Icon name="call" className="h-4 w-4 text-primary-container" />
                پیامک وضعیت
              </span>
              <span className="mt-1 block text-xs text-on-surface-variant">هشدار موجودی کم و پیگیری سفارش</span>
            </span>
            <input name="notifySms" type="checkbox" defaultChecked={user.notifySms} className="mt-1 accent-[var(--primary-container)]" />
          </label>

          <button
            type="submit"
            disabled={savingNotify}
            className="cyber-chamfer-sm bg-cta px-4 py-2.5 text-sm font-semibold text-on-primary disabled:opacity-60"
          >
            {savingNotify ? "در حال ذخیره…" : "ذخیره ترجیحات"}
          </button>
        </form>

        <form id="security" onSubmit={changePassword} className="scroll-mt-4 cyber-chamfer border border-outline bg-surface-container-lowest p-4 sm:p-5">
          <div className="mb-4">
            <h2 className="text-base font-bold">امنیت و رمز عبور</h2>
            <p className="mt-0.5 text-xs text-on-surface-variant">حداقل ۶ کاراکتر · پس از تغییر، با رمز جدید وارد شوید</p>
          </div>

          {passMsg ? (
            <p
              className={`mb-3 cyber-chamfer-sm px-3 py-2 text-sm font-semibold ${
                passMsg.ok ? "alert-ok" : "alert-danger"
              }`}
            >
              {passMsg.text}
            </p>
          ) : null}

          <div className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-on-surface-variant">رمز فعلی</span>
              <input name="current" type="password" required autoComplete="current-password" className={inputClass} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-on-surface-variant">رمز جدید</span>
              <input name="next" type="password" required minLength={6} autoComplete="new-password" className={inputClass} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-on-surface-variant">تکرار رمز جدید</span>
              <input name="confirm" type="password" required minLength={6} autoComplete="new-password" className={inputClass} />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-outline pt-4">
            <button
              type="submit"
              disabled={savingPass}
              className="cyber-chamfer-sm bg-cta px-4 py-2.5 text-sm font-semibold text-on-primary disabled:opacity-60"
            >
              {savingPass ? "در حال بروزرسانی…" : "بروزرسانی رمز"}
            </button>
            <p className="text-[11px] text-on-surface-variant">رمز را با کسی به اشتراک نگذارید.</p>
          </div>
        </form>
      </div>

      <aside className="space-y-5">
        <section id="shortcuts" className="scroll-mt-4 cyber-chamfer border border-outline bg-surface-container-lowest p-4 sm:p-5">
          <h2 className="mb-3 text-base font-bold">میانبرهای پنل</h2>
          <ul className="space-y-2">
            {[
              { href: "/partner/inventory", label: "موجودی و محصولات", icon: "inventory_2" as const },
              { href: "/partner/orders", label: "گزارش فروش", icon: "payments" as const },
              { href: "/partner/tickets", label: "تیکت‌های پشتیبانی", icon: "mail" as const },
              { href: "/partner", label: "داشبورد همکار", icon: "schema" as const },
            ].map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 cyber-chamfer-sm border border-outline px-3 py-2.5 text-sm font-semibold transition-colors hover:border-primary-container"
                >
                  <span className="flex h-8 w-8 items-center justify-center cyber-chamfer-sm bg-primary-container/10 text-primary-container">
                    <Icon name={item.icon} className="h-4 w-4" />
                  </span>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="cyber-chamfer border border-outline bg-surface-container-lowest p-4 sm:p-5">
          <h2 className="mb-3 text-base font-bold">وضعیت حساب</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <dt className="text-on-surface-variant">نقش</dt>
              <dd className="font-semibold">{ROLE_FA[user.role] ?? user.role}</dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-on-surface-variant">ایمیل</dt>
              <dd className="truncate font-semibold" dir="ltr">
                {user.email}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-on-surface-variant">تماس</dt>
              <dd className="font-semibold tabular-nums" dir="ltr">
                {user.phone || "—"}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-outline pt-3">
              <dt className="text-on-surface-variant">ایمیل اعلان</dt>
              <dd className="font-semibold">{user.notifyEmail ? "فعال" : "خاموش"}</dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-on-surface-variant">پیامک</dt>
              <dd className="font-semibold">{user.notifySms ? "فعال" : "خاموش"}</dd>
            </div>
          </dl>
        </section>

        <section className="cyber-chamfer border alert-warn p-4 sm:p-5">
          <h2 className="mb-2 text-sm font-bold text-primary-container">نکته امنیتی</h2>
          <p className="text-xs leading-6 text-primary-container/80">
            اگر مشکوک شدید کسی به حسابتان دسترسی دارد، همین‌جا رمز را عوض کنید و تیکت‌های باز را از بخش پشتیبانی بررسی کنید.
          </p>
        </section>
      </aside>
    </div>
  );
}
