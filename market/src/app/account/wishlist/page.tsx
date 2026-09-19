import Link from "next/link";
import { AccountShell } from "@/components/account-shell";
import { Icon } from "@/components/icon";
import { WishlistLibrary } from "@/components/wishlist-library";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatToman } from "@/lib/format";
import { productImagePath } from "@/lib/media";

export const metadata = { title: "علاقه‌مندی" };

export default async function WishlistPage() {
  const user = await requireUser(["CUSTOMER", "ADMIN"]);
  if (!user) return null;

  const items = await prisma.wishlistItem.findMany({
    where: { userId: user.id },
    include: { product: true },
    orderBy: { id: "desc" },
  });

  const hardware = items.filter((i) => i.product.type === "HARDWARE").length;
  const digital = items.filter((i) => i.product.type === "DIGITAL").length;
  const inStock = items.filter((i) => i.product.inStock && i.product.active).length;
  const outOfStock = items.length - inStock;
  const totalValue = items.reduce((s, i) => s + i.product.price, 0);

  return (
    <AccountShell
      title="علاقه‌مندی‌ها"
      subtitle="محصولات ذخیره‌شده برای خرید بعدی"
      active="/account/wishlist"
      actions={
        <>
          <Link
            href="/cart"
            className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-2 text-sm font-semibold text-on-surface hover:border-primary-container hover:text-primary-container"
          >
            سبد خرید
          </Link>
          <Link
            href="/shop"
            className="cyber-chamfer-sm bg-cta px-3 py-2 text-sm font-semibold text-on-primary"
          >
            ادامه خرید
          </Link>
        </>
      }
    >
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: "کل موارد",
            value: String(items.length),
            hint: `${formatToman(totalValue)} تومان جمع`,
            icon: "favorite" as const,
          },
          {
            label: "موجود",
            value: String(inStock),
            hint: outOfStock ? `${outOfStock} ناموجود` : "همه قابل خرید",
            icon: "check_circle" as const,
          },
          {
            label: "سخت‌افزار",
            value: String(hardware),
            hint: "قطعات و ماژول‌ها",
            icon: "developer_board" as const,
          },
          {
            label: "دیجیتال",
            value: String(digital),
            hint: "فایل و پروژه",
            icon: "folder_zip" as const,
          },
        ].map((c) => (
          <div key={c.label} className="cyber-chamfer border border-outline bg-surface-container-lowest p-4">
            <div className="mb-2 flex items-start justify-between gap-2">
              <p className="text-xs font-medium text-on-surface-variant">{c.label}</p>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center cyber-chamfer-sm bg-primary-container/10 text-primary-container">
                <Icon name={c.icon} className="h-3.5 w-3.5" />
              </span>
            </div>
            <p className="text-xl font-bold tabular-nums tracking-tight sm:text-2xl">{c.value}</p>
            <p className="mt-1 text-[11px] text-on-surface-variant">{c.hint}</p>
          </div>
        ))}
      </div>

      {outOfStock > 0 ? (
        <div className="mb-5 cyber-chamfer-sm border alert-warn px-3.5 py-3">
          <p className="text-[11px] font-bold text-on-surface-variant">توجه موجودی</p>
          <p className="mt-1 text-sm font-semibold leading-6">
            {outOfStock} مورد از لیست فعلاً ناموجود یا غیرفعال است — قبل از خرید وضعیت را چک کنید.
          </p>
        </div>
      ) : null}

      <WishlistLibrary
        items={items.map((i) => ({
          id: i.id,
          productId: i.productId,
          title: i.product.title,
          slug: i.product.slug,
          price: i.product.price,
          compareAtPrice: i.product.compareAtPrice,
          type: i.product.type,
          inStock: i.product.inStock,
          active: i.product.active,
          image: i.product.image || productImagePath(i.product.slug, i.product.title),
          brand: i.product.brand,
          badge: i.product.badge,
        }))}
      />
    </AccountShell>
  );
}
