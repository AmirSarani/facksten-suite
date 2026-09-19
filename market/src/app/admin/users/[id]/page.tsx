import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { AdminUserActions } from "@/components/admin-user-actions";
import { RoleSelect } from "@/components/role-select";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatToman } from "@/lib/format";
import { ORDER_STATUS_BADGE, ORDER_STATUS_FA, ROLE_FA, TICKET_STATUS_BADGE, TICKET_STATUS_FA } from "@/lib/panel";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id } });
  return { title: user ? `کاربر ${user.name}` : "کاربر" };
}

export default async function AdminUserDetailPage({ params }: Props) {
  await requireUser(["ADMIN"]);
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      orders: { orderBy: { createdAt: "desc" }, take: 8 },
      tickets: { orderBy: { updatedAt: "desc" }, take: 8 },
      products: { where: { active: true }, take: 6, orderBy: { updatedAt: "desc" } },
      _count: { select: { orders: true, tickets: true, products: true, reviews: true } },
    },
  });
  if (!user) notFound();

  return (
    <AdminShell
      title={user.name}
      subtitle={`${ROLE_FA[user.role]} · ${user.email}`}
      active="/admin/users"
      actions={
        <>
          <Link
            href="/admin/users"
            className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-2 text-sm font-semibold text-on-surface hover:border-primary-container hover:text-primary-container"
          >
            لیست کاربران
          </Link>
          {user.role === "PARTNER" ? (
            <Link
              href={`/admin/products?flag=partner`}
              className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-2 text-sm font-semibold text-on-surface hover:border-primary-container hover:text-primary-container"
            >
              محصولات همکاران
            </Link>
          ) : null}
        </>
      }
    >
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="cyber-chamfer border border-outline bg-surface-container-lowest p-4">
          <p className="text-[11px] font-bold text-on-surface-variant">وضعیت و نقش</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {user.disabled ? (
              <span className="alert-danger px-2.5 py-0.5 text-xs font-bold">غیرفعال</span>
            ) : (
              <span className="alert-ok px-2.5 py-0.5 text-xs font-bold">فعال</span>
            )}
            <RoleSelect userId={user.id} role={user.role} />
          </div>
          <p className="mt-2 text-[11px] text-on-surface-variant" dir="ltr">
            {user.phone || "بدون تلفن"}
          </p>
        </div>
        {[
          { label: "سفارش‌ها", value: user._count.orders, href: "/admin/orders" },
          { label: "تیکت‌ها", value: user._count.tickets, href: "/admin/tickets" },
          {
            label: user.role === "PARTNER" ? "محصولات" : "نظرات",
            value: user.role === "PARTNER" ? user._count.products : user._count.reviews,
            href: user.role === "PARTNER" ? "/admin/products" : "/admin/reviews",
          },
        ].map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="cyber-chamfer border border-outline bg-surface-container-lowest p-4 transition-colors hover:border-primary-container"
          >
            <p className="text-[11px] font-bold text-on-surface-variant">{s.label}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{s.value}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <section className="cyber-chamfer border border-outline bg-surface-container-lowest p-4 sm:p-5">
            <div className="mb-3">
              <h2 className="text-base font-bold">سفارش‌های اخیر</h2>
              <p className="mt-0.5 text-xs text-on-surface-variant">{user._count.orders} سفارش در مجموع</p>
            </div>
            <ul className="divide-y divide-outline">
              {user.orders.map((o) => (
                <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0">
                  <Link href={`/admin/orders/${o.id}`} className="font-semibold text-primary-container hover:underline" dir="ltr">
                    {o.code}
                  </Link>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${ORDER_STATUS_BADGE[o.status] ?? "bg-surface-container-high"}`}
                  >
                    {ORDER_STATUS_FA[o.status]}
                  </span>
                  <span className="tabular-nums text-sm font-medium">{formatToman(o.total)}</span>
                </li>
              ))}
              {!user.orders.length ? <li className="py-4 text-sm text-on-surface-variant">سفارشی نیست.</li> : null}
            </ul>
          </section>

          <section className="cyber-chamfer border border-outline bg-surface-container-lowest p-4 sm:p-5">
            <h2 className="mb-1 text-base font-bold">تیکت‌های اخیر</h2>
            <p className="mb-3 text-xs text-on-surface-variant">{user._count.tickets} تیکت در مجموع</p>
            <ul className="divide-y divide-outline">
              {user.tickets.map((t) => (
                <li key={t.id} className="flex flex-wrap items-start justify-between gap-2 py-2.5 first:pt-0 last:pb-0">
                  <Link href={`/admin/tickets/${t.id}`} className="min-w-0 font-semibold text-primary-container hover:underline">
                    <span dir="ltr">{t.code}</span>
                    <span className="mt-0.5 block text-xs font-normal text-on-surface-variant">{t.subject}</span>
                  </Link>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${TICKET_STATUS_BADGE[t.status] ?? ""}`}
                  >
                    {TICKET_STATUS_FA[t.status] ?? t.status}
                  </span>
                </li>
              ))}
              {!user.tickets.length ? <li className="py-4 text-sm text-on-surface-variant">تیکتی نیست.</li> : null}
            </ul>
          </section>

          {user.role === "PARTNER" ? (
            <section className="cyber-chamfer border border-outline bg-surface-container-lowest p-4 sm:p-5">
              <h2 className="mb-3 text-base font-bold">محصولات همکار</h2>
              <ul className="space-y-2 text-sm">
                {user.products.map((p) => (
                  <li key={p.id}>
                    <Link href={`/admin/products/${p.id}`} className="font-semibold text-primary-container hover:underline">
                      {p.title}
                    </Link>
                  </li>
                ))}
                {!user.products.length ? <li className="text-on-surface-variant">محصولی ثبت نشده.</li> : null}
              </ul>
            </section>
          ) : null}
        </div>

        <AdminUserActions userId={user.id} disabled={user.disabled} name={user.name} phone={user.phone} />
      </div>
    </AdminShell>
  );
}
