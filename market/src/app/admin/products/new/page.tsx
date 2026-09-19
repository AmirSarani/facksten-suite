import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { ProductEditorForm } from "@/components/product-editor-form";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const metadata = { title: "محصول جدید" };

export default async function AdminProductNewPage() {
  await requireUser(["ADMIN"]);
  const [categories, sellers] = await Promise.all([
    prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, slug: true, parentId: true },
    }),
    prisma.user.findMany({
      where: { role: "PARTNER", disabled: false },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <AdminShell
      title="محصول جدید"
      subtitle="اطلاعات پایه، قیمت، رسانه و انتشار در فروشگاه"
      active="/admin/products/new"
      actions={
        <>
          <Link
            href="/admin/products"
            className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-2 text-sm font-semibold text-on-surface hover:border-primary-container hover:text-primary-container"
          >
            لیست محصولات
          </Link>
          <Link
            href="/admin/categories"
            className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-2 text-sm font-semibold text-on-surface hover:border-primary-container hover:text-primary-container"
          >
            دسته‌ها
          </Link>
          <Link
            href="/shop"
            target="_blank"
            className="cyber-chamfer-sm bg-cta px-3 py-2 text-sm font-semibold text-on-primary"
          >
            فروشگاه
          </Link>
        </>
      }
    >
      <ProductEditorForm mode="create" categories={categories} sellers={sellers} apiBase="/api/admin/products" />
    </AdminShell>
  );
}
