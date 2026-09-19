"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icon";

export function AccountReviewCard({
  review,
}: {
  review: {
    id: string;
    rating: number;
    body: string;
    createdAt: string;
    product: {
      id: string;
      slug: string;
      title: string;
      image: string;
      brand?: string | null;
    };
  };
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function onDelete() {
    if (!confirm("این نظر حذف شود؟")) return;
    setLoading(true);
    await fetch("/api/reviews", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: review.id }),
    });
    setLoading(false);
    router.refresh();
  }

  async function onSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: review.product.id,
        rating: Number(fd.get("rating")),
        body: fd.get("body"),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setMsg(data.error ?? "خطا در ذخیره");
      return;
    }
    setEditing(false);
    setMsg("نظر به‌روز شد");
    router.refresh();
  }

  return (
    <article className="cyber-chamfer border border-outline bg-surface-container-lowest p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <Link
          href={`/product/${review.product.slug}`}
          className="flex h-24 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface-container-low sm:h-20 sm:w-20"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={review.product.image || "/placeholder.svg"}
            alt={review.product.title}
            className="max-h-full max-w-full object-contain p-2"
            loading="lazy"
          />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <Link href={`/product/${review.product.slug}`} className="font-bold hover:text-primary-container">
                {review.product.title}
              </Link>
              {review.product.brand ? (
                <p className="mt-0.5 text-xs text-on-surface-variant">{review.product.brand}</p>
              ) : null}
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-0.5" aria-label={`${review.rating} از ۵`}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <Icon
                      key={i}
                      name="star"
                      className={`h-3.5 w-3.5 ${i < review.rating ? "text-primary-container" : "text-surface-variant"}`}
                    />
                  ))}
                </span>
                <span className="text-xs font-bold tabular-nums text-on-surface-variant">{review.rating}/5</span>
                <span className="text-[11px] text-on-surface-variant">
                  {new Date(review.createdAt).toLocaleDateString("fa-IR")}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setEditing((v) => !v)}
                className="cyber-chamfer-sm border border-outline bg-surface-container-low px-2.5 py-1.5 text-xs font-semibold hover:border-primary-container"
              >
                {editing ? "انصراف" : "ویرایش"}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => void onDelete()}
                className="rounded-lg border alert-danger cyber-chamfer-sm px-2.5 py-1.5 text-xs font-semibold disabled:opacity-60"
              >
                حذف
              </button>
            </div>
          </div>

          {!editing ? (
            <p className="mt-3 text-sm leading-7 text-on-surface-variant">{review.body}</p>
          ) : (
            <form onSubmit={onSave} className="mt-3 space-y-3">
              <label className="block text-xs font-semibold text-on-surface-variant">
                امتیاز
                <select
                  name="rating"
                  defaultValue={review.rating}
                  className="mt-1 block w-full max-w-[140px] cyber-chamfer-sm border border-outline bg-surface-container-lowest-container-low px-3 py-2 text-sm"
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n} از ۵
                    </option>
                  ))}
                </select>
              </label>
              <textarea
                name="body"
                required
                minLength={3}
                rows={3}
                defaultValue={review.body}
                className="w-full cyber-chamfer-sm border border-outline bg-surface-container-lowest-container-low px-3 py-2 text-sm outline-none focus:border-primary-container"
              />
              <button
                type="submit"
                disabled={loading}
                className="cyber-chamfer-sm bg-cta px-4 py-2 text-sm font-semibold text-on-primary disabled:opacity-60"
              >
                {loading ? "در حال ذخیره…" : "ذخیره تغییرات"}
              </button>
            </form>
          )}
          {msg ? <p className="mt-2 text-sm font-semibold text-primary-container">{msg}</p> : null}
        </div>
      </div>
    </article>
  );
}
