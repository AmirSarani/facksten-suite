"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ArticleDeleteButton({ articleId }: { articleId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onDelete() {
    if (!confirm("مقاله حذف شود؟")) return;
    setLoading(true);
    const res = await fetch("/api/admin/articles", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: articleId }),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/admin/articles");
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      disabled={loading}
      onClick={() => void onDelete()}
      className="rounded-xl border alert-danger cyber-chamfer-sm px-3 py-2 text-sm font-semibold hover:border-error disabled:opacity-60"
    >
      {loading ? "…" : "حذف مقاله"}
    </button>
  );
}
