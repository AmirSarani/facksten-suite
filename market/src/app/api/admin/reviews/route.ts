import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE(req: Request) {
  const admin = await requireUser(["ADMIN"]);
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = z.object({ id: z.string().min(1) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  await prisma.review.delete({ where: { id: parsed.data.id } });
  return NextResponse.json({ ok: true });
}
