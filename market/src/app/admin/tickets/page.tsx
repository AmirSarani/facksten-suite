import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { Icon } from "@/components/icon";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAdminTicketsHubMock } from "@/lib/admin-tickets-mock";
import { ROLE_FA, TICKET_STATUS_BADGE, TICKET_STATUS_FA } from "@/lib/panel";
import type { Prisma, TicketStatus } from "@/generated/prisma/client";

export const metadata = { title: "تیکت‌های ادمین" };

type Props = { searchParams: Promise<{ status?: string; q?: string; scope?: string }> };

const alertTone: Record<string, string> = {
  order: "alert-warn",
  stock: "alert-danger",
  ticket: "alert-info",
  article: "alert-info",
};

function relativeFa(date: Date) {
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 60) return `${Math.max(1, mins)} دقیقه پیش`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours} ساعت پیش`;
  const days = Math.floor(hours / 24);
  return `${days} روز پیش`;
}

export default async function AdminTicketsPage({ searchParams }: Props) {
  await requireUser(["ADMIN"]);
  const sp = await searchParams;
  const q = sp.q?.trim();
  const status =
    sp.status && Object.keys(TICKET_STATUS_FA).includes(sp.status) ? (sp.status as TicketStatus) : undefined;
  const scope = sp.scope === "partner" || sp.scope === "customer" || sp.scope === "order" ? sp.scope : "";
  const activeStatus = status ?? "";

  const where: Prisma.TicketWhereInput = {
    ...(status ? { status } : {}),
    ...(scope === "partner" ? { user: { role: "PARTNER" } } : {}),
    ...(scope === "customer" ? { user: { role: "CUSTOMER" } } : {}),
    ...(scope === "order" ? { orderId: { not: null } } : {}),
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

  const [tickets, counts, hub] = await Promise.all([
    prisma.ticket.findMany({
      where,
      include: {
        user: true,
        order: { select: { id: true, code: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1, include: { user: true } },
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.ticket.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    Promise.resolve(getAdminTicketsHubMock()),
  ]);

  const countByStatus = Object.fromEntries(counts.map((c) => [c.status, c._count._all])) as Record<string, number>;
  const totalLive = counts.reduce((s, c) => s + c._count._all, 0);

  return (
    <AdminShell
      title="تیکت‌های پشتیبانی"
      subtitle="صف پاسخ‌گویی، پیگیری سفارش و درخواست همکاران"
      active="/admin/tickets"
      actions={
        <>
          <a
            href="#tickets-list"
            className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-2 text-sm font-semibold text-on-surface hover:border-primary-container hover:text-primary-container"
          >
            برو به لیست
          </a>
          <Link
            href="/admin/orders"
            className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-2 text-sm font-semibold text-on-surface hover:border-primary-container hover:text-primary-container"
          >
            سفارش‌ها
          </Link>
          <Link
            href="/admin/tickets?status=OPEN#tickets-list"
            className="cyber-chamfer-sm bg-cta px-3 py-2 text-sm font-semibold text-on-primary"
          >
            تیکت‌های باز
          </Link>
        </>
      }
    >
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
            <p className="text-xl font-bold tabular-nums tracking-tight sm:text-2xl">{c.value}</p>
            <p className="mt-1 text-[11px] text-on-surface-variant">{c.hint}</p>
          </Link>
        ))}
      </div>

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

      <section id="tickets-action" className="mt-6 scroll-mt-4">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-base font-bold">نیازمند اقدام الان</h2>
            <p className="mt-0.5 text-xs text-on-surface-variant">تیکت‌های فوری و موارد مرتبط با سفارش / موجودی</p>
          </div>
          <span className="alert-warn cyber-chamfer-sm px-2.5 py-0.5 text-[11px] font-bold">
            {hub.alerts.length} مورد
          </span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {hub.alerts.map((a, i) => (
            <Link
              key={`${a.kind}-${i}`}
              href={a.href}
              className={`cyber-chamfer-sm border px-3.5 py-3 transition-colors hover:border-primary-container/50 ${alertTone[a.kind] ?? "bg-surface"}`}
            >
              <p className="text-[11px] font-bold text-on-surface-variant">{a.title}</p>
              <p className="mt-1 text-sm font-semibold leading-6">{a.detail}</p>
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {hub.statusShortcuts.map((s) => {
          const active = s.status === activeStatus;
          const live = s.status === "" ? totalLive : (countByStatus[s.status] ?? 0);
          const params = new URLSearchParams();
          if (s.status) params.set("status", s.status);
          if (scope) params.set("scope", scope);
          const qs = params.toString();
          const href = qs ? `/admin/tickets?${qs}#tickets-list` : "/admin/tickets#tickets-list";
          return (
            <Link
              key={s.href}
              href={href}
              className={`flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors ${
                active
                  ? "border-primary-container bg-cta text-on-primary"
                  : "border-outline bg-surface-container-low hover:border-primary-container"
              }`}
            >
              <Icon name={s.icon} className={`h-3.5 w-3.5 ${active ? "text-on-primary" : "text-primary-container"}`} />
              {s.label}
              <span
                className={`rounded-md px-1.5 py-0.5 text-[11px] tabular-nums ${
                  active ? "bg-on-primary/20 text-on-primary" : "bg-surface-container-low text-on-surface-variant"
                }`}
              >
                {live}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {hub.scopeShortcuts.map((s) => {
          const softActive = s.scope === scope;
          const params = new URLSearchParams();
          if (status) params.set("status", status);
          if (s.scope) params.set("scope", s.scope);
          const qs = params.toString();
          const href = qs ? `/admin/tickets?${qs}#tickets-list` : "/admin/tickets#tickets-list";
          return (
            <Link
              key={s.href}
              href={href}
              className={`shrink-0 cyber-chamfer-sm border px-3 py-1.5 text-xs font-semibold transition-colors ${
                softActive
                  ? "border-primary-container/60 bg-primary-container/10 text-primary-container"
                  : "border-outline bg-surface-container-low text-on-surface-variant hover:border-primary-container"
              }`}
            >
              {s.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3 lg:gap-5">
        <section className="cyber-chamfer border border-outline bg-surface-container-lowest p-4 sm:p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold">موضوعات پرتکرار</h2>
              <p className="mt-0.5 text-xs text-on-surface-variant">دسته‌بندی برای فیلتر سریع</p>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {hub.categories.map((c) => (
              <Link
                key={c.title}
                href={c.href}
                className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3.5 py-3 hover:border-primary-container/40"
              >
                <p className="text-sm font-semibold">{c.title}</p>
                <p className="mt-1 text-[11px] text-on-surface-variant">{c.meta}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="cyber-chamfer border border-outline bg-surface-container-lowest p-4 sm:p-5">
          <h2 className="mb-3 text-base font-bold">وضعیت واقعی دیتابیس</h2>
          <ul className="space-y-2.5 text-sm">
            {Object.entries(TICKET_STATUS_FA).map(([key, label]) => (
              <li key={key} className="flex items-center justify-between gap-2">
                <Link href={`/admin/tickets?status=${key}#tickets-list`} className="font-semibold hover:text-primary-container">
                  {label}
                </Link>
                <span className="tabular-nums text-on-surface-variant">{countByStatus[key] ?? 0}</span>
              </li>
            ))}
            <li className="flex items-center justify-between gap-2 border-t border-outline pt-2.5 font-bold">
              <span>جمع</span>
              <span className="tabular-nums">{totalLive}</span>
            </li>
          </ul>
        </section>
      </div>

      <section id="tickets-list" className="mt-8 scroll-mt-4 border-t border-outline pt-6">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold">لیست تیکت‌ها</h2>
            <p className="mt-0.5 text-sm text-on-surface-variant">
              داده واقعی · {tickets.length} مورد
              {status ? ` · ${TICKET_STATUS_FA[status]}` : ""}
              {scope === "partner" ? " · همکار" : ""}
              {scope === "customer" ? " · مشتری" : ""}
              {scope === "order" ? " · با سفارش" : ""}
              {q ? ` · «${q}»` : ""}
            </p>
          </div>
        </div>

        <form className="mb-4 flex flex-wrap items-center gap-2 cyber-chamfer border border-outline bg-surface-container-lowest p-3">
          {scope ? <input type="hidden" name="scope" value={scope} /> : null}
          <div className="relative min-w-[200px] flex-1">
            <Icon
              name="search"
              className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-on-surface-variant"
            />
            <input
              name="q"
              defaultValue={q}
              placeholder="موضوع، کد تیکت، مشتری، ایمیل یا کد سفارش"
              className="w-full cyber-chamfer-sm border border-outline bg-surface-container-lowest-container-low py-2.5 pr-10 pl-3 text-sm outline-none focus:border-primary-container"
            />
          </div>
          <select
            name="status"
            defaultValue={sp.status ?? ""}
            className="cyber-chamfer-sm border border-outline bg-surface-container-lowest-container-low px-3 py-2.5 text-sm outline-none focus:border-primary-container"
          >
            <option value="">همه وضعیت‌ها</option>
            {Object.entries(TICKET_STATUS_FA).map(([k, v]) => (
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
          {(q || status || scope) && (
            <Link
              href="/admin/tickets#tickets-list"
              className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-2.5 text-sm font-semibold hover:border-primary-container hover:text-primary-container"
            >
              پاک کردن
            </Link>
          )}
        </form>

        <div className="cyber-chamfer border border-outline bg-surface-container-lowest">
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="border-b border-outline bg-surface-container font-mono text-[11px] uppercase tracking-wider text-on-surface-variant">
                <tr>
                  <th className="px-4 py-3 text-right font-medium">کد</th>
                  <th className="px-4 py-3 text-right font-medium">موضوع</th>
                  <th className="px-4 py-3 text-right font-medium">کاربر</th>
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
                        <Link href={`/admin/tickets/${t.id}`} className="font-semibold hover:text-primary-container">
                          {t.subject}
                        </Link>
                        <span className="mt-0.5 block text-[11px] text-on-surface-variant">
                          {t._count.messages} پیام
                          {t.order ? (
                            <>
                              {" · "}
                              <Link href={`/admin/orders/${t.order.id}`} className="font-semibold text-primary-container">
                                {t.order.code}
                              </Link>
                            </>
                          ) : null}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold">{t.user.name}</span>
                        <span className="mt-0.5 block text-[11px] text-on-surface-variant">
                          {ROLE_FA[t.user.role] ?? t.user.role}
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
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${TICKET_STATUS_BADGE[t.status] ?? "bg-surface-container-high"}`}
                        >
                          {TICKET_STATUS_FA[t.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/tickets/${t.id}`}
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
                <Link key={t.id} href={`/admin/tickets/${t.id}`} className="block p-4 hover:bg-surface-container-low/40">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold leading-6">{t.subject}</p>
                      <p className="mt-1 text-xs text-on-surface-variant">
                        <span dir="ltr">{t.code}</span> · {t.user.name} · {ROLE_FA[t.user.role]}
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
                    {t.order ? ` · ${t.order.code}` : ""}
                  </p>
                </Link>
              );
            })}
          </div>

          {!tickets.length ? (
            <p className="p-10 text-center text-sm text-on-surface-variant">تیکتی با این فیلتر پیدا نشد.</p>
          ) : null}
        </div>
      </section>
    </AdminShell>
  );
}
