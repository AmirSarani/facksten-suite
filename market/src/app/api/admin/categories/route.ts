import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { slugifyContent } from "@/lib/panel";

const categorySchema = z.object({
  name: z.string().min(2).max(80),
  slug: z.string().min(1).max(80).optional().nullable(),
  intro: z.string().max(500).optional(),
  icon: z.string().max(40).optional().nullable(),
  parentId: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
  isPassive: z.boolean().optional(),
});

export async function GET() {
  const user = await requireUser(["ADMIN"]);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true, children: true } }, parent: true },
    orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }],
  });
  return NextResponse.json({ categories });
}

export async function POST(req: Request) {
  const user = await requireUser(["ADMIN"]);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = categorySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const slugBase = slugifyContent(parsed.data.slug || parsed.data.name, "cat");
  let slug = slugBase;
  let n = 1;
  while (await prisma.category.findUnique({ where: { slug } })) {
    slug = `${slugBase}-${n++}`;
  }

  const siblings = await prisma.category.count({ where: { parentId: parsed.data.parentId || null } });

  const category = await prisma.category.create({
    data: {
      name: parsed.data.name,
      slug,
      intro: parsed.data.intro ?? "",
      icon: parsed.data.icon || null,
      parentId: parsed.data.parentId || null,
      sortOrder: parsed.data.sortOrder ?? siblings,
      isPassive: parsed.data.isPassive ?? false,
    },
  });
  return NextResponse.json({ category });
}

export async function PATCH(req: Request) {
  const user = await requireUser(["ADMIN"]);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);

  if (body?.action === "reorder" && Array.isArray(body?.orderedIds)) {
    const ids = body.orderedIds as string[];
    await prisma.$transaction(ids.map((id, index) => prisma.category.update({ where: { id }, data: { sortOrder: index } })));
    return NextResponse.json({ ok: true });
  }

  const parsed = categorySchema.extend({ id: z.string().min(1) }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const existing = await prisma.category.findUnique({ where: { id: parsed.data.id } });
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });

  if (parsed.data.parentId === parsed.data.id) {
    return NextResponse.json({ error: "دسته نمی‌تواند والد خودش باشد" }, { status: 400 });
  }

  let slug = existing.slug;
  if (parsed.data.slug) {
    const next = slugifyContent(parsed.data.slug, existing.slug);
    if (next !== existing.slug) {
      const clash = await prisma.category.findFirst({ where: { slug: next, NOT: { id: existing.id } } });
      slug = clash ? `${next}-${Date.now().toString().slice(-3)}` : next;
    }
  }

  const category = await prisma.category.update({
    where: { id: existing.id },
    data: {
      name: parsed.data.name,
      slug,
      intro: parsed.data.intro ?? existing.intro,
      icon: parsed.data.icon !== undefined ? parsed.data.icon || null : existing.icon,
      parentId: parsed.data.parentId !== undefined ? parsed.data.parentId || null : existing.parentId,
      sortOrder: parsed.data.sortOrder ?? existing.sortOrder,
      isPassive: parsed.data.isPassive ?? existing.isPassive,
    },
  });
  return NextResponse.json({ category });
}

export async function DELETE(req: Request) {
  const user = await requireUser(["ADMIN"]);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = z.object({ id: z.string().min(1) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const existing = await prisma.category.findUnique({
    where: { id: parsed.data.id },
    include: { _count: { select: { children: true, products: true } } },
  });
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (existing._count.children > 0) {
    return NextResponse.json({ error: "ابتدا زیردسته‌ها را حذف یا جابه‌جا کنید" }, { status: 400 });
  }

  await prisma.product.updateMany({ where: { categoryId: existing.id }, data: { categoryId: null } });
  await prisma.category.delete({ where: { id: existing.id } });
  return NextResponse.json({ ok: true });
}
