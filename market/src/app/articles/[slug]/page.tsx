import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArticleAuthor,
  ArticleBlocks,
  ArticleMetaRow,
  ArticleMobileToc,
  ArticleToc,
} from "@/components/article-detail";
import { ArticleCard } from "@/components/article-card";
import { ArticleShareBar } from "@/components/article-share";
import { Icon } from "@/components/icon";
import { estimateReadMinutes, parseArticleBody } from "@/lib/article-content";
import { ARTICLE_BODIES } from "@/lib/article-bodies";
import { getArticleBySlug, getArticles } from "@/lib/catalog";
import { UI_IMAGES } from "@/lib/media";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  return {
    title: article?.title ?? "مقاله",
    description: article?.excerpt,
  };
}

export const dynamic = "force-dynamic";

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const rawBody = ARTICLE_BODIES[slug] || article.body || article.excerpt;
  const { blocks, toc } = parseArticleBody(rawBody);
  const minutes = estimateReadMinutes(rawBody);

  const allArticles = await getArticles();
  const related = allArticles
    .filter((a) => a.slug !== slug)
    .filter((a) => a.category === article.category)
    .slice(0, 3);

  const relatedFallback =
    related.length >= 2
      ? related
      : allArticles.filter((a) => a.slug !== slug).slice(0, 3);

  const relatedWithMinutes = relatedFallback.map((a) => {
    const body = ARTICLE_BODIES[a.slug] || a.body || a.excerpt;
    return {
      id: a.id,
      slug: a.slug,
      title: a.title,
      excerpt: a.excerpt,
      category: a.category,
      date: a.dateLabel,
      image: a.image || "/placeholder.svg",
      minutes: estimateReadMinutes(body),
    };
  });

  return (
    <div className="mx-auto w-full max-w-[1280px] px-page py-8 sm:py-10">
      <nav aria-label="مسیر صفحه" className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-on-surface-variant sm:mb-8 sm:text-sm">
        <Link href="/" prefetch className="focus-cta transition-colors hover:text-primary-container">
          خانه
        </Link>
        <Icon name="chevron_left" className="h-3.5 w-3.5 rotate-180 opacity-50" />
        <Link href="/articles" prefetch className="focus-cta transition-colors hover:text-primary-container">
          مقالات
        </Link>
        <Icon name="chevron_left" className="h-3.5 w-3.5 rotate-180 opacity-50" />
        <span className="line-clamp-1 font-semibold text-on-surface">{article.title}</span>
      </nav>

      <article className="mb-14 sm:mb-16">
        <header className="mb-8 cyber-chamfer border border-outline bg-surface-container-lowest p-5 shadow-[var(--box-shadow-neon-sm)] sm:mb-10 sm:p-8">
          <ArticleMetaRow
            category={article.category}
            minutes={minutes}
            dateLabel={article.dateLabel}
          />

          <h1 className="mb-4 text-[26px] leading-10 font-extrabold text-on-surface text-balance sm:mb-5 md:text-[40px] md:leading-[1.35]">
            {article.title}
          </h1>

          <p className="mb-6 max-w-3xl text-base leading-8 text-on-surface-variant sm:mb-8 sm:text-lg sm:leading-[1.8]">
            {article.excerpt}
          </p>

          <div className="flex flex-col gap-5 border-t border-surface-variant/70 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <ArticleAuthor
              name="امیرحسین رضایی"
              role="تحلیل‌گر ارشد سخت‌افزار"
              avatar={UI_IMAGES.author}
            />
            <ArticleShareBar title={article.title} />
          </div>
        </header>

        <div className="mb-8 aspect-[16/9] w-full overflow-hidden cyber-chamfer border border-outline bg-surface-container-low shadow-[var(--box-shadow-neon-sm)] sm:mb-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={article.image || "/placeholder.svg"}
            alt={article.title}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          <ArticleToc items={toc} />
          <div className={toc.length ? "lg:col-span-9" : "lg:col-span-12"}>
            <ArticleMobileToc items={toc} />
            <ArticleBlocks blocks={blocks} />

            <div className="mt-12 flex flex-col gap-4 cyber-chamfer border border-primary-container/30 bg-primary-container/10 p-5 shadow-[var(--box-shadow-neon-sm)] sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div>
                <p className="font-mono text-base font-bold uppercase tracking-wide text-on-surface">قطعه لازم برای این پروژه را دارید؟</p>
                <p className="mt-1 text-sm text-on-surface-variant">از فروشگاه فکستن برد، سنسور و ماژول را با ارسال سریع تهیه کنید.</p>
              </div>
              <Link
                href="/shop"
                prefetch
                className="bg-cta focus-cta cyber-chamfer-sm inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 px-5 py-2.5 font-mono text-sm font-semibold uppercase tracking-wide shadow-[var(--box-shadow-neon-sm)] transition-colors duration-200"
              >
                مشاهده فروشگاه
                <Icon name="arrow_forward" className="h-4 w-4 rotate-180" />
              </Link>
            </div>
          </div>
        </div>
      </article>

      {relatedWithMinutes.length ? (
        <section className="border-t border-surface-variant/70 pt-10">
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-fluid-title font-bold text-on-surface">مقالات مرتبط</h2>
              <p className="mt-1 text-sm text-on-surface-variant">ادامه مسیر یادگیری در همین موضوع</p>
            </div>
            <Link
              href="/articles"
              prefetch
              className="focus-cta hidden text-sm font-semibold text-primary-container hover:underline sm:inline-flex sm:items-center sm:gap-1"
            >
              همه مقالات
              <Icon name="arrow_forward" className="h-4 w-4 rotate-180" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {relatedWithMinutes.map((a) => (
              <ArticleCard
                key={a.id}
                minutes={a.minutes}
                article={{
                  id: a.id,
                  slug: a.slug,
                  title: a.title,
                  excerpt: a.excerpt,
                  category: a.category,
                  date: a.date,
                  image: a.image,
                }}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
