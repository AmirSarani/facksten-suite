"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { TICKET_STATUS_FA } from "@/lib/panel";

const statuses = ["OPEN", "ANSWERED", "CLOSED"] as const;

export function TicketStatusButton({ ticketId, status }: { ticketId: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function setStatus(next: string) {
    setLoading(true);
    await fetch(`/api/tickets/${ticketId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={status}
        disabled={loading}
        onChange={(e) => void setStatus(e.target.value)}
        className="cyber-chamfer-sm border border-outline bg-surface-container-lowest px-3 py-1.5 font-mono text-xs font-semibold disabled:opacity-60"
      >
        {statuses.map((s) => (
          <option key={s} value={s}>
            {TICKET_STATUS_FA[s] ?? s}
          </option>
        ))}
      </select>
      {status !== "CLOSED" ? (
        <button
          type="button"
          disabled={loading}
          onClick={() => void setStatus("CLOSED")}
          className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-1.5 text-xs font-semibold hover:border-primary-container disabled:opacity-60"
        >
          بستن
        </button>
      ) : (
        <button
          type="button"
          disabled={loading}
          onClick={() => void setStatus("OPEN")}
          className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-1.5 text-xs font-semibold hover:border-primary-container disabled:opacity-60"
        >
          بازگشایی
        </button>
      )}
    </div>
  );
}
