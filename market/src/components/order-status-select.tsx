"use client";

import { useRouter } from "next/navigation";
import { ORDER_STATUS_FA } from "@/lib/panel";

const statuses = ["PENDING", "PAID", "PROCESSING", "SHIPPED", "COMPLETED", "CANCELLED"] as const;

export function OrderStatusSelect({ orderId, status }: { orderId: string; status: string }) {
  const router = useRouter();
  return (
    <select
      defaultValue={status}
      className="cyber-chamfer-sm border border-outline bg-surface-container-lowest px-2 py-1.5 font-mono text-sm"
      onChange={async (e) => {
        await fetch("/api/admin/orders/status", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, status: e.target.value }),
        });
        router.refresh();
      }}
    >
      {statuses.map((s) => (
        <option key={s} value={s}>
          {ORDER_STATUS_FA[s] ?? s}
        </option>
      ))}
    </select>
  );
}
