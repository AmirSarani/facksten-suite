import type { Metadata } from "next";
import {
  ProductGrid,
  ProductListTable,
  ShopPagination,
  ShopToolbar,
} from "@/components/shop-catalog";
import { ShopFilters } from "@/components/shop-filters";
import { getBrands, getCategoryTree, getPriceBounds, queryCatalog } from "@/lib/catalog";
import { SITE } from "@/lib/site";

type Props = {
  searchParams: Promise<{
    type?: string;
    brand?: string;
    sort?: string;
    q?: string;
    page?: string;
    inStock?: string;
    view?: string;
    minPrice?: string;
    maxPrice?: string;
    isNew?: string;
    isPopular?: string;
    onSale?: string;
  }>;
};

export const metadata: Metadata = {
  title: "فروشگاه قطعات الکترونیک",
  description: `خرید قطعات الکترونیک، برد توسعه، سنسور و ماژول از ${SITE.name}`,
};

export default async function ShopPage({ searchParams }: Props) {
  const sp = await searchParams;
  const query = {
    type: sp.type,
    brand: sp.brand,
    sort: sp.sort,
    q: sp.q,
    page: sp.page,
    inStock: sp.inStock,
    view: sp.view,
    minPrice: sp.minPrice,
    maxPrice: sp.maxPrice,
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

  const params = {
    type: sp.type,
    brand: sp.brand,
    sort: sp.sort,
    q: sp.q,
    inStock: sp.inStock,
    view: sp.view,
    minPrice: sp.minPrice,
    maxPrice: sp.maxPrice,
    isNew: sp.isNew,
    isPopular: sp.isPopular,
    onSale: sp.onSale,
  };

  const view = sp.view || "grid";

  return (
    <main className="cyber-grid mx-auto flex w-full max-w-[1280px] flex-col gap-4 px-page py-6 sm:gap-6 sm:py-8 lg:flex-row lg:py-10">
      <ShopFilters
        basePath="/shop"
        categories={categories}
        brands={brands}
        sp={params}
        priceBounds={priceBounds}
      />

      <div className="flex flex-1 flex-col">
        <div className="mb-4">
          <h1 className="font-mono text-2xl font-bold uppercase tracking-wide text-on-surface">فروشگاه قطعات الکترونیک</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            مقاومت، خازن، برد آردوینو، ESP، سنسور و ابزار — همه در یک فروشگاه تخصصی.
          </p>
        </div>

        <ShopToolbar
          basePath="/shop"
          sp={params}
          from={result.from}
          to={result.to}
          total={result.total}
          view={view}
        />

        {result.items.length === 0 ? (
          <div className="cyber-chamfer border border-dashed border-outline p-12 text-center text-on-surface-variant">
            محصولی با این فیلترها پیدا نشد.
          </div>
        ) : view === "list" ? (
          <ProductListTable products={result.items} />
        ) : (
          <ProductGrid products={result.items} />
        )}

        <ShopPagination basePath="/shop" sp={params} page={result.page} totalPages={result.totalPages} />
      </div>
    </main>
  );
}
