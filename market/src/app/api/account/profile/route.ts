import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = z
    .object({
      name: z.string().min(2),
      phone: z.string().optional(),
      notifyEmail: z.boolean().optional(),
      notifySms: z.boolean().optional(),
    })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  await prisma.user.update({
    where: { id: user.id },
    data: parsed.data,
  });
  return NextResponse.json({ ok: true });
}
