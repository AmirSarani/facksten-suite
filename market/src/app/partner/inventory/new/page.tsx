import Link from "next/link";
import { PartnerShell } from "@/components/partner-shell";
import { ProductEditorForm } from "@/components/product-editor-form";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const metadata = { title: "ثبت محصول همکار" };

export default async function PartnerNewProductPage() {
  const user = await requireUser(["PARTNER", "ADMIN"]);
  if (!user) return null;

  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, slug: true, parentId: true },
  });

  return (
    <PartnerShell
      title="ثبت محصول جدید"
      subtitle="عنوان، قیمت، موجودی و کاور برای نمایش در فروشگاه"
      active="/partner/inventory"
      actions={
        <Link
          href="/partner/inventory"
          className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-2 text-sm font-semibold text-on-surface hover:border-primary-container hover:text-primary-container"
        >
          بازگشت به موجودی
        </Link>
      }
    >
      <ProductEditorForm mode="create" categories={categories} apiBase="/api/partner/products" />
    </PartnerShell>
  );
}
