"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icon";
import { ROLE_FA } from "@/lib/panel";

type Addr = { id: string; label: string; line: string; phone: string; isDefault?: boolean };

type SettingsUser = {
  name: string;
  email: string;
  phone: string;
  role: string;
  notifyEmail: boolean;
  notifySms: boolean;
  createdAt: string;
};

const inputClass =
  "w-full cyber-chamfer-sm border border-outline bg-surface-container-lowest-container-low px-3 py-2.5 text-sm outline-none focus:border-primary-container disabled:cursor-not-allowed disabled:opacity-70";

export function SettingsForm({
  user,
  addresses,
  reviews,
}: {
  user: SettingsUser;
  addresses: Addr[];
  reviews: {
    id: string;
    rating: number;
    body: string;
    productTitle: string;
    productSlug: string;
    createdAt: string;
  }[];
}) {
  const router = useRouter();
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [passMsg, setPassMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [notifyMsg, setNotifyMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [addrMsg, setAddrMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [savingNotify, setSavingNotify] = useState(false);
  const [savingAddr, setSavingAddr] = useState(false);
  const [busyAddrId, setBusyAddrId] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editing, setEditing] = useState<Addr | null>(null);
  const [labelDraft, setLabelDraft] = useState("");
  const sortedAddresses = [...addresses].sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
  const LABEL_PRESETS = ["خانه", "محل کار", "انبار", "سایر"];

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
    setProfileMsg(
      res.ok
        ? { ok: true, text: "اطلاعات شخصی ذخیره شد." }
        : { ok: false, text: "ذخیره انجام نشد. دوباره تلاش کنید." },
    );
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
    setNotifyMsg(
      res.ok
        ? { ok: true, text: "ترجیحات اطلاع‌رسانی ذخیره شد." }
        : { ok: false, text: "ذخیره انجام نشد." },
    );
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

  function openAddressForm(addr?: Addr | null) {
    setEditing(addr ?? null);
    setLabelDraft(addr?.label ?? "");
    setShowAddressForm(true);
  }

  function closeAddressForm() {
    setShowAddressForm(false);
    setEditing(null);
    setLabelDraft("");
  }

  async function saveAddress(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSavingAddr(true);
    setAddrMsg(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      id: editing?.id,
      label: String(fd.get("label") ?? labelDraft).trim(),
      line: String(fd.get("line") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      isDefault: fd.get("isDefault") === "on",
    };
    const res = await fetch("/api/account/addresses", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSavingAddr(false);
    if (res.ok) {
      setAddrMsg({ ok: true, text: editing ? "آدرس به‌روز شد." : "آدرس اضافه شد." });
      closeAddressForm();
      router.refresh();
    } else {
      setAddrMsg({ ok: false, text: "خطا در ذخیره آدرس." });
    }
  }

  async function setDefaultAddress(addr: Addr) {
    if (addr.isDefault) return;
    setBusyAddrId(addr.id);
    setAddrMsg(null);
    const res = await fetch("/api/account/addresses", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: addr.id,
        label: addr.label,
        line: addr.line,
        phone: addr.phone,
        isDefault: true,
      }),
    });
    setBusyAddrId(null);
    setAddrMsg(
      res.ok
        ? { ok: true, text: `«${addr.label}» به‌عنوان پیش‌فرض تنظیم شد.` }
        : { ok: false, text: "تنظیم پیش‌فرض انجام نشد." },
    );
    if (res.ok) router.refresh();
  }

  async function copyAddress(addr: Addr) {
    const text = `${addr.label}\n${addr.line}\n${addr.phone}`;
    try {
      await navigator.clipboard.writeText(text);
      setAddrMsg({ ok: true, text: "آدرس کپی شد." });
    } catch {
      setAddrMsg({ ok: false, text: "کپی انجام نشد." });
    }
  }

  async function removeAddress(id: string) {
    if (!confirm("آدرس حذف شود؟")) return;
    setBusyAddrId(id);
    setAddrMsg(null);
    const res = await fetch("/api/account/addresses", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setBusyAddrId(null);
    setAddrMsg(res.ok ? { ok: true, text: "آدرس حذف شد." } : { ok: false, text: "خطا در حذف." });
    if (res.ok) {
      if (editing?.id === id) closeAddressForm();
      router.refresh();
    }
  }

  function Msg({ msg }: { msg: { ok: boolean; text: string } | null }) {
    if (!msg) return null;
    return (
      <p
        className={`mb-3 cyber-chamfer-sm px-3 py-2 text-sm font-semibold ${
          msg.ok ? "alert-ok" : "alert-danger"
        }`}
      >
        {msg.text}
      </p>
    );
  }

  return (
    <div className="mt-6 grid gap-5 lg:grid-cols-3">
      <div className="space-y-5 lg:col-span-2">
        <form id="profile" onSubmit={saveProfile} className="scroll-mt-4 cyber-chamfer border border-outline bg-surface-container-lowest p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-bold">اطلاعات شخصی</h2>
              <p className="mt-0.5 text-xs text-on-surface-variant">نام و شماره تماس روی فاکتور و پشتیبانی</p>
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

          <Msg msg={profileMsg} />

          <div className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-on-surface-variant">نام کامل</span>
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
            <p className="text-[11px] text-on-surface-variant">برای تغییر ایمیل با پشتیبانی تماس بگیرید.</p>
          </div>
        </form>

        <section id="addresses" className="scroll-mt-4 cyber-chamfer border border-outline bg-surface-container-lowest p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold">آدرس‌ها</h2>
              <p className="mt-0.5 text-xs text-on-surface-variant">
                آدرس‌های ارسال سفارش
                {addresses.length ? ` · ${addresses.length} مورد` : ""}
                {addresses.some((a) => a.isDefault) ? " · یک پیش‌فرض فعال" : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (showAddressForm && !editing) closeAddressForm();
                else openAddressForm(null);
              }}
              className="inline-flex items-center gap-1 cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-1.5 text-xs font-bold hover:border-primary-container"
            >
              <Icon name="add" className="h-3.5 w-3.5" />
              {showAddressForm && !editing ? "بستن" : "افزودن"}
            </button>
          </div>

          <Msg msg={addrMsg} />

          {showAddressForm && (
            <form
              key={editing?.id ?? "new"}
              onSubmit={saveAddress}
              className="mb-4 space-y-3 cyber-chamfer-sm border border-dashed border-primary-container/30 bg-primary-container/5 p-3.5"
            >
              <p className="text-sm font-bold">{editing ? "ویرایش آدرس" : "آدرس جدید"}</p>
              <div>
                <span className="mb-1.5 block text-xs font-semibold text-on-surface-variant">برچسب سریع</span>
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {LABEL_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setLabelDraft(preset)}
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                        labelDraft === preset
                          ? "border-primary-container bg-cta text-on-primary"
                          : "border-outline bg-surface-container-low text-on-surface-variant hover:border-primary-container"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-on-surface-variant">عنوان آدرس</span>
                  <input
                    name="label"
                    required
                    value={labelDraft}
                    onChange={(e) => setLabelDraft(e.target.value)}
                    placeholder="مثلاً خانه یا محل کار"
                    className={inputClass}
                  />
                </label>
              </div>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-on-surface-variant">آدرس کامل</span>
                <textarea
                  name="line"
                  required
                  rows={2}
                  defaultValue={editing?.line ?? ""}
                  placeholder="شهر، خیابان، کوچه، پلاک، واحد..."
                  className={`${inputClass} resize-none`}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-on-surface-variant">تلفن گیرنده</span>
                <input
                  name="phone"
                  required
                  dir="ltr"
                  defaultValue={editing?.phone ?? user.phone}
                  placeholder="09xxxxxxxxx"
                  className={`${inputClass} text-left`}
                />
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold">
                <input
                  name="isDefault"
                  type="checkbox"
                  defaultChecked={editing?.isDefault ?? addresses.length === 0}
                  className="accent-[var(--primary-container)]"
                />
                تنظیم به‌عنوان آدرس پیش‌فرض ارسال
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={savingAddr}
                  className="cyber-chamfer-sm bg-cta px-4 py-2 text-sm font-semibold text-on-primary disabled:opacity-60"
                >
                  {savingAddr ? "در حال ذخیره…" : editing ? "ذخیره تغییرات" : "افزودن آدرس"}
                </button>
                <button
                  type="button"
                  onClick={closeAddressForm}
                  className="cyber-chamfer-sm border border-outline bg-surface-container-low px-4 py-2 text-sm font-semibold hover:border-primary-container"
                >
                  انصراف
                </button>
              </div>
            </form>
          )}

          {!addresses.length && !showAddressForm ? (
            <div className="cyber-chamfer-sm border border-dashed border-outline px-4 py-8 text-center">
              <span className="mx-auto mb-3 flex h-10 w-10 items-center justify-center cyber-chamfer-sm bg-cta/10 text-primary-container">
                <Icon name="location_on" className="h-5 w-5" />
              </span>
              <p className="text-sm text-on-surface-variant">هنوز آدرسی ثبت نشده.</p>
              <button
                type="button"
                onClick={() => openAddressForm(null)}
                className="mt-3 inline-flex cyber-chamfer-sm bg-cta px-4 py-2 text-sm font-semibold text-on-primary"
              >
                افزودن اولین آدرس
              </button>
            </div>
          ) : null}

          <div className="space-y-2.5">
            {sortedAddresses.map((a) => {
              const busy = busyAddrId === a.id;
              return (
                <article
                  key={a.id}
                  className={`cyber-chamfer-sm border px-3.5 py-3.5 transition-colors ${
                    a.isDefault
                      ? "border-primary-container/40 bg-primary-container/5"
                      : "border-outline/80 bg-surface hover:border-primary-container/30"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        a.isDefault
                          ? "bg-cta text-on-primary"
                          : "bg-surface-container-low text-primary-container"
                      }`}
                    >
                      <Icon name="location_on" className="h-5 w-5" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-on-surface">{a.label}</h3>
                        {a.isDefault ? (
                          <span className="rounded-md bg-primary-container/15 px-1.5 py-0.5 text-[10px] font-bold text-primary-container">
                            پیش‌فرض ارسال
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void setDefaultAddress(a)}
                            className="rounded-md border border-outline px-1.5 py-0.5 text-[10px] font-bold text-on-surface-variant hover:border-primary-container hover:text-primary-container disabled:opacity-60"
                          >
                            {busy ? "…" : "انتخاب به‌عنوان پیش‌فرض"}
                          </button>
                        )}
                      </div>
                      <p className="mt-1.5 text-sm leading-7 text-on-surface">{a.line}</p>
                      <a
                        href={`tel:${a.phone}`}
                        className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold tabular-nums text-primary-container hover:underline"
                        dir="ltr"
                      >
                        <Icon name="call" className="h-3.5 w-3.5" />
                        {a.phone}
                      </a>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 border-t border-outline/60 pt-3">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => openAddressForm(a)}
                      className="inline-flex items-center gap-1.5 cyber-chamfer-sm border border-outline bg-surface-container-low px-2.5 py-1.5 text-xs font-semibold hover:border-primary-container disabled:opacity-60"
                    >
                      <Icon name="description" className="h-3.5 w-3.5" />
                      ویرایش
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void copyAddress(a)}
                      className="inline-flex items-center gap-1.5 cyber-chamfer-sm border border-outline bg-surface-container-low px-2.5 py-1.5 text-xs font-semibold hover:border-primary-container disabled:opacity-60"
                    >
                      <Icon name="share" className="h-3.5 w-3.5" />
                      کپی
                    </button>
                    {!a.isDefault ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void setDefaultAddress(a)}
                        className="inline-flex items-center gap-1.5 cyber-chamfer-sm border border-outline bg-surface-container-low px-2.5 py-1.5 text-xs font-semibold hover:border-primary-container disabled:opacity-60"
                      >
                        <Icon name="check_circle" className="h-3.5 w-3.5" />
                        پیش‌فرض
                      </button>
                    ) : null}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void removeAddress(a.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border alert-danger cyber-chamfer-sm px-2.5 py-1.5 text-xs font-semibold hover:opacity-90 disabled:opacity-60"
                    >
                      <Icon name="delete" className="h-3.5 w-3.5" />
                      حذف
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <form
          id="notifications"
          onSubmit={saveNotifications}
          className="scroll-mt-4 cyber-chamfer border border-outline bg-surface-container-lowest p-4 sm:p-5"
        >
          <div className="mb-4">
            <h2 className="text-base font-bold">اطلاع‌رسانی‌ها</h2>
            <p className="mt-0.5 text-xs text-on-surface-variant">خبرها، تخفیف‌ها و وضعیت سفارش</p>
          </div>
          <Msg msg={notifyMsg} />
          <label className="mb-3 flex cursor-pointer items-start justify-between gap-3 rounded-xl border border-outline/80 bg-surface-container-low/40 px-3.5 py-3">
            <span>
              <span className="flex items-center gap-2 text-sm font-semibold">
                <Icon name="mail" className="h-4 w-4 text-primary-container" />
                ایمیل‌های اطلاع‌رسانی
              </span>
              <span className="mt-1 block text-xs text-on-surface-variant">اخبار، پیشنهادها و تخفیف‌ها</span>
            </span>
            <input name="notifyEmail" type="checkbox" defaultChecked={user.notifyEmail} className="mt-1 accent-[var(--primary-container)]" />
          </label>
          <label className="mb-4 flex cursor-pointer items-start justify-between gap-3 rounded-xl border border-outline/80 bg-surface-container-low/40 px-3.5 py-3">
            <span>
              <span className="flex items-center gap-2 text-sm font-semibold">
                <Icon name="call" className="h-4 w-4 text-primary-container" />
                پیامک وضعیت سفارش
              </span>
              <span className="mt-1 block text-xs text-on-surface-variant">تغییر وضعیت پردازش و ارسال</span>
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
            <p className="mt-0.5 text-xs text-on-surface-variant">حداقل ۶ کاراکتر · پس از تغییر با رمز جدید وارد شوید</p>
          </div>
          <Msg msg={passMsg} />
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
          <h2 className="mb-3 text-base font-bold">میانبرهای حساب</h2>
          <ul className="space-y-2">
            {[
              { href: "/account/orders", label: "سفارش‌ها", icon: "shopping_cart" as const },
              { href: "/account/tickets", label: "پیام‌های پشتیبانی", icon: "mail" as const },
              { href: "/account/wishlist", label: "علاقه‌مندی‌ها", icon: "favorite" as const },
              { href: "/account/reviews", label: "نظرات من", icon: "star" as const },
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
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-base font-bold">آخرین نظرات</h2>
            <Link href="/account/reviews" className="text-xs font-semibold text-primary-container hover:underline">
              همه
            </Link>
          </div>
          {!reviews.length ? (
            <p className="text-sm text-on-surface-variant">نظری ثبت نشده.</p>
          ) : (
            <ul className="space-y-3">
              {reviews.map((r) => (
                <li key={r.id} className="border-b border-outline/70 pb-3 last:border-0 last:pb-0">
                  <Link href={`/product/${r.productSlug}`} className="text-sm font-semibold hover:text-primary-container">
                    {r.productTitle}
                  </Link>
                  <p className="mt-0.5 text-[11px] text-on-surface-variant">
                    {r.rating}/5 · {new Date(r.createdAt).toLocaleDateString("fa-IR")}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-on-surface-variant">{r.body}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="cyber-chamfer border border-outline bg-surface-container-lowest p-4 sm:p-5">
          <h2 className="mb-3 text-base font-bold">وضعیت حساب</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <dt className="text-on-surface-variant">نقش</dt>
              <dd className="font-semibold">{ROLE_FA[user.role] ?? user.role}</dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-on-surface-variant">تماس</dt>
              <dd className="font-semibold tabular-nums" dir="ltr">
                {user.phone || "—"}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-on-surface-variant">آدرس‌ها</dt>
              <dd className="font-semibold tabular-nums">{addresses.length}</dd>
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
            اگر ورود مشکوک دیدید، همین‌جا رمز را عوض کنید و تیکت‌های باز را در بخش پیام‌ها بررسی کنید.
          </p>
        </section>
      </aside>
    </div>
  );
}
