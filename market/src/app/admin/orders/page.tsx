import Link from "next/link";
import type { ReactNode } from "react";
import { AdminOrdersTrendChart, AdminStatusBreakdown } from "@/components/admin-dashboard-charts";
import { AdminShell } from "@/components/admin-shell";
import { Icon } from "@/components/icon";
import { OrderStatusSelect } from "@/components/order-status-select";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAdminOrdersHubMock } from "@/lib/admin-orders-mock";
import { formatToman } from "@/lib/format";
import { ORDER_STATUS_FA } from "@/lib/panel";
import type { OrderStatus, Prisma } from "@/generated/prisma/client";

export const metadata = { title: "سفارش‌های ادمین" };

type Props = { searchParams: Promise<{ status?: string; q?: string }> };

const alertTone: Record<string, string> = {
  order: "alert-warn",
  stock: "alert-danger",
  ticket: "alert-info",
  article: "alert-info",
};

const statusBadge: Partial<Record<OrderStatus, string>> = {
  PENDING: "alert-warn",
  PAID: "alert-info",
  PROCESSING: "alert-info",
  SHIPPED: "alert-warn",
  COMPLETED: "alert-ok",
  CANCELLED: "alert-danger",
};

function SectionTitle({
  id,
  title,
  hint,
  action,
}: {
  id?: string;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div id={id} className="mb-3 flex flex-wrap items-end justify-between gap-2 scroll-mt-4">
      <div>
        <h2 className="text-base font-bold text-on-surface">{title}</h2>
        {hint ? <p className="mt-0.5 text-xs text-on-surface-variant">{hint}</p> : null}
      </div>
      {action}
    </div>
  );
}

