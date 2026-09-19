"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function ProductQuickStock({
  productId,
  stock,
  price,
  active,
  apiBase,
}: {
  productId: string;
  stock: number;
  price: number;
  active: boolean;
  apiBase: "/api/admin/products" | "/api/partner/products";
}) {
  const router = useRouter();
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch(apiBase, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: productId,
        stock: Number(fd.get("stock")),
        price: Number(fd.get("price")),
        active: fd.get("active") === "on",
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "خطا");
      return;
    }
    setError("");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-2">
      <label className="text-xs text-on-surface-variant">
        موجودی
        <input name="stock" type="number" min={0} defaultValue={stock} className="mt-1 block w-24 cyber-chamfer-sm border border-outline bg-surface-container-lowest px-2 py-1.5 font-mono text-sm" />
      </label>
      <label className="text-xs text-on-surface-variant">
        قیمت
        <input name="price" type="number" min={1} defaultValue={price} className="mt-1 block w-28 cyber-chamfer-sm border border-outline bg-surface-container-lowest px-2 py-1.5 font-mono text-sm" />
      </label>
      <label className="flex items-center gap-1.5 pb-2 text-xs font-semibold">
        <input name="active" type="checkbox" defaultChecked={active} />
        فعال
      </label>
      <button type="submit" className="cyber-chamfer-sm bg-cta px-3 py-1.5 text-xs font-semibold text-on-primary">
        به‌روزرسانی
      </button>
      {error && <span className="text-xs text-error">{error}</span>}
    </form>
  );
}
