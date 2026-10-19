import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { LAB_PROJECT_LIMITS, parseIncomingProject, summarize } from "@/lib/lab-projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WRITE_RULE = { limit: 30, windowMs: 60_000 };

/** The signed-in user's saved circuits, newest first. */
export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "برای دیدن پروژه‌ها وارد شوید" }, { status: 401 });
  const rows = await prisma.labProject.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, updatedAt: true, shareToken: true, data: true },
  });
  return NextResponse.json({ projects: rows.map(summarize) });
}

/** Save a new circuit to the account. */
export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "برای ذخیره در حساب وارد شوید" }, { status: 401 });
  const limited = rateLimit(`lab-save:${user.id}`, WRITE_RULE);
  if (!limited.ok) return NextResponse.json({ error: "تعداد ذخیره‌ها زیاد است. کمی صبر کنید." }, { status: 429 });

  const body = (await req.json().catch(() => null)) as { project?: unknown } | null;
  const parsed = parseIncomingProject(body?.project);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const count = await prisma.labProject.count({ where: { userId: user.id } });
  if (count >= LAB_PROJECT_LIMITS.perUser) {
    return NextResponse.json({ error: `حداکثر ${LAB_PROJECT_LIMITS.perUser} پروژه. چندتا را حذف کنید.` }, { status: 409 });
  }
  const row = await prisma.labProject.create({
    data: { userId: user.id, name: parsed.project.name, data: parsed.json },
    select: { id: true, updatedAt: true },
  });
  return NextResponse.json({ id: row.id, updatedAt: row.updatedAt.toISOString() }, { status: 201 });
}
