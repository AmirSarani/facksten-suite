import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { ArticleDeleteButton } from "@/components/article-delete-button";
import { ArticleEditorForm } from "@/components/article-editor-form";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const article = await prisma.article.findUnique({ where: { id } });
  return { title: article ? `ویرایش ${article.title}` : "ویرایش مقاله" };
}

export default async function AdminArticleEditPage({ params }: Props) {
  await requireUser(["ADMIN"]);
  const { id } = await params;
  const [article, categories] = await Promise.all([
    prisma.article.findUnique({ where: { id } }),
    prisma.article.findMany({ select: { category: true }, distinct: ["category"] }),
  ]);
  if (!article) notFound();

  return (
    <AdminShell
      title={article.title}
      subtitle={`${article.category} · ${article.published ? "منتشر" : "پیش‌نویس"}`}
      active="/admin/articles"
      actions={
        <>
          <Link
            href="/admin/articles"
            className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-2 text-sm font-semibold text-on-surface hover:border-primary-container hover:text-primary-container"
          >
            لیست مقالات
          </Link>
          <Link
            href="/admin/articles/new"
            className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-2 text-sm font-semibold text-on-surface hover:border-primary-container hover:text-primary-container"
          >
            مقاله جدید
          </Link>
          <Link
            href={`/articles/${article.slug}`}
            className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-2 text-sm font-semibold text-on-surface hover:border-primary-container hover:text-primary-container"
          >
            صفحه عمومی
          </Link>
          <ArticleDeleteButton articleId={article.id} />
        </>
      }
    >
      <ArticleEditorForm
        mode="edit"
        categorySuggestions={categories.map((c) => c.category)}
        initial={{
          id: article.id,
          title: article.title,
          excerpt: article.excerpt,
          category: article.category,
          body: article.body,
          slug: article.slug,
          image: article.image,
          published: article.published,
          dateLabel: article.dateLabel,
        }}
      />
    </AdminShell>
  );
}
