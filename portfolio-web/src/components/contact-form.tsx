"use client";

import { useState } from "react";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/locale";

export function ContactForm({ locale, className }: { locale: Locale; className?: string }) {
  const dict = t(locale);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/public/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(data.get("name") ?? ""),
          email: String(data.get("email") ?? ""),
          message: String(data.get("message") ?? ""),
          locale,
        }),
      });
      if (!res.ok) throw new Error("failed");
      form.reset();
      setStatus("sent");
    } catch {
      setStatus("error");
      setError(locale === "fa" ? "ارسال ناموفق بود. دوباره تلاش کنید." : "Send failed. Try again.");
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className={`ambient-card cyber-chamfer-sm grid w-full min-w-0 gap-4 p-4 sm:p-6 ${className ?? ""}`.trim()}
    >
      <label className="grid gap-2 text-sm">
        <span>{dict.form.name}</span>
        <input
          name="name"
          required
          className="focus-cta min-h-11 w-full border border-outline bg-surface px-3 py-2 text-base font-mono"
          dir={locale === "fa" ? "rtl" : "ltr"}
          autoComplete="name"
        />
      </label>
      <label className="grid gap-2 text-sm">
        <span>{dict.form.email}</span>
        <input
          name="email"
          type="email"
          required
          className="focus-cta min-h-11 w-full border border-outline bg-surface px-3 py-2 text-base font-mono"
          dir="ltr"
          autoComplete="email"
        />
      </label>
      <label className="grid gap-2 text-sm">
        <span>{dict.form.message}</span>
        <textarea
          name="message"
          required
          rows={5}
          className="focus-cta min-h-28 w-full border border-outline bg-surface px-3 py-2 text-base"
        />
      </label>
      <button
        type="submit"
        disabled={status === "sending"}
        className="focus-cta bg-cta cyber-chamfer-sm min-h-11 w-full cursor-pointer px-5 py-3 font-semibold disabled:opacity-60 sm:w-auto"
      >
        {status === "sending" ? dict.actions.sending : dict.actions.send}
      </button>
      {status === "sent" ? <p className="alert-ok px-3 py-2 text-sm">{dict.actions.sent}</p> : null}
      {status === "error" ? <p className="alert-danger px-3 py-2 text-sm">{error}</p> : null}
    </form>
  );
}