export default async function AdminOrdersPage({ searchParams }: Props) {
  await requireUser(["ADMIN"]);
  const sp = await searchParams;
  const q = sp.q?.trim();
  const status =
    sp.status && Object.keys(ORDER_STATUS_FA).includes(sp.status) ? (sp.status as OrderStatus) : undefined;
  const activeStatus = status ?? "";

  const where: Prisma.OrderWhereInput = {
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [{ code: { contains: q } }, { user: { name: { contains: q } } }, { user: { email: { contains: q } } }],
        }
      : {}),
  };

  const [orders, hub] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { user: true, items: true },
      orderBy: { createdAt: "desc" },
    }),
    Promise.resolve(getAdminOrdersHubMock()),
  ]);

  return (
    <AdminShell
      title="سفارش‌ها"
      subtitle="عملیات فروش، ارسال و صف‌های مرتبط"
      active="/admin/orders"
      actions={
        <>
          <a
            href="#orders-list"
            className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-2 text-sm font-semibold text-on-surface hover:border-primary-container hover:text-primary-container"
          >
            برو به لیست
          </a>
          <Link
            href="/admin/tickets?status=OPEN"
            className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-2 text-sm font-semibold text-on-surface hover:border-primary-container hover:text-primary-container"
          >
            تیکت‌های باز
          </Link>
          <Link
            href="/admin/products?stock=low"
            className="cyber-chamfer-sm bg-cta px-3 py-2 text-sm font-semibold text-on-primary"
          >
            موجودی کم
          </Link>
        </>
      }
    >
      {/* Primary KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {hub.primaryKpis.map((c) => (
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
            <p className="text-xl font-bold tabular-nums tracking-tight text-on-surface sm:text-2xl">{c.value}</p>
            <p className="mt-1 text-[11px] text-on-surface-variant">{c.hint}</p>
          </Link>
        ))}
      </div>

      {/* Secondary metrics — compact strip */}
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {hub.secondaryKpis.map((c) => (
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

      {/* Action queue — first for ops */}
      <section id="orders-action" className="mt-6 scroll-mt-4">
        <SectionTitle
          title="نیازمند اقدام الان"
          hint="هشدارهای سفارش، موجودی و تیکت مرتبط"
          action={
            <span className="alert-warn cyber-chamfer-sm px-2.5 py-0.5 text-[11px] font-bold">
              {hub.alerts.length} مورد
            </span>
          }
        />
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {hub.alerts.map((a, i) => (
            <Link
              key={`${a.kind}-${i}`}
              href={a.href}
              className={`cyber-chamfer-sm border px-3.5 py-3 transition-colors hover:border-primary-container/50 ${alertTone[a.kind] ?? "bg-surface"}`}
            >
              <p className="text-[11px] font-bold text-on-surface-variant">{a.title}</p>
              <p className="mt-1 text-sm font-semibold leading-6 text-on-surface">{a.detail}</p>
            </Link>
          ))}
          {hub.fulfillment.map((f) => (
            <Link
              key={f.label}
              href={f.href}
              className="flex items-center justify-between gap-3 cyber-chamfer-sm border border-outline bg-surface-container-lowest px-3.5 py-3 hover:border-primary-container/40"
            >
              <span>
                <span className="block text-sm font-semibold">{f.label}</span>
                <span className="text-[11px] text-on-surface-variant">{f.hint}</span>
              </span>
              <span className="text-xl font-bold tabular-nums text-primary-container">{f.value}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Status chips → jump to list */}
      <div className="mt-5 max-w-full min-w-0 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {hub.statusShortcuts.map((s) => {
          const active = s.status === activeStatus;
          return (
            <Link
              key={s.href}
              href={s.href}
              className={`flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors ${
                active
                  ? "border-primary-container bg-cta text-on-primary"
                  : "border-outline bg-surface-container-low text-on-surface hover:border-primary-container"
              }`}
            >
              <Icon name={s.icon} className={`h-3.5 w-3.5 ${active ? "text-on-primary" : "text-primary-container"}`} />
              {s.label}
              <span
                className={`rounded-md px-1.5 py-0.5 text-[11px] tabular-nums ${
                  active ? "bg-on-primary/20 text-on-primary" : "bg-surface-container-low text-on-surface-variant"
                }`}
              >
                {s.count}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Analytics */}
      <section id="orders-analytics" className="mt-6 scroll-mt-4">
        <div className="grid gap-4 lg:grid-cols-3 lg:gap-5">
          <div className="lg:col-span-2">
            <AdminOrdersTrendChart
              salesSeries={hub.salesSeries}
              orderCountSeries={hub.orderCountSeries}
              salesTotal={hub.sales30Total}
              ordersTotal={hub.orders30Total}
            />
          </div>
          <AdminStatusBreakdown byStatus={hub.byStatus} byType={hub.byType} />
        </div>
      </section>

      {/* Products + payments */}
      <div className="mt-6 grid gap-4 lg:grid-cols-5 lg:gap-5">
        <section className="cyber-chamfer border border-outline bg-surface-container-lowest p-4 sm:p-5 lg:col-span-3">
          <SectionTitle
            title="پرفروش‌های ۳۰ روز"
            hint="بر اساس تعداد فروش در سفارش‌ها"
            action={
              <Link href="/admin/products" className="text-xs font-semibold text-primary-container hover:underline">
                کاتالوگ
              </Link>
            }
          />
          <div className="table-scroll max-w-full min-w-0 overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="border-b border-outline text-[11px] text-on-surface-variant">
                  <th className="pb-2.5 text-right font-medium">#</th>
                  <th className="pb-2.5 text-right font-medium">محصول</th>
                  <th className="pb-2.5 text-right font-medium">تعداد</th>
                  <th className="pb-2.5 text-right font-medium">درآمد</th>
                </tr>
              </thead>
              <tbody>
                {hub.topProducts.map((p, idx) => (
                  <tr key={p.productId} className="border-b border-outline/50 last:border-0">
                    <td className="py-2.5 tabular-nums text-on-surface-variant">{idx + 1}</td>
                    <td className="py-2.5">
                      <Link href={p.href} className="font-semibold hover:text-primary-container">
                        {p.title}
                      </Link>
                    </td>
                    <td className="py-2.5 tabular-nums">{p.qty}</td>
                    <td className="py-2.5 tabular-nums font-medium">{formatToman(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="cyber-chamfer border border-outline bg-surface-container-lowest p-4 sm:p-5 lg:col-span-2">
          <SectionTitle title="روش پرداخت" hint="ترکیب ۳۰ روز اخیر" />
          <ul className="space-y-3">
            {hub.paymentMix.map((p) => (
              <li key={p.label}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="font-semibold">{p.label}</span>
                  <span className="tabular-nums text-on-surface-variant">
                    {p.count} · {p.pct}٪
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-container-high">
                  <div className="h-full rounded-full bg-primary-container" style={{ width: `${p.pct}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Queues: users + partners */}
      <section id="orders-queues" className="mt-6 scroll-mt-4">
        <div className="grid gap-4 lg:grid-cols-2 lg:gap-5">
          <div className="cyber-chamfer border border-outline bg-surface-container-lowest p-4 sm:p-5">
            <SectionTitle
              title="درخواست‌های کاربران"
              hint="تیکت‌های مرتبط با سفارش و پشتیبانی"
              action={
                <Link href="/admin/tickets" className="text-xs font-semibold text-primary-container hover:underline">
                  همه
                </Link>
              }
            />
            <ul className="space-y-2">
              {hub.userRequests.map((t) => (
                <li key={t.title}>
                  <Link
                    href={t.href}
                    className="block cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-2.5 hover:border-primary-container/40"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold leading-6">{t.title}</p>
                      {t.badge ? (
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${t.badgeClass ?? ""}`}>
                          {t.badge}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-[11px] text-on-surface-variant">{t.meta}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="cyber-chamfer border border-outline bg-surface-container-lowest p-4 sm:p-5">
            <SectionTitle
              title="درخواست‌های همکاران"
              hint="تسویه، موجودی و SKU"
              action={
                <Link
                  href="/admin/users?role=PARTNER"
                  className="text-xs font-semibold text-primary-container hover:underline"
                >
                  همکاران
                </Link>
              }
            />
            <ul className="space-y-2">
              {hub.partnerRequests.map((t) => (
                <li key={t.title}>
                  <Link
                    href={t.href}
                    className="block cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-2.5 hover:border-primary-container/40"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold leading-6">{t.title}</p>
                      {t.badge ? (
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${t.badgeClass ?? ""}`}>
                          {t.badge}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-[11px] text-on-surface-variant">{t.meta}</p>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-4 border-t border-outline pt-3">
              <p className="mb-2 text-[11px] font-bold text-on-surface-variant">موجودی کم همکار</p>
              <ul className="space-y-1.5 text-sm">
                {hub.partnerLowStock.map((p) => (
                  <li key={p.title} className="flex justify-between gap-2">
                    <Link href={p.href} className="font-semibold hover:text-primary-container">
                      {p.title}
                    </Link>
                    <span className="shrink-0 text-[11px] text-on-surface-variant">{p.meta}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Live order list */}
      <section id="orders-list" className="mt-8 scroll-mt-4 border-t border-outline pt-6">
        <SectionTitle
          title="لیست سفارش‌ها"
          hint={`داده واقعی · ${orders.length} مورد${status ? ` · ${ORDER_STATUS_FA[status]}` : ""}${q ? ` · «${q}»` : ""}`}
        />

        <form className="mb-4 flex flex-wrap items-center gap-2 cyber-chamfer border border-outline bg-surface-container-lowest p-3">
          <div className="relative min-w-0 flex-1 basis-[200px]">
            <Icon
              name="search"
              className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-on-surface-variant"
            />
            <input
              name="q"
              defaultValue={q}
              placeholder="کد سفارش، نام یا ایمیل مشتری"
              className="w-full cyber-chamfer-sm border border-outline bg-surface-container-lowest-container-low py-2.5 pr-10 pl-3 text-sm outline-none focus:border-primary-container"
            />
          </div>
          <select
            name="status"
            defaultValue={sp.status ?? ""}
            className="cyber-chamfer-sm border border-outline bg-surface-container-lowest-container-low px-3 py-2.5 text-sm outline-none focus:border-primary-container"
          >
            <option value="">همه وضعیت‌ها</option>
            {Object.entries(ORDER_STATUS_FA).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="cyber-chamfer-sm bg-cta px-4 py-2.5 text-sm font-semibold text-on-primary"
          >
            اعمال فیلتر
          </button>
          {(q || status) && (
            <Link
              href="/admin/orders#orders-list"
              className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-2.5 text-sm font-semibold hover:border-primary-container hover:text-primary-container"
            >
              پاک کردن
            </Link>
          )}
        </form>

        <div className="cyber-chamfer border border-outline bg-surface-container-lowest">
          <div className="table-scroll hidden max-w-full min-w-0 overflow-x-auto md:block">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b border-outline bg-surface-container font-mono text-[11px] uppercase tracking-wider text-on-surface-variant">
                <tr>
                  <th className="px-4 py-3 text-right font-medium">کد</th>
                  <th className="px-4 py-3 text-right font-medium">مشتری</th>
                  <th className="px-4 py-3 text-right font-medium">اقلام</th>
                  <th className="px-4 py-3 text-right font-medium">مبلغ</th>
                  <th className="px-4 py-3 text-right font-medium">تاریخ</th>
                  <th className="px-4 py-3 text-right font-medium">وضعیت</th>
                  <th className="px-4 py-3 text-right font-medium">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-t border-outline hover:bg-surface-container-low/40">
                    <td className="px-4 py-3 font-bold tracking-wide" dir="ltr">
                      {o.code}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold">{o.user.name}</span>
                      <span className="mt-0.5 block text-[11px] text-on-surface-variant" dir="ltr">
                        {o.user.email}
                      </span>
                    </td>
                    <td className="max-w-[220px] px-4 py-3 text-on-surface-variant">
                      <span className="line-clamp-2">
                        {o.items
                          .slice(0, 2)
                          .map((i) => `${i.title} × ${i.qty}`)
                          .join(" · ")}
                        {o.items.length > 2 ? ` · +${o.items.length - 2}` : ""}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums font-medium">{formatToman(o.total)}</td>
                    <td className="px-4 py-3 tabular-nums text-on-surface-variant">
                      {new Date(o.createdAt).toLocaleDateString("fa-IR")}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${statusBadge[o.status] ?? "bg-surface-container-high"}`}
                      >
                        {ORDER_STATUS_FA[o.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <OrderStatusSelect orderId={o.id} status={o.status} />
                        <Link
                          href={`/admin/orders/${o.id}`}
                          className="cyber-chamfer-sm border border-outline bg-surface-container-low px-2.5 py-1.5 text-xs font-semibold hover:border-primary-container"
                        >
                          جزئیات
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="divide-y divide-outline md:hidden">
            {orders.map((o) => (
              <div key={o.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold" dir="ltr">
                      {o.code}
                    </p>
                    <p className="mt-0.5 text-sm text-on-surface-variant">
                      {o.user.name} · {formatToman(o.total)} تومان
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusBadge[o.status] ?? "bg-surface-container-high"}`}
                  >
                    {ORDER_STATUS_FA[o.status]}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-xs text-on-surface-variant">
                  {o.items.map((i) => `${i.title} × ${i.qty}`).join(" · ")}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <OrderStatusSelect orderId={o.id} status={o.status} />
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-1.5 text-sm font-semibold hover:border-primary-container"
                  >
                    جزئیات
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {!orders.length ? (
            <p className="p-10 text-center text-sm text-on-surface-variant">سفارشی با این فیلتر پیدا نشد.</p>
          ) : null}
        </div>
      </section>
    </AdminShell>
  );
}
