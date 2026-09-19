"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ProductDeleteButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onDelete() {
    if (!confirm("محصول حذف شود؟ در صورت داشتن سفارش، فقط غیرفعال می‌شود.")) return;
    setLoading(true);
    const res = await fetch("/api/admin/products", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: productId }),
    });
    setLoading(false);
    if (res.ok) router.refresh();
  }

  return (
    <button
      type="button"
      disabled={loading}
      onClick={() => void onDelete()}
      className="rounded-lg border alert-danger cyber-chamfer-sm px-2.5 py-1.5 text-xs font-semibold transition-colors hover:border-error hover:opacity-90 disabled:opacity-60"
    >
      {loading ? "…" : "حذف"}
    </button>
  );
}
