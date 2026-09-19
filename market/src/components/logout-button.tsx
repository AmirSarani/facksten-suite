"use client";

import { useRouter } from "next/navigation";

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className={
        className ??
        "w-full cyber-chamfer-sm alert-danger px-3 py-2 text-sm font-semibold hover:opacity-90"
      }
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
        router.refresh();
      }}
    >
      خروج از حساب
    </button>
  );
}
