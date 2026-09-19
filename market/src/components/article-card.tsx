import Link from "next/link";
import { Icon } from "@/components/icon";
import type { Article } from "@/lib/data";

export function ArticleCard({
  article,
  minutes,
}: {
  article: Article;
  minutes?: number;
}) {
  return (
    <article className="product-card group flex h-full flex-col overflow-hidden cyber-chamfer bg-surface-container-lowest border border-outline shadow-[var(--box-shadow-neon-sm)]  transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--box-shadow-neon)]">
      <Link
        href={`/articles/${article.slug}`}
        prefetch
        className="relative aspect-video overflow-hidden bg-surface-container-low"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={article.image}
          alt={article.title}
          width={640}
          height={360}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </Link>
      <div className="flex flex-grow flex-col p-4 sm:p-5">
        <div className="mb-2.5 flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="cyber-chamfer-sm bg-primary-container/10 px-2 py-1 text-primary-container">
            {article.category}
          </span>
          {typeof minutes === "number" ? (
            <span className="text-on-surface-variant">{minutes} دقیقه</span>
          ) : null}
          <span className="text-on-surface-variant">· {article.date}</span>
        </div>
        <Link href={`/articles/${article.slug}`} prefetch className="cursor-pointer">
          <h3 className="mb-2 line-clamp-2 text-lg font-bold text-on-surface transition-colors group-hover:text-primary-container">
            {article.title}
          </h3>
        </Link>
        <p className="mb-4 line-clamp-3 flex-grow text-sm leading-6 text-on-surface-variant">
          {article.excerpt}
        </p>
        <Link
          href={`/articles/${article.slug}`}
          prefetch
          className="focus-cta inline-flex cursor-pointer items-center gap-1 text-sm font-semibold text-primary-container"
        >
          ادامه مطلب
          <Icon name="arrow_forward" className="h-4 w-4 rotate-180" />
        </Link>
      </div>
    </article>
  );
}
