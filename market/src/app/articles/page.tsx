import { ArticlesIndex } from "@/components/articles-index";
import { ARTICLE_BODIES } from "@/lib/article-bodies";
import { estimateReadMinutes } from "@/lib/article-content";
import { getArticles } from "@/lib/catalog";

export const metadata = {
  title: "مقالات آموزشی",
  description: "راهنماهای عملی الکترونیک، آردوینو، IoT و ابزار در فکستن",
};

export default async function ArticlesPage() {
  const articles = await getArticles();
  const items = articles.map((a) => {
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

  return <ArticlesIndex articles={items} />;
}
