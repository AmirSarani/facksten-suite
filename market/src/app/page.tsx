import Link from "next/link";
import { ArticleCard } from "@/components/article-card";
import { CategoryStrip } from "@/components/home/category-strip";
import { HeroStatic } from "@/components/home/hero-static";
import { DealsCarousel } from "@/components/home/deals-carousel";
import { ProductRail } from "@/components/home/product-rail";
import { Newsletter } from "@/components/home/newsletter";
import { PromoBand } from "@/components/home/promo-band";
import { SocialProof } from "@/components/home/social-proof";
import { LabPromo } from "@/components/home/lab-promo";
import { PortfolioPromo } from "@/components/home/portfolio-promo";
import { TrustUspBar } from "@/components/home/trust-usp-bar";
import { Icon, resolveIconName } from "@/components/icon";
import { DigitalProductCard } from "@/components/product-cards";
import { getArticles, getCategoryTree, getHomeRails, getCatalog, getSiteSettings, parseHomeConfig } from "@/lib/catalog";

export default async function HomePage() {
  const [rails, articles, categories, allProducts, settings] = await Promise.all([
    getHomeRails(),
    getArticles(),
    getCategoryTree(),
    getCatalog({ type: "digital" }),
    getSiteSettings(),
  ]);

  const home = parseHomeConfig("homeJson" in settings ? settings.homeJson : "{}");
  const digital = allProducts.slice(0, 3);

  const stripSource =
    home.stripCategorySlugs.length > 0
      ? home.stripCategorySlugs
          .map((slug) => categories.find((c) => c.slug === slug))
          .filter(Boolean)
      : categories.slice(0, 6);

  const strip = stripSource.map((c) => ({
    href: `/shop/category/${c!.slug}`,
    label: c!.name,
    icon: resolveIconName(c!.icon, c!.slug === "power" ? "battery_charging_full" : "memory"),
  }));

  const deals = rails.deals.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    price: p.price,
    image: p.image,
    badge: p.badge,
    compareAtPrice: p.compareAtPrice,
  }));

  return (
    <>
      <HeroStatic
        heroTitle={home.heroTitle}
        heroSubtitle={home.heroSubtitle}
        heroCtaLabel={home.heroCtaLabel}
        heroCtaHref={home.heroCtaHref}
      />
      <CategoryStrip categories={strip} />
      <TrustUspBar />
      <PortfolioPromo />
      {home.showDeals ? <DealsCarousel items={deals} /> : null}

      {home.showNew ? (
        <ProductRail
          title="کالاهای جدید"
          subtitle="تازه‌واردهای انبار فکستن"
          href="/shop?sort=newest"
          items={rails.newItems}
          tone="default"
          layout="snap"
        />
      ) : null}

      <PromoBand />
      <LabPromo />

      {home.showPopular ? (
        <ProductRail
          title="پرفروش‌ترین‌ها"
          subtitle="انتخاب محبوب مهندسان و دانشجویان"
          href="/shop?sort=popular"
          items={rails.popular}
          tone="muted"
          layout="grid"
        />
      ) : null}
      <ProductRail
        title="بردهای خانواده آردوینو"
        subtitle="Uno، Nano، Mega و کیت‌های آموزشی"
        href="/shop/category/arduino"
        items={rails.arduino}
        tone="circuit"
        layout="feature"
      />

      {home.showDigital ? (
        <section className="home-section-enter home-band-circuit border-y border-outline-variant/50">
          <div className="mx-auto max-w-[1280px] px-page py-home">
            <div className="mb-4 flex items-end justify-between gap-3 border-b border-outline-variant/40 pb-4 sm:mb-5">
              <div className="min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent-tertiary" dir="ltr">
                  // DIGITAL::ASSETS
                </p>
                <h2 className="mt-1 text-fluid-title font-bold text-on-surface">محصولات دانلودی و کد</h2>
                <p className="mt-1 text-sm text-on-surface-variant sm:text-base">سورس کدها، پروژه‌های آماده و فایل‌های آموزشی</p>
              </div>
              <Link
                href="/shop?type=digital"
                className="focus-cta cyber-chamfer-sm hidden shrink-0 cursor-pointer items-center gap-1 border border-outline-variant bg-surface-container-lowest px-3 py-1.5 text-sm font-semibold text-primary-container transition-all duration-200 hover:border-primary-container hover:shadow-[var(--box-shadow-neon-sm)] sm:flex"
              >
                مشاهده همه
                <Icon name="arrow_forward" className="h-4 w-4 rotate-180" />
              </Link>
            </div>
            {digital.length ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
                {digital.map((p) => (
                  <DigitalProductCard
                    key={p.id}
                    variant="home"
                    product={{
                      id: p.id,
                      slug: p.slug,
                      title: p.title,
                      price: p.price,
                      type: p.type,
                      inStock: p.inStock,
                      image: p.image || "/placeholder.svg",
                      brand: p.brand,
                      icon: p.icon,
                      fileLabel: p.fileLabel,
                      fileSize: p.fileSize,
                      badge: p.isNew ? "جدید" : p.badge,
                    }}
                  />
                ))}
              </div>
            ) : (
              <p className="cyber-chamfer-sm border border-dashed border-outline-variant bg-surface-container-lowest p-8 text-center text-sm text-on-surface-variant">
                محصول دیجیتال موجود نیست.
              </p>
            )}
          </div>
        </section>
      ) : null}

      <SocialProof />

      <section className="home-section-enter border-t border-outline-variant/40">
        <div className="mx-auto max-w-[1280px] px-page py-home">
          <div className="mb-4 flex items-end justify-between gap-3 border-b border-outline-variant/40 pb-4 sm:mb-5">
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent-secondary" dir="ltr">
                // ARTICLES::LATEST
              </p>
              <h2 className="mt-1 text-fluid-title font-bold text-on-surface">آخرین مقالات آموزشی</h2>
              <p className="mt-1 text-sm text-on-surface-variant sm:text-base">دانش خود را در زمینه الکترونیک ارتقا دهید</p>
            </div>
            <Link href="/articles" className="focus-cta cyber-chamfer-sm hidden shrink-0 cursor-pointer items-center gap-1 border border-outline-variant bg-surface-container-lowest px-3 py-1.5 text-sm font-semibold text-primary-container transition-all duration-200 hover:border-primary-container hover:shadow-[var(--box-shadow-neon-sm)] sm:flex">
            مشاهده همه
            <Icon name="arrow_forward" className="h-4 w-4 rotate-180" />
          </Link>
        </div>
        {articles.length ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 md:grid-cols-3">
            {articles.slice(0, 3).map((a) => (
              <ArticleCard
                key={a.id}
                article={{
                  id: a.id,
                  slug: a.slug,
                  title: a.title,
                  excerpt: a.excerpt,
                  category: a.category,
                  date: a.dateLabel,
                  image: a.image,
                }}
              />
            ))}
          </div>
        ) : null}
        </div>
      </section>

      <Newsletter />
    </>
  );
}
