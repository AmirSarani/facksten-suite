"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function OrderReviewForm({ productId, productTitle }: { productId: string; productTitle: string }) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        rating: Number(fd.get("rating")),
        body: fd.get("body"),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setMsg(data.error ?? "خطا در ثبت نظر");
      return;
    }
    setMsg("نظر ثبت شد");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="cyber-chamfer border border-outline bg-surface-container-lowest p-4">
      <p className="mb-3 text-sm font-semibold">{productTitle}</p>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <label className="text-xs text-on-surface-variant">
          امتیاز
          <select name="rating" defaultValue="5" className="mr-2 rounded-lg border px-2 py-1.5 text-sm">
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>
      <textarea
        name="body"
        required
        rows={3}
        placeholder="نظر خود را بنویسید..."
        className="mb-3 w-full cyber-chamfer-sm border border-outline bg-surface-container-lowest px-3 py-2 font-mono text-sm outline-none focus:border-primary-container focus:shadow-[var(--box-shadow-neon-sm)]"
      />
      <button
        type="submit"
        disabled={loading}
        className="cyber-chamfer-sm bg-cta px-4 py-2 text-sm font-semibold text-on-primary disabled:opacity-60"
      >
        ثبت نظر
      </button>
      {msg && <p className="mt-2 text-sm text-primary-container">{msg}</p>}
    </form>
  );
}
