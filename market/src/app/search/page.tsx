import Link from "next/link";
import { SearchResultsClient, SearchSidebar } from "@/components/search-results";
import { Icon } from "@/components/icon";
import { getCatalog } from "@/lib/catalog";
import { SITE } from "@/lib/site";

type Props = {
  searchParams: Promise<{ q?: string; type?: string; brand?: string; stock?: string }>;
};

export const metadata = { title: "نتایج جستجو" };

export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  let results = await getCatalog({ q, type: sp.type });

  const brandCounts = new Map<string, number>();
  for (const p of results) {
    if (!p.brand) continue;
    brandCounts.set(p.brand, (brandCounts.get(p.brand) ?? 0) + 1);
  }
  const brands = Array.from(brandCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  if (sp.brand) {
    results = results.filter((p) => (p.brand || "").toLowerCase() === sp.brand!.toLowerCase());
  }
  const inStockOnly = sp.stock === "1";
  if (inStockOnly) results = results.filter((p) => p.inStock);

  return (
    <div className="mx-auto max-w-[1280px] px-margin-mobile py-10 md:px-margin-desktop">
      <nav className="mb-6 flex items-center gap-1 text-xs text-on-surface-variant">
        <Link href="/" className="hover:text-primary">
          خانه
        </Link>
        <Icon name="chevron_left" className="h-3.5 w-3.5" />
        <span className="text-on-surface">نتایج جستجو</span>
      </nav>

      <div className="mb-8">
        <h1 className="mb-1 text-2xl font-bold text-on-surface md:text-[32px] md:leading-[44px]">
          {q ? `نتایج برای: «${q}»` : `جستجو در ${SITE.name}`}
        </h1>
        <p className="text-sm text-on-surface-variant">{results.length} کالا یافت شد</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        <SearchSidebar
          q={q}
          brands={brands.length ? brands : [{ name: "Arduino", count: 0 }, { name: "Espressif", count: 0 }]}
          currentBrand={sp.brand}
          inStockOnly={inStockOnly}
        />
        <section className="md:col-span-9">
          <SearchResultsClient
            q={q}
            brand={sp.brand}
            inStockOnly={inStockOnly}
            products={results.map((p) => ({
              id: p.id,
              slug: p.slug,
              title: p.title,
              price: p.price,
              type: p.type,
              brand: p.brand,
              image: p.image,
              inStock: p.inStock,
              badge: p.badge,
            }))}
          />
        </section>
      </div>
    </div>
  );
}
