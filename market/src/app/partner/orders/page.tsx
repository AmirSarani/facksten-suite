import Link from "next/link";
import { PartnerShell } from "@/components/partner-shell";
import { Icon } from "@/components/icon";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatToman } from "@/lib/format";
import { ORDER_STATUS_BADGE, ORDER_STATUS_FA } from "@/lib/panel";
import type { Prisma } from "@/generated/prisma/client";

export const metadata = { title: "گزارش فروش همکار" };

type Props = {
  searchParams: Promise<{ q?: string; status?: string; range?: string }>;
};

const STATUSES = ["PENDING", "PAID", "PROCESSING", "SHIPPED", "COMPLETED", "CANCELLED"] as const;

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function buildHref(opts: { q?: string; status?: string; range?: string }) {
  const p = new URLSearchParams();
  if (opts.q) p.set("q", opts.q);
  if (opts.status) p.set("status", opts.status);
  if (opts.range) p.set("range", opts.range);
  const s = p.toString();
  return s ? `/partner/orders?${s}` : "/partner/orders";
}

export default async function PartnerOrdersPage({ searchParams }: Props) {
  const user = await requireUser(["PARTNER", "ADMIN"]);
  if (!user) return null;
  const sp = await searchParams;
  const q = sp.q?.trim();
  const status = STATUSES.includes(sp.status as (typeof STATUSES)[number]) ? sp.status! : undefined;
  const range = sp.range === "7" || sp.range === "30" ? sp.range : undefined;

  const products = await prisma.product.findMany({
    where: user.role === "ADMIN" ? { sellerId: { not: null } } : { sellerId: user.id },
    select: { id: true },
  });
  const ids = products.map((p) => p.id);
  const idFilter = ids.length ? ids : ["__none__"];

  const since7 = new Date();
  since7.setDate(since7.getDate() - 6);
  since7.setHours(0, 0, 0, 0);
  const since30 = new Date();
  since30.setDate(since30.getDate() - 29);
  since30.setHours(0, 0, 0, 0);
  const rangeSince = range === "7" ? since7 : range === "30" ? since30 : undefined;

  const baseWhere: Prisma.OrderItemWhereInput = {
    productId: { in: idFilter },
  };

  const [allItems, items] = await Promise.all([
    prisma.orderItem.findMany({
      where: { ...baseWhere, order: { status: { not: "CANCELLED" } } },
      include: { order: { select: { status: true, createdAt: true, code: true } } },
    }),
    prisma.orderItem.findMany({
      where: {
        ...baseWhere,
        AND: [
          status ? { order: { status: status as (typeof STATUSES)[number] } } : {},
          rangeSince ? { order: { createdAt: { gte: rangeSince } } } : {},
          q
            ? {
                OR: [
                  { title: { contains: q } },
                  { order: { code: { contains: q } } },
                  { order: { user: { name: { contains: q } } } },
                  { order: { user: { email: { contains: q } } } },
                ],
              }
            : {},
        ],
      },
      include: { order: { include: { user: true } } },
      orderBy: { id: "desc" },
    }),
  ]);

  const revenueAll = allItems.reduce((s, i) => s + i.price * i.qty, 0);
  const unitsAll = allItems.reduce((s, i) => s + i.qty, 0);
  const orderIdsAll = new Set(allItems.map((i) => i.order.code));
  const revenue30 = allItems
    .filter((i) => i.order.createdAt >= since30)
    .reduce((s, i) => s + i.price * i.qty, 0);
  const revenue7 = allItems
    .filter((i) => i.order.createdAt >= since7)
    .reduce((s, i) => s + i.price * i.qty, 0);

  const byStatus = new Map<string, number>();
  for (const i of allItems) {
    byStatus.set(i.order.status, (byStatus.get(i.order.status) ?? 0) + 1);
  }

  const chartSince = new Date();
  chartSince.setDate(chartSince.getDate() - 13);
  chartSince.setHours(0, 0, 0, 0);
  const byDay = new Map<string, number>();
  for (let i = 0; i < 14; i++) {
    const d = new Date(chartSince);
    d.setDate(chartSince.getDate() + i);
    byDay.set(dayKey(d), 0);
  }
  for (const i of allItems) {
    if (i.order.createdAt < chartSince) continue;
    const k = dayKey(i.order.createdAt);
    if (byDay.has(k)) byDay.set(k, (byDay.get(k) ?? 0) + i.price * i.qty);
  }
  const chart = Array.from(byDay.entries());
  const maxDay = Math.max(1, ...chart.map(([, v]) => v));
  const CHART_H = 120;
  const filterRevenue = items.reduce((s, i) => s + i.price * i.qty, 0);

  const chips = [
    {
      label: "همه",
      href: buildHref({ q }) + "#sales-list",
      active: !status && !range,
      count: allItems.length,
    },
    {
      label: "۷ روز",
      href: buildHref({ q, range: "7", status }) + "#sales-list",
      active: range === "7",
      count: allItems.filter((i) => i.order.createdAt >= since7).length,
    },
    {
      label: "۳۰ روز",
      href: buildHref({ q, range: "30", status }) + "#sales-list",
      active: range === "30",
      count: allItems.filter((i) => i.order.createdAt >= since30).length,
    },
    ...(["COMPLETED", "SHIPPED", "PROCESSING", "PAID"] as const).map((st) => ({
      label: ORDER_STATUS_FA[st],
      href: buildHref({ q, status: st, range }) + "#sales-list",
      active: status === st,
      count: byStatus.get(st) ?? 0,
    })),
  ];

  return (
    <PartnerShell
      title="گزارش فروش"
      subtitle="سهم شما از سفارش‌های فروشگاه"
      active="/partner/orders"
      actions={
        <Link
          href="/partner"
          className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-2 text-sm font-semibold text-on-surface hover:border-primary-container hover:text-primary-container"
        >
          داشبورد
        </Link>
      }
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: "فروش کل",
            value: formatToman(revenueAll),
            hint: `${orderIdsAll.size} سفارش یکتا`,
            icon: "payments" as const,
          },
          {
            label: "۳۰ روز",
            value: formatToman(revenue30),
            hint: `۷ روز: ${formatToman(revenue7)}`,
            icon: "shopping_cart" as const,
          },
          {
            label: "اقلام فروخته‌شده",
            value: String(unitsAll),
            hint: `${allItems.length} ردیف فروش`,
            icon: "inventory_2" as const,
          },
          {
            label: "در این فیلتر",
            value: formatToman(filterRevenue),
            hint: `${items.length} مورد`,
            icon: "schema" as const,
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

      <section className="mt-5 cyber-chamfer border border-outline bg-surface-container-lowest p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-base font-bold">روند ۱۴ روز اخیر</h2>
            <p className="mt-0.5 text-xs text-on-surface-variant">جمع سهم شما در هر روز</p>
          </div>
          <span className="rounded-lg bg-primary-container/10 px-2.5 py-1 text-[11px] font-bold text-primary-container">
            روزانه
          </span>
        </div>
        <div
          className="flex items-end gap-1 cyber-chamfer-sm border border-outline bg-surface-container-low/80 px-2 pt-3 pb-1 sm:gap-1.5 sm:px-3"
          style={{ height: CHART_H + 8 }}
        >
          {chart.map(([key, value]) => {
            const barH = value > 0 ? Math.max(8, Math.round((value / maxDay) * CHART_H)) : 3;
            return (
              <div
                key={key}
                className="flex h-full min-w-0 flex-1 flex-col items-center justify-end"
                title={`${key}: ${formatToman(value)}`}
              >
                <div
                  className={`w-full max-w-[14px] rounded-t-sm sm:max-w-[16px] ${
                    value > 0 ? "bg-primary-container" : "bg-surface-variant/60"
                  }`}
                  style={{ height: barH }}
                />
              </div>
            );
          })}
        </div>
      </section>

      <section id="sales-list" className="mt-6 scroll-mt-4">
        <div className="mb-3">
          <h2 className="text-lg font-bold">ریز فروش</h2>
          <p className="mt-0.5 text-sm text-on-surface-variant">
            {items.length} مورد
            {status ? ` · ${ORDER_STATUS_FA[status]}` : ""}
            {range ? ` · ${range} روز` : ""}
            {q ? ` · «${q}»` : ""}
          </p>
        </div>

        <div className="mb-3 max-w-full min-w-0 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {chips.map((chip) => (
            <Link
              key={`${chip.label}-${chip.href}`}
              href={chip.href}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                chip.active
                  ? "border-primary-container bg-cta text-on-primary"
                  : "border-outline bg-surface-container-low text-on-surface-variant hover:border-primary-container"
              }`}
            >
              {chip.label}
              <span
                className={`rounded-md px-1.5 py-0.5 tabular-nums ${chip.active ? "bg-on-primary/20" : "bg-surface-container-low"}`}
              >
                {chip.count}
              </span>
            </Link>
          ))}
        </div>

        <form
          method="get"
          action="/partner/orders"
          className="mb-4 flex flex-wrap items-center gap-2 cyber-chamfer border border-outline bg-surface-container-lowest p-3"
        >
          {status ? <input type="hidden" name="status" value={status} /> : null}
          {range ? <input type="hidden" name="range" value={range} /> : null}
          <div className="relative min-w-0 flex-1 basis-[160px]">
            <Icon
              name="search"
              className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-on-surface-variant"
            />
            <input
              name="q"
              defaultValue={q}
              placeholder="کد سفارش، مشتری یا نام محصول"
              className="w-full cyber-chamfer-sm border border-outline bg-surface-container-lowest-container-low py-2.5 pr-10 pl-3 text-sm outline-none focus:border-primary-container"
            />
          </div>
          <button
            type="submit"
            className="cyber-chamfer-sm bg-cta px-4 py-2.5 text-sm font-semibold text-on-primary"
          >
            اعمال
          </button>
          {(q || status || range) && (
            <Link
              href="/partner/orders#sales-list"
              className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-2.5 text-sm font-semibold hover:border-primary-container hover:text-primary-container"
            >
              پاک کردن
            </Link>
          )}
        </form>

        <div className="cyber-chamfer border border-outline bg-surface-container-lowest">
          <div className="table-scroll hidden max-w-full min-w-0 overflow-x-auto md:block">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="border-b border-outline bg-surface-container font-mono text-[11px] uppercase tracking-wider text-on-surface-variant">
                <tr>
                  <th className="px-4 py-3 text-right font-medium">سفارش</th>
                  <th className="px-4 py-3 text-right font-medium">مشتری</th>
                  <th className="px-4 py-3 text-right font-medium">محصول</th>
                  <th className="px-4 py-3 text-right font-medium">تعداد</th>
                  <th className="px-4 py-3 text-right font-medium">مبلغ</th>
                  <th className="px-4 py-3 text-right font-medium">وضعیت</th>
                  <th className="px-4 py-3 text-right font-medium">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.id} className="border-t border-outline hover:bg-surface-container-low/40">
                    <td className="px-4 py-3">
                      <Link
                        href={`/partner/orders/${i.orderId}`}
                        className="font-semibold text-primary-container hover:underline"
                        dir="ltr"
                      >
                        {i.order.code}
                      </Link>
                      <span className="mt-0.5 block text-[11px] text-on-surface-variant">
                        {new Date(i.order.createdAt).toLocaleDateString("fa-IR")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium">{i.order.user.name}</span>
                      <span className="mt-0.5 block truncate text-[11px] text-on-surface-variant" dir="ltr">
                        {i.order.user.email}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="line-clamp-2">{i.title}</span>
                    </td>
                    <td className="px-4 py-3 tabular-nums">{i.qty}</td>
                    <td className="px-4 py-3 font-semibold tabular-nums">{formatToman(i.price * i.qty)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${ORDER_STATUS_BADGE[i.order.status] ?? ""}`}
                      >
                        {ORDER_STATUS_FA[i.order.status] ?? i.order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/partner/orders/${i.orderId}`}
                        className="cyber-chamfer-sm border border-outline bg-surface-container-low px-2.5 py-1.5 text-xs font-semibold hover:border-primary-container"
                      >
                        جزئیات
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-outline md:hidden">
            {items.map((i) => (
              <Link key={i.id} href={`/partner/orders/${i.orderId}`} className="block p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-primary-container" dir="ltr">
                      {i.order.code}
                    </p>
                    <p className="mt-0.5 text-xs text-on-surface-variant">{i.order.user.name}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${ORDER_STATUS_BADGE[i.order.status] ?? ""}`}
                  >
                    {ORDER_STATUS_FA[i.order.status] ?? i.order.status}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm">{i.title}</p>
                <p className="mt-1 text-sm font-bold tabular-nums text-on-surface">
                  {formatToman(i.price * i.qty)} تومان
                  <span className="ms-2 text-xs font-medium text-on-surface-variant">× {i.qty}</span>
                </p>
              </Link>
            ))}
          </div>

          {!items.length ? (
            <div className="p-10 text-center">
              <p className="text-sm text-on-surface-variant">
                {allItems.length ? "موردی با این فیلتر پیدا نشد." : "هنوز فروشی از محصولات شما ثبت نشده."}
              </p>
              {allItems.length ? (
                <Link
                  href="/partner/orders#sales-list"
                  className="mt-3 inline-flex text-sm font-semibold text-primary-container hover:underline"
                >
                  پاک کردن فیلترها
                </Link>
              ) : (
                <Link
                  href="/partner/inventory/new"
                  className="mt-3 inline-flex cyber-chamfer-sm bg-cta px-4 py-2 text-sm font-semibold text-on-primary"
                >
                  ثبت محصول
                </Link>
              )}
            </div>
          ) : null}
        </div>
      </section>
    </PartnerShell>
  );
}
