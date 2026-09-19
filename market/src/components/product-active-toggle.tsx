"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ProductActiveToggle({ productId, active }: { productId: string; active: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    await fetch("/api/admin/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: productId, active: !active }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      type="button"
      disabled={loading}
      onClick={() => void toggle()}
      className={`rounded-lg px-2.5 py-1.5 text-xs font-bold disabled:opacity-60 ${
        active
          ? "alert-ok hover:opacity-90"
          : "alert-danger hover:opacity-90"
      }`}
    >
      {loading ? "…" : active ? "فعال" : "غیرفعال"}
    </button>
  );
}
