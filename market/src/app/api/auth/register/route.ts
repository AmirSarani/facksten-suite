import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "اطلاعات ثبت‌نام نامعتبر است" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return NextResponse.json({ error: "این ایمیل قبلاً ثبت شده است" }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email,
      phone: parsed.data.phone,
      passwordHash: await hash(parsed.data.password, 10),
      role: "CUSTOMER",
    },
  });

  const session = await getSession();
  session.user = { id: user.id, name: user.name, email: user.email, role: user.role };
  await session.save();

  return NextResponse.json({ user: session.user, redirect: "/account/orders" });
}
