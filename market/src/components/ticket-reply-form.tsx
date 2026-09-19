"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Icon } from "@/components/icon";

export function TicketReplyForm({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch(`/api/tickets/${ticketId}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: fd.get("body") }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "خطا");
      return;
    }
    (e.target as HTMLFormElement).reset();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex items-end gap-2">
      <button
        type="button"
        aria-label="پیوست"
        className="flex h-11 w-11 shrink-0 items-center justify-center cyber-chamfer-sm border border-outline bg-surface-container-low text-on-surface-variant hover:border-primary-container hover:text-primary-container"
      >
        <Icon name="description" className="h-5 w-5" />
      </button>
      <textarea
        name="body"
        required
        rows={1}
        placeholder="پاسخ خود را بنویسید..."
        className="max-h-[120px] min-h-[48px] flex-1 resize-none cyber-chamfer-sm border border-outline bg-surface-container-lowest-container-lowest px-3 py-3 text-sm focus:border-primary-container focus:outline-none"
      />
      <button
        type="submit"
        className="flex h-11 shrink-0 items-center gap-1 cyber-chamfer-sm bg-cta px-4 text-sm font-semibold text-on-primary"
      >
        ارسال
        <Icon name="send" className="h-4 w-4" />
      </button>
      {error && <p className="basis-full text-sm text-error">{error}</p>}
    </form>
  );
}
