"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function AdminUserActions({
  userId,
  disabled,
  name,
  phone,
}: {
  userId: string;
  disabled: boolean;
  name: string;
  phone: string | null;
}) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    setMsg("");
    setErr("");
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: userId, ...body }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setErr(data.error ?? "خطا");
      return;
    }
    setMsg("ذخیره شد");
    router.refresh();
  }

  async function onProfile(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await patch({ name: fd.get("name"), phone: fd.get("phone") || null });
  }

  async function onReset(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password") || "");
    if (password.length < 6) {
      setErr("رمز حداقل ۶ کاراکتر");
      return;
    }
    await patch({ resetPassword: password });
    (e.target as HTMLFormElement).reset();
  }

  const field =
    "cyber-chamfer-sm w-full border border-outline bg-surface-container-lowest px-3 py-2.5 font-mono text-sm outline-none focus:border-primary-container focus:shadow-[var(--box-shadow-neon-sm)]";

  return (
    <div className="space-y-4">
      <form onSubmit={onProfile} className="space-y-3 cyber-chamfer border border-outline bg-surface-container-lowest p-4 sm:p-5">
        <h3 className="text-base font-bold">اطلاعات پایه</h3>
        <label className="block text-xs font-semibold text-on-surface-variant">
          نام
          <input name="name" defaultValue={name} required className={field} />
        </label>
        <label className="block text-xs font-semibold text-on-surface-variant">
          تلفن
          <input name="phone" defaultValue={phone ?? ""} placeholder="۰۹۱۲…" className={field} />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="cyber-chamfer-sm bg-cta px-3 py-2 text-sm font-semibold text-on-primary disabled:opacity-60"
        >
          ذخیره پروفایل
        </button>
      </form>

      <form onSubmit={onReset} className="space-y-3 cyber-chamfer border border-outline bg-surface-container-lowest p-4 sm:p-5">
        <h3 className="text-base font-bold">بازنشانی رمز</h3>
        <p className="text-xs text-on-surface-variant">رمز جدید حداقل ۶ کاراکتر؛ کاربر با همین رمز وارد می‌شود.</p>
        <label className="block text-xs font-semibold text-on-surface-variant">
          رمز جدید
          <input name="password" type="password" minLength={6} required placeholder="••••••" className={field} />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-2 text-sm font-semibold hover:border-primary-container disabled:opacity-60"
        >
          تغییر رمز
        </button>
      </form>

      <div className="cyber-chamfer border border-outline bg-surface-container-lowest p-4 sm:p-5">
        <h3 className="mb-2 text-base font-bold">وضعیت حساب</h3>
        <p className="mb-3 text-xs leading-5 text-on-surface-variant">
          غیرفعال‌سازی مانع ورود می‌شود؛ داده‌های سفارش و تیکت باقی می‌مانند.
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={() => void patch({ disabled: !disabled })}
          className={`cyber-chamfer-sm px-3 py-2 text-sm font-semibold text-on-primary disabled:opacity-60 ${
            disabled ? "bg-cta" : "alert-danger bg-error"
          }`}
        >
          {disabled ? "فعال‌سازی حساب" : "غیرفعال‌سازی حساب"}
        </button>
      </div>

      {msg ? (
        <p className="cyber-chamfer-sm border border-primary-container/20 bg-primary-container/5 px-3 py-2 text-sm font-semibold text-primary-container">
          {msg}
        </p>
      ) : null}
      {err ? (
        <p className="cyber-chamfer-sm border alert-danger px-3 py-2 text-sm font-semibold">{err}</p>
      ) : null}
    </div>
  );
}
