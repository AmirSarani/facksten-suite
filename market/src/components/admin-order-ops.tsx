"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ORDER_STATUS_FA } from "@/lib/panel";

const statuses = ["PENDING", "PAID", "PROCESSING", "SHIPPED", "COMPLETED", "CANCELLED"] as const;

export function AdminOrderOps({
  orderId,
  status,
  trackingCode,
  adminNote,
}: {
  orderId: string;
  status: string;
  trackingCode: string | null;
  adminNote: string | null;
}) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  async function save(body: Record<string, unknown>) {
    setSaving(true);
    setMsg("");
    const res = await fetch("/api/admin/orders/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, ...body }),
    });
    setSaving(false);
    setMsg(res.ok ? "ذخیره شد" : "خطا در ذخیره");
    router.refresh();
  }

  async function onMeta(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await save({
      trackingCode: String(fd.get("trackingCode") || "") || null,
      adminNote: String(fd.get("adminNote") || "") || null,
    });
  }

  return (
    <div className="mb-6 grid gap-4 cyber-chamfer border border-outline bg-surface-container-lowest p-4 sm:grid-cols-2">
      <div>
        <p className="mb-2 text-xs font-semibold text-on-surface-variant">وضعیت سفارش</p>
        <select
          defaultValue={status}
          disabled={saving}
          className="cyber-chamfer-sm w-full border border-outline bg-surface-container-lowest px-3 py-2 font-mono text-sm outline-none focus:border-primary-container focus:shadow-[var(--box-shadow-neon-sm)]"
          onChange={(e) => void save({ status: e.target.value })}
        >
          {statuses.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_FA[s] ?? s}
            </option>
          ))}
        </select>
      </div>
      <form onSubmit={onMeta} className="space-y-2 sm:col-span-2">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-on-surface-variant">کد رهگیری ارسال</span>
          <input
            name="trackingCode"
            defaultValue={trackingCode ?? ""}
            dir="ltr"
            className="cyber-chamfer-sm w-full border border-outline bg-surface-container-lowest px-3 py-2 font-mono text-sm outline-none focus:border-primary-container focus:shadow-[var(--box-shadow-neon-sm)] text-left"
            placeholder="مثلاً کد پست / تیپاکس"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-on-surface-variant">یادداشت داخلی ادمین</span>
          <textarea
            name="adminNote"
            defaultValue={adminNote ?? ""}
            rows={3}
            className="cyber-chamfer-sm w-full border border-outline bg-surface-container-lowest px-3 py-2 font-mono text-sm outline-none focus:border-primary-container focus:shadow-[var(--box-shadow-neon-sm)]"
            placeholder="فقط برای تیم عملیات — برای مشتری نمایش داده نمی‌شود"
          />
        </label>
        <button
          type="submit"
          disabled={saving}
          className="cyber-chamfer-sm bg-cta px-4 py-2 text-sm font-semibold text-on-primary disabled:opacity-60"
        >
          ذخیره پیگیری و یادداشت
        </button>
        {msg ? <p className="text-sm text-primary-container">{msg}</p> : null}
      </form>
    </div>
  );
}
