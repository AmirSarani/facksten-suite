import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

const schema = z.object({ productId: z.string() });

export async function POST(req: Request) {
  const user = await requireUser(["CUSTOMER", "ADMIN"]);
  if (!user) return NextResponse.json({ error: "login" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  await prisma.wishlistItem.upsert({
    where: { userId_productId: { userId: user.id, productId: parsed.data.productId } },
    create: { userId: user.id, productId: parsed.data.productId },
    update: {},
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const user = await requireUser(["CUSTOMER", "ADMIN"]);
  if (!user) return NextResponse.json({ error: "login" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  await prisma.wishlistItem.deleteMany({
    where: { userId: user.id, productId: parsed.data.productId },
  });
  return NextResponse.json({ ok: true });
}
