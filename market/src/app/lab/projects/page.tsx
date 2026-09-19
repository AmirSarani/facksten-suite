import Link from "next/link";
import type { Metadata } from "next";
import { LAB_TEMPLATES } from "@/lab/templates";

export const metadata: Metadata = {
  title: "پروژه‌ها و قالب‌های آزمایشگاه",
};

export default function LabProjectsPage() {
  return (
    <main className="mx-auto max-w-3xl px-page py-10">
      <h1 className="mb-2 text-2xl font-bold">پروژه‌ها و قالب‌ها</h1>
      <p className="mb-6 text-sm text-on-surface-variant">
        پروژه‌های شخصی در مرورگر شما (localStorage) ذخیره می‌شوند. قالب‌های زیر از پیش آماده و قابل
        اجرا هستند.
      </p>
      <ul className="space-y-3">
        {LAB_TEMPLATES.map((t) => (
          <li key={t.id} className="rounded border border-outline bg-surface-container p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-semibold">{t.name}</h2>
                <p className="text-xs text-on-surface-variant">{t.description}</p>
              </div>
              <Link
                href={`/lab/workspace?template=${t.id}`}
                className="rounded bg-primary-container px-3 py-1.5 text-xs font-bold text-on-primary"
              >
                باز کردن
              </Link>
            </div>
          </li>
        ))}
      </ul>
      <Link href="/lab/workspace" className="mt-8 inline-block text-primary hover:underline">
        میز کار خالی →
      </Link>
    </main>
  );
}
