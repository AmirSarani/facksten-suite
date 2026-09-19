import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { ArticleEditorForm } from "@/components/article-editor-form";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const metadata = { title: "مقاله جدید" };

export default async function AdminNewArticlePage() {
  await requireUser(["ADMIN"]);
  const categories = await prisma.article.findMany({
    select: { category: true },
    distinct: ["category"],
  });

  return (
    <AdminShell
      title="مقاله جدید"
      subtitle="از عنوان و کاور تا انتشار در آرشیو"
      active="/admin/articles/new"
      actions={
        <>
          <Link
            href="/admin/articles"
            className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-2 text-sm font-semibold text-on-surface hover:border-primary-container hover:text-primary-container"
          >
            لیست مقالات
          </Link>
          <Link
            href="/articles"
            className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-2 text-sm font-semibold text-on-surface hover:border-primary-container hover:text-primary-container"
          >
            آرشیو سایت
          </Link>
        </>
      }
    >
      <ArticleEditorForm
        mode="create"
        categorySuggestions={categories.map((c) => c.category).filter(Boolean)}
      />
    </AdminShell>
  );
}
