import Link from "next/link";
import { notFound } from "next/navigation";
import { PartnerShell } from "@/components/partner-shell";
import { TicketReplyForm } from "@/components/ticket-reply-form";
import { TicketStatusButton } from "@/components/ticket-status-button";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ORDER_STATUS_FA, TICKET_STATUS_BADGE, TICKET_STATUS_FA } from "@/lib/panel";

type Props = { params: Promise<{ id: string }> };

export default async function PartnerTicketDetailPage({ params }: Props) {
  const user = await requireUser(["PARTNER", "ADMIN"]);
  if (!user) return null;
  const { id } = await params;

  const products = await prisma.product.findMany({
    where: user.role === "ADMIN" ? { sellerId: { not: null } } : { sellerId: user.id },
    select: { id: true },
  });
  const productIds = new Set(products.map((p) => p.id));

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      user: true,
      order: { include: { items: true } },
      messages: { include: { user: true }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!ticket) notFound();

  const relatedItems = ticket.order?.items.filter((i) => productIds.has(i.productId)) ?? [];
  if (user.role === "PARTNER" && !relatedItems.length) notFound();

  return (
    <PartnerShell
      title={ticket.subject}
      subtitle={`${ticket.code} · ${ticket.user.name}`}
      active="/partner/tickets"
      actions={
        <>
          <Link
            href="/partner/tickets"
            className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-2 text-sm font-semibold text-on-surface hover:border-primary-container hover:text-primary-container"
          >
            بازگشت به لیست
          </Link>
          <TicketStatusButton ticketId={ticket.id} status={ticket.status} />
        </>
      }
    >
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="cyber-chamfer-sm border border-outline bg-surface-container-lowest px-3.5 py-3">
          <p className="text-[11px] font-bold text-on-surface-variant">وضعیت</p>
          <span
            className={`mt-1.5 inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${TICKET_STATUS_BADGE[ticket.status] ?? ""}`}
          >
            {TICKET_STATUS_FA[ticket.status]}
          </span>
        </div>
        <div className="cyber-chamfer-sm border border-outline bg-surface-container-lowest px-3.5 py-3">
          <p className="text-[11px] font-bold text-on-surface-variant">مشتری</p>
          <p className="mt-1.5 text-sm font-semibold">{ticket.user.name}</p>
          <p className="truncate text-[11px] text-on-surface-variant" dir="ltr">
            {ticket.user.email}
          </p>
        </div>
        <div className="cyber-chamfer-sm border border-outline bg-surface-container-lowest px-3.5 py-3">
          <p className="text-[11px] font-bold text-on-surface-variant">سفارش مرتبط</p>
          {ticket.order ? (
            <>
              <Link
                href={`/partner/orders/${ticket.order.id}`}
                className="mt-1.5 block text-sm font-semibold text-primary-container hover:underline"
                dir="ltr"
              >
                {ticket.order.code}
              </Link>
              <p className="text-[11px] text-on-surface-variant">
                {ORDER_STATUS_FA[ticket.order.status] ?? ticket.order.status}
              </p>
            </>
          ) : (
            <p className="mt-1.5 text-sm text-on-surface-variant">ندارد</p>
          )}
        </div>
        <div className="cyber-chamfer-sm border border-outline bg-surface-container-lowest px-3.5 py-3">
          <p className="text-[11px] font-bold text-on-surface-variant">به‌روزرسانی</p>
          <p className="mt-1.5 text-sm font-semibold tabular-nums">
            {new Date(ticket.updatedAt).toLocaleString("fa-IR")}
          </p>
          <p className="text-[11px] text-on-surface-variant">{ticket.messages.length} پیام</p>
        </div>
      </div>

      {relatedItems.length > 0 ? (
        <section className="mb-5 cyber-chamfer border border-outline bg-surface-container-lowest p-4 sm:p-5">
          <h2 className="mb-3 text-base font-bold">اقلام مرتبط با شما</h2>
          <ul className="space-y-2">
            {relatedItems.map((i) => (
              <li
                key={i.id}
                className="flex flex-wrap items-center justify-between gap-2 cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-2.5 text-sm"
              >
                <span className="font-medium">{i.title}</span>
                <span className="text-xs tabular-nums text-on-surface-variant">× {i.qty}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mb-5 cyber-chamfer border border-outline bg-surface-container-lowest p-4 sm:p-5">
        <h2 className="mb-4 text-base font-bold">گفتگو · {ticket.messages.length} پیام</h2>
        <div className="space-y-3">
          {ticket.messages.map((m) => (
            <div
              key={m.id}
              className={`cyber-chamfer-sm border px-3.5 py-3 ${
                m.isStaff
                  ? "border-primary-container/30 bg-primary-container/5"
                  : "border-outline bg-surface-container-low/40"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold">{m.isStaff ? "پشتیبانی / همکار" : m.user.name}</p>
                <time className="text-[11px] tabular-nums text-on-surface-variant">
                  {new Date(m.createdAt).toLocaleString("fa-IR")}
                </time>
              </div>
              <p className="mt-2 text-sm leading-7 text-on-surface">{m.body}</p>
            </div>
          ))}
          {!ticket.messages.length ? (
            <p className="text-sm text-on-surface-variant">هنوز پیامی ثبت نشده.</p>
          ) : null}
        </div>
      </section>

      {ticket.status !== "CLOSED" ? (
        <div className="cyber-chamfer border border-outline bg-surface-container-lowest p-4 sm:p-5">
          <h2 className="mb-3 text-base font-bold">پاسخ شما</h2>
          <TicketReplyForm ticketId={ticket.id} />
        </div>
      ) : (
        <p className="cyber-chamfer-sm border border-dashed border-outline px-4 py-6 text-center text-sm text-on-surface-variant">
          تیکت بسته است — برای پاسخ دوباره، وضعیت را از بالا تغییر دهید.
        </p>
      )}
    </PartnerShell>
  );
}
