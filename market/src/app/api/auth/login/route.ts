import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "اطلاعات ورود نامعتبر است" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (!user || !(await compare(parsed.data.password, user.passwordHash))) {
    return NextResponse.json({ error: "ایمیل یا رمز عبور اشتباه است" }, { status: 401 });
  }
  if (user.disabled) {
    return NextResponse.json({ error: "این حساب غیرفعال شده است" }, { status: 403 });
  }

  const session = await getSession();
  const guestCart = session.guestCart ?? [];
  session.user = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
  if (guestCart.length && (user.role === "CUSTOMER" || user.role === "ADMIN")) {
    for (const line of guestCart) {
      await prisma.cartItem.upsert({
        where: { userId_productId: { userId: user.id, productId: line.productId } },
        create: { userId: user.id, productId: line.productId, qty: line.qty },
        update: { qty: { increment: line.qty } },
      });
    }
    session.guestCart = [];
  }
  await session.save();

  const redirect =
    user.role === "ADMIN" ? "/admin" : user.role === "PARTNER" ? "/partner" : "/account/orders";

  return NextResponse.json({
    user: session.user,
    redirect,
  });
}
