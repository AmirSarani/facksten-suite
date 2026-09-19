import Link from "next/link";
import { AdminSalesChart } from "@/components/admin-dashboard-charts";
import { PartnerShell } from "@/components/partner-shell";
import { Icon } from "@/components/icon";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatToman } from "@/lib/format";
import { UI_IMAGES } from "@/lib/media";
import { ORDER_STATUS_BADGE, ORDER_STATUS_FA } from "@/lib/panel";

export const metadata = { title: "پنل همکار" };

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

const LOW_STOCK = 5;

export default async function PartnerDashboard() {
  const user = await requireUser(["PARTNER", "ADMIN"]);
  if (!user) return null;

  const sellerId = user.role === "ADMIN" ? undefined : user.id;
  const products = await prisma.product.findMany({
    where: sellerId ? { sellerId } : { sellerId: { not: null } },
    orderBy: { updatedAt: "desc" },
  });
  const productIds = products.map((p) => p.id);
  const productById = new Map(products.map((p) => [p.id, p]));

  const since = new Date();
  since.setDate(since.getDate() - 29);
  since.setHours(0, 0, 0, 0);

  const [orderItems, chartItems, openTickets, recentTickets] = await Promise.all([
    prisma.orderItem.findMany({
      where: { productId: { in: productIds.length ? productIds : ["__none__"] }, order: { status: { not: "CANCELLED" } } },
      include: { order: { include: { user: true } } },
      orderBy: { id: "desc" },
      take: 40,
    }),
    prisma.orderItem.findMany({
      where: {
        productId: { in: productIds.length ? productIds : ["__none__"] },
        order: { status: { not: "CANCELLED" }, createdAt: { gte: since } },
      },
      include: { order: { select: { createdAt: true } } },
    }),
    prisma.ticket.count({
      where: {
        status: { in: ["OPEN", "ANSWERED"] },
        orderId: { not: null },
        order: { items: { some: { productId: { in: productIds.length ? productIds : ["__none__"] } } } },
      },
    }),
    prisma.ticket.findMany({
      where: {
        status: { in: ["OPEN", "ANSWERED"] },
        orderId: { not: null },
        order: { items: { some: { productId: { in: productIds.length ? productIds : ["__none__"] } } } },
      },
      orderBy: { updatedAt: "desc" },
      take: 4,
      include: { user: { select: { name: true } } },
    }),
  ]);

  const byDay = new Map<string, number>();
  for (let i = 0; i < 30; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    byDay.set(dayKey(d), 0);
  }
  for (const item of chartItems) {
    const key = dayKey(item.order.createdAt);
    byDay.set(key, (byDay.get(key) ?? 0) + item.price * item.qty);
  }
  const salesSeries = Array.from(byDay.entries()).map(([key, value]) => ({ key, value }));
  const sales30 = salesSeries.reduce((s, p) => s + p.value, 0);

  const salesRecent = orderItems.reduce((s, i) => s + i.price * i.qty, 0);
  const stockValue = products.reduce((s, p) => s + p.price * Math.max(0, p.stock), 0);
  const activeProducts = products.filter((p) => p.active).length;
  const lowStock = products.filter((p) => p.active && p.stock > 0 && p.stock <= LOW_STOCK);
  const outOfStock = products.filter((p) => p.active && p.stock <= 0);

  const activeOrders = new Set(
    orderItems.filter((i) => ["PAID", "PROCESSING", "SHIPPED"].includes(i.order.status)).map((i) => i.orderId),
  ).size;

  // Unique recent orders with partner share
  const seenOrders = new Set<string>();
  const recentOrders: {
    orderId: string;
    code: string;
    customer: string;
    createdAt: Date;
    status: string;
    share: number;
  }[] = [];
  for (const i of orderItems) {
    if (seenOrders.has(i.orderId)) {
      const row = recentOrders.find((r) => r.orderId === i.orderId);
      if (row) row.share += i.price * i.qty;
      continue;
    }
    seenOrders.add(i.orderId);
    recentOrders.push({
      orderId: i.orderId,
      code: i.order.code,
      customer: i.order.user.name,
      createdAt: i.order.createdAt,
      status: i.order.status,
      share: i.price * i.qty,
    });
    if (recentOrders.length >= 8) break;
  }

  // Top products by qty in last 30 days
  const soldQty = new Map<string, { qty: number; revenue: number }>();
  for (const item of chartItems) {
    const cur = soldQty.get(item.productId) ?? { qty: 0, revenue: 0 };
    cur.qty += item.qty;
    cur.revenue += item.price * item.qty;
    soldQty.set(item.productId, cur);
  }
  const topProducts = Array.from(soldQty.entries())
    .map(([id, stats]) => ({ product: productById.get(id), ...stats }))
    .filter((x) => x.product)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const alerts: { title: string; detail: string; href: string; kind: "stock" | "ticket" | "order" | "catalog" }[] = [];
  if (outOfStock.length) {
    alerts.push({
      kind: "stock",
      title: "ناموجود",
      detail: `${outOfStock.length} کالای فعال موجودی صفر دارد`,
      href: "/partner/inventory",
    });
  }
  if (lowStock.length) {
    alerts.push({
      kind: "stock",
      title: "کم‌موجودی",
      detail: `${lowStock.length} کالا کمتر از ${LOW_STOCK} عدد در انبار`,
      href: "/partner/inventory",
    });
  }
  if (openTickets > 0) {
    alerts.push({
      kind: "ticket",
      title: "تیکت باز",
      detail: `${openTickets} تیکت مرتبط با سفارش‌های شما نیاز به پیگیری دارد`,
      href: "/partner/tickets",
    });
  }
  if (activeOrders > 0) {
    alerts.push({
      kind: "order",
      title: "سفارش فعال",
      detail: `${activeOrders} سفارش در وضعیت پرداخت‌شده / پردازش / ارسال`,
      href: "/partner/orders",
    });
  }
  if (!products.length) {
    alerts.push({
      kind: "catalog",
      title: "کاتالوگ خالی",
      detail: "هنوز محصولی ثبت نشده — از موجودی شروع کنید",
      href: "/partner/inventory",
    });
  }

  const alertTone: Record<string, string> = {
    stock: "alert-danger",
    ticket: "alert-info",
    order: "alert-warn",
    catalog: "alert-info",
  };

  const kpis = [
    {
      label: "فروش ۳۰ روز",
      value: formatToman(sales30),
      hint: `نمایش اخیر: ${formatToman(salesRecent)}`,
      href: "/partner/orders",
      icon: "shopping_cart" as const,
    },
    {
      label: "سفارشات فعال",
      value: String(activeOrders),
      hint: "پرداخت / پردازش / ارسال",
      href: "/partner/orders",
      icon: "local_shipping" as const,
    },
    {
      label: "ارزش انبار",
      value: formatToman(stockValue),
      hint: `${activeProducts} کالای فعال`,
      href: "/partner/inventory",
      icon: "inventory_2" as const,
    },
    {
      label: "تیکت‌های باز",
      value: String(openTickets),
      hint: openTickets ? "نیاز به پیگیری" : "همه پاسخ‌داده‌شده",
      href: "/partner/tickets",
      icon: "mail" as const,
    },
  ];

  return (
    <PartnerShell
      title="نمای کلی داشبورد"
      subtitle="عملکرد فروش و موجودی شما در ۳۰ روز گذشته"
      active="/partner"
      actions={
        <>
          <Link
            href="/partner/inventory"
            className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-2 text-sm font-semibold text-on-surface hover:border-primary-container hover:text-primary-container"
          >
            موجودی
          </Link>
          <Link
            href="/partner/orders"
            className="inline-flex items-center justify-center gap-2 cyber-chamfer-sm bg-cta px-3 py-2 text-sm font-semibold text-on-primary"
          >
            <Icon name="download" className="h-4 w-4" />
            گزارش فروش
          </Link>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((c) => (
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
          { label: "کم‌موجودی", value: String(lowStock.length), href: "/partner/inventory", icon: "inventory_2" as const },
          { label: "ناموجود", value: String(outOfStock.length), href: "/partner/inventory", icon: "remove" as const },
          { label: "کل کالا", value: String(products.length), href: "/partner/inventory", icon: "schema" as const },
          { label: "تیکت پیگیری", value: String(openTickets), href: "/partner/tickets", icon: "support_agent" as const },
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

      {alerts.length > 0 ? (
        <section className="mt-6">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-base font-bold">نیازمند اقدام</h2>
              <p className="mt-0.5 text-xs text-on-surface-variant">موجودی، سفارش و تیکت‌های فوری</p>
            </div>
            <span className="alert-warn cyber-chamfer-sm px-2.5 py-0.5 text-[11px] font-bold">
              {alerts.length} مورد
            </span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {alerts.map((a, i) => (
              <Link
                key={`${a.kind}-${i}`}
                href={a.href}
                className={`cyber-chamfer-sm border px-3.5 py-3 transition-colors hover:border-primary-container/50 ${alertTone[a.kind] ?? "bg-surface"}`}
              >
                <p className="text-[11px] font-bold text-on-surface-variant">{a.title}</p>
                <p className="mt-1 text-sm font-semibold leading-6 text-on-surface">{a.detail}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-3 lg:gap-5">
        <div className="lg:col-span-2">
          <AdminSalesChart
            series={salesSeries}
            total={sales30}
            title="روند فروش (۳۰ روز اخیر)"
            subtitle="سهم شما از سفارش‌های غیرلغو‌شده"
            totalLabel="مجموع ۳۰ روز"
          />
        </div>

        <div className="space-y-4">
          <section className="cyber-chamfer border border-outline bg-surface-container-lowest p-4 sm:p-5">
            <h2 className="mb-3 text-base font-bold">دسترسی سریع</h2>
            <div className="space-y-2">
              {[
                { href: "/partner/inventory", label: "مدیریت موجودی", icon: "inventory_2" as const },
                { href: "/partner/orders", label: "گزارش فروش", icon: "shopping_cart" as const },
                { href: "/partner/tickets", label: "تیکت‌های مرتبط", icon: "mail" as const },
                { href: "/partner/settings", label: "تنظیمات حساب", icon: "person" as const },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="flex min-h-11 items-center justify-between cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-2.5 text-sm font-semibold transition-colors hover:border-primary-container hover:bg-surface-container-low/50"
                >
                  <span className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center cyber-chamfer-sm bg-primary-container/10 text-primary-container">
                      <Icon name={l.icon} className="h-4 w-4" />
                    </span>
                    {l.label}
                  </span>
                  <Icon name="arrow_forward" className="h-4 w-4 rotate-180 text-on-surface-variant" />
                </Link>
              ))}
            </div>
          </section>

          <section className="cyber-chamfer border border-outline bg-surface-container-lowest p-4 sm:p-5">
            <p className="text-[11px] font-bold text-on-surface-variant">مدیر حساب شما</p>
            <div className="mt-3 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={UI_IMAGES.partnerManager} alt="" className="h-11 w-11 rounded-full object-cover" />
              <div className="min-w-0">
                <p className="font-bold text-on-surface">سارا محمدی</p>
                <a
                  href="mailto:partner-support@facksten.com"
                  className="mt-0.5 block truncate text-xs text-primary-container hover:underline"
                  dir="ltr"
                >
                  partner-support@facksten.com
                </a>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-5 lg:gap-5">
        <section className="cyber-chamfer border border-outline bg-surface-container-lowest p-4 sm:p-5 lg:col-span-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold">آخرین سفارش‌ها</h2>
              <p className="mt-0.5 text-xs text-on-surface-variant">سهم شما از هر سفارش</p>
            </div>
            <Link href="/partner/orders" className="text-xs font-semibold text-primary-container hover:underline">
              همه فروش‌ها
            </Link>
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="text-[11px] text-on-surface-variant">
                <tr className="border-b border-outline">
                  <th className="py-2 text-right font-medium">سفارش</th>
                  <th className="py-2 text-right font-medium">مشتری</th>
                  <th className="py-2 text-right font-medium">وضعیت</th>
                  <th className="py-2 text-right font-medium">سهم شما</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o.orderId} className="border-b border-outline/70 last:border-0">
                    <td className="py-2.5">
                      <Link
                        href={`/partner/orders/${o.orderId}`}
                        className="font-semibold text-primary-container hover:underline"
                        dir="ltr"
                      >
                        {o.code}
                      </Link>
                      <span className="mt-0.5 block text-[11px] text-on-surface-variant">
                        {new Date(o.createdAt).toLocaleDateString("fa-IR")}
                      </span>
                    </td>
                    <td className="py-2.5">{o.customer}</td>
                    <td className="py-2.5">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${ORDER_STATUS_BADGE[o.status] ?? ""}`}>
                        {ORDER_STATUS_FA[o.status] ?? o.status}
                      </span>
                    </td>
                    <td className="py-2.5 tabular-nums font-medium">{formatToman(o.share)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-outline md:hidden">
            {recentOrders.map((o) => (
              <Link key={o.orderId} href={`/partner/orders/${o.orderId}`} className="block py-3 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-primary-container" dir="ltr">
                      {o.code}
                    </p>
                    <p className="mt-0.5 text-xs text-on-surface-variant">{o.customer}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${ORDER_STATUS_BADGE[o.status] ?? ""}`}>
                    {ORDER_STATUS_FA[o.status] ?? o.status}
                  </span>
                </div>
                <p className="mt-1 text-sm font-medium tabular-nums">{formatToman(o.share)} تومان</p>
              </Link>
            ))}
          </div>

          {!recentOrders.length ? (
            <p className="py-8 text-center text-sm text-on-surface-variant">هنوز فروشی از محصولات شما ثبت نشده.</p>
          ) : null}
        </section>

        <div className="space-y-4 lg:col-span-2">
          <section className="cyber-chamfer border border-outline bg-surface-container-lowest p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-base font-bold">پرفروش‌های ۳۰ روز</h2>
              <Link href="/partner/inventory" className="text-xs font-semibold text-primary-container hover:underline">
                موجودی
              </Link>
            </div>
            <ul className="space-y-2.5">
              {topProducts.map((row, idx) => (
                <li key={row.product!.id} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-surface-container-low text-[11px] font-bold text-on-surface-variant">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{row.product!.title}</p>
                    <p className="mt-0.5 text-[11px] text-on-surface-variant">
                      {row.qty} عدد · {formatToman(row.revenue)} تومان
                    </p>
                  </div>
                </li>
              ))}
              {!topProducts.length ? (
                <li className="py-4 text-center text-sm text-on-surface-variant">فروشی در ۳۰ روز اخیر نیست.</li>
              ) : null}
            </ul>
          </section>

          <section className="cyber-chamfer border border-outline bg-surface-container-lowest p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-base font-bold">تیکت‌های باز</h2>
              <Link href="/partner/tickets" className="text-xs font-semibold text-primary-container hover:underline">
                همه
              </Link>
            </div>
            <ul className="space-y-2.5">
              {recentTickets.map((t) => (
                <li key={t.id}>
                  <Link href={`/partner/tickets/${t.id}`} className="block cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-2.5 hover:border-primary-container">
                    <p className="line-clamp-1 text-sm font-semibold">{t.subject}</p>
                    <p className="mt-0.5 text-[11px] text-on-surface-variant">
                      {t.user.name} · <span dir="ltr">{t.code}</span>
                    </p>
                  </Link>
                </li>
              ))}
              {!recentTickets.length ? (
                <li className="py-4 text-center text-sm text-on-surface-variant">تیکت بازی مرتبط نیست.</li>
              ) : null}
            </ul>
          </section>

          {(lowStock.length > 0 || outOfStock.length > 0) && (
            <section className="cyber-chamfer border border-outline bg-surface-container-lowest p-4 sm:p-5">
              <h2 className="mb-3 text-base font-bold">هشدار موجودی</h2>
              <ul className="space-y-2">
                {[...outOfStock, ...lowStock].slice(0, 5).map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="min-w-0 truncate font-medium">{p.title}</span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        p.stock <= 0 ? "alert-danger" : "alert-warn"
                      }`}
                    >
                      {p.stock <= 0 ? "ناموجود" : `${p.stock} عدد`}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </PartnerShell>
  );
}
