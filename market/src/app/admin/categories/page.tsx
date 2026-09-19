import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { CategoryManager } from "@/components/category-manager";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const metadata = { title: "دسته‌بندی‌ها" };

export default async function AdminCategoriesPage() {
  await requireUser(["ADMIN"]);
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true, children: true } } },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return (
    <AdminShell
      title="دسته‌بندی‌ها"
      subtitle="درخت منوی هدر، فروشگاه و اختصاص محصول"
      active="/admin/categories"
      actions={
        <>
          <Link
            href="/shop"
            className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-2 text-sm font-semibold text-on-surface hover:border-primary-container hover:text-primary-container"
          >
            فروشگاه
          </Link>
          <Link
            href="/admin/products"
            className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-2 text-sm font-semibold text-on-surface hover:border-primary-container hover:text-primary-container"
          >
            محصولات
          </Link>
          <a
            href="#categories-tree"
            className="cyber-chamfer-sm bg-cta px-3 py-2 text-sm font-semibold text-on-primary"
          >
            درخت دسته‌ها
          </a>
        </>
      }
    >
      <CategoryManager categories={categories} />
    </AdminShell>
  );
}
