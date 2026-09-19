/**
 * Upsert category tree + remap product categories without wiping the DB.
 * Run: npx tsx prisma/sync-nav-categories.ts
 */
import path from "path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import { buildProductSeeds, CATEGORY_TREE } from "./seed-catalog-data";

const dbPath = path.join(process.cwd(), "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  const categoryBySlug = new Map<string, string>();

  for (const root of CATEGORY_TREE) {
    const parent = await prisma.category.upsert({
      where: { slug: root.slug },
      create: {
        slug: root.slug,
        name: root.name,
        intro: root.intro,
        icon: root.icon,
        sortOrder: root.sortOrder,
        isPassive: Boolean(root.isPassive),
      },
      update: {
        name: root.name,
        intro: root.intro,
        icon: root.icon,
        sortOrder: root.sortOrder,
        isPassive: Boolean(root.isPassive),
        parentId: null,
      },
    });
    categoryBySlug.set(parent.slug, parent.id);

    for (const child of root.children ?? []) {
      const created = await prisma.category.upsert({
        where: { slug: child.slug },
        create: {
          slug: child.slug,
          name: child.name,
          intro: child.intro,
          icon: child.icon,
          sortOrder: child.sortOrder,
          isPassive: Boolean(child.isPassive),
          parentId: parent.id,
        },
        update: {
          name: child.name,
          intro: child.intro,
          icon: child.icon,
          sortOrder: child.sortOrder,
          isPassive: Boolean(child.isPassive),
          parentId: parent.id,
        },
      });
      categoryBySlug.set(created.slug, created.id);
    }
  }

  const seeds = buildProductSeeds();
  let remapped = 0;
  for (const p of seeds) {
    const categoryId = categoryBySlug.get(p.categorySlug);
    if (!categoryId) continue;
    const result = await prisma.product.updateMany({
      where: { slug: p.slug },
      data: { categoryId },
    });
    remapped += result.count;
  }

  console.log(`Synced ${categoryBySlug.size} categories; remapped ${remapped} products.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
