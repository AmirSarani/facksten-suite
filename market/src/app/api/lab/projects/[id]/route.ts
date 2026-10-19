import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { parseIncomingProject, storedProject } from "@/lib/lab-projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };
const WRITE_RULE = { limit: 60, windowMs: 60_000 };

/** Only the owner sees, changes or deletes a project; anyone else gets a plain 404. */
async function owned(id: string, userId: string) {
  const row = await prisma.labProject.findUnique({ where: { id } });
  return row && row.userId === userId ? row : null;
}

export async function GET(_req: Request, ctx: Ctx) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "برای باز کردن پروژه وارد شوید" }, { status: 401 });
  const row = await owned((await ctx.params).id, user.id);
  if (!row) return NextResponse.json({ error: "پروژه پیدا نشد" }, { status: 404 });
  return NextResponse.json({ project: storedProject(row), shareToken: row.shareToken, updatedAt: row.updatedAt.toISOString() });
}

export async function PUT(req: Request, ctx: Ctx) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "برای ذخیره در حساب وارد شوید" }, { status: 401 });
  const limited = rateLimit(`lab-save:${user.id}`, WRITE_RULE);
  if (!limited.ok) return NextResponse.json({ error: "تعداد ذخیره‌ها زیاد است. کمی صبر کنید." }, { status: 429 });
  const row = await owned((await ctx.params).id, user.id);
  if (!row) return NextResponse.json({ error: "پروژه پیدا نشد" }, { status: 404 });

  const body = (await req.json().catch(() => null)) as { project?: unknown } | null;
  const parsed = parseIncomingProject(body?.project);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const updated = await prisma.labProject.update({
    where: { id: row.id },
    data: { name: parsed.project.name, data: parsed.json },
    select: { updatedAt: true },
  });
  return NextResponse.json({ id: row.id, updatedAt: updated.updatedAt.toISOString() });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "وارد شوید" }, { status: 401 });
  const row = await owned((await ctx.params).id, user.id);
  if (!row) return NextResponse.json({ error: "پروژه پیدا نشد" }, { status: 404 });
  await prisma.labProject.delete({ where: { id: row.id } });
  return NextResponse.json({ ok: true });
}
