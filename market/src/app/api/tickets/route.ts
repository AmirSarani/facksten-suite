import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

const schema = z.object({
  subject: z.string().min(3),
  body: z.string().min(3),
  orderId: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  const user = await requireUser(["CUSTOMER", "ADMIN"]);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  let orderId: string | null = parsed.data.orderId?.trim() || null;
  if (orderId) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, ...(user.role === "ADMIN" ? {} : { userId: user.id }) },
      select: { id: true },
    });
    if (!order) return NextResponse.json({ error: "سفارش معتبر نیست" }, { status: 400 });
    orderId = order.id;
  }

  const ticket = await prisma.ticket.create({
    data: {
      code: `TK-${Date.now().toString().slice(-6)}`,
      userId: user.id,
      subject: parsed.data.subject,
      orderId,
      messages: {
        create: {
          userId: user.id,
          body: parsed.data.body,
          isStaff: false,
        },
      },
    },
  });

  return NextResponse.json({ ticket });
}
