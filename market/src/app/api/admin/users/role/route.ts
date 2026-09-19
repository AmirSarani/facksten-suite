import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(req: Request) {
  const admin = await requireUser(["ADMIN"]);
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = z
    .object({ userId: z.string(), role: z.enum(["ADMIN", "PARTNER", "CUSTOMER"]) })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  await prisma.user.update({ where: { id: parsed.data.userId }, data: { role: parsed.data.role } });
  return NextResponse.json({ ok: true });
}
