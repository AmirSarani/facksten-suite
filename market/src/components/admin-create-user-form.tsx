"use client";

import { FormEvent, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ROLE_FA } from "@/lib/panel";

const field =
  "mt-1 w-full cyber-chamfer-sm border border-outline bg-surface-container-lowest-container-low px-3 py-2.5 text-sm font-normal text-on-surface outline-none focus:border-primary-container";

export function AdminCreateUserForm() {
  const router = useRouter();
  const titleId = useId();
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const t = window.setTimeout(() => firstFieldRef.current?.focus(), 50);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
    };
  }, [open]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        email: fd.get("email"),
        phone: fd.get("phone") || null,
        role: fd.get("role"),
        password: fd.get("password"),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "ثبت نشد");
      return;
    }
    (e.target as HTMLFormElement).reset();
    setOpen(false);
    router.refresh();
    if (data.user?.id) router.push(`/admin/users/${data.user.id}`);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="cyber-chamfer-sm bg-cta px-3 py-2 text-sm font-semibold text-on-primary"
      >
        کاربر جدید
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal
          aria-labelledby={titleId}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="w-full max-w-lg cyber-chamfer border border-outline bg-surface-container-lowest p-5 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 id={titleId} className="text-base font-bold">
                  ایجاد کاربر
                </h3>
                <p className="mt-0.5 text-xs text-on-surface-variant">مشتری، همکار یا ادمین با رمز اولیه</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="cyber-chamfer-sm border border-outline bg-surface-container-low px-2.5 py-1 text-xs font-semibold hover:border-primary-container"
              >
                بستن
              </button>
            </div>
            <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-semibold text-on-surface-variant sm:col-span-2">
                نام
                <input ref={firstFieldRef} name="name" required placeholder="نام کامل" className={field} />
              </label>
              <label className="block text-xs font-semibold text-on-surface-variant">
                ایمیل
                <input
                  name="email"
                  required
                  type="email"
                  dir="ltr"
                  placeholder="user@email.com"
                  className={`${field} text-left`}
                />
              </label>
              <label className="block text-xs font-semibold text-on-surface-variant">
                تلفن
                <input name="phone" placeholder="۰۹۱۲…" className={field} />
              </label>
              <label className="block text-xs font-semibold text-on-surface-variant">
                نقش
                <select name="role" defaultValue="CUSTOMER" className={field}>
                  <option value="CUSTOMER">{ROLE_FA.CUSTOMER}</option>
                  <option value="PARTNER">{ROLE_FA.PARTNER}</option>
                  <option value="ADMIN">{ROLE_FA.ADMIN}</option>
                </select>
              </label>
              <label className="block text-xs font-semibold text-on-surface-variant">
                رمز اولیه
                <input
                  name="password"
                  required
                  type="password"
                  minLength={6}
                  placeholder="حداقل ۶ کاراکتر"
                  className={field}
                />
              </label>
              {error ? (
                <p className="cyber-chamfer-sm border alert-danger px-3 py-2 text-sm font-semibold sm:col-span-2">
                  {error}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2 sm:col-span-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="cyber-chamfer-sm bg-cta px-4 py-2.5 text-sm font-semibold text-on-primary disabled:opacity-60"
                >
                  {saving ? "در حال ثبت…" : "ثبت کاربر"}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="cyber-chamfer-sm border border-outline bg-surface-container-low px-4 py-2.5 text-sm font-semibold hover:border-primary-container"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
