"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function PartnerInventoryForm() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/partner/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: fd.get("title"),
        price: Number(fd.get("price")),
        stock: Number(fd.get("stock")),
        type: fd.get("type"),
        brand: fd.get("brand"),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "خطا");
      return;
    }
    (e.target as HTMLFormElement).reset();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 cyber-chamfer border border-outline bg-surface-container-lowest p-4 md:grid-cols-5">
      <input name="title" required placeholder="عنوان" className="cyber-chamfer-sm w-full border border-outline bg-surface-container-lowest px-3 py-2 font-mono text-sm outline-none focus:border-primary-container focus:shadow-[var(--box-shadow-neon-sm)] md:col-span-2" />
      <input name="price" required type="number" placeholder="قیمت" className="cyber-chamfer-sm w-full border border-outline bg-surface-container-lowest px-3 py-2 font-mono text-sm outline-none focus:border-primary-container focus:shadow-[var(--box-shadow-neon-sm)]" />
      <input name="stock" required type="number" placeholder="موجودی" className="cyber-chamfer-sm w-full border border-outline bg-surface-container-lowest px-3 py-2 font-mono text-sm outline-none focus:border-primary-container focus:shadow-[var(--box-shadow-neon-sm)]" />
      <select name="type" className="cyber-chamfer-sm w-full border border-outline bg-surface-container-lowest px-3 py-2 font-mono text-sm outline-none focus:border-primary-container focus:shadow-[var(--box-shadow-neon-sm)]">
        <option value="HARDWARE">سخت‌افزار</option>
        <option value="DIGITAL">دیجیتال</option>
      </select>
      <input name="brand" placeholder="برند" className="cyber-chamfer-sm w-full border border-outline bg-surface-container-lowest px-3 py-2 font-mono text-sm outline-none focus:border-primary-container focus:shadow-[var(--box-shadow-neon-sm)] md:col-span-2" />
      <button type="submit" className="cyber-chamfer-sm bg-cta px-4 py-2 text-sm font-semibold text-on-primary md:col-span-3">
        ثبت محصول
      </button>
      {error && <p className="text-sm text-error md:col-span-5">{error}</p>}
    </form>
  );
}
