import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { slugifyProduct } from "@/lib/panel";

const fileSchema = z.object({
  name: z.string().min(1),
  url: z.string().min(1),
});

const productSchema = z.object({
  title: z.string().min(2),
  price: z.number().int().positive(),
  stock: z.number().int().min(0),
  type: z.enum(["HARDWARE", "DIGITAL"]),
  brand: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
  mpn: z.string().optional().nullable(),
  description: z.string().optional(),
  categoryId: z.string().optional().nullable(),
  compareAtPrice: z.number().int().positive().optional().nullable(),
  packQty: z.number().int().min(1).optional(),
  active: z.boolean().optional(),
  image: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  badge: z.string().optional().nullable(),
  isNew: z.boolean().optional(),
  isPopular: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  specs: z.string().optional(),
  fileLabel: z.string().optional().nullable(),
  fileSize: z.string().optional().nullable(),
  sellerId: z.string().optional().nullable(),
  files: z.array(fileSchema).optional(),
  slug: z.string().min(1).max(80).optional().nullable(),
});

function productData(parsed: z.infer<typeof productSchema>, skuFallback: string) {
  return {
    title: parsed.title,
    sku: parsed.sku?.trim() || skuFallback,
    price: parsed.price,
    compareAtPrice: parsed.compareAtPrice ?? null,
    stock: parsed.stock,
    inStock: parsed.stock > 0,
    type: parsed.type,
    brand: parsed.brand || null,
    mpn: parsed.mpn || null,
    description: parsed.description ?? "",
    categoryId: parsed.categoryId || null,
    packQty: parsed.packQty ?? 1,
    active: parsed.active ?? true,
    image: parsed.image || "/placeholder.svg",
    icon: parsed.icon || null,
    badge: parsed.badge || null,
    isNew: parsed.isNew ?? false,
    isPopular: parsed.isPopular ?? false,
    isFeatured: parsed.isFeatured ?? false,
    specs: parsed.specs ?? "{}",
    fileLabel: parsed.fileLabel || null,
    fileSize: parsed.fileSize || null,
    sellerId: parsed.sellerId || null,
  };
}

async function syncFiles(productId: string, files: { name: string; url: string }[] | undefined) {
  if (files === undefined) return;
  await prisma.productFile.deleteMany({ where: { productId } });
  if (!files.length) return;
  await prisma.productFile.createMany({
    data: files.map((f) => ({ productId, name: f.name.trim(), url: f.url.trim() })),
  });
}

export async function POST(req: Request) {
  const user = await requireUser(["ADMIN"]);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = productSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "اطلاعات نامعتبر" }, { status: 400 });

  if (parsed.data.sellerId) {
    const seller = await prisma.user.findFirst({
      where: { id: parsed.data.sellerId, role: "PARTNER", disabled: false },
    });
    if (!seller) return NextResponse.json({ error: "فروشنده نامعتبر" }, { status: 400 });
  }

  const sku = parsed.data.sku?.trim() || `ADM-${Date.now().toString(36).toUpperCase()}`;
  const customSlug = parsed.data.slug?.trim();
  const product = await prisma.product.create({
    data: {
      ...productData(parsed.data, sku),
      slug: customSlug || slugifyProduct(parsed.data.title),
    },
  });
  await syncFiles(product.id, parsed.data.files ?? []);

  const full = await prisma.product.findUnique({
    where: { id: product.id },
    include: { files: true },
  });
  return NextResponse.json({ product: full });
}

export async function PATCH(req: Request) {
  const user = await requireUser(["ADMIN"]);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const id = body?.id as string | undefined;
  if (!id) return NextResponse.json({ error: "id لازم است" }, { status: 400 });

  const parsed = productSchema.partial().safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "اطلاعات نامعتبر" }, { status: 400 });

  if (parsed.data.sellerId) {
    const seller = await prisma.user.findFirst({
      where: { id: parsed.data.sellerId, role: "PARTNER", disabled: false },
    });
    if (!seller) return NextResponse.json({ error: "فروشنده نامعتبر" }, { status: 400 });
  }

  const data = parsed.data;
  const product = await prisma.product.update({
    where: { id },
    data: {
      ...(data.title != null ? { title: data.title } : {}),
      ...(data.price != null ? { price: data.price } : {}),
      ...(data.stock != null ? { stock: data.stock, inStock: data.stock > 0 } : {}),
      ...(data.type != null ? { type: data.type } : {}),
      ...(data.brand !== undefined ? { brand: data.brand || null } : {}),
      ...(data.sku !== undefined && data.sku ? { sku: data.sku } : {}),
      ...(data.mpn !== undefined ? { mpn: data.mpn || null } : {}),
      ...(data.description != null ? { description: data.description } : {}),
      ...(data.categoryId !== undefined ? { categoryId: data.categoryId || null } : {}),
      ...(data.compareAtPrice !== undefined ? { compareAtPrice: data.compareAtPrice } : {}),
      ...(data.packQty != null ? { packQty: data.packQty } : {}),
      ...(data.active != null ? { active: data.active } : {}),
      ...(data.image !== undefined ? { image: data.image || "" } : {}),
      ...(data.icon !== undefined ? { icon: data.icon || null } : {}),
      ...(data.badge !== undefined ? { badge: data.badge || null } : {}),
      ...(data.isNew != null ? { isNew: data.isNew } : {}),
      ...(data.isPopular != null ? { isPopular: data.isPopular } : {}),
      ...(data.isFeatured != null ? { isFeatured: data.isFeatured } : {}),
      ...(data.specs != null ? { specs: data.specs } : {}),
      ...(data.fileLabel !== undefined ? { fileLabel: data.fileLabel || null } : {}),
      ...(data.fileSize !== undefined ? { fileSize: data.fileSize || null } : {}),
      ...(data.sellerId !== undefined ? { sellerId: data.sellerId || null } : {}),
      ...(data.slug !== undefined && data.slug?.trim()
        ? { slug: data.slug.trim().replace(/\s+/g, "-").slice(0, 80) }
        : {}),
    },
  });

  await syncFiles(product.id, data.files);

  const full = await prisma.product.findUnique({
    where: { id: product.id },
    include: { files: true },
  });
  return NextResponse.json({ product: full });
}

export async function DELETE(req: Request) {
  const user = await requireUser(["ADMIN"]);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = z.object({ id: z.string().min(1) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const existing = await prisma.product.findUnique({
    where: { id: parsed.data.id },
    include: { _count: { select: { orderItems: true } } },
  });
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });

  if (existing._count.orderItems > 0) {
    await prisma.product.update({ where: { id: existing.id }, data: { active: false, inStock: false } });
    return NextResponse.json({ ok: true, soft: true });
  }

  await prisma.product.delete({ where: { id: existing.id } });
  return NextResponse.json({ ok: true, soft: false });
}
