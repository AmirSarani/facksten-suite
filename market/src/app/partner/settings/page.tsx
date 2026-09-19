import Link from "next/link";
import { PartnerShell } from "@/components/partner-shell";
import { PartnerSettingsForm } from "@/components/partner-settings-form";
import { Icon } from "@/components/icon";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ROLE_FA } from "@/lib/panel";

export const metadata = { title: "تنظیمات همکار" };

export default async function PartnerSettingsPage() {
  const sessionUser = await requireUser(["PARTNER", "ADMIN"]);
  if (!sessionUser) return null;

  const user = await prisma.user.findUnique({ where: { id: sessionUser.id } });
  if (!user) return null;

  const products = await prisma.product.findMany({
    where: user.role === "ADMIN" ? { sellerId: { not: null } } : { sellerId: user.id },
    select: { id: true, stock: true, active: true },
  });
  const productIds = products.map((p) => p.id);
  const idFilter = productIds.length ? productIds : ["__none__"];

  const [openTickets, recentItems] = await Promise.all([
    prisma.ticket.count({
      where: {
        status: "OPEN",
        orderId: { not: null },
        order: { items: { some: { productId: { in: idFilter } } } },
      },
    }),
    prisma.orderItem.count({
      where: {
        productId: { in: idFilter },
        order: { status: { not: "CANCELLED" } },
      },
    }),
  ]);

  const activeProducts = products.filter((p) => p.active).length;
  const lowStock = products.filter((p) => p.active && p.stock > 0 && p.stock <= 5).length;

  return (
    <PartnerShell
      title="تنظیمات حساب"
      subtitle="پروفایل، امنیت و ترجیحات اطلاع‌رسانی همکار"
      active="/partner/settings"
      actions={
        <>
          <a
            href="#profile"
            className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-2 text-sm font-semibold text-on-surface hover:border-primary-container hover:text-primary-container"
          >
            پروفایل
          </a>
          <a
            href="#security"
            className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-2 text-sm font-semibold text-on-surface hover:border-primary-container hover:text-primary-container"
          >
            امنیت
          </a>
          <Link
            href="/partner"
            className="cyber-chamfer-sm bg-cta px-3 py-2 text-sm font-semibold text-on-primary"
          >
            داشبورد
          </Link>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: "نقش حساب",
            value: ROLE_FA[user.role] ?? user.role,
            hint: `عضو از ${new Date(user.createdAt).toLocaleDateString("fa-IR")}`,
            icon: "verified_user" as const,
            href: "#profile",
          },
          {
            label: "محصولات فعال",
            value: String(activeProducts),
            hint: lowStock ? `${lowStock} موجودی کم` : `${products.length} کل`,
            icon: "inventory_2" as const,
            href: "/partner/inventory",
          },
          {
            label: "اقلام فروش",
            value: String(recentItems),
            hint: "بدون سفارش‌های لغو شده",
            icon: "payments" as const,
            href: "/partner/orders",
          },
          {
            label: "تیکت باز",
            value: String(openTickets),
            hint: "نیازمند پاسخ",
            icon: "support_agent" as const,
            href: "/partner/tickets?status=OPEN",
          },
        ].map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="cyber-chamfer border border-outline bg-surface-container-lowest p-4 transition-colors hover:border-primary-container"
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <p className="text-xs font-medium text-on-surface-variant">{c.label}</p>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center cyber-chamfer-sm bg-primary-container/10 text-primary-container">
                <Icon name={c.icon} className="h-3.5 w-3.5" />
              </span>
            </div>
            <p className="text-xl font-bold tracking-tight sm:text-2xl">{c.value}</p>
            <p className="mt-1 text-[11px] text-on-surface-variant">{c.hint}</p>
          </Link>
        ))}
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {[
          { href: "#profile", label: "اطلاعات حساب" },
          { href: "#notifications", label: "اطلاع‌رسانی" },
          { href: "#security", label: "امنیت" },
          { href: "#shortcuts", label: "میانبرها" },
        ].map((s) => (
          <a
            key={s.href}
            href={s.href}
            className="shrink-0 cyber-chamfer-sm border border-outline bg-surface-container-low px-3.5 py-1.5 text-xs font-semibold text-on-surface-variant hover:border-primary-container"
          >
            {s.label}
          </a>
        ))}
      </div>

      <PartnerSettingsForm
        user={{
          name: user.name,
          email: user.email,
          phone: user.phone ?? "",
          role: user.role,
          notifyEmail: user.notifyEmail,
          notifySms: user.notifySms,
          createdAt: user.createdAt.toISOString(),
        }}
      />
    </PartnerShell>
  );
}
