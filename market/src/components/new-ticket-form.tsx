"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type OrderOpt = { id: string; code: string };

type Props = {
  /** Compact always-open form for sidebars (e.g. contact page). */
  compact?: boolean;
  orders?: OrderOpt[];
  defaultOpen?: boolean;
};

export function NewTicketForm({ compact = false, orders = [], defaultOpen = false }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(compact || defaultOpen);
  const [error, setError] = useState("");
  const [successId, setSuccessId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccessId(null);
    setSubmitting(true);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const orderId = String(fd.get("orderId") || "").trim() || null;
    const res = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: fd.get("subject"),
        body: fd.get("body"),
        orderId,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error ?? "خطا");
      return;
    }
    form.reset();
    if (compact) {
      setSuccessId(data.ticket?.id ?? null);
      router.refresh();
      return;
    }
    setOpen(false);
    router.push(`/account/tickets/${data.ticket.id}`);
    router.refresh();
  }

  const fieldClass = compact
    ? "w-full rounded-lg border border-outline bg-surface px-3 py-2 text-sm text-on-surface outline-none transition-colors focus:border-primary-container focus:shadow-[0_0_0_3px_rgba(255,122,0,0.1)]"
    : "w-full cyber-chamfer-sm border border-outline bg-surface-container-lowest px-3 py-2.5 font-mono text-sm outline-none focus:border-primary-container focus:shadow-[var(--box-shadow-neon-sm)]";

  const formBlock = open ? (
    <form
      onSubmit={onSubmit}
      className={
        compact
          ? "space-y-3"
          : "mt-4 space-y-3 cyber-chamfer border border-outline bg-surface-container-lowest p-4 sm:p-5"
      }
    >
      {!compact ? (
        <div>
          <h3 className="text-base font-bold">تیکت جدید</h3>
          <p className="mt-0.5 text-xs text-on-surface-variant">موضوع و شرح را بنویسید؛ در صورت نیاز سفارش مرتبط را انتخاب کنید.</p>
        </div>
      ) : null}
      <label className="block">
        {!compact ? <span className="mb-1 block text-xs font-semibold text-on-surface-variant">موضوع</span> : null}
        <input name="subject" required minLength={3} placeholder="موضوع" className={fieldClass} />
      </label>
      {!compact && orders.length > 0 ? (
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-on-surface-variant">سفارش مرتبط (اختیاری)</span>
          <select name="orderId" defaultValue="" className={fieldClass}>
            <option value="">بدون سفارش</option>
            {orders.map((o) => (
              <option key={o.id} value={o.id}>
                {o.code}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <label className="block">
        {!compact ? <span className="mb-1 block text-xs font-semibold text-on-surface-variant">شرح درخواست</span> : null}
        <textarea
          name="body"
          required
          minLength={3}
          rows={compact ? 3 : 4}
          placeholder="شرح مشکل"
          className={`${fieldClass} resize-none`}
        />
      </label>
      {error ? <p className="text-sm text-error">{error}</p> : null}
      {compact && successId ? (
        <p className="rounded-lg border border-primary-container/30 bg-primary-container/10 px-3 py-2 text-sm text-on-surface">
          تیکت ثبت شد.{" "}
          <Link href={`/account/tickets/${successId}`} className="font-semibold text-primary-container underline-offset-2 hover:underline">
            مشاهده تیکت
          </Link>
          {" · "}
          <Link href="/account/tickets" className="font-semibold text-primary-container underline-offset-2 hover:underline">
            تیکت‌های من
          </Link>
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={submitting}
          className={
            compact
              ? "flex w-full items-center justify-center cyber-chamfer-sm bg-cta px-4 py-2.5 text-sm font-semibold text-on-primary transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
              : "cyber-chamfer-sm bg-cta px-4 py-2.5 text-sm font-semibold text-on-primary disabled:opacity-60"
          }
        >
          {submitting ? "در حال ارسال…" : compact ? "ثبت تیکت" : "ارسال تیکت"}
        </button>
        {!compact ? (
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="cyber-chamfer-sm border border-outline bg-surface-container-low px-4 py-2.5 text-sm font-semibold hover:border-primary-container hover:border-primary"
          >
            انصراف
          </button>
        ) : null}
      </div>
    </form>
  ) : null;

  if (compact) {
    return formBlock;
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="cyber-chamfer-sm bg-cta px-4 py-2.5 text-sm font-semibold text-on-primary"
      >
        {open ? "بستن فرم" : "تیکت جدید"}
      </button>
      {formBlock}
    </div>
  );
}
