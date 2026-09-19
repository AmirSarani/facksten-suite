import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ProductGrid,
  ProductListTable,
  ShopPagination,
  ShopToolbar,
} from "@/components/shop-catalog";
import { ShopFilters } from "@/components/shop-filters";
import { getBrands, getCategoryBySlug, getCategoryTree, getPriceBounds, queryCatalog } from "@/lib/catalog";
import { SITE } from "@/lib/site";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    brand?: string;
    sort?: string;
    q?: string;
    page?: string;
    inStock?: string;
    view?: string;
    minPrice?: string;
    maxPrice?: string;
    type?: string;
    isNew?: string;
    isPopular?: string;
    onSale?: string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "دسته" };
  return {
    title: `${category.name} | فروشگاه`,
    description: category.intro || `خرید ${category.name} از ${SITE.name}`,
  };
}

export default async function CategoryShopPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const preferList = category.isPassive || category.parent?.isPassive;
  const query = {
    categorySlug: slug,
    brand: sp.brand,
    sort: sp.sort,
    q: sp.q,
    page: sp.page,
    inStock: sp.inStock,
    view: sp.view,
    minPrice: sp.minPrice,
    maxPrice: sp.maxPrice,
    type: sp.type,
    isNew: sp.isNew,
    isPopular: sp.isPopular,
    onSale: sp.onSale,
  };

  const [result, categories, brands, priceBounds] = await Promise.all([
    queryCatalog(query),
    getCategoryTree(),
    getBrands(query),
    getPriceBounds(query),
  ]);

  const basePath = `/shop/category/${slug}`;
  const paramsMap = {
    brand: sp.brand,
    sort: sp.sort,
    q: sp.q,
    inStock: sp.inStock,
    view: sp.view,
    minPrice: sp.minPrice,
    maxPrice: sp.maxPrice,
    type: sp.type,
    isNew: sp.isNew,
    isPopular: sp.isPopular,
    onSale: sp.onSale,
  };
  const view = sp.view || (preferList ? "list" : "grid");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "خانه", item: "/" },
      { "@type": "ListItem", position: 2, name: "فروشگاه", item: "/shop" },
      ...(category.parent
        ? [{ "@type": "ListItem", position: 3, name: category.parent.name, item: `/shop/category/${category.parent.slug}` }]
        : []),
      {
        "@type": "ListItem",
        position: category.parent ? 4 : 3,
        name: category.name,
        item: basePath,
      },
    ],
  };

  return (
    <main className="cyber-grid mx-auto flex w-full max-w-[1280px] flex-col gap-4 px-page py-6 sm:gap-6 sm:py-8 lg:flex-row lg:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ShopFilters
        basePath={basePath}
        categories={categories}
        brands={brands}
        sp={paramsMap}
        activeCategorySlug={slug}
        priceBounds={priceBounds}
      />

      <div className="flex flex-1 flex-col">
        <div className="mb-4">
          <h1 className="font-mono text-2xl font-bold uppercase tracking-wide text-on-surface">{category.name}</h1>
          {category.intro && <p className="mt-2 max-w-3xl text-sm leading-7 text-on-surface-variant">{category.intro}</p>}
        </div>

        <ShopToolbar
          basePath={basePath}
          sp={paramsMap}
          from={result.from}
          to={result.to}
          total={result.total}
          view={view}
          preferList={preferList}
        />

        {result.items.length === 0 ? (
          <div className="cyber-chamfer border border-dashed border-outline p-12 text-center text-on-surface-variant">
            در این دسته فعلاً محصولی نیست.
          </div>
        ) : view === "list" ? (
          <ProductListTable products={result.items} />
        ) : (
          <ProductGrid products={result.items} />
        )}

        <ShopPagination basePath={basePath} sp={paramsMap} page={result.page} totalPages={result.totalPages} />
      </div>
    </main>
  );
}
