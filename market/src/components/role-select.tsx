"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ROLE_FA } from "@/lib/panel";

const roleTone: Record<string, string> = {
  ADMIN: "alert-info border",
  PARTNER: "alert-warn border",
  CUSTOMER: "border-outline bg-surface-container-low text-on-surface",
};

export function RoleSelect({ userId, role }: { userId: string; role: string }) {
  const router = useRouter();
  const [value, setValue] = useState(role);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setValue(role);
  }, [role]);

  return (
    <select
      value={value}
      disabled={busy}
      aria-label="نقش کاربر"
      className={`max-w-[7.5rem] cyber-chamfer-sm border px-2.5 py-1.5 font-mono text-xs font-semibold outline-none focus:border-primary-container focus:shadow-[var(--box-shadow-neon-sm)] disabled:opacity-60 ${
        roleTone[value] ?? roleTone.CUSTOMER
      }`}
      onChange={async (e) => {
        const next = e.target.value;
        const prev = value;
        setValue(next);
        setBusy(true);
        const res = await fetch("/api/admin/users/role", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, role: next }),
        });
        setBusy(false);
        if (!res.ok) {
          setValue(prev);
          return;
        }
        router.refresh();
      }}
    >
      <option value="CUSTOMER">{ROLE_FA.CUSTOMER}</option>
      <option value="PARTNER">{ROLE_FA.PARTNER}</option>
      <option value="ADMIN">{ROLE_FA.ADMIN}</option>
    </select>
  );
}
