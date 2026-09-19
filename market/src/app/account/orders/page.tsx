import Link from "next/link";
import { AccountShell } from "@/components/account-shell";
import { Icon } from "@/components/icon";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatToman } from "@/lib/format";
import { ORDER_STATUS_BADGE, ORDER_STATUS_FA, PRODUCT_TYPE_FA } from "@/lib/panel";
import type { OrderStatus } from "@/generated/prisma/client";

export const metadata = { title: "سفارش‌ها" };

type Props = { searchParams: Promise<{ status?: string; q?: string; scope?: string }> };

const STATUSES = ["PENDING", "PAID", "PROCESSING", "SHIPPED", "COMPLETED", "CANCELLED"] as const;
const ACTIVE_STATUSES = new Set(["PAID", "PROCESSING", "SHIPPED"]);

const steps = [
  { key: "PENDING", label: "ثبت سفارش", day: 0, icon: "check_circle" as const },
  { key: "PROCESSING", label: "پردازش انبار", day: 1, icon: "inventory_2" as const },
  { key: "SHIPPED", label: "ارسال", day: 2, icon: "local_shipping" as const },
  { key: "COMPLETED", label: "تحویل", day: 4, icon: "home_iot_device" as const },
] as const;

function stepIndex(status: string) {
  if (status === "PAID") return 1;
  if (status === "CANCELLED") return -1;
  const i = steps.findIndex((s) => s.key === status);
  return i < 0 ? 0 : i;
}

function addDaysFa(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("fa-IR");
}

function buildHref(opts: { q?: string; status?: string; scope?: string }) {
  const p = new URLSearchParams();
  if (opts.q) p.set("q", opts.q);
  if (opts.status) p.set("status", opts.status);
  if (opts.scope) p.set("scope", opts.scope);
  const s = p.toString();
  return s ? `/account/orders?${s}` : "/account/orders";
}

