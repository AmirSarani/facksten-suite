import Link from "next/link";
import { notFound } from "next/navigation";
import { AccountShell } from "@/components/account-shell";
import { TicketReplyForm } from "@/components/ticket-reply-form";
import { TicketStatusButton } from "@/components/ticket-status-button";
import { Icon } from "@/components/icon";
import { UI_IMAGES } from "@/lib/media";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ORDER_STATUS_FA, TICKET_STATUS_BADGE, TICKET_STATUS_FA } from "@/lib/panel";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const ticket = await prisma.ticket.findUnique({ where: { id }, select: { subject: true, code: true } });
  return { title: ticket ? `${ticket.code} · ${ticket.subject}` : "گفتگوی پشتیبانی" };
}

export default async function TicketDetailPage({ params }: Props) {
  const user = await requireUser(["CUSTOMER", "ADMIN"]);
  if (!user) return null;
  const { id } = await params;

  const ticket = await prisma.ticket.findFirst({
    where: { id, ...(user.role === "ADMIN" ? {} : { userId: user.id }) },
    include: {
      order: { select: { id: true, code: true, status: true } },
      messages: { include: { user: true }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!ticket) notFound();

  return (
    <AccountShell
      title={ticket.subject}
      subtitle={`${ticket.code} · ${TICKET_STATUS_FA[ticket.status] ?? ticket.status}`}
      active="/account/tickets"
      actions={
        <>
          <Link
            href="/account/tickets"
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
          <p className="text-[11px] font-bold text-on-surface-variant">کد تیکت</p>
          <p className="mt-1.5 text-sm font-semibold" dir="ltr">
            {ticket.code}
          </p>
        </div>
        <div className="cyber-chamfer-sm border border-outline bg-surface-container-lowest px-3.5 py-3">
          <p className="text-[11px] font-bold text-on-surface-variant">سفارش مرتبط</p>
          {ticket.order ? (
            <>
              <Link
                href={`/account/orders/${ticket.order.id}`}
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

      <div className="flex min-h-[420px] flex-col overflow-hidden cyber-chamfer border border-outline bg-surface-container-lowest">
        <div className="flex-1 space-y-4 overflow-y-auto bg-surface-container-low/40 p-4 md:p-6">
          <div className="flex justify-center">
            <span className="rounded-full bg-surface-container px-3 py-1 text-[10px] text-on-surface-variant">
              شروع گفتگو · {new Date(ticket.createdAt).toLocaleDateString("fa-IR")}
            </span>
          </div>
          {ticket.messages.map((m) => {
            const mine = !m.isStaff;
            return (
              <div key={m.id} className={`flex items-end gap-2 ${mine ? "justify-start" : "justify-end"}`}>
                {!mine ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={UI_IMAGES.author}
                    alt=""
                    className="order-2 mb-1 h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <span className="mb-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-container/15 text-xs font-bold text-primary-container">
                    {m.user.name.slice(0, 1)}
                  </span>
                )}
                <div
                  className={`max-w-[85%] cyber-chamfer-sm px-4 py-3 shadow-[var(--box-shadow-neon-sm)] md:max-w-[70%] ${
                    m.isStaff
                      ? "order-1 rounded-tl-md bg-cta text-on-primary"
                      : "rounded-tr-md border border-outline bg-surface text-on-surface"
                  }`}
                >
                  <p className={`mb-1 text-xs font-semibold ${m.isStaff ? "text-on-primary/90" : "text-on-surface-variant"}`}>
                    {m.isStaff ? "پشتیبانی فکستن" : m.user.name}
                    <span className="me-2 font-normal opacity-80">
                      {" "}
                      {new Date(m.createdAt).toLocaleString("fa-IR")}
                    </span>
                  </p>
                  <p className={`text-sm leading-7 ${m.isStaff ? "text-on-primary" : "text-on-surface"}`}>{m.body}</p>
                </div>
              </div>
            );
          })}
          {!ticket.messages.length ? (
            <p className="text-center text-sm text-on-surface-variant">هنوز پیامی ثبت نشده.</p>
          ) : null}
        </div>

        <div className="sticky bottom-0 border-t border-outline bg-surface-container-lowest p-4">
          {ticket.status !== "CLOSED" ? (
            <TicketReplyForm ticketId={ticket.id} />
          ) : (
            <p className="cyber-chamfer-sm border border-dashed border-outline px-4 py-4 text-center text-sm text-on-surface-variant">
              این تیکت بسته است — از کنترل وضعیت بالا می‌توانید بازگشایی کنید.
            </p>
          )}
        </div>
      </div>

      {ticket.order ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/account/orders/${ticket.order.id}`}
            className="inline-flex items-center gap-2 cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-2 text-sm font-semibold hover:border-primary-container"
          >
            <Icon name="shopping_cart" className="h-4 w-4 text-primary-container" />
            مشاهده سفارش {ticket.order.code}
          </Link>
        </div>
      ) : null}
    </AccountShell>
  );
}
