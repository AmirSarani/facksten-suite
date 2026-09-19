import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminOrderOps } from "@/components/admin-order-ops";
import { AdminShell } from "@/components/admin-shell";
import { OrderInvoice } from "@/components/order-invoice";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatToman } from "@/lib/format";
import { ORDER_STATUS_FA } from "@/lib/panel";

type Props = { params: Promise<{ id: string }> };

export default async function AdminOrderDetailPage({ params }: Props) {
  await requireUser(["ADMIN"]);
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: true,
      items: true,
      tickets: { orderBy: { updatedAt: "desc" }, take: 5 },
    },
  });
  if (!order) notFound();

  return (
    <AdminShell title={`سفارش ${order.code}`} subtitle={`${order.user.name} · ${formatToman(order.total)} تومان`} active="/admin/orders">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Link href="/admin/orders" className="text-sm font-semibold text-primary-container hover:underline">
          ← لیست سفارش‌ها
        </Link>
        <Link href={`/admin/users/${order.userId}`} className="text-sm font-semibold text-on-surface-variant hover:text-primary">
          پروفایل مشتری
        </Link>
        <span className="text-sm text-on-surface-variant">{ORDER_STATUS_FA[order.status]}</span>
      </div>

      <AdminOrderOps
        orderId={order.id}
        status={order.status}
        trackingCode={order.trackingCode}
        adminNote={order.adminNote}
      />

      {order.tickets.length > 0 ? (
        <div className="mb-6 cyber-chamfer border border-outline bg-surface-container-lowest p-4">
          <h2 className="mb-2 text-sm font-bold">تیکت‌های مرتبط</h2>
          <ul className="space-y-1 text-sm">
            {order.tickets.map((t) => (
              <li key={t.id}>
                <Link href={`/admin/tickets/${t.id}`} className="font-semibold text-primary-container hover:underline">
                  {t.code} — {t.subject}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <OrderInvoice
        order={{
          code: order.code,
          createdAt: order.createdAt.toISOString(),
          status: order.status,
          total: order.total,
          shippingName: order.shippingName,
          shippingPhone: order.shippingPhone,
          shippingAddr: order.shippingAddr,
          paymentMethod: order.paymentMethod,
          user: { name: order.user.name, email: order.user.email },
          items: order.items.map((i) => ({ title: i.title, price: i.price, qty: i.qty, type: i.type })),
        }}
      />
    </AdminShell>
  );
}
