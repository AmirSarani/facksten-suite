import { Suspense } from "react";
import { CompareClient } from "@/components/compare-client";
import { getCatalog } from "@/lib/catalog";

export const metadata = { title: "مقایسه محصولات" };

export default async function ComparePage() {
  const catalog = await getCatalog();
  const products = catalog.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    price: p.price,
    brand: p.brand,
    image: p.image,
    inStock: p.inStock,
    stock: p.stock,
    badge: p.badge,
    type: p.type,
  }));

  return (
    <Suspense fallback={<div className="p-20 text-center text-on-surface-variant">در حال بارگذاری...</div>}>
      <CompareClient catalog={products} />
    </Suspense>
  );
}
