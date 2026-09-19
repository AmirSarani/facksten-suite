import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { slugifyProduct } from "@/lib/panel";

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
  files: z.array(z.object({ name: z.string(), url: z.string() })).optional(),
});

async function uniqueSku(base: string, excludeId?: string) {
  let sku = base.slice(0, 40);
  let n = 0;
  while (true) {
    const candidate = n === 0 ? sku : `${sku}-${n}`;
    const found = await prisma.product.findUnique({ where: { sku: candidate } });
    if (!found || found.id === excludeId) return candidate;
    n += 1;
  }
}

export async function POST(req: Request) {
  const user = await requireUser(["PARTNER", "ADMIN"]);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = productSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "اطلاعات نامعتبر" }, { status: 400 });

  const sku = await uniqueSku(parsed.data.sku?.trim() || `PTR-${Date.now().toString(36).toUpperCase()}`);
  const cleanFiles = (parsed.data.files ?? []).filter((f) => f.name.trim() && f.url.trim());

  const product = await prisma.product.create({
    data: {
      title: parsed.data.title,
      slug: slugifyProduct(parsed.data.title),
      sku,
      price: parsed.data.price,
      compareAtPrice: parsed.data.compareAtPrice ?? null,
      stock: parsed.data.stock,
      inStock: parsed.data.stock > 0,
      type: parsed.data.type,
      brand: parsed.data.brand || null,
      mpn: parsed.data.mpn || null,
      description: parsed.data.description || "محصول ثبت‌شده توسط همکار",
      categoryId: parsed.data.categoryId || null,
      packQty: parsed.data.packQty ?? 1,
      active: parsed.data.active ?? true,
      image: parsed.data.image || "/placeholder.svg",
      icon: parsed.data.type === "DIGITAL" ? parsed.data.icon || "folder_zip" : null,
      badge: parsed.data.badge || null,
      isNew: parsed.data.isNew ?? false,
      isPopular: parsed.data.isPopular ?? false,
      isFeatured: false,
      specs: parsed.data.specs ?? "{}",
      fileLabel: parsed.data.type === "DIGITAL" ? parsed.data.fileLabel || null : null,
      fileSize: parsed.data.type === "DIGITAL" ? parsed.data.fileSize || null : null,
      sellerId: user.id,
      ...(cleanFiles.length
        ? { files: { create: cleanFiles.map((f) => ({ name: f.name.trim(), url: f.url.trim() })) } }
        : {}),
    },
  });

  return NextResponse.json({ product });
}

export async function PATCH(req: Request) {
  const user = await requireUser(["PARTNER", "ADMIN"]);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const id = body?.id as string | undefined;
  if (!id) return NextResponse.json({ error: "id لازم است" }, { status: 400 });

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "یافت نشد" }, { status: 404 });
  if (user.role === "PARTNER" && existing.sellerId !== user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const parsed = productSchema.partial().safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "اطلاعات نامعتبر" }, { status: 400 });

  const data = parsed.data;
  const product = await prisma.product.update({
    where: { id },
    data: {
      ...(data.title != null ? { title: data.title } : {}),
      ...(data.price != null ? { price: data.price } : {}),
      ...(data.stock != null ? { stock: data.stock, inStock: data.stock > 0 } : {}),
      ...(data.type != null ? { type: data.type } : {}),
      ...(data.brand !== undefined ? { brand: data.brand || null } : {}),
      ...(data.sku !== undefined && data.sku
        ? { sku: await uniqueSku(data.sku.trim(), existing.id) }
        : {}),
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
      ...(data.specs != null ? { specs: data.specs } : {}),
      ...(data.fileLabel !== undefined ? { fileLabel: data.fileLabel || null } : {}),
      ...(data.fileSize !== undefined ? { fileSize: data.fileSize || null } : {}),
    },
  });

  if (data.files) {
    const cleanFiles = data.files.filter((f) => f.name.trim() && f.url.trim());
    await prisma.productFile.deleteMany({ where: { productId: id } });
    if (cleanFiles.length) {
      await prisma.productFile.createMany({
        data: cleanFiles.map((f) => ({ productId: id, name: f.name.trim(), url: f.url.trim() })),
      });
    }
  }

  return NextResponse.json({ product });
}