export default async function OrdersPage({ searchParams }: Props) {
  const user = await requireUser(["CUSTOMER", "ADMIN"]);
  if (!user) return null;
  const sp = await searchParams;
  const q = sp.q?.trim();
  const scope = sp.scope === "active" ? "active" : undefined;
  const status =
    !scope && STATUSES.includes(sp.status as (typeof STATUSES)[number])
      ? (sp.status as OrderStatus)
      : undefined;

  const [allOrders, wishlist, downloads] = await Promise.all([
    prisma.order.findMany({
      where: { userId: user.id },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.wishlistItem.count({ where: { userId: user.id } }),
    prisma.orderItem.count({
      where: {
        type: "DIGITAL",
        order: { userId: user.id, status: { in: ["PAID", "PROCESSING", "SHIPPED", "COMPLETED"] } },
      },
    }),
  ]);

  const orders = allOrders.filter((o) => {
    if (scope === "active" && !ACTIVE_STATUSES.has(o.status)) return false;
    if (status && o.status !== status) return false;
    if (!q) return true;
    const hay = `${o.code} ${o.items.map((i) => i.title).join(" ")} ${o.trackingCode ?? ""}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  const completed = allOrders.filter((o) => o.status === "COMPLETED").length;
  const processing = allOrders.filter((o) => ACTIVE_STATUSES.has(o.status)).length;
  const pendingPay = allOrders.filter((o) => o.status === "PENDING").length;
  const spent = allOrders.filter((o) => o.status !== "CANCELLED").reduce((s, o) => s + o.total, 0);
  const byStatus = Object.fromEntries(
    STATUSES.map((s) => [s, allOrders.filter((o) => o.status === s).length]),
  ) as Record<string, number>;

  const active = allOrders.find((o) => ACTIVE_STATUSES.has(o.status));
  const activeStep = active ? stepIndex(active.status) : -1;

  const chips = [
    { label: "همه", count: allOrders.length, href: buildHref({ q }) },
    { label: "در انتظار پرداخت", count: byStatus.PENDING, href: buildHref({ q, status: "PENDING" }) },
    { label: "در جریان", count: processing, href: buildHref({ q, scope: "active" }) },
    { label: "ارسال‌شده", count: byStatus.SHIPPED, href: buildHref({ q, status: "SHIPPED" }) },
    { label: "تکمیل‌شده", count: byStatus.COMPLETED, href: buildHref({ q, status: "COMPLETED" }) },
    { label: "لغو شده", count: byStatus.CANCELLED, href: buildHref({ q, status: "CANCELLED" }) },
  ];

  function chipActive(href: string) {
    if (scope === "active") return href.includes("scope=active");
    if (status) return href.includes(`status=${status}`);
    return href === buildHref({ q }) || href === "/account/orders";
  }

  return (
    <AccountShell
      title="پیگیری سفارش‌ها"
      subtitle="وضعیت، فاکتور و رهگیری سفارش‌های اخیر"
      active="/account/orders"
      actions={
        <>
          <a
            href="#orders-list"
            className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-2 text-sm font-semibold text-on-surface hover:border-primary-container hover:text-primary-container"
          >
            تاریخچه
          </a>
          <Link
            href="/products"
            className="cyber-chamfer-sm bg-cta px-3 py-2 text-sm font-semibold text-on-primary"
          >
            خرید جدید
          </Link>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: "کل سفارشات",
            value: String(allOrders.length),
            hint: `${formatToman(spent)} تومان خرید`,
            icon: "shopping_cart" as const,
            href: "/account/orders#orders-list",
          },
          {
            label: "تکمیل‌شده",
            value: String(completed),
            hint: "تحویل گرفته‌اید",
            icon: "check_circle" as const,
            href: buildHref({ status: "COMPLETED" }) + "#orders-list",
          },
          {
            label: "در جریان",
            value: String(processing),
            hint: pendingPay ? `${pendingPay} در انتظار پرداخت` : "پردازش و ارسال",
            icon: "local_shipping" as const,
            href: buildHref({ scope: "active" }) + "#orders-list",
          },
          {
            label: "دانلود / علاقه‌مندی",
            value: `${downloads} / ${wishlist}`,
            hint: "فایل دیجیتال و لیست ذخیره‌شده",
            icon: "folder_zip" as const,
            href: "/account/downloads",
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
            <p className="text-xl font-bold tabular-nums tracking-tight sm:text-2xl">{c.value}</p>
            <p className="mt-1 text-[11px] text-on-surface-variant">{c.hint}</p>
          </Link>
        ))}
      </div>

      {(pendingPay > 0 || processing > 0) && (
        <section className="mt-5 grid gap-2 sm:grid-cols-2">
          {pendingPay > 0 ? (
            <Link
              href={buildHref({ status: "PENDING" }) + "#orders-list"}
              className="cyber-chamfer-sm border alert-danger px-3.5 py-3 hover:border-primary-container/50"
            >
              <p className="text-[11px] font-bold text-on-surface-variant">پرداخت ناتمام</p>
              <p className="mt-1 text-sm font-semibold leading-6">{pendingPay} سفارش هنوز پرداخت نشده</p>
            </Link>
          ) : null}
          {processing > 0 ? (
            <a
              href="#active-order"
              className="cyber-chamfer-sm border alert-warn px-3.5 py-3 hover:border-primary-container/50"
            >
              <p className="text-[11px] font-bold text-on-surface-variant">سفارش فعال</p>
              <p className="mt-1 text-sm font-semibold leading-6">{processing} سفارش در حال پردازش یا ارسال</p>
            </a>
          ) : null}
        </section>
      )}

      {active ? (
        <section id="active-order" className="mt-6 scroll-mt-4 cyber-chamfer border border-outline bg-surface-container-lowest p-4 sm:p-6">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">
                سفارش فعال{" "}
                <span className="text-primary-container" dir="ltr">
                  #{active.code}
                </span>
              </h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                ثبت {new Date(active.createdAt).toLocaleDateString("fa-IR")}
                {active.trackingCode ? (
                  <>
                    {" · "}
                    رهگیری:{" "}
                    <span className="font-semibold text-primary-container" dir="ltr">
                      {active.trackingCode}
                    </span>
                  </>
                ) : null}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${ORDER_STATUS_BADGE[active.status] ?? ""}`}>
                {ORDER_STATUS_FA[active.status] ?? active.status}
              </span>
              <Link
                href={`/account/orders/${active.id}`}
                className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-1.5 text-xs font-semibold hover:border-primary-container"
              >
                مشاهده فاکتور
              </Link>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {steps.map((s, i) => {
              const done = activeStep >= 0 && i <= activeStep;
              const current = activeStep === i;
              return (
                <div
                  key={s.key}
                  className={`flex flex-col items-center gap-2 cyber-chamfer-sm border px-2 py-3 ${
                    current
                      ? "border-primary-container/50 bg-primary-container/5"
                      : "border-transparent bg-surface-container-low/50"
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      done ? "bg-cta text-on-primary" : "bg-surface-container text-on-surface-variant"
                    }`}
                  >
                    <Icon name={done ? "check_circle" : s.icon} className="h-5 w-5" />
                  </div>
                  <span className="text-center text-xs font-semibold">{s.label}</span>
                  <span className="text-center text-[10px] text-on-surface-variant">
                    {addDaysFa(active.createdAt, s.day)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-end justify-between gap-4 border-t border-outline pt-4">
            <div className="min-w-0 flex-1">
              <p className="mb-2 text-sm font-semibold">اقلام سفارش</p>
              <ul className="space-y-1.5 text-sm text-on-surface-variant">
                {active.items.map((i) => (
                  <li key={i.id} className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-on-surface">
                      {i.title} × {i.qty}
                    </span>
                    <span className="rounded-md bg-surface-container-low px-1.5 py-0.5 text-[10px] font-bold">
                      {PRODUCT_TYPE_FA[i.type] ?? i.type}
                    </span>
                    <span className="tabular-nums text-xs">{formatToman(i.price * i.qty)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="text-left">
              <p className="text-xs text-on-surface-variant">مبلغ کل</p>
              <p className="text-xl font-bold tabular-nums">{formatToman(active.total)} تومان</p>
            </div>
          </div>
        </section>
      ) : null}

      <section id="orders-list" className="mt-8 scroll-mt-4 border-t border-outline pt-6">
        <div className="mb-3">
          <h2 className="text-lg font-bold">تاریخچه سفارشات</h2>
          <p className="mt-0.5 text-sm text-on-surface-variant">
            {orders.length} مورد
            {scope === "active" ? " · در جریان" : ""}
            {status ? ` · ${ORDER_STATUS_FA[status]}` : ""}
            {q ? ` · «${q}»` : ""}
          </p>
        </div>

        <div className="mb-3 max-w-full min-w-0 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {chips.map((chip) => {
            const isActive = chipActive(chip.href);
            return (
              <Link
                key={chip.label}
                href={`${chip.href}#orders-list`}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  isActive
                    ? "border-primary-container bg-cta text-on-primary"
                    : "border-outline bg-surface-container-low text-on-surface-variant hover:border-primary-container"
                }`}
              >
                {chip.label}
                <span
                  className={`rounded-md px-1.5 py-0.5 tabular-nums ${isActive ? "bg-on-primary/20" : "bg-surface-container-low"}`}
                >
                  {chip.count}
                </span>
              </Link>
            );
          })}
        </div>

        <form
          method="get"
          action="/account/orders"
          className="mb-4 flex flex-wrap items-center gap-2 cyber-chamfer border border-outline bg-surface-container-lowest p-3"
        >
          {status ? <input type="hidden" name="status" value={status} /> : null}
          {scope ? <input type="hidden" name="scope" value={scope} /> : null}
          <div className="relative min-w-0 flex-1 basis-[160px]">
            <Icon
              name="search"
              className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-on-surface-variant"
            />
            <input
              name="q"
              defaultValue={q}
              placeholder="کد سفارش، رهگیری یا نام محصول"
              className="w-full cyber-chamfer-sm border border-outline bg-surface-container-lowest-container-low py-2.5 pr-10 pl-3 text-sm outline-none focus:border-primary-container"
            />
          </div>
          <button
            type="submit"
            className="cyber-chamfer-sm bg-cta px-4 py-2.5 text-sm font-semibold text-on-primary"
          >
            اعمال
          </button>
          {(q || status || scope) && (
            <Link
              href="/account/orders#orders-list"
              className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-2.5 text-sm font-semibold hover:border-primary-container hover:text-primary-container"
            >
              پاک کردن
            </Link>
          )}
        </form>

        <div className="cyber-chamfer border border-outline bg-surface-container-lowest">
          {!orders.length ? (
            <div className="p-10 text-center">
              <p className="text-sm text-on-surface-variant">
                {allOrders.length ? "سفارشی با این فیلتر پیدا نشد." : "هنوز سفارشی ندارید."}
              </p>
              {allOrders.length ? (
                <Link
                  href="/account/orders#orders-list"
                  className="mt-3 inline-flex text-sm font-semibold text-primary-container hover:underline"
                >
                  پاک کردن فیلترها
                </Link>
              ) : (
                <Link
                  href="/products"
                  className="mt-3 inline-flex cyber-chamfer-sm bg-cta px-4 py-2 text-sm font-semibold text-on-primary"
                >
                  رفتن به فروشگاه
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="table-scroll hidden max-w-full min-w-0 overflow-x-auto md:block">
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="border-b border-outline bg-surface-container font-mono text-[11px] uppercase tracking-wider text-on-surface-variant">
                    <tr>
                      <th className="px-4 py-3 text-right font-medium">شماره سفارش</th>
                      <th className="px-4 py-3 text-right font-medium">اقلام</th>
                      <th className="px-4 py-3 text-right font-medium">تاریخ</th>
                      <th className="px-4 py-3 text-right font-medium">مبلغ</th>
                      <th className="px-4 py-3 text-right font-medium">وضعیت</th>
                      <th className="px-4 py-3 text-right font-medium">عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id} className="border-t border-outline hover:bg-surface-container-low/40">
                        <td className="px-4 py-3">
                          <Link
                            href={`/account/orders/${o.id}`}
                            className="font-semibold text-primary-container hover:underline"
                            dir="ltr"
                          >
                            {o.code}
                          </Link>
                          {o.trackingCode ? (
                            <span className="mt-0.5 block text-[11px] text-on-surface-variant" dir="ltr">
                              رهگیری: {o.trackingCode}
                            </span>
                          ) : null}
                        </td>
                        <td className="max-w-[200px] px-4 py-3 text-xs text-on-surface-variant">
                          <span className="line-clamp-1">{o.items[0]?.title ?? "—"}</span>
                          <span className="mt-0.5 block">{o.items.length} قلم</span>
                        </td>
                        <td className="px-4 py-3 text-xs tabular-nums text-on-surface-variant">
                          {new Date(o.createdAt).toLocaleDateString("fa-IR")}
                        </td>
                        <td className="px-4 py-3 font-semibold tabular-nums">{formatToman(o.total)}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${ORDER_STATUS_BADGE[o.status] ?? ""}`}
                          >
                            {ORDER_STATUS_FA[o.status] ?? o.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/account/orders/${o.id}`}
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
                {orders.map((o) => (
                  <Link key={o.id} href={`/account/orders/${o.id}`} className="block p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-primary-container" dir="ltr">
                          {o.code}
                        </p>
                        <p className="mt-0.5 line-clamp-1 text-xs text-on-surface-variant">
                          {o.items[0]?.title ?? "سفارش"}
                          {o.items.length > 1 ? ` +${o.items.length - 1}` : ""}
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
          )}
        </div>
      </section>
    </AccountShell>
  );
}
