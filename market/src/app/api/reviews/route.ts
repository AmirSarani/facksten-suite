import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

const schema = z.object({
  productId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  body: z.string().min(3).max(1000),
});

export async function POST(req: Request) {
  const user = await requireUser(["CUSTOMER", "ADMIN"]);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const purchased = await prisma.orderItem.findFirst({
    where: {
      productId: parsed.data.productId,
      order: { userId: user.id, status: "COMPLETED" },
    },
  });
  if (!purchased) {
    return NextResponse.json({ error: "فقط پس از تکمیل سفارش می‌توانید نظر ثبت کنید" }, { status: 403 });
  }

  const review = await prisma.review.upsert({
    where: { userId_productId: { userId: user.id, productId: parsed.data.productId } },
    create: {
      userId: user.id,
      productId: parsed.data.productId,
      rating: parsed.data.rating,
      body: parsed.data.body,
    },
    update: {
      rating: parsed.data.rating,
      body: parsed.data.body,
    },
  });

  return NextResponse.json({ review });
}

export async function DELETE(req: Request) {
  const user = await requireUser(["CUSTOMER", "ADMIN"]);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = z
    .object({ id: z.string().min(1) })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const existing = await prisma.review.findUnique({ where: { id: parsed.data.id } });
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (user.role !== "ADMIN" && existing.userId !== user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  await prisma.review.delete({ where: { id: parsed.data.id } });
  return NextResponse.json({ ok: true });
}
