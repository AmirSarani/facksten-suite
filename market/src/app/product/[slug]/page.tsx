import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HardwareProductCard } from "@/components/product-cards";
import { Icon } from "@/components/icon";
import { ProductBuyBox } from "@/components/product-buy-box";
import { ProductDetailSections } from "@/components/product-detail-sections";
import { ProductGallery } from "@/components/product-gallery";
import {
  getArticles,
  getProductBySlug,
  getRelatedProducts,
} from "@/lib/catalog";
import { discountPercent, parseSpecs, unitPrice } from "@/lib/format";
import { mockReviewsForProduct } from "@/lib/product-mock";
import { SITE } from "@/lib/site";
import { labSlugForProduct } from "@/lab/lab-link";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "محصول" };
  const description = product.description?.slice(0, 160) || `${product.title} را از ${SITE.name} بخرید.`;
  return {
    title: product.title,
    description,
    openGraph: {
      title: product.title,
      description,
      images: product.image ? [{ url: product.image }] : undefined,
    },
    alternates: { canonical: `/product/${product.slug}` },
  };
}

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const [product, articles] = await Promise.all([getProductBySlug(slug), getArticles()]);
  if (!product) notFound();

  const specsFromDb = parseSpecs(product.specs);
  const specs =
    specsFromDb.length > 0
      ? [
          { k: "کد کالا (SKU)", v: product.sku },
          ...(product.mpn ? [{ k: "MPN", v: product.mpn }] : []),
          ...(product.brand ? [{ k: "برند", v: product.brand }] : []),
          ...(product.packQty > 1 ? [{ k: "تعداد در بسته", v: String(product.packQty) }] : []),
          ...specsFromDb,
          { k: "وضعیت موجودی", v: product.inStock ? `موجود (${product.stock})` : "ناموجود" },
        ]
      : [
          { k: "کد کالا (SKU)", v: product.sku },
          { k: "برند", v: product.brand || "—" },
          { k: "نوع", v: product.type === "DIGITAL" ? "دیجیتال" : "سخت‌افزار" },
          { k: "وضعیت موجودی", v: product.inStock ? `موجود (${product.stock})` : "ناموجود" },
        ];

  const highlights =
    specsFromDb.slice(0, 4).map((s) => `${s.k}: ${s.v}`).length > 0
      ? specsFromDb.slice(0, 4).map((s) => `${s.k}: ${s.v}`)
      : product.type === "DIGITAL"
        ? ["دانلود آنی پس از پرداخت", "مستندات فارسی", "پشتیبانی تیکت"]
        : ["قطعات اورجینال", "پشتیبانی تخصصی Facksten", "ارسال از انبار تهران"];

  const tags = [
    product.category?.name,
    product.brand,
    product.isNew ? "جدید" : null,
    product.isPopular ? "پرطرفدار" : null,
    product.type === "DIGITAL" ? "دانلود آنی" : "سخت‌افزار",
  ].filter(Boolean) as string[];

  const displayReviews = mockReviewsForProduct(
    product.slug,
    product.reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      body: r.body,
      user: r.user,
      createdAt: r.createdAt?.toISOString?.() ?? undefined,
    })),
    8,
  );
  const reviewCount = displayReviews.length;
  const avgNum = displayReviews.reduce((s, r) => s + r.rating, 0) / Math.max(reviewCount, 1);
  const avgRating = avgNum.toFixed(1).replace(".", "٫");
  const snippet = product.description?.slice(0, 220) || "توضیحات کامل در بخش معرفی محصول.";
  const category = product.category;
  const related = await getRelatedProducts(product.id, product.categoryId, 4);
  const disc = discountPercent(product.price, product.compareAtPrice);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    sku: product.sku,
    mpn: product.mpn || undefined,
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    image: product.image || undefined,
    description: product.description,
    offers: {
      "@type": "Offer",
      priceCurrency: "IRR",
      price: product.price,
      availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "خانه", item: "/" },
      { "@type": "ListItem", position: 2, name: "فروشگاه", item: "/shop" },
      ...(category
        ? [{ "@type": "ListItem", position: 3, name: category.name, item: `/shop/category/${category.slug}` }]
        : []),
      { "@type": "ListItem", position: category ? 4 : 3, name: product.title },
    ],
  };

  return (
    <main className="mx-auto max-w-[1280px] px-page py-6 sm:py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <nav className="no-scrollbar mb-6 flex items-center gap-2 overflow-x-auto text-xs font-medium whitespace-nowrap text-on-surface-variant">
        <Link href="/" className="transition-colors hover:text-primary">
          {SITE.name}
        </Link>
        <Icon name="chevron_left" className="h-3.5 w-3.5" />
        <Link href="/shop" className="transition-colors hover:text-primary">
          فروشگاه
        </Link>
        {category && (
          <>
            <Icon name="chevron_left" className="h-3.5 w-3.5" />
            <Link href={`/shop/category/${category.slug}`} className="transition-colors hover:text-primary">
              {category.name}
            </Link>
          </>
        )}
        <Icon name="chevron_left" className="h-3.5 w-3.5" />
        <span className="font-semibold text-on-surface">{product.title}</span>
      </nav>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <ProductGallery
            title={product.title}
            image={product.image}
            slug={product.slug}
            badge={disc > 0 ? `${disc}٪` : product.badge}
            isDigital={product.type === "DIGITAL"}
            digitalIcon={product.icon}
          />
        </div>

        <div className="flex flex-col gap-6 lg:col-span-5">
          <div>
            <h1 className="mb-2 text-2xl leading-9 font-bold text-on-surface md:text-[32px] md:leading-[44px]">
              {product.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-on-surface-variant">
              <span className="flex items-center gap-1">
                <Icon name="star" className="h-4 w-4 text-primary-container" />
                <span className="font-bold text-on-surface">{avgRating}</span>
                <span>({reviewCount || 0} دیدگاه)</span>
              </span>
              <span className="h-1 w-1 rounded-full bg-outline-variant" />
              <span>SKU: {product.sku}</span>
              {product.brand && (
                <>
                  <span className="h-1 w-1 rounded-full bg-outline-variant" />
                  <span>
                    برند:{" "}
                    <Link href={`/shop?brand=${encodeURIComponent(product.brand)}`} className="text-primary hover:underline">
                      {product.brand}
                    </Link>
                  </span>
                </>
              )}
              {product.packQty > 1 && (
                <>
                  <span className="h-1 w-1 rounded-full bg-outline-variant" />
                  <span>واحد ≈ {unitPrice(product.price, product.packQty).toLocaleString("fa-IR")} تومان</span>
                </>
              )}
            </div>
          </div>

          <div className="cyber-chamfer border border-outline bg-surface-container-low p-6 shadow-[var(--box-shadow-neon-sm)]">
            <h3 className="mb-3 flex items-center gap-2 font-mono text-sm font-semibold uppercase tracking-wide text-on-surface">
              <Icon name="memory" className="h-5 w-5 text-primary" />
              ویژگی‌های کلیدی
            </h3>
            <ul className="space-y-2 text-sm leading-6 text-on-surface-variant">
              {highlights.map((h) => (
                <li key={h} className="flex items-start gap-2">
                  <Icon name="check_circle" className="mt-1 h-4 w-4 shrink-0 text-primary-container" />
                  {h}
                </li>
              ))}
            </ul>
          </div>

          <div className="text-base leading-7 text-on-surface-variant">
            {snippet}
            {product.description && product.description.length > 220 ? "…" : ""}
            <a href="#description" className="mr-1 font-bold text-primary hover:underline">
              مشاهده بیشتر
            </a>
          </div>

          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="cyber-chamfer-sm flex items-center gap-1 border border-outline bg-surface-container-low px-3 py-1.5 font-mono text-xs font-semibold text-on-surface-variant"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="lg:sticky lg:top-28 lg:col-span-3 lg:self-start">
          <ProductBuyBox
            productId={product.id}
            price={product.price}
            compareAtPrice={product.compareAtPrice}
            packQty={product.packQty}
            inStock={product.inStock}
            stock={product.stock}
            labSlug={labSlugForProduct(product.slug)}
          />
        </div>
      </div>

      <ProductDetailSections
        slug={product.slug}
        title={product.title}
        description={product.description}
        brand={product.brand}
        type={product.type}
        files={product.files}
        reviews={product.reviews}
        specs={specs}
        articles={articles.map((a) => ({
          id: a.id,
          slug: a.slug,
          title: a.title,
          category: a.category,
          image: a.image,
        }))}
      />

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-6 text-xl font-bold text-on-surface">محصولات مرتبط</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {related.map((p) => (
              <HardwareProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
