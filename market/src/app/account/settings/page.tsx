import Link from "next/link";
import { AccountShell } from "@/components/account-shell";
import { Icon } from "@/components/icon";
import { SettingsForm } from "@/components/settings-form";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ROLE_FA } from "@/lib/panel";

export const metadata = { title: "تنظیمات" };

export default async function SettingsPage() {
  const sessionUser = await requireUser(["CUSTOMER", "ADMIN"]);
  if (!sessionUser) return null;

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    include: {
      addresses: { orderBy: { id: "asc" } },
      reviews: { include: { product: true }, orderBy: { createdAt: "desc" }, take: 4 },
    },
  });
  if (!user) return null;

  const [orderCount, openTickets, wishlistCount] = await Promise.all([
    prisma.order.count({ where: { userId: user.id } }),
    prisma.ticket.count({ where: { userId: user.id, status: { not: "CLOSED" } } }),
    prisma.wishlistItem.count({ where: { userId: user.id } }),
  ]);

  const defaultAddr = user.addresses.find((a) => a.isDefault) ?? user.addresses[0];

  return (
    <AccountShell
      title="تنظیمات حساب کاربری"
      subtitle="اطلاعات شخصی، آدرس‌ها، امنیت و اطلاع‌رسانی"
      active="/account/settings"
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
            href="/account"
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
            label: "آدرس‌ها",
            value: String(user.addresses.length),
            hint: defaultAddr ? `پیش‌فرض: ${defaultAddr.label}` : "هنوز آدرسی نیست",
            icon: "location_on" as const,
            href: "#addresses",
          },
          {
            label: "سفارش‌ها",
            value: String(orderCount),
            hint: `${openTickets} تیکت باز`,
            icon: "shopping_cart" as const,
            href: "/account/orders",
          },
          {
            label: "علاقه‌مندی",
            value: String(wishlistCount),
            hint: `${user.reviews.length ? "نظرات اخیر دارید" : "بدون نظر اخیر"}`,
            icon: "favorite" as const,
            href: "/account/wishlist",
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
          { href: "#profile", label: "اطلاعات شخصی" },
          { href: "#addresses", label: "آدرس‌ها" },
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

      {!user.addresses.length ? (
        <div className="mt-5 cyber-chamfer-sm border alert-warn px-3.5 py-3">
          <p className="text-[11px] font-bold text-on-surface-variant">آدرس ارسال</p>
          <p className="mt-1 text-sm font-semibold leading-6">
            هنوز آدرسی ثبت نشده — برای تسویه سریع‌تر، یک آدرس پیش‌فرض اضافه کنید.
          </p>
        </div>
      ) : null}

      <SettingsForm
        user={{
          name: user.name,
          email: user.email,
          phone: user.phone ?? "",
          role: user.role,
          notifyEmail: user.notifyEmail,
          notifySms: user.notifySms,
          createdAt: user.createdAt.toISOString(),
        }}
        addresses={user.addresses.map((a) => ({
          id: a.id,
          label: a.label,
          line: a.line,
          phone: a.phone,
          isDefault: a.isDefault,
        }))}
        reviews={user.reviews.map((r) => ({
          id: r.id,
          rating: r.rating,
          body: r.body,
          productTitle: r.product.title,
          productSlug: r.product.slug,
          createdAt: r.createdAt.toISOString(),
        }))}
      />
    </AccountShell>
  );
}
