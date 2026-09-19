"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ReviewDeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onDelete() {
    if (!confirm("این نظر حذف شود؟")) return;
    setLoading(true);
    await fetch("/api/admin/reviews", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setLoading(false);
    router.refresh();
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
