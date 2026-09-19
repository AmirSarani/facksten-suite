import { NextResponse } from "next/server";
import { compare, hash } from "bcryptjs";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const sessionUser = await requireUser();
  if (!sessionUser) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = z
    .object({ current: z.string().min(6), next: z.string().min(6) })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: sessionUser.id } });
  if (!user || !(await compare(parsed.data.current, user.passwordHash))) {
    return NextResponse.json({ error: "رمز فعلی اشتباه است" }, { status: 400 });
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hash(parsed.data.next, 10) },
  });
  return NextResponse.json({ ok: true });
}
