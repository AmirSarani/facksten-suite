import Link from "next/link";
import { AccountShell } from "@/components/account-shell";
import { DownloadsLibrary } from "@/components/downloads-library";
import { Icon } from "@/components/icon";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const metadata = { title: "دانلودها" };

export default async function DownloadsPage() {
  const user = await requireUser(["CUSTOMER", "ADMIN"]);
  if (!user) return null;

  const items = await prisma.orderItem.findMany({
    where: {
      type: "DIGITAL",
      order: { userId: user.id, status: { in: ["PAID", "PROCESSING", "SHIPPED", "COMPLETED"] } },
    },
    include: {
      product: { include: { files: true } },
      order: true,
    },
    orderBy: { id: "desc" },
  });

  const withFiles = items.filter((i) => i.product.files.length > 0).length;
  const fileCount = items.reduce((s, i) => s + i.product.files.length, 0);
  const orderCodes = new Set(items.map((i) => i.order.code));
  const recentCutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
  const recent = items.filter((i) => i.order.createdAt.getTime() >= recentCutoff || i.product.isNew).length;

  return (
    <AccountShell
      title="کتابخانه دانلودهای دیجیتال"
      subtitle="فایل‌ها، کدها و پروژه‌های خریداری‌شده"
      active="/account/downloads"
      actions={
        <>
          <Link
            href="/account/orders"
            className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-2 text-sm font-semibold text-on-surface hover:border-primary-container hover:text-primary-container"
          >
            سفارش‌ها
          </Link>
          <Link
            href="/shop?type=DIGITAL"
            className="cyber-chamfer-sm bg-cta px-3 py-2 text-sm font-semibold text-on-primary"
          >
            محصولات دیجیتال
          </Link>
        </>
      }
    >
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: "محصولات خریداری‌شده",
            value: String(items.length),
            hint: `${orderCodes.size} سفارش`,
            icon: "folder_zip" as const,
          },
          {
            label: "فایل‌های آماده",
            value: String(fileCount),
            hint: `${withFiles} محصول با فایل`,
            icon: "download" as const,
          },
          {
            label: "جدید / اخیر",
            value: String(recent),
            hint: "۱۴ روز اخیر یا نسخه جدید",
            icon: "new_releases" as const,
          },
          {
            label: "بدون فایل",
            value: String(items.length - withFiles),
            hint: "نیازمند پیگیری پشتیبانی",
            icon: "support_agent" as const,
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

      <DownloadsLibrary
        items={items.map((item) => ({
          id: item.id,
          title: item.title,
          orderId: item.order.id,
          orderCode: item.order.code,
          purchasedAt: item.order.createdAt.toISOString(),
          productSlug: item.product.slug,
          fileLabel: item.product.fileLabel,
          fileSize: item.product.fileSize,
          isNew: item.product.isNew || item.order.createdAt.getTime() >= recentCutoff,
          files: item.product.files.map((f) => ({ id: f.id, name: f.name, url: f.url })),
        }))}
      />
    </AccountShell>
  );
}
