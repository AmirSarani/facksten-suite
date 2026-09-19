import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { ProductEditorForm } from "@/components/product-editor-form";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });
  return { title: product ? `ویرایش ${product.title}` : "ویرایش محصول" };
}

export default async function AdminProductEditPage({ params }: Props) {
  await requireUser(["ADMIN"]);
  const { id } = await params;
  const [product, categories, sellers] = await Promise.all([
    prisma.product.findUnique({ where: { id }, include: { files: true } }),
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
  if (!product) notFound();

  return (
    <AdminShell
      title="ویرایش محصول"
      subtitle={`${product.title} · ${product.sku}`}
      active="/admin/products"
      actions={
        <>
          <Link
            href="/admin/products"
            className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-2 text-sm font-semibold text-on-surface hover:border-primary-container hover:text-primary-container"
          >
            لیست
          </Link>
          <Link
            href={`/product/${product.slug}`}
            className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-2 text-sm font-semibold text-on-surface hover:border-primary-container hover:text-primary-container"
          >
            صفحه عمومی
          </Link>
          <Link
            href="/admin/products/new"
            className="cyber-chamfer-sm bg-cta px-3 py-2 text-sm font-semibold text-on-primary"
          >
            محصول جدید
          </Link>
        </>
      }
    >
      <ProductEditorForm
        mode="edit"
        apiBase="/api/admin/products"
        categories={categories}
        sellers={sellers}
        initial={{
          id: product.id,
          slug: product.slug,
          title: product.title,
          price: product.price,
          stock: product.stock,
          type: product.type,
          brand: product.brand,
          sku: product.sku,
          mpn: product.mpn,
          description: product.description,
          categoryId: product.categoryId,
          compareAtPrice: product.compareAtPrice,
          packQty: product.packQty,
          active: product.active,
          image: product.image,
          icon: product.icon,
          badge: product.badge,
          isNew: product.isNew,
          isPopular: product.isPopular,
          isFeatured: product.isFeatured,
          specs: product.specs,
          fileLabel: product.fileLabel,
          fileSize: product.fileSize,
          sellerId: product.sellerId,
          files: product.files.map((f) => ({ name: f.name, url: f.url })),
        }}
      />
    </AdminShell>
  );
}
