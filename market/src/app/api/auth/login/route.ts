import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  clientIp,
  LOGIN_ACCOUNT_RULE,
  LOGIN_IP_RULE,
  rateLimit,
  resetRateLimit,
} from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

function tooManyAttempts(retryAfterSec: number) {
  return NextResponse.json(
    { error: "تلاش‌های ورود بیش از حد مجاز است. کمی بعد دوباره امتحان کنید." },
    { status: 429, headers: { "Retry-After": String(retryAfterSec) } },
  );
}

export async function POST(req: Request) {
  const ipCheck = rateLimit(`login:ip:${clientIp(req)}`, LOGIN_IP_RULE);
  if (!ipCheck.ok) return tooManyAttempts(ipCheck.retryAfterSec);

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "اطلاعات ورود نامعتبر است" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const accountKey = `login:acct:${email}`;
  const accountCheck = rateLimit(accountKey, LOGIN_ACCOUNT_RULE);
  if (!accountCheck.ok) return tooManyAttempts(accountCheck.retryAfterSec);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await compare(parsed.data.password, user.passwordHash))) {
    return NextResponse.json({ error: "ایمیل یا رمز عبور اشتباه است" }, { status: 401 });
  }
  resetRateLimit(accountKey);
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
