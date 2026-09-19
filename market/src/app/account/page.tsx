import Link from "next/link";
import { AccountShell } from "@/components/account-shell";
import { Icon, type IconName } from "@/components/icon";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatToman } from "@/lib/format";
import { ORDER_STATUS_BADGE, ORDER_STATUS_FA, TICKET_STATUS_BADGE, TICKET_STATUS_FA } from "@/lib/panel";

export const metadata = { title: "داشبورد مشتری" };

function relativeFa(date: Date) {
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 60) return `${Math.max(1, mins)} دقیقه پیش`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours} ساعت پیش`;
  return `${Math.floor(hours / 24)} روز پیش`;
}

export default async function AccountHomePage() {
  const user = await requireUser(["CUSTOMER", "ADMIN"]);
  if (!user) return null;

  const [
    orders,
    openTicketsCount,
    wishlistCount,
    downloadsCount,
    reviewsCount,
    latestOrders,
    recentTickets,
    wishlistItems,
  ] = await Promise.all([
    prisma.order.findMany({
      where: { userId: user.id },
      select: { id: true, status: true, total: true },
    }),
    prisma.ticket.count({ where: { userId: user.id, status: { not: "CLOSED" } } }),
    prisma.wishlistItem.count({ where: { userId: user.id } }),
    prisma.orderItem.count({
      where: {
        type: "DIGITAL",
        order: { userId: user.id, status: { in: ["PAID", "PROCESSING", "SHIPPED", "COMPLETED"] } },
      },
    }),
    prisma.review.count({ where: { userId: user.id } }),
    prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { items: { select: { id: true, title: true, qty: true } } },
    }),
    prisma.ticket.findMany({
      where: { userId: user.id, status: { not: "CLOSED" } },
      orderBy: { updatedAt: "desc" },
      take: 4,
      include: { order: { select: { code: true } }, _count: { select: { messages: true } } },
    }),
    prisma.wishlistItem.findMany({
      where: { userId: user.id },
      take: 4,
      orderBy: { id: "desc" },
      include: { product: { select: { id: true, title: true, slug: true, price: true, active: true } } },
    }),
  ]);

  const orderCount = orders.length;
  const spent = orders.filter((o) => o.status !== "CANCELLED").reduce((s, o) => s + o.total, 0);
  const processing = orders.filter((o) => ["PAID", "PROCESSING", "SHIPPED"].includes(o.status)).length;
  const pendingPay = orders.filter((o) => o.status === "PENDING").length;
  const completed = orders.filter((o) => o.status === "COMPLETED").length;

  const alerts: { title: string; detail: string; href: string; kind: "order" | "ticket" | "pay" | "download" }[] = [];
  if (pendingPay) {
    alerts.push({
      kind: "pay",
      title: "پرداخت ناتمام",
      detail: `${pendingPay} سفارش در انتظار پرداخت است`,
      href: "/account/orders",
    });
  }
  if (processing) {
    alerts.push({
      kind: "order",
      title: "سفارش در جریان",
      detail: `${processing} سفارش در حال پردازش یا ارسال`,
      href: "/account/orders",
    });
  }
  if (openTicketsCount) {
    alerts.push({
      kind: "ticket",
      title: "پیام پشتیبانی",
      detail: `${openTicketsCount} تیکت باز یا در حال بررسی`,
      href: "/account/tickets",
    });
  }
  if (downloadsCount) {
    alerts.push({
      kind: "download",
      title: "دانلود دیجیتال",
      detail: `${downloadsCount} فایل آماده در کتابخانه شما`,
      href: "/account/downloads",
    });
  }

  const alertTone: Record<string, string> = {
    pay: "alert-danger",
    order: "alert-warn",
    ticket: "alert-info",
    download: "alert-ok",
  };

  const primaryKpis: { label: string; value: string; hint: string; href: string; icon: IconName }[] = [
    {
      label: "سفارش‌ها",
      value: String(orderCount),
      hint: `${completed} تکمیل‌شده`,
      href: "/account/orders",
      icon: "shopping_cart",
    },
    {
      label: "تیکت باز",
      value: String(openTicketsCount),
      hint: "پیام‌های فعال",
      href: "/account/tickets",
      icon: "support_agent",
    },
    {
      label: "علاقه‌مندی",
      value: String(wishlistCount),
      hint: "محصولات ذخیره‌شده",
      href: "/account/wishlist",
      icon: "favorite",
    },
    {
      label: "دانلودها",
      value: String(downloadsCount),
      hint: "فایل‌های دیجیتال",
      href: "/account/downloads",
      icon: "folder_zip",
    },
  ];

  return (
    <AccountShell
      title={`سلام، ${user.name}`}
      subtitle="خلاصه وضعیت حساب، سفارش‌ها و پشتیبانی"
      active="/account"
      actions={
        <>
          <Link
            href="/products"
            className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-2 text-sm font-semibold text-on-surface hover:border-primary-container hover:text-primary-container"
          >
            فروشگاه
          </Link>
          <Link
            href="/account/orders"
            className="cyber-chamfer-sm bg-cta px-3 py-2 text-sm font-semibold text-on-primary"
          >
            سفارش‌ها
          </Link>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {primaryKpis.map((c) => (
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
            <p className="text-xl font-bold tabular-nums tracking-tight sm:text-2xl">{c.value}</p>
            <p className="mt-1 text-[11px] text-on-surface-variant">{c.hint}</p>
          </Link>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: "مجموع خرید", value: formatToman(spent), href: "/account/orders", icon: "payments" as const },
          { label: "در جریان", value: String(processing), href: "/account/orders", icon: "local_shipping" as const },
          { label: "نظرات من", value: String(reviewsCount), href: "/account/reviews", icon: "star" as const },
          { label: "در انتظار پرداخت", value: String(pendingPay), href: "/account/orders", icon: "lock" as const },
        ].map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="flex items-center gap-3 cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-2.5 transition-colors hover:border-primary-container/50"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center cyber-chamfer-sm bg-surface-container-low text-primary-container">
              <Icon name={c.icon} className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-[11px] text-on-surface-variant">{c.label}</span>
              <span className="block truncate text-sm font-bold tabular-nums">{c.value}</span>
            </span>
          </Link>
        ))}
      </div>

      <section className="mt-5 cyber-chamfer border border-outline bg-surface-container-lowest p-4 sm:p-5">
        <h2 className="mb-3 text-base font-bold">میانبرهای حساب</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: "/account/downloads", label: "کتابخانه دانلود", icon: "folder_zip" as const },
            { href: "/account/reviews", label: "نظرات من", icon: "star" as const },
            { href: "/account/settings", label: "تنظیمات حساب", icon: "lock" as const },
            { href: "/account/tickets", label: "پشتیبانی", icon: "mail" as const },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 cyber-chamfer-sm border border-outline px-3 py-2.5 text-sm font-semibold transition-colors hover:border-primary-container"
            >
              <span className="flex h-8 w-8 items-center justify-center cyber-chamfer-sm bg-primary-container/10 text-primary-container">
                <Icon name={item.icon} className="h-4 w-4" />
              </span>
              {item.label}
            </Link>
          ))}
        </div>
      </section>

      {alerts.length > 0 ? (
        <section className="mt-6">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-base font-bold">نیازمند توجه</h2>
              <p className="mt-0.5 text-xs text-on-surface-variant">پرداخت، ارسال و پیام‌های باز</p>
            </div>
            <span className="alert-warn cyber-chamfer-sm px-2.5 py-0.5 text-[11px] font-bold">
              {alerts.length} مورد
            </span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {alerts.map((a) => (
              <Link
                key={`${a.kind}-${a.title}`}
                href={a.href}
                className={`cyber-chamfer-sm border px-3.5 py-3 transition-colors hover:border-primary-container/50 ${alertTone[a.kind] ?? "bg-surface"}`}
              >
                <p className="text-[11px] font-bold text-on-surface-variant">{a.title}</p>
                <p className="mt-1 text-sm font-semibold leading-6">{a.detail}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <section className="cyber-chamfer border border-outline bg-surface-container-lowest p-4 sm:p-5 lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold">آخرین سفارش‌ها</h2>
              <p className="mt-0.5 text-xs text-on-surface-variant">وضعیت و مبلغ سفارش‌های اخیر</p>
            </div>
            <Link href="/account/orders" className="text-xs font-semibold text-primary-container hover:underline">
              همه سفارش‌ها
            </Link>
          </div>

          {latestOrders.length ? (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[520px] text-sm">
                  <thead className="border-b border-outline bg-surface-container font-mono text-[11px] uppercase tracking-wider text-on-surface-variant">
                    <tr>
                      <th className="px-3 py-2.5 text-right font-medium">کد</th>
                      <th className="px-3 py-2.5 text-right font-medium">اقلام</th>
                      <th className="px-3 py-2.5 text-right font-medium">تاریخ</th>
                      <th className="px-3 py-2.5 text-right font-medium">مبلغ</th>
                      <th className="px-3 py-2.5 text-right font-medium">وضعیت</th>
                    </tr>
                  </thead>
                  <tbody>
                    {latestOrders.map((o) => (
                      <tr key={o.id} className="border-t border-outline hover:bg-surface-container-low/40">
                        <td className="px-3 py-3">
                          <Link
                            href={`/account/orders/${o.id}`}
                            className="font-semibold text-primary-container hover:underline"
                            dir="ltr"
                          >
                            {o.code}
                          </Link>
                        </td>
                        <td className="max-w-[180px] px-3 py-3 text-xs text-on-surface-variant">
                          <span className="line-clamp-1">{o.items[0]?.title ?? "—"}</span>
                          {o.items.length > 1 ? (
                            <span className="mt-0.5 block">+{o.items.length - 1} مورد دیگر</span>
                          ) : null}
                        </td>
                        <td className="px-3 py-3 text-xs tabular-nums text-on-surface-variant">
                          {new Date(o.createdAt).toLocaleDateString("fa-IR")}
                        </td>
                        <td className="px-3 py-3 font-semibold tabular-nums">{formatToman(o.total)}</td>
                        <td className="px-3 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${ORDER_STATUS_BADGE[o.status] ?? ""}`}
                          >
                            {ORDER_STATUS_FA[o.status] ?? o.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-outline md:hidden">
                {latestOrders.map((o) => (
                  <Link key={o.id} href={`/account/orders/${o.id}`} className="block py-3 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-primary-container" dir="ltr">
                          {o.code}
                        </p>
                        <p className="mt-0.5 line-clamp-1 text-xs text-on-surface-variant">
                          {o.items[0]?.title ?? "سفارش"}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${ORDER_STATUS_BADGE[o.status] ?? ""}`}
                      >
                        {ORDER_STATUS_FA[o.status] ?? o.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-bold tabular-nums">
                      {formatToman(o.total)} تومان
                      <span className="ms-2 text-[11px] font-medium text-on-surface-variant">
                        {new Date(o.createdAt).toLocaleDateString("fa-IR")}
                      </span>
                    </p>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <div className="cyber-chamfer-sm border border-dashed border-outline px-4 py-8 text-center">
              <p className="text-sm text-on-surface-variant">هنوز سفارشی ثبت نکرده‌اید.</p>
              <Link
                href="/products"
                className="mt-3 inline-flex cyber-chamfer-sm bg-cta px-4 py-2 text-sm font-semibold text-on-primary"
              >
                شروع خرید
              </Link>
            </div>
          )}
        </section>

        <div className="space-y-5">
          <section className="cyber-chamfer border border-outline bg-surface-container-lowest p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-base font-bold">پیام‌های باز</h2>
              <Link href="/account/tickets" className="text-xs font-semibold text-primary-container hover:underline">
                همه
              </Link>
            </div>
            {recentTickets.length ? (
              <ul className="space-y-2">
                {recentTickets.map((t) => (
                  <li key={t.id}>
                    <Link
                      href={`/account/tickets/${t.id}`}
                      className="block cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-2.5 hover:border-primary-container/50"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="line-clamp-1 text-sm font-semibold">{t.subject}</p>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${TICKET_STATUS_BADGE[t.status] ?? ""}`}
                        >
                          {TICKET_STATUS_FA[t.status]}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-on-surface-variant">
                        {relativeFa(t.updatedAt)} · {t._count.messages} پیام
                        {t.order ? ` · ${t.order.code}` : ""}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-on-surface-variant">تیکت بازی ندارید.</p>
            )}
            <Link
              href="/account/tickets"
              className="mt-3 inline-flex text-xs font-semibold text-primary-container hover:underline"
            >
              ثبت یا پیگیری تیکت
            </Link>
          </section>

          <section className="cyber-chamfer border border-outline bg-surface-container-lowest p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-base font-bold">علاقه‌مندی‌ها</h2>
              <Link href="/account/wishlist" className="text-xs font-semibold text-primary-container hover:underline">
                همه
              </Link>
            </div>
            {wishlistItems.length ? (
              <ul className="space-y-2">
                {wishlistItems.map((w) => (
                  <li key={w.id}>
                    <Link
                      href={`/products/${w.product.slug}`}
                      className="flex items-center justify-between gap-2 cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-2.5 hover:border-primary-container/50"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">{w.product.title}</span>
                        <span className="text-[11px] text-on-surface-variant">
                          {w.product.active ? "موجود در فروشگاه" : "غیرفعال"}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs font-bold tabular-nums text-primary-container">
                        {formatToman(w.product.price)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-on-surface-variant">لیست علاقه‌مندی خالی است.</p>
            )}
          </section>
        </div>
      </div>
    </AccountShell>
  );
}
