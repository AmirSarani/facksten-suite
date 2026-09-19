/**
 * One-off: recompute Product.image from catalog + category/slug rules
 * without wiping the rest of the DB. Run: npx tsx prisma/fix-product-images.ts
 */
import path from "path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import { resolveProductImage } from "../src/lib/media";
import { buildProductSeeds } from "./seed-catalog-data";

const dbPath = path.join(process.cwd(), "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  const seeds = buildProductSeeds();
  const bySlug = new Map(seeds.map((s) => [s.slug, s]));

  const products = await prisma.product.findMany({
    select: {
      id: true,
      slug: true,
      image: true,
      type: true,
      category: { select: { slug: true } },
    },
  });

  let updated = 0;
  const examples: { slug: string; from: string; to: string }[] = [];

  for (const product of products) {
    const seed = bySlug.get(product.slug);
    const next = resolveProductImage({
      slug: product.slug,
      categorySlug: seed?.categorySlug ?? product.category?.slug,
      type: seed?.type ?? product.type,
      // Prefer curated seed image; ignore legacy chip-macro via resolveProductImage
      explicit: seed?.image ?? null,
    });

    if (next !== product.image) {
      await prisma.product.update({
        where: { id: product.id },
        data: { image: next },
      });
      updated++;
      if (examples.length < 12) {
        examples.push({ slug: product.slug, from: product.image, to: next });
      }
    }
  }

  const dist = await prisma.product.groupBy({
    by: ["image"],
    _count: { image: true },
    orderBy: { _count: { image: "desc" } },
  });

  console.log(JSON.stringify({ updated, total: products.length, examples, dist }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
