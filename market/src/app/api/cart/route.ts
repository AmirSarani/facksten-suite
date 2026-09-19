import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function mergeGuestIntoUser(userId: string, guestCart: { productId: string; qty: number }[] | undefined) {
  if (!guestCart?.length) return;
  for (const line of guestCart) {
    await prisma.cartItem.upsert({
      where: { userId_productId: { userId, productId: line.productId } },
      create: { userId, productId: line.productId, qty: line.qty },
      update: { qty: { increment: line.qty } },
    });
  }
}

export async function GET() {
  const session = await getSession();
  const user = session.user;

  if (user && (user.role === "CUSTOMER" || user.role === "ADMIN")) {
    if (session.guestCart?.length) {
      await mergeGuestIntoUser(user.id, session.guestCart);
      session.guestCart = [];
      await session.save();
    }
    const items = await prisma.cartItem.findMany({
      where: { userId: user.id },
      include: { product: true },
      orderBy: { id: "asc" },
    });
    return NextResponse.json({ items });
  }

  const guest = session.guestCart ?? [];
  if (!guest.length) return NextResponse.json({ items: [] });

  const products = await prisma.product.findMany({
    where: { id: { in: guest.map((g) => g.productId) }, active: true },
  });
  const byId = Object.fromEntries(products.map((p) => [p.id, p]));
  const items = guest
    .filter((g) => byId[g.productId])
    .map((g) => ({ qty: g.qty, product: byId[g.productId] }));
  return NextResponse.json({ items });
}

const addSchema = z.object({
  productId: z.string(),
  qty: z.number().int().min(1).default(1),
});

export async function POST(req: Request) {
  const parsed = addSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const product = await prisma.product.findUnique({ where: { id: parsed.data.productId } });
  if (!product || !product.active || !product.inStock) {
    return NextResponse.json({ error: "محصول موجود نیست" }, { status: 400 });
  }

  const session = await getSession();
  const user = session.user;

  if (user && (user.role === "CUSTOMER" || user.role === "ADMIN")) {
    const item = await prisma.cartItem.upsert({
      where: { userId_productId: { userId: user.id, productId: product.id } },
      create: { userId: user.id, productId: product.id, qty: parsed.data.qty },
      update: { qty: { increment: parsed.data.qty } },
      include: { product: true },
    });
    return NextResponse.json({ item });
  }

  const cart = [...(session.guestCart ?? [])];
  const idx = cart.findIndex((l) => l.productId === product.id);
  if (idx >= 0) cart[idx] = { ...cart[idx], qty: cart[idx].qty + parsed.data.qty };
  else cart.push({ productId: product.id, qty: parsed.data.qty });
  session.guestCart = cart;
  await session.save();
  return NextResponse.json({ item: { qty: cart.find((l) => l.productId === product.id)!.qty, product } });
}

const patchSchema = z.object({
  productId: z.string(),
  qty: z.number().int().min(0),
});

export async function PATCH(req: Request) {
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const session = await getSession();
  const user = await requireUser(["CUSTOMER", "ADMIN"]);

  if (user) {
    if (parsed.data.qty === 0) {
      await prisma.cartItem.deleteMany({
        where: { userId: user.id, productId: parsed.data.productId },
      });
    } else {
      await prisma.cartItem.updateMany({
        where: { userId: user.id, productId: parsed.data.productId },
        data: { qty: parsed.data.qty },
      });
    }
    return NextResponse.json({ ok: true });
  }

  let cart = [...(session.guestCart ?? [])];
  if (parsed.data.qty === 0) {
    cart = cart.filter((l) => l.productId !== parsed.data.productId);
  } else {
    const idx = cart.findIndex((l) => l.productId === parsed.data.productId);
    if (idx >= 0) cart[idx] = { ...cart[idx], qty: parsed.data.qty };
  }
  session.guestCart = cart;
  await session.save();
  return NextResponse.json({ ok: true });
}
