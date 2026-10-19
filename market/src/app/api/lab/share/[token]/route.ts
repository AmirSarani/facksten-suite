import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { storedProject } from "@/lib/lab-projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ token: string }> };
const READ_RULE = { limit: 120, windowMs: 60_000 };

/** Public, read-only: a shared circuit, handed out as a copy (no owner, no cloud id). */
export async function GET(req: Request, ctx: Ctx) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!rateLimit(`lab-share:${ip}`, READ_RULE).ok) return NextResponse.json({ error: "too many requests" }, { status: 429 });
  const { token } = await ctx.params;
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return NextResponse.json({ error: "لینک نامعتبر است" }, { status: 404 });
  const row = await prisma.labProject.findUnique({ where: { shareToken: token }, select: { id: true, data: true, name: true } });
  if (!row) return NextResponse.json({ error: "این لینک اشتراک دیگر فعال نیست" }, { status: 404 });
  return NextResponse.json({ project: storedProject(row, { asCopy: true }), name: row.name });
}
