import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

const schema = z.object({
  shippingName: z.string().min(2),
  shippingPhone: z.string().min(8),
  shippingAddr: z.string().min(5),
  paymentMethod: z.string().default("mock"),
});

function orderCode() {
  return `FS-${Date.now().toString().slice(-8)}`;
}

export async function POST(req: Request) {
  const user = await requireUser(["CUSTOMER", "ADMIN"]);
  if (!user) return NextResponse.json({ error: "وارد شوید" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "آدرس نامعتبر است" }, { status: 400 });

  const cart = await prisma.cartItem.findMany({
    where: { userId: user.id },
    include: { product: true },
  });
  if (cart.length === 0) return NextResponse.json({ error: "سبد خالی است" }, { status: 400 });

  for (const line of cart) {
    if (!line.product.inStock || (line.product.type === "HARDWARE" && line.product.stock < line.qty)) {
      return NextResponse.json(
        { error: `موجودی کافی نیست: ${line.product.title}` },
        { status: 400 },
      );
    }
  }

  const total = cart.reduce((s, l) => s + l.product.price * l.qty, 0);

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        code: orderCode(),
        userId: user.id,
        status: "PAID",
        total,
        shippingName: parsed.data.shippingName,
        shippingPhone: parsed.data.shippingPhone,
        shippingAddr: parsed.data.shippingAddr,
        paymentMethod: parsed.data.paymentMethod,
        items: {
          create: cart.map((l) => ({
            productId: l.productId,
            title: l.product.title,
            price: l.product.price,
            qty: l.qty,
            type: l.product.type,
          })),
        },
      },
      include: { items: true },
    });

    for (const line of cart) {
      if (line.product.type === "HARDWARE") {
        const stock = Math.max(0, line.product.stock - line.qty);
        await tx.product.update({
          where: { id: line.productId },
          data: { stock, inStock: stock > 0 },
        });
      }
    }

    await tx.cartItem.deleteMany({ where: { userId: user.id } });
    return created;
  });

  return NextResponse.json({ order, redirect: `/checkout/success?code=${order.code}` });
}
