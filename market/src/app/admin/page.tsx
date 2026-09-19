import Link from "next/link";
import { AdminSalesChart, AdminStatusBreakdown } from "@/components/admin-dashboard-charts";
import { AdminShell } from "@/components/admin-shell";
import { Icon } from "@/components/icon";
import { requireUser } from "@/lib/auth";
import { getAdminDashboardMock } from "@/lib/admin-dashboard-mock";
import { formatToman } from "@/lib/format";

export const metadata = { title: "ادمین" };

const alertTone: Record<string, string> = {
  order: "alert-warn",
  stock: "alert-danger",
  ticket: "alert-info",
  article: "alert-info",
};

export default async function AdminDashboard() {
  await requireUser(["ADMIN"]);
  const data = getAdminDashboardMock();

  return (
    <AdminShell
      title="داشبورد ادمین"
      subtitle="خلاصه عملیاتی فروشگاه — فقط موارد مهم امروز"
      active="/admin"
      actions={
        <>
          <Link
            href="/admin/orders"
            className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-2 text-sm font-semibold text-on-surface hover:border-primary-container hover:text-primary-container"
          >
            سفارش‌ها
          </Link>
          <Link
            href="/admin/tickets?status=OPEN"
            className="cyber-chamfer-sm bg-cta px-3 py-2 text-sm font-semibold text-on-primary"
          >
            تیکت‌های باز
          </Link>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {data.primaryKpis.map((c) => (
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

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {data.secondaryKpis.map((c) => (
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

      <section className="mt-6">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-base font-bold">نیازمند اقدام الان</h2>
            <p className="mt-0.5 text-xs text-on-surface-variant">سفارش، موجودی و تیکت‌های فوری</p>
          </div>
          <span className="alert-warn cyber-chamfer-sm px-2.5 py-0.5 text-[11px] font-bold">
            {data.alerts.length} مورد
          </span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {data.alerts.map((a, i) => (
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

      <div className="mt-6 grid gap-4 lg:grid-cols-3 lg:gap-5">
        <div className="lg:col-span-2">
          <AdminSalesChart series={data.salesSeries} total={data.sales30Total} />
        </div>
        <AdminStatusBreakdown byStatus={data.byStatus} byType={data.byType} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-5 lg:gap-5">
        <section className="cyber-chamfer border border-outline bg-surface-container-lowest p-4 sm:p-5 lg:col-span-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold">آخرین سفارش‌ها</h2>
              <p className="mt-0.5 text-xs text-on-surface-variant">برای پیگیری سریع وضعیت</p>
            </div>
            <Link href="/admin/orders" className="text-xs font-semibold text-primary-container hover:underline">
              همه سفارش‌ها
            </Link>
          </div>
          <ul className="divide-y divide-outline">
            {data.recentOrders.map((o) => (
              <li key={o.title}>
                <Link
                  href={o.href}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 hover:opacity-90"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{o.title}</span>
                    <span className="mt-0.5 block text-xs tabular-nums text-on-surface-variant">{o.meta} تومان</span>
                  </span>
                  {o.badge ? (
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${o.badgeClass ?? ""}`}>
                      {o.badge}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="cyber-chamfer border border-outline bg-surface-container-lowest p-4 sm:p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold">پرفروش‌ها</h2>
              <p className="mt-0.5 text-xs text-on-surface-variant">۳۰ روز · ۵ قلم برتر</p>
            </div>
            <Link href="/admin/products" className="text-xs font-semibold text-primary-container hover:underline">
              کاتالوگ
            </Link>
          </div>
          <ul className="space-y-2.5">
            {data.topProducts.map((p, idx) => (
              <li key={p.productId} className="flex items-start justify-between gap-2 text-sm">
                <span className="min-w-0">
                  <span className="text-[11px] tabular-nums text-on-surface-variant">{idx + 1}. </span>
                  <Link href={p.href} className="font-semibold hover:text-primary-container">
                    {p.title}
                  </Link>
                  <span className="mt-0.5 block text-[11px] text-on-surface-variant">{p.qty} فروش</span>
                </span>
                <span className="shrink-0 tabular-nums font-medium">{formatToman(p.revenue)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2 lg:gap-5">
        <section className="cyber-chamfer border border-outline bg-surface-container-lowest p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold">تیکت‌های باز</h2>
              <p className="mt-0.5 text-xs text-on-surface-variant">درخواست مشتریان نیازمند پاسخ</p>
            </div>
            <Link href="/admin/tickets?status=OPEN" className="text-xs font-semibold text-primary-container hover:underline">
              همه
            </Link>
          </div>
          <ul className="space-y-2">
            {data.tickets.map((t) => (
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
        </section>

        <section className="cyber-chamfer border border-outline bg-surface-container-lowest p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold">درخواست همکاران</h2>
              <p className="mt-0.5 text-xs text-on-surface-variant">تسویه و موجودی — فقط موارد باز</p>
            </div>
            <Link href="/admin/users?role=PARTNER" className="text-xs font-semibold text-primary-container hover:underline">
              همکاران
            </Link>
          </div>
          <ul className="space-y-2">
            {data.partnerTickets.map((t) => (
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
        </section>
      </div>
    </AdminShell>
  );
}
