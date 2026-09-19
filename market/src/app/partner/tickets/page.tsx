import Link from "next/link";
import { PartnerShell } from "@/components/partner-shell";
import { Icon } from "@/components/icon";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { TICKET_STATUS_BADGE, TICKET_STATUS_FA } from "@/lib/panel";
import type { Prisma, TicketStatus } from "@/generated/prisma/client";

export const metadata = { title: "تیکت همکار" };

type Props = { searchParams: Promise<{ status?: string; q?: string }> };

const STATUSES = ["OPEN", "ANSWERED", "CLOSED"] as const;

function relativeFa(date: Date) {
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 60) return `${Math.max(1, mins)} دقیقه پیش`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours} ساعت پیش`;
  const days = Math.floor(hours / 24);
  return `${days} روز پیش`;
}

function buildHref(opts: { q?: string; status?: string }) {
  const p = new URLSearchParams();
  if (opts.q) p.set("q", opts.q);
  if (opts.status) p.set("status", opts.status);
  const s = p.toString();
  return s ? `/partner/tickets?${s}` : "/partner/tickets";
}

export default async function PartnerTicketsPage({ searchParams }: Props) {
  const user = await requireUser(["PARTNER", "ADMIN"]);
  if (!user) return null;
  const sp = await searchParams;
  const q = sp.q?.trim();
  const status = STATUSES.includes(sp.status as (typeof STATUSES)[number])
    ? (sp.status as TicketStatus)
    : undefined;

  const products = await prisma.product.findMany({
    where: user.role === "ADMIN" ? { sellerId: { not: null } } : { sellerId: user.id },
    select: { id: true },
  });
  const productIds = products.map((p) => p.id);
  const idFilter = productIds.length ? productIds : ["__none__"];

  const baseWhere: Prisma.TicketWhereInput = {
    orderId: { not: null },
    order: { items: { some: { productId: { in: idFilter } } } },
  };

  const listWhere: Prisma.TicketWhereInput = {
    ...baseWhere,
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { subject: { contains: q } },
            { code: { contains: q } },
            { user: { name: { contains: q } } },
            { user: { email: { contains: q } } },
            { order: { code: { contains: q } } },
          ],
        }
      : {}),
  };

  const [allTickets, tickets] = await Promise.all([
    prisma.ticket.findMany({
      where: baseWhere,
      select: { id: true, status: true, updatedAt: true, subject: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.ticket.findMany({
      where: listWhere,
      include: {
        user: true,
        order: { select: { id: true, code: true, status: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1, include: { user: true } },
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 80,
    }),
  ]);

  const byStatus = {
    OPEN: allTickets.filter((t) => t.status === "OPEN").length,
    ANSWERED: allTickets.filter((t) => t.status === "ANSWERED").length,
    CLOSED: allTickets.filter((t) => t.status === "CLOSED").length,
  };
  const openTickets = allTickets.filter((t) => t.status === "OPEN").slice(0, 4);
  const waitingCustomer = byStatus.ANSWERED;

  const chips = [
    { label: "همه", status: undefined as string | undefined, count: allTickets.length },
    { label: "باز", status: "OPEN", count: byStatus.OPEN },
    { label: "پاسخ‌داده‌شده", status: "ANSWERED", count: byStatus.ANSWERED },
    { label: "بسته", status: "CLOSED", count: byStatus.CLOSED },
  ];

  return (
    <PartnerShell
      title="تیکت‌های پشتیبانی"
      subtitle="پیگیری درخواست مشتریان روی سفارش‌های محصولات شما"
      active="/partner/tickets"
      actions={
        <>
          <a
            href="#tickets-list"
            className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-2 text-sm font-semibold text-on-surface hover:border-primary-container hover:text-primary-container"
          >
            برو به لیست
          </a>
          <Link
            href="/partner/orders"
            className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-2 text-sm font-semibold text-on-surface hover:border-primary-container hover:text-primary-container"
          >
            گزارش فروش
          </Link>
          {byStatus.OPEN > 0 ? (
            <Link
              href="/partner/tickets?status=OPEN#tickets-list"
              className="cyber-chamfer-sm bg-cta px-3 py-2 text-sm font-semibold text-on-primary"
            >
              تیکت‌های باز
            </Link>
          ) : null}
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: "کل تیکت‌ها",
            value: String(allTickets.length),
            hint: "مرتبط با محصولات شما",
            icon: "mail" as const,
            href: "/partner/tickets#tickets-list",
          },
          {
            label: "نیازمند پاسخ",
            value: String(byStatus.OPEN),
            hint: "وضعیت باز",
            icon: "support_agent" as const,
            href: "/partner/tickets?status=OPEN#tickets-list",
          },
          {
            label: "در انتظار مشتری",
            value: String(waitingCustomer),
            hint: "پاسخ داده‌اید",
            icon: "send" as const,
            href: "/partner/tickets?status=ANSWERED#tickets-list",
          },
          {
            label: "بسته‌شده",
            value: String(byStatus.CLOSED),
            hint: "آرشیو شده",
            icon: "check_circle" as const,
            href: "/partner/tickets?status=CLOSED#tickets-list",
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

      {openTickets.length > 0 ? (
        <section className="mt-6 scroll-mt-4">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-base font-bold">نیازمند اقدام الان</h2>
              <p className="mt-0.5 text-xs text-on-surface-variant">تیکت‌های باز مرتبط با سفارش محصولات شما</p>
            </div>
            <span className="alert-warn cyber-chamfer-sm px-2.5 py-0.5 text-[11px] font-bold">
              {byStatus.OPEN} مورد
            </span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {openTickets.map((t) => (
              <Link
                key={t.id}
                href={`/partner/tickets/${t.id}`}
                className="cyber-chamfer-sm border alert-warn px-3.5 py-3 transition-colors hover:border-primary-container/50"
              >
                <p className="text-[11px] font-bold text-on-surface-variant">تیکت باز · {relativeFa(t.updatedAt)}</p>
                <p className="mt-1 text-sm font-semibold leading-6">{t.subject}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section id="tickets-list" className="mt-8 scroll-mt-4 border-t border-outline pt-6">
        <div className="mb-3">
          <h2 className="text-lg font-bold">لیست تیکت‌ها</h2>
          <p className="mt-0.5 text-sm text-on-surface-variant">
            {tickets.length} مورد
            {status ? ` · ${TICKET_STATUS_FA[status]}` : ""}
            {q ? ` · «${q}»` : ""}
          </p>
        </div>

        <div className="mb-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {chips.map((chip) => {
            const active = (status ?? "") === (chip.status ?? "");
            return (
              <Link
                key={chip.label}
                href={buildHref({ q, status: chip.status }) + "#tickets-list"}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  active
                    ? "border-primary-container bg-cta text-on-primary"
                    : "border-outline bg-surface-container-low text-on-surface-variant hover:border-primary-container"
                }`}
              >
                {chip.label}
                <span
                  className={`rounded-md px-1.5 py-0.5 tabular-nums ${active ? "bg-on-primary/20" : "bg-surface-container-low"}`}
                >
                  {chip.count}
                </span>
              </Link>
            );
          })}
        </div>

        <form
          method="get"
          action="/partner/tickets"
          className="mb-4 flex flex-wrap items-center gap-2 cyber-chamfer border border-outline bg-surface-container-lowest p-3"
        >
          {status ? <input type="hidden" name="status" value={status} /> : null}
          <div className="relative min-w-[160px] flex-1">
            <Icon
              name="search"
              className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-on-surface-variant"
            />
            <input
              name="q"
              defaultValue={q}
              placeholder="موضوع، کد تیکت، مشتری یا کد سفارش"
              className="w-full cyber-chamfer-sm border border-outline bg-surface-container-lowest-container-low py-2.5 pr-10 pl-3 text-sm outline-none focus:border-primary-container"
            />
          </div>
          <button
            type="submit"
            className="cyber-chamfer-sm bg-cta px-4 py-2.5 text-sm font-semibold text-on-primary"
          >
            اعمال
          </button>
          {(q || status) && (
            <Link
              href="/partner/tickets#tickets-list"
              className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-2.5 text-sm font-semibold hover:border-primary-container hover:text-primary-container"
            >
              پاک کردن
            </Link>
          )}
        </form>

        <div className="cyber-chamfer border border-outline bg-surface-container-lowest">
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[780px] text-sm">
              <thead className="border-b border-outline bg-surface-container font-mono text-[11px] uppercase tracking-wider text-on-surface-variant">
                <tr>
                  <th className="px-4 py-3 text-right font-medium">کد</th>
                  <th className="px-4 py-3 text-right font-medium">موضوع</th>
                  <th className="px-4 py-3 text-right font-medium">مشتری</th>
                  <th className="px-4 py-3 text-right font-medium">آخرین پیام</th>
                  <th className="px-4 py-3 text-right font-medium">به‌روزرسانی</th>
                  <th className="px-4 py-3 text-right font-medium">وضعیت</th>
                  <th className="px-4 py-3 text-right font-medium">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => {
                  const last = t.messages[0];
                  return (
                    <tr key={t.id} className="border-t border-outline hover:bg-surface-container-low/40">
                      <td className="px-4 py-3 font-bold tracking-wide" dir="ltr">
                        {t.code}
                      </td>
                      <td className="max-w-[240px] px-4 py-3">
                        <Link href={`/partner/tickets/${t.id}`} className="font-semibold hover:text-primary-container">
                          {t.subject}
                        </Link>
                        <span className="mt-0.5 block text-[11px] text-on-surface-variant">
                          {t._count.messages} پیام
                          {t.order ? (
                            <>
                              {" · "}
                              <Link
                                href={`/partner/orders/${t.order.id}`}
                                className="font-semibold text-primary-container"
                              >
                                {t.order.code}
                              </Link>
                            </>
                          ) : null}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold">{t.user.name}</span>
                        <span className="mt-0.5 block truncate text-[11px] text-on-surface-variant" dir="ltr">
                          {t.user.email}
                        </span>
                      </td>
                      <td className="max-w-[220px] px-4 py-3 text-on-surface-variant">
                        <span className="line-clamp-2 text-xs leading-5">
                          {last ? `${last.isStaff ? "پشتیبانی" : last.user.name}: ${last.body}` : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-on-surface-variant">{relativeFa(t.updatedAt)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${TICKET_STATUS_BADGE[t.status] ?? ""}`}
                        >
                          {TICKET_STATUS_FA[t.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/partner/tickets/${t.id}`}
                          className="cyber-chamfer-sm border border-outline bg-surface-container-low px-2.5 py-1.5 text-xs font-semibold hover:border-primary-container"
                        >
                          {t.status === "OPEN" ? "پاسخ" : "مشاهده"}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-outline md:hidden">
            {tickets.map((t) => {
              const last = t.messages[0];
              return (
                <Link key={t.id} href={`/partner/tickets/${t.id}`} className="block p-4 hover:bg-surface-container-low/40">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold leading-6">{t.subject}</p>
                      <p className="mt-1 text-xs text-on-surface-variant">
                        <span dir="ltr">{t.code}</span> · {t.user.name}
                        {t.order ? (
                          <>
                            {" · "}
                            <span dir="ltr">{t.order.code}</span>
                          </>
                        ) : null}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${TICKET_STATUS_BADGE[t.status] ?? ""}`}
                    >
                      {TICKET_STATUS_FA[t.status]}
                    </span>
                  </div>
                  {last ? (
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-on-surface-variant">
                      {last.isStaff ? "پشتیبانی" : last.user.name}: {last.body}
                    </p>
                  ) : null}
                  <p className="mt-2 text-[11px] text-on-surface-variant">
                    {relativeFa(t.updatedAt)} · {t._count.messages} پیام
                  </p>
                </Link>
              );
            })}
          </div>

          {!tickets.length ? (
            <div className="p-10 text-center">
              <p className="text-sm text-on-surface-variant">
                {allTickets.length
                  ? "تیکتی با این فیلتر پیدا نشد."
                  : "هنوز تیکتی مرتبط با محصولات شما ثبت نشده."}
              </p>
              {allTickets.length ? (
                <Link
                  href="/partner/tickets#tickets-list"
                  className="mt-3 inline-flex text-sm font-semibold text-primary-container hover:underline"
                >
                  پاک کردن فیلترها
                </Link>
              ) : (
                <Link
                  href="/partner/orders"
                  className="mt-3 inline-flex cyber-chamfer-sm border border-outline bg-surface-container-low px-4 py-2 text-sm font-semibold hover:border-primary-container"
                >
                  گزارش فروش
                </Link>
              )}
            </div>
          ) : null}
        </div>
      </section>
    </PartnerShell>
  );
}
