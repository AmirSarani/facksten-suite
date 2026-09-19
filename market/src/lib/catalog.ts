import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

export const PAGE_SIZE = 24;

export type CatalogQuery = {
  categorySlug?: string;
  type?: string;
  brand?: string;
  q?: string;
  sort?: string;
  inStock?: string;
  minPrice?: string;
  maxPrice?: string;
  page?: string;
  view?: string;
  isNew?: string;
  isPopular?: string;
  onSale?: string;
};

function parsePage(page?: string) {
  const n = Number(page ?? "1");
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
}

async function categoryIdsForSlug(slug: string): Promise<string[] | null> {
  const cat = await prisma.category.findUnique({
    where: { slug },
    include: { children: { select: { id: true } } },
  });
  if (!cat) return null;
  return [cat.id, ...cat.children.map((c) => c.id)];
}

export async function buildProductWhere(opts: CatalogQuery = {}): Promise<Prisma.ProductWhereInput> {
  const where: Prisma.ProductWhereInput = { active: true };

  if (opts.type === "hardware") where.type = "HARDWARE";
  if (opts.type === "digital") where.type = "DIGITAL";

  if (opts.categorySlug) {
    const ids = await categoryIdsForSlug(opts.categorySlug);
    if (ids) where.categoryId = { in: ids };
    else where.categoryId = "__none__";
  }

  if (opts.brand) where.brand = opts.brand;
  if (opts.inStock === "1") where.inStock = true;
  if (opts.isNew === "1") where.isNew = true;
  if (opts.isPopular === "1") where.isPopular = true;
  if (opts.onSale === "1") where.compareAtPrice = { gt: 0 };

  const min = opts.minPrice ? Number(opts.minPrice) : undefined;
  const max = opts.maxPrice ? Number(opts.maxPrice) : undefined;
  if ((min != null && Number.isFinite(min)) || (max != null && Number.isFinite(max))) {
    where.price = {};
    if (min != null && Number.isFinite(min)) where.price.gte = min;
    if (max != null && Number.isFinite(max)) where.price.lte = max;
  }

  if (opts.q?.trim()) {
    const q = opts.q.trim();
    where.OR = [
      { title: { contains: q } },
      { brand: { contains: q } },
      { slug: { contains: q } },
      { sku: { contains: q } },
      { mpn: { contains: q } },
    ];
  }

  return where;
}

export function buildProductOrderBy(sort?: string): Prisma.ProductOrderByWithRelationInput {
  if (sort === "price_asc") return { price: "asc" };
  if (sort === "price_desc") return { price: "desc" };
  if (sort === "popular") return { isPopular: "desc" };
  if (sort === "newest") return { createdAt: "desc" };
  return { createdAt: "desc" };
}

