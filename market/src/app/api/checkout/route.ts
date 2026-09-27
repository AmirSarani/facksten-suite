import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateUniqueOrderCode } from "@/lib/order-code";
import { PAYMENT_METHOD_IDS } from "@/lib/payment-methods";

const schema = z.object({
  shippingName: z.string().min(2),
  shippingPhone: z.string().min(8),
  shippingAddr: z.string().min(5),
  paymentMethod: z.enum(PAYMENT_METHOD_IDS).default("zarinpal"),
});

const MAX_CODE_RETRIES = 5;

/** Raised inside the transaction to abort it with a specific, user-facing reason. */
class CheckoutError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

function isOrderCodeCollision(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === "P2002" &&
    Array.isArray(err.meta?.target) &&
    (err.meta.target as string[]).includes("code")
  );
}

export async function POST(req: Request) {
  const user = await requireUser(["CUSTOMER", "ADMIN"]);
  if (!user) return NextResponse.json({ error: "وارد شوید" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "آدرس نامعتبر است" }, { status: 400 });

  for (let attempt = 0; attempt < MAX_CODE_RETRIES; attempt++) {
    try {
      const order = await prisma.$transaction(async (tx) => {
        // Read the cart inside the transaction so the stock check below sees a consistent
        // snapshot; the per-line decrement is still the real atomicity guarantee.
        const cart = await tx.cartItem.findMany({
          where: { userId: user.id },
          include: { product: true },
        });
        if (cart.length === 0) throw new CheckoutError(400, "سبد خالی است");

        for (const line of cart) {
          if (!line.product.active) {
            throw new CheckoutError(400, `این محصول دیگر در دسترس نیست: ${line.product.title}`);
          }
          // Friendly early rejection; the atomic decrement below is the real race guard
          // for HARDWARE (inStock is otherwise just `stock > 0`, so this alone can't race).
          if (!line.product.inStock) {
            throw new CheckoutError(400, `موجودی کافی نیست: ${line.product.title}`);
          }
        }

        const total = cart.reduce((s, l) => s + l.product.price * l.qty, 0);
        const code = await generateUniqueOrderCode(async (candidate) => {
          const hit = await tx.order.findUnique({ where: { code: candidate }, select: { id: true } });
          return hit != null;
        });

        const created = await tx.order.create({
          data: {
            code,
            userId: user.id,
            status: "PENDING",
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

        // Atomic per-line decrement: only succeeds if `stock` is still >= qty *at commit
        // time*, so two concurrent checkouts for the last unit can't both succeed and
        // drive stock negative (the old code read stock once, outside any lock, and
        // computed the new value from that stale snapshot).
        for (const line of cart) {
          if (line.product.type !== "HARDWARE") continue;
          const res = await tx.product.updateMany({
            where: { id: line.productId, stock: { gte: line.qty } },
            data: { stock: { decrement: line.qty } },
          });
          if (res.count === 0) {
            throw new CheckoutError(409, `موجودی کافی نیست: ${line.product.title}`);
          }
          const updated = await tx.product.findUniqueOrThrow({ where: { id: line.productId } });
          if (updated.stock <= 0 && updated.inStock) {
            await tx.product.update({ where: { id: line.productId }, data: { inStock: false } });
          }
        }

        await tx.cartItem.deleteMany({ where: { userId: user.id } });
        return created;
      });

      return NextResponse.json({ order, redirect: `/checkout/success?code=${order.code}` });
    } catch (err) {
      if (isOrderCodeCollision(err)) continue; // extremely unlikely; try a fresh code
      if (err instanceof CheckoutError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      throw err;
    }
  }

  return NextResponse.json({ error: "امکان ثبت سفارش نبود، دوباره تلاش کنید" }, { status: 500 });
}
