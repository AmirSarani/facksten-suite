import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

const createSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  role: z.enum(["ADMIN", "PARTNER", "CUSTOMER"]),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  const admin = await requireUser(["ADMIN"]);
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "اطلاعات نامعتبر" }, { status: 400 });

  const email = parsed.data.email.toLowerCase();
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: "این ایمیل قبلاً ثبت شده" }, { status: 409 });

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name.trim(),
      email,
      phone: parsed.data.phone?.trim() || null,
      role: parsed.data.role,
      passwordHash: await hash(parsed.data.password, 10),
    },
  });

  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}

export async function PATCH(req: Request) {
  const admin = await requireUser(["ADMIN"]);
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = z
    .object({
      id: z.string().min(1),
      disabled: z.boolean().optional(),
      name: z.string().min(2).optional(),
      phone: z.string().optional().nullable(),
      resetPassword: z.string().min(6).optional(),
    })
    .safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  if (parsed.data.id === admin.id && parsed.data.disabled === true) {
    return NextResponse.json({ error: "نمی‌توانید حساب خودتان را غیرفعال کنید" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: parsed.data.id },
    data: {
      ...(parsed.data.disabled != null ? { disabled: parsed.data.disabled } : {}),
      ...(parsed.data.name != null ? { name: parsed.data.name.trim() } : {}),
      ...(parsed.data.phone !== undefined ? { phone: parsed.data.phone?.trim() || null } : {}),
      ...(parsed.data.resetPassword
        ? { passwordHash: await hash(parsed.data.resetPassword, 10) }
        : {}),
    },
  });

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      disabled: user.disabled,
    },
  });
}
