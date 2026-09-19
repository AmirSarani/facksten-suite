import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

const schema = z.object({
  label: z.string().min(2).max(40),
  line: z.string().min(5).max(300),
  phone: z.string().min(8).max(20),
  isDefault: z.boolean().optional(),
});

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const addresses = await prisma.address.findMany({ where: { userId: user.id }, orderBy: { id: "desc" } });
  return NextResponse.json({ addresses });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  if (parsed.data.isDefault) {
    await prisma.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
  }

  const address = await prisma.address.create({
    data: {
      userId: user.id,
      label: parsed.data.label,
      line: parsed.data.line,
      phone: parsed.data.phone,
      isDefault: parsed.data.isDefault ?? false,
    },
  });
  return NextResponse.json({ address });
}

export async function PATCH(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = schema
    .extend({ id: z.string().min(1) })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const existing = await prisma.address.findFirst({ where: { id: parsed.data.id, userId: user.id } });
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });

  if (parsed.data.isDefault) {
    await prisma.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
  }

  const address = await prisma.address.update({
    where: { id: existing.id },
    data: {
      label: parsed.data.label,
      line: parsed.data.line,
      phone: parsed.data.phone,
      isDefault: parsed.data.isDefault ?? existing.isDefault,
    },
  });
  return NextResponse.json({ address });
}

export async function DELETE(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = z.object({ id: z.string().min(1) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const existing = await prisma.address.findFirst({ where: { id: parsed.data.id, userId: user.id } });
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });

  await prisma.address.delete({ where: { id: existing.id } });

  if (existing.isDefault) {
    const next = await prisma.address.findFirst({
      where: { userId: user.id },
      orderBy: { id: "asc" },
    });
    if (next) {
      await prisma.address.update({ where: { id: next.id }, data: { isDefault: true } });
    }
  }

  return NextResponse.json({ ok: true });
}
