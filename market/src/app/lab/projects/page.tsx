import Link from "next/link";
import type { Metadata } from "next";
import { LAB_TEMPLATES } from "@/lab/templates";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { summarize } from "@/lib/lab-projects";
import { MyLabProjects } from "@/components/lab/my-lab-projects";

export const metadata: Metadata = {
  title: "پروژه‌ها و قالب‌های آزمایشگاه",
};
export const dynamic = "force-dynamic";

export default async function LabProjectsPage() {
  const user = await requireUser();
  const projects = user
    ? (
        await prisma.labProject.findMany({
          where: { userId: user.id },
          orderBy: { updatedAt: "desc" },
          select: { id: true, name: true, updatedAt: true, shareToken: true, data: true },
        })
      ).map(summarize)
    : null;

  return (
    <main className="mx-auto max-w-3xl px-page py-10">
      <h1 className="mb-2 text-2xl font-bold">پروژه‌ها و قالب‌ها</h1>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold">پروژه‌های من</h2>
        {projects ? (
          <MyLabProjects initial={projects} />
        ) : (
          <p className="text-sm leading-7 text-on-surface-variant">
            برای دیدن مدارهایی که در حساب ذخیره کرده‌اید{" "}
            <Link href="/login?next=%2Flab%2Fprojects" className="text-primary hover:underline">
              وارد شوید
            </Link>
            . بدون ورود هم پروژه‌ی در حال کار در همین مرورگر می‌ماند.
          </p>
        )}
      </section>

      <h2 className="mb-3 text-lg font-semibold">قالب‌های آماده</h2>
      <ul className="space-y-3">
        {LAB_TEMPLATES.map((t) => (
          <li key={t.id} className="rounded border border-outline bg-surface-container p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-semibold">{t.name}</h3>
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