/** Backward-compatible simple catalog list */
export async function getCatalog(opts?: { type?: string; q?: string }) {
  const where = await buildProductWhere({ type: opts?.type, q: opts?.q });
  return prisma.product.findMany({
    where,
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function queryCatalog(opts: CatalogQuery = {}) {
  const page = parsePage(opts.page);
  const where = await buildProductWhere(opts);
  const orderBy = buildProductOrderBy(opts.sort);

  const [total, items] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: [orderBy, { title: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return {
    items,
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages,
    from: total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1,
    to: Math.min(page * PAGE_SIZE, total),
  };
}

export async function getCategoryTree() {
  return prisma.category.findMany({
    where: { parentId: null, isPassive: false },
    include: {
      children: { orderBy: { sortOrder: "asc" } },
      _count: { select: { products: true } },
    },
    orderBy: { sortOrder: "asc" },
  });
}

/** Full tree for header mega-menu (includes passive children like resistors). */
export async function getNavCategoryTree() {
  return prisma.category.findMany({
    where: { parentId: null },
    include: {
      children: { orderBy: { sortOrder: "asc" } },
    },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getCategoryBySlug(slug: string) {
  return prisma.category.findUnique({
    where: { slug },
    include: {
      parent: true,
      children: { orderBy: { sortOrder: "asc" } },
    },
  });
}

export async function getBrands(opts: CatalogQuery = {}) {
  const where = await buildProductWhere({ ...opts, brand: undefined });
  const rows = await prisma.product.findMany({
    where: { ...where, brand: { not: null } },
    select: { brand: true },
    distinct: ["brand"],
    orderBy: { brand: "asc" },
  });
  return rows.map((r) => r.brand!).filter(Boolean);
}

export async function getPriceBounds(opts: CatalogQuery = {}) {
  const where = await buildProductWhere({
    ...opts,
    minPrice: undefined,
    maxPrice: undefined,
  });
  const agg = await prisma.product.aggregate({
    where,
    _min: { price: true },
    _max: { price: true },
  });
  return {
    min: agg._min.price ?? 0,
    max: agg._max.price ?? 0,
  };
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
    include: {
      files: true,
      category: { include: { parent: true } },
      reviews: { include: { user: true }, orderBy: { createdAt: "desc" } },
    },
  });
}

export async function getRelatedProducts(productId: string, categoryId: string | null, take = 4) {
  if (!categoryId) {
    return prisma.product.findMany({
      where: { active: true, id: { not: productId } },
      take,
      orderBy: { isPopular: "desc" },
    });
  }
  return prisma.product.findMany({
    where: { active: true, categoryId, id: { not: productId } },
    take,
    orderBy: [{ isPopular: "desc" }, { createdAt: "desc" }],
  });
}

export type HomeConfig = {
  heroTitle: string;
  heroSubtitle: string;
  heroCtaLabel: string;
  heroCtaHref: string;
  stripCategorySlugs: string[];
  showDeals: boolean;
  showPopular: boolean;
  showNew: boolean;
  showDigital: boolean;
};

export const DEFAULT_HOME_CONFIG: HomeConfig = {
  heroTitle: "قطعه درست را پیدا کن؛ پروژه را تمام کن.",
  heroSubtitle:
    "فکستن فروشگاه قطعات الکترونیک برای سازنده‌ها، دانشجویان و مهندسان است — مقاومت و خازن تا آردوینو، ESP32 و سنسور، با دسته‌بندی دقیق و ارسال سریع.",
  heroCtaLabel: "مشاهده فروشگاه",
  heroCtaHref: "/shop",
  stripCategorySlugs: [],
  showDeals: true,
  showPopular: true,
  showNew: true,
  showDigital: true,
};

export function parseHomeConfig(raw?: string | null): HomeConfig {
  try {
    const parsed = JSON.parse(raw || "{}") as Partial<HomeConfig>;
    return {
      ...DEFAULT_HOME_CONFIG,
      ...parsed,
      stripCategorySlugs: Array.isArray(parsed.stripCategorySlugs)
        ? parsed.stripCategorySlugs.map(String).filter(Boolean)
        : DEFAULT_HOME_CONFIG.stripCategorySlugs,
      showDeals: parsed.showDeals ?? true,
      showPopular: parsed.showPopular ?? true,
      showNew: parsed.showNew ?? true,
      showDigital: parsed.showDigital ?? true,
    };
  } catch {
    return { ...DEFAULT_HOME_CONFIG };
  }
}

export async function getHomeRails() {
  const [newItems, popular, deals, arduino] = await Promise.all([
    prisma.product.findMany({
      where: { active: true, isNew: true },
      take: 8,
      orderBy: { createdAt: "desc" },
      include: { category: true },
    }),
    prisma.product.findMany({
      where: { active: true, isPopular: true },
      take: 8,
      orderBy: { stock: "desc" },
      include: { category: true },
    }),
    prisma.product.findMany({
      where: { active: true, OR: [{ compareAtPrice: { not: null } }, { isFeatured: true }] },
      take: 8,
      orderBy: { updatedAt: "desc" },
      include: { category: true },
    }),
    prisma.product.findMany({
      where: { active: true, category: { slug: "arduino" } },
      take: 8,
      orderBy: { isPopular: "desc" },
      include: { category: true },
    }),
  ]);
  return { newItems, popular, deals, arduino };
}

export async function getArticles() {
  return prisma.article.findMany({ where: { published: true }, orderBy: { createdAt: "desc" } });
}

export async function getArticleBySlug(slug: string) {
  return prisma.article.findUnique({ where: { slug } });
}

export async function getSiteSettings() {
  return (
    (await prisma.siteSetting.findUnique({ where: { id: "main" } })) ?? {
      id: "main",
      phone: "۰۲۱-۱۲۳۴۵۶۷۸",
      email: "info@facksten.com",
      address: "تهران، خیابان جمهوری",
      faqJson: "[]",
      homeJson: "{}",
    }
  );
}
