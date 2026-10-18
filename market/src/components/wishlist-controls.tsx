"use client";

import { withBasePath } from "@/lab/base-path";
import { useRouter } from "next/navigation";

export function WishlistButton({ productId, active }: { productId: string; active?: boolean }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className="rounded-xl border px-3 py-2 text-sm font-semibold text-error"
      onClick={async () => {
        await fetch(withBasePath("/api/wishlist"), {
          method: active ? "DELETE" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });
        router.refresh();
      }}
    >
      {active ? "حذف" : "علاقه‌مندی"}
    </button>
  );
}
