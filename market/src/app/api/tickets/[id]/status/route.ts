import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

async function canAccessTicket(userId: string, role: string, ticketId: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: { order: { include: { items: { select: { productId: true } } } } },
  });
  if (!ticket) return null;

  if (role === "ADMIN") return ticket;
  if (role === "CUSTOMER") return ticket.userId === userId ? ticket : null;

  if (role === "PARTNER") {
    const products = await prisma.product.findMany({
      where: { sellerId: userId },
      select: { id: true },
    });
    const ids = new Set(products.map((p) => p.id));
    const related = ticket.order?.items.some((i) => ids.has(i.productId));
    return related ? ticket : null;
  }

  return null;
}

export async function PATCH(req: Request, ctx: Ctx) {
  const user = await requireUser(["CUSTOMER", "ADMIN", "PARTNER"]);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const parsed = z.object({ status: z.enum(["OPEN", "ANSWERED", "CLOSED"]) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const exists = await prisma.ticket.findUnique({ where: { id }, select: { id: true } });
  if (!exists) return NextResponse.json({ error: "not found" }, { status: 404 });

  const ticket = await canAccessTicket(user.id, user.role, id);
  if (!ticket) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const updated = await prisma.ticket.update({
    where: { id },
    data: { status: parsed.data.status },
  });

  return NextResponse.json({ ticket: updated });
}
