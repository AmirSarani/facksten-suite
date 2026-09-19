import Link from "next/link";
import { notFound } from "next/navigation";
import { PartnerShell } from "@/components/partner-shell";
import { OrderInvoice } from "@/components/order-invoice";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatToman } from "@/lib/format";

type Props = { params: Promise<{ id: string }> };

export default async function PartnerOrderDetailPage({ params }: Props) {
  const user = await requireUser(["PARTNER", "ADMIN"]);
  if (!user) return null;
  const { id } = await params;

  const products = await prisma.product.findMany({
    where: user.role === "ADMIN" ? { sellerId: { not: null } } : { sellerId: user.id },
    select: { id: true },
  });
  const productIds = new Set(products.map((p) => p.id));

  const order = await prisma.order.findUnique({
    where: { id },
    include: { user: true, items: true },
  });
  if (!order) notFound();

  const myItems = order.items.filter((i) => productIds.has(i.productId));
  if (!myItems.length && user.role === "PARTNER") notFound();

  const subtotal = myItems.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <PartnerShell
      title={`سفارش ${order.code}`}
      subtitle={`سهم شما: ${formatToman(subtotal)} تومان · ${order.user.name}`}
      active="/partner/orders"
      actions={
        <Link
          href="/partner/orders"
          className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-2 text-sm font-semibold text-on-surface hover:border-primary-container hover:text-primary-container"
        >
          گزارش فروش
        </Link>
      }
    >
      <OrderInvoice
        order={{
          code: order.code,
          createdAt: order.createdAt.toISOString(),
          status: order.status,
          total: user.role === "ADMIN" ? order.total : subtotal,
          shippingName: order.shippingName,
          shippingPhone: order.shippingPhone,
          shippingAddr: order.shippingAddr,
          paymentMethod: order.paymentMethod,
          user: { name: order.user.name, email: order.user.email },
          items: (user.role === "ADMIN" ? order.items : myItems).map((i) => ({
            title: i.title,
            price: i.price,
            qty: i.qty,
            type: i.type,
          })),
        }}
      />
    </PartnerShell>
  );
}
