import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { newShareToken } from "@/lib/lab-projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

async function owned(id: string, userId: string) {
  const row = await prisma.labProject.findUnique({ where: { id }, select: { id: true, userId: true, shareToken: true } });
  return row && row.userId === userId ? row : null;
}

/** Turn on the public read-only link (idempotent: the same token until revoked). */
export async function POST(_req: Request, ctx: Ctx) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "وارد شوید" }, { status: 401 });
  const row = await owned((await ctx.params).id, user.id);
  if (!row) return NextResponse.json({ error: "پروژه پیدا نشد" }, { status: 404 });
  if (row.shareToken) return NextResponse.json({ token: row.shareToken });
  const updated = await prisma.labProject.update({ where: { id: row.id }, data: { shareToken: newShareToken() }, select: { shareToken: true } });
  return NextResponse.json({ token: updated.shareToken });
}

/** Revoke the link: the old URL stops working at once. */
export async function DELETE(_req: Request, ctx: Ctx) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "وارد شوید" }, { status: 401 });
  const row = await owned((await ctx.params).id, user.id);
  if (!row) return NextResponse.json({ error: "پروژه پیدا نشد" }, { status: 404 });
  await prisma.labProject.update({ where: { id: row.id }, data: { shareToken: null } });
  return NextResponse.json({ ok: true });
}
