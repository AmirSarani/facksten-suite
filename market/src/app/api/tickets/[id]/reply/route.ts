import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const user = await requireUser(["CUSTOMER", "ADMIN", "PARTNER"]);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const parsed = z.object({ body: z.string().min(1) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: { order: { include: { items: { select: { productId: true } } } } },
  });
  if (!ticket) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (ticket.status === "CLOSED") {
    return NextResponse.json({ error: "تیکت بسته است" }, { status: 400 });
  }
  if (user.role === "CUSTOMER" && ticket.userId !== user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (user.role === "PARTNER") {
    const products = await prisma.product.findMany({
      where: { sellerId: user.id },
      select: { id: true },
    });
    const ids = new Set(products.map((p) => p.id));
    const related = ticket.order?.items.some((i) => ids.has(i.productId));
    if (!related) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const isStaff = user.role === "ADMIN" || user.role === "PARTNER";
  await prisma.ticketMessage.create({
    data: {
      ticketId: id,
      userId: user.id,
      body: parsed.data.body,
      isStaff,
    },
  });
  await prisma.ticket.update({
    where: { id },
    data: { status: isStaff ? "ANSWERED" : "OPEN" },
  });

  return NextResponse.json({ ok: true });
}
