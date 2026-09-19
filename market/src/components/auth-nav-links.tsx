"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icon";

type Me = { id: string; name: string; role: "ADMIN" | "PARTNER" | "CUSTOMER" } | null;

export function AuthNavLinks() {
  const [user, setUser] = useState<Me>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user ?? null))
      .catch(() => setUser(null));
  }, []);

  const href = !user
    ? "/login"
    : user.role === "ADMIN"
      ? "/admin"
      : user.role === "PARTNER"
        ? "/partner"
        : "/account";

  if (!user) {
    return (
      <Link
        href="/login"
        prefetch
        className="inline-flex h-9 min-w-9 items-center justify-center gap-1.5 cyber-chamfer-sm border border-outline bg-surface-container-lowest px-2.5 text-sm font-semibold text-on-surface transition-colors hover:border-primary-container/40 hover:bg-primary-container/5"
        aria-label="ورود"
      >
        <Icon name="person" className="h-4 w-4 text-primary-container" />
        <span className="hidden md:inline">ورود</span>
      </Link>
    );
  }

  const label = user.role === "ADMIN" ? "ادمین" : user.role === "PARTNER" ? "پنل" : "حساب من";

  return (
    <Link
      href={href}
      prefetch
      className="inline-flex h-9 min-w-9 items-center justify-center gap-1.5 cyber-chamfer-sm px-2 text-sm font-semibold text-primary-container transition-colors hover:bg-primary-container/10 md:px-2.5"
      aria-label={label}
    >
      <Icon name="person" className="h-5 w-5 text-primary-container" />
      <span className="hidden md:inline">{label}</span>
    </Link>
  );
}
