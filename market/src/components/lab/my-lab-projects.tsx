"use client";

import Link from "next/link";
import { useState } from "react";
import { withBasePath } from "@/lab/base-path";
import type { ProjectSummary } from "@/lib/lab-projects";

const btn =
  "cursor-pointer rounded border border-outline px-2.5 py-1 text-xs text-on-surface transition-colors hover:border-primary-container hover:text-primary-container disabled:opacity-40";

/** The account's saved circuits: open, share / unshare, delete. */
export function MyLabProjects({ initial }: { initial: ProjectSummary[] }) {
  const [projects, setProjects] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const call = async (id: string, url: string, method: string) => {
    setBusy(id);
    try {
      const res = await fetch(withBasePath(url), { method });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setNote(data.error ?? "انجام نشد");
      return res.ok ? data : null;
    } finally {
      setBusy(null);
    }
  };

  const share = async (p: ProjectSummary) => {
    const data = await call(p.id, `/api/lab/projects/${p.id}/share`, "POST");
    if (!data?.token) return;
    const url = `${window.location.origin}${withBasePath(`/lab/workspace?share=${data.token}`)}`;
    await navigator.clipboard?.writeText(url).catch(() => undefined);
    setProjects((list) => list.map((x) => (x.id === p.id ? { ...x, shared: true } : x)));
    setNote(`لینک اشتراک «${p.name}» کپی شد.`);
  };

  const unshare = async (p: ProjectSummary) => {
    if (!(await call(p.id, `/api/lab/projects/${p.id}/share`, "DELETE"))) return;
    setProjects((list) => list.map((x) => (x.id === p.id ? { ...x, shared: false } : x)));
    setNote(`لینک «${p.name}» لغو شد؛ لینک قبلی دیگر باز نمی‌شود.`);
  };

  const remove = async (p: ProjectSummary) => {
    if (!window.confirm(`«${p.name}» برای همیشه از حساب حذف شود؟`)) return;
    if (!(await call(p.id, `/api/lab/projects/${p.id}`, "DELETE"))) return;
    setProjects((list) => list.filter((x) => x.id !== p.id));
    setNote(`«${p.name}» حذف شد.`);
  };

  if (!projects.length) {
    return (
      <p className="text-sm leading-7 text-on-surface-variant">
        هنوز پروژه‌ای در حساب ذخیره نکرده‌اید. در میز کار دکمه‌ی «ذخیره در حساب» (یا <kbd className="font-mono">Ctrl+S</kbd>) را بزنید.
      </p>
    );
  }

  return (
    <div>
      {note && (
        <p role="status" className="mb-3 rounded border border-outline bg-surface-container-low px-3 py-2 text-xs">
          {note}
        </p>
      )}
      <ul className="space-y-3">
        {projects.map((p) => (
          <li key={p.id} className="rounded border border-outline bg-surface-container p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate font-semibold">{p.name}</h3>
                <p className="text-xs text-on-surface-variant">
                  {p.parts.toLocaleString("fa-IR")} قطعه · {new Date(p.updatedAt).toLocaleString("fa-IR", { dateStyle: "medium", timeStyle: "short" })}
                  {p.shared ? " · اشتراک‌گذاری‌شده" : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={`/lab/workspace?project=${p.id}`} className="rounded bg-primary-container px-3 py-1 text-xs font-bold text-on-primary">
                  باز کردن
                </Link>
                <button type="button" className={btn} disabled={busy === p.id} onClick={() => void share(p)}>
                  {p.shared ? "کپی لینک" : "اشتراک"}
                </button>
                {p.shared && (
                  <button type="button" className={btn} disabled={busy === p.id} onClick={() => void unshare(p)}>
                    لغو اشتراک
                  </button>
                )}
                <button type="button" className={`${btn} hover:!border-error hover:!text-error`} disabled={busy === p.id} onClick={() => void remove(p)}>
                  حذف
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
