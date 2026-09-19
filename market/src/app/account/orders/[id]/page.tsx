import Link from "next/link";
import { notFound } from "next/navigation";
import { AccountShell } from "@/components/account-shell";
import { OrderInvoice } from "@/components/order-invoice";
import { OrderReviewForm } from "@/components/order-review-form";
import { Icon } from "@/components/icon";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatToman } from "@/lib/format";
import { ORDER_STATUS_BADGE, ORDER_STATUS_FA, PRODUCT_TYPE_FA } from "@/lib/panel";

type Props = { params: Promise<{ id: string }> };

const steps = [
  { key: "PENDING", label: "ثبت سفارش", icon: "check_circle" as const },
  { key: "PROCESSING", label: "پردازش انبار", icon: "inventory_2" as const },
  { key: "SHIPPED", label: "ارسال", icon: "local_shipping" as const },
  { key: "COMPLETED", label: "تحویل", icon: "home_iot_device" as const },
] as const;

function stepIndex(status: string) {
  if (status === "PAID") return 1;
  if (status === "CANCELLED") return -1;
  const i = steps.findIndex((s) => s.key === status);
  return i < 0 ? 0 : i;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id } });
  return { title: order ? `سفارش ${order.code}` : "جزئیات سفارش" };
}

export default async function AccountOrderDetailPage({ params }: Props) {
  const user = await requireUser(["CUSTOMER", "ADMIN"]);
  if (!user) return null;
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: true } },
      user: true,
      tickets: { select: { id: true, code: true, status: true }, take: 3, orderBy: { updatedAt: "desc" } },
    },
  });
  if (!order || (user.role === "CUSTOMER" && order.userId !== user.id)) notFound();

  const reviewable = order.status === "COMPLETED" ? order.items.filter((i) => i.type === "HARDWARE") : [];
  const digitalItems = order.items.filter((i) => i.type === "DIGITAL");
  const currentStep = stepIndex(order.status);

  const existingReviews = await prisma.review.findMany({
    where: { userId: user.id, productId: { in: reviewable.map((i) => i.productId) } },
    select: { productId: true },
  });
  const reviewedIds = new Set(existingReviews.map((r) => r.productId));

  return (
    <AccountShell
      title={`سفارش ${order.code}`}
      subtitle={`${ORDER_STATUS_FA[order.status] ?? order.status} · ${formatToman(order.total)} تومان`}
      active="/account/orders"
      actions={
        <>
          <Link
            href="/account/orders"
            className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-2 text-sm font-semibold text-on-surface hover:border-primary-container hover:text-primary-container"
          >
            بازگشت
          </Link>
          {digitalItems.length > 0 && ["PAID", "PROCESSING", "SHIPPED", "COMPLETED"].includes(order.status) ? (
            <Link
              href="/account/downloads"
              className="cyber-chamfer-sm bg-cta px-3 py-2 text-sm font-semibold text-on-primary"
            >
              دانلود فایل‌ها
            </Link>
          ) : null}
        </>
      }
    >
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="cyber-chamfer-sm border border-outline bg-surface-container-lowest px-3.5 py-3">
          <p className="text-[11px] font-bold text-on-surface-variant">وضعیت</p>
          <span
            className={`mt-1.5 inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${ORDER_STATUS_BADGE[order.status] ?? ""}`}
          >
            {ORDER_STATUS_FA[order.status] ?? order.status}
          </span>
        </div>
        <div className="cyber-chamfer-sm border border-outline bg-surface-container-lowest px-3.5 py-3">
          <p className="text-[11px] font-bold text-on-surface-variant">تاریخ ثبت</p>
          <p className="mt-1.5 text-sm font-semibold tabular-nums">
            {new Date(order.createdAt).toLocaleDateString("fa-IR")}
          </p>
        </div>
        <div className="cyber-chamfer-sm border border-outline bg-surface-container-lowest px-3.5 py-3">
          <p className="text-[11px] font-bold text-on-surface-variant">مبلغ</p>
          <p className="mt-1.5 text-sm font-bold tabular-nums">{formatToman(order.total)} تومان</p>
        </div>
        <div className="cyber-chamfer-sm border border-outline bg-surface-container-lowest px-3.5 py-3">
          <p className="text-[11px] font-bold text-on-surface-variant">کد رهگیری</p>
          <p className="mt-1.5 text-sm font-semibold" dir="ltr">
            {order.trackingCode || "—"}
          </p>
        </div>
      </div>

      {order.status !== "CANCELLED" ? (
        <section className="mb-5 cyber-chamfer border border-outline bg-surface-container-lowest p-4 sm:p-5">
          <h2 className="mb-4 text-base font-bold">مراحل سفارش</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {steps.map((s, i) => {
              const done = currentStep >= 0 && i <= currentStep;
              const current = currentStep === i;
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
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="cyber-chamfer-sm border border-outline bg-surface-container-lowest px-3.5 py-3 sm:col-span-2">
          <p className="text-[11px] font-bold text-on-surface-variant">اقلام</p>
          <ul className="mt-2 space-y-1.5 text-sm">
            {order.items.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  {i.title} × {i.qty}
                  <span className="ms-2 rounded-md bg-surface-container-low px-1.5 py-0.5 text-[10px] font-bold text-on-surface-variant">
                    {PRODUCT_TYPE_FA[i.type] ?? i.type}
                  </span>
                </span>
                <span className="tabular-nums font-semibold">{formatToman(i.price * i.qty)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="cyber-chamfer-sm border border-outline bg-surface-container-lowest px-3.5 py-3">
          <p className="text-[11px] font-bold text-on-surface-variant">پشتیبانی</p>
          {order.tickets.length ? (
            <ul className="mt-2 space-y-1.5 text-sm">
              {order.tickets.map((t) => (
                <li key={t.id}>
                  <Link href={`/account/tickets/${t.id}`} className="font-semibold text-primary-container hover:underline">
                    {t.code}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Link
              href="/account/tickets"
              className="mt-2 inline-flex text-sm font-semibold text-primary-container hover:underline"
            >
              ثبت تیکت برای این سفارش
            </Link>
          )}
        </div>
      </div>

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

      {reviewable.length > 0 && (
        <div className="mt-8 cyber-chamfer border border-outline bg-surface-container-lowest p-5">
          <h2 className="mb-4 text-lg font-bold">ثبت نظر برای محصولات</h2>
          <div className="space-y-4">
            {reviewable.map((i) =>
              reviewedIds.has(i.productId) ? (
                <p key={i.id} className="text-sm text-on-surface-variant">
                  برای «{i.title}» قبلاً نظر ثبت کرده‌اید.
                </p>
              ) : (
                <OrderReviewForm key={i.id} productId={i.productId} productTitle={i.title} />
              ),
            )}
          </div>
        </div>
      )}
    </AccountShell>
  );
}
