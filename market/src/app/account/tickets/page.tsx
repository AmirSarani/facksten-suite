import Link from "next/link";
import { AccountShell } from "@/components/account-shell";
import { Icon } from "@/components/icon";
import { NewTicketForm } from "@/components/new-ticket-form";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { TICKET_STATUS_BADGE, TICKET_STATUS_FA } from "@/lib/panel";

export const metadata = { title: "تیکت‌ها" };

type Props = { searchParams: Promise<{ status?: string; q?: string; new?: string }> };

function relativeFa(date: Date) {
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 60) return `${Math.max(1, mins)} دقیقه پیش`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours} ساعت پیش`;
  return `${Math.floor(hours / 24)} روز پیش`;
}

function buildHref(opts: { q?: string; status?: string }) {
  const p = new URLSearchParams();
  if (opts.q) p.set("q", opts.q);
  if (opts.status) p.set("status", opts.status);
  const s = p.toString();
  return s ? `/account/tickets?${s}` : "/account/tickets";
}

export default async function TicketsPage({ searchParams }: Props) {
  const user = await requireUser(["CUSTOMER", "ADMIN"]);
  if (!user) return null;
  const sp = await searchParams;
  const q = sp.q?.trim();
  const statusFilter =
    sp.status && ["OPEN", "ANSWERED", "CLOSED"].includes(sp.status) ? sp.status : undefined;
  const openNew = sp.new === "1";

  const [tickets, counts, recentOrders, allTicketsMeta] = await Promise.all([
    prisma.ticket.findMany({
      where: {
        userId: user.id,
        ...(statusFilter ? { status: statusFilter as "OPEN" | "ANSWERED" | "CLOSED" } : {}),
        ...(q
          ? {
              OR: [
                { subject: { contains: q } },
                { code: { contains: q } },
                { order: { code: { contains: q } } },
              ],
            }
          : {}),
      },
      include: {
        order: { select: { id: true, code: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1, include: { user: true } },
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.ticket.groupBy({
      by: ["status"],
      where: { userId: user.id },
      _count: true,
    }),
    prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: { id: true, code: true },
    }),
    prisma.ticket.findMany({
      where: { userId: user.id },
      select: { id: true, status: true, subject: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const countMap = Object.fromEntries(counts.map((c) => [c.status, c._count])) as Record<string, number>;
  const total = Object.values(countMap).reduce((a, b) => a + b, 0);
  const openCount = countMap.OPEN ?? 0;
  const answeredCount = countMap.ANSWERED ?? 0;
  const closedCount = countMap.CLOSED ?? 0;
  const needsAttention = allTicketsMeta.filter((t) => t.status === "ANSWERED").slice(0, 3);

  const filters = [
    { key: "", label: "همه", count: total },
    { key: "OPEN", label: "باز", count: openCount },
    { key: "ANSWERED", label: "پاسخ پشتیبانی", count: answeredCount },
    { key: "CLOSED", label: "بسته", count: closedCount },
  ];

  return (
    <AccountShell
      title="تیکت‌های پشتیبانی"
      subtitle="ارتباط با پشتیبانی و پیگیری درخواست‌ها"
      active="/account/tickets"
      actions={
        <>
          <a
            href="#tickets-list"
            className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-2 text-sm font-semibold text-on-surface hover:border-primary-container hover:text-primary-container"
          >
            لیست تیکت‌ها
          </a>
          <a
            href="#new-ticket"
            className="cyber-chamfer-sm bg-cta px-3 py-2 text-sm font-semibold text-on-primary"
          >
            تیکت جدید
          </a>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: "کل تیکت‌ها",
            value: String(total),
            hint: "همه درخواست‌ها",
            icon: "mail" as const,
            href: "/account/tickets#tickets-list",
          },
          {
            label: "باز",
            value: String(openCount),
            hint: "در انتظار پاسخ پشتیبانی",
            icon: "support_agent" as const,
            href: buildHref({ status: "OPEN" }) + "#tickets-list",
          },
          {
            label: "پاسخ پشتیبانی",
            value: String(answeredCount),
            hint: "نیاز به خواندن / ادامه",
            icon: "send" as const,
            href: buildHref({ status: "ANSWERED" }) + "#tickets-list",
          },
          {
            label: "بسته",
            value: String(closedCount),
            hint: "آرشیو شده",
            icon: "check_circle" as const,
            href: buildHref({ status: "CLOSED" }) + "#tickets-list",
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

      {needsAttention.length > 0 ? (
        <section className="mt-5">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-base font-bold">پاسخ جدید پشتیبانی</h2>
              <p className="mt-0.5 text-xs text-on-surface-variant">تیکت‌هایی که پاسخ گرفته‌اند</p>
            </div>
            <span className="alert-info px-2.5 py-0.5 text-[11px] font-bold">
              {answeredCount} مورد
            </span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {needsAttention.map((t) => (
              <Link
                key={t.id}
                href={`/account/tickets/${t.id}`}
                className="cyber-chamfer-sm border alert-info px-3.5 py-3 hover:border-primary-container/50"
              >
                <p className="text-[11px] font-bold text-on-surface-variant">{relativeFa(t.updatedAt)}</p>
                <p className="mt-1 line-clamp-2 text-sm font-semibold leading-6">{t.subject}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section id="new-ticket" className="mt-6 scroll-mt-4">
        <NewTicketForm orders={recentOrders} defaultOpen={openNew || total === 0} />
      </section>

      <section id="tickets-list" className="mt-8 scroll-mt-4 border-t border-outline pt-6">
        <div className="mb-3">
          <h2 className="text-lg font-bold">لیست تیکت‌ها</h2>
          <p className="mt-0.5 text-sm text-on-surface-variant">
            {tickets.length} مورد
            {statusFilter ? ` · ${TICKET_STATUS_FA[statusFilter]}` : ""}
            {q ? ` · «${q}»` : ""}
          </p>
        </div>

        <div className="mb-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {filters.map((f) => {
            const active = (statusFilter || "") === f.key;
            return (
              <Link
                key={f.key || "all"}
                href={buildHref({ q, status: f.key || undefined }) + "#tickets-list"}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  active
                    ? "border-primary-container bg-cta text-on-primary"
                    : "border-outline bg-surface-container-low text-on-surface-variant hover:border-primary-container"
                }`}
              >
                {f.label}
                <span
                  className={`rounded-md px-1.5 py-0.5 tabular-nums ${active ? "bg-on-primary/20" : "bg-surface-container-low"}`}
                >
                  {f.count}
                </span>
              </Link>
            );
          })}
        </div>

        <form
          method="get"
          action="/account/tickets"
          className="mb-4 flex flex-wrap items-center gap-2 cyber-chamfer border border-outline bg-surface-container-lowest p-3"
        >
          {statusFilter ? <input type="hidden" name="status" value={statusFilter} /> : null}
          <div className="relative min-w-[160px] flex-1">
            <Icon
              name="search"
              className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-on-surface-variant"
            />
            <input
              name="q"
              defaultValue={q}
              placeholder="موضوع، کد تیکت یا کد سفارش"
              className="w-full cyber-chamfer-sm border border-outline bg-surface-container-lowest-container-low py-2.5 pr-10 pl-3 text-sm outline-none focus:border-primary-container"
            />
          </div>
          <button
            type="submit"
            className="cyber-chamfer-sm bg-cta px-4 py-2.5 text-sm font-semibold text-on-primary"
          >
            اعمال
          </button>
          {(q || statusFilter) && (
            <Link
              href="/account/tickets#tickets-list"
              className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-2.5 text-sm font-semibold hover:border-primary-container hover:text-primary-container"
            >
              پاک کردن
            </Link>
          )}
        </form>

        <div className="cyber-chamfer border border-outline bg-surface-container-lowest">
          {!tickets.length ? (
            <div className="p-10 text-center">
              <p className="text-sm text-on-surface-variant">
                {total ? "تیکتی با این فیلتر پیدا نشد." : "هنوز تیکتی ثبت نکرده‌اید."}
              </p>
              {total ? (
                <Link
                  href="/account/tickets#tickets-list"
                  className="mt-3 inline-flex text-sm font-semibold text-primary-container hover:underline"
                >
                  پاک کردن فیلترها
                </Link>
              ) : (
                <a
                  href="#new-ticket"
                  className="mt-3 inline-flex cyber-chamfer-sm bg-cta px-4 py-2 text-sm font-semibold text-on-primary"
                >
                  ثبت اولین تیکت
                </a>
              )}
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[700px] text-sm">
                  <thead className="border-b border-outline bg-surface-container font-mono text-[11px] uppercase tracking-wider text-on-surface-variant">
                    <tr>
                      <th className="px-4 py-3 text-right font-medium">کد</th>
                      <th className="px-4 py-3 text-right font-medium">موضوع</th>
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
                          <td className="max-w-[220px] px-4 py-3">
                            <Link href={`/account/tickets/${t.id}`} className="font-semibold hover:text-primary-container">
                              {t.subject}
                            </Link>
                            <span className="mt-0.5 block text-[11px] text-on-surface-variant">
                              {t._count.messages} پیام
                              {t.order ? (
                                <>
                                  {" · "}
                                  <Link
                                    href={`/account/orders/${t.order.id}`}
                                    className="font-semibold text-primary-container"
                                  >
                                    {t.order.code}
                                  </Link>
                                </>
                              ) : null}
                            </span>
                          </td>
                          <td className="max-w-[220px] px-4 py-3 text-on-surface-variant">
                            <span className="line-clamp-2 text-xs leading-5">
                              {last ? `${last.isStaff ? "پشتیبانی" : "شما"}: ${last.body}` : "—"}
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
                              href={`/account/tickets/${t.id}`}
                              className="cyber-chamfer-sm border border-outline bg-surface-container-low px-2.5 py-1.5 text-xs font-semibold hover:border-primary-container"
                            >
                              {t.status === "ANSWERED" ? "مشاهده پاسخ" : "ادامه گفتگو"}
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
                    <Link key={t.id} href={`/account/tickets/${t.id}`} className="block p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold leading-6">{t.subject}</p>
                          <p className="mt-1 text-xs text-on-surface-variant">
                            <span dir="ltr">#{t.code}</span>
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
                          {last.isStaff ? "پشتیبانی" : "شما"}: {last.body}
                        </p>
                      ) : null}
                      <p className="mt-2 text-[11px] text-on-surface-variant">
                        {relativeFa(t.updatedAt)} · {t._count.messages} پیام
                      </p>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>
    </AccountShell>
  );
}
