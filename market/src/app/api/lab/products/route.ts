import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { LAB_COMPONENTS_SEED } from "@/lab/registry";
import { CATALOG_SLUG_MAP, applyShopData } from "@/lab/product-adapter";

export const dynamic = "force-dynamic";

export async function GET() {
  const slugs = new Set<string>();
  for (const c of LAB_COMPONENTS_SEED) {
    if (c.catalogSlug) slugs.add(c.catalogSlug);
    for (const s of CATALOG_SLUG_MAP[c.id] ?? []) slugs.add(s);
  }

  const products = await prisma.product.findMany({
    where: { slug: { in: [...slugs] }, active: true },
    select: {
      id: true,
      slug: true,
      title: true,
      price: true,
      inStock: true,
      stock: true,
      active: true,
    },
  });

  const enriched = applyShopData(LAB_COMPONENTS_SEED, products);
  return NextResponse.json({ components: enriched, products });
}
