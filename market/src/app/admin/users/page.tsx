import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { AdminCreateUserForm } from "@/components/admin-create-user-form";
import { Icon } from "@/components/icon";
import { RoleSelect } from "@/components/role-select";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ROLE_FA } from "@/lib/panel";
import type { Prisma } from "@/generated/prisma/client";

export const metadata = { title: "کاربران" };

type Props = {
  searchParams: Promise<{
    q?: string;
    role?: string;
    status?: string;
    page?: string;
    sort?: string;
    activity?: string;
  }>;
};

const PAGE_SIZE = 24;

function buildHref(opts: {
  q?: string;
  role?: string;
  status?: string;
  sort?: string;
  activity?: string;
  page?: number;
}) {
  const p = new URLSearchParams();
  if (opts.q) p.set("q", opts.q);
  if (opts.role) p.set("role", opts.role);
  if (opts.status) p.set("status", opts.status);
  if (opts.sort && opts.sort !== "newest") p.set("sort", opts.sort);
  if (opts.activity) p.set("activity", opts.activity);
  if (opts.page && opts.page > 1) p.set("page", String(opts.page));
  const s = p.toString();
  return s ? `/admin/users?${s}` : "/admin/users";
}

function relativeFa(date: Date) {
  const diffMs = Date.now() - date.getTime();
  const days = Math.floor(diffMs / 86_400_000);
  if (days <= 0) return "امروز";
  if (days === 1) return "دیروز";
  if (days < 30) return `${days} روز پیش`;
  return date.toLocaleDateString("fa-IR");
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "؟";
  if (parts.length === 1) return parts[0].slice(0, 1);
  return `${parts[0].slice(0, 1)}${parts[parts.length - 1].slice(0, 1)}`;
}

export default async function AdminUsersPage({ searchParams }: Props) {
  await requireUser(["ADMIN"]);
  const sp = await searchParams;
  const q = sp.q?.trim();
  const role = sp.role && ["ADMIN", "PARTNER", "CUSTOMER"].includes(sp.role) ? sp.role : undefined;
  const status = sp.status === "active" || sp.status === "disabled" ? sp.status : undefined;
  const sort = sp.sort === "orders" || sp.sort === "tickets" || sp.sort === "oldest" ? sp.sort : "newest";
  const activity = sp.activity === "orders" || sp.activity === "tickets" ? sp.activity : undefined;
  const page = Math.max(1, Number(sp.page) || 1);

  const where: Prisma.UserWhereInput = {
    ...(role ? { role: role as "ADMIN" | "PARTNER" | "CUSTOMER" } : {}),
    ...(status === "active" ? { disabled: false } : {}),
    ...(status === "disabled" ? { disabled: true } : {}),
    ...(activity === "orders" ? { orders: { some: {} } } : {}),
    ...(activity === "tickets" ? { tickets: { some: {} } } : {}),
    ...(q
      ? {
          OR: [{ name: { contains: q } }, { email: { contains: q } }, { phone: { contains: q } }],
        }
      : {}),
  };

  const orderBy: Prisma.UserOrderByWithRelationInput =
    sort === "oldest"
      ? { createdAt: "asc" }
      : sort === "orders"
        ? { orders: { _count: "desc" } }
        : sort === "tickets"
          ? { tickets: { _count: "desc" } }
          : { createdAt: "desc" };

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [
    total,
    users,
    totalAll,
    customerCount,
    partnerCount,
    adminCount,
    disabledCount,
    recentCount,
    withOrders,
    withTickets,
  ] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      include: { _count: { select: { orders: true, tickets: true, products: true, reviews: true } } },
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.user.count(),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.user.count({ where: { role: "PARTNER" } }),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.user.count({ where: { disabled: true } }),
    prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.user.count({ where: { orders: { some: {} } } }),
    prisma.user.count({ where: { tickets: { some: {} } } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const kpis = [
    {
      label: "کل کاربران",
      value: String(totalAll),
      hint: `${recentCount} ثبت‌نام در ۷ روز`,
      href: "/admin/users#users-list",
      icon: "person" as const,
    },
    {
      label: "مشتری",
      value: String(customerCount),
      hint: "خریدار فروشگاه",
      href: buildHref({ role: "CUSTOMER" }) + "#users-list",
      icon: "shopping_cart" as const,
    },
    {
      label: "همکار",
      value: String(partnerCount),
      hint: "فروشنده پنل",
      href: buildHref({ role: "PARTNER" }) + "#users-list",
      icon: "verified_user" as const,
    },
    {
      label: "ادمین",
      value: String(adminCount),
      hint: disabledCount > 0 ? `${disabledCount} غیرفعال` : "دسترسی کامل",
      href: buildHref({ role: "ADMIN" }) + "#users-list",
      icon: "lock" as const,
    },
  ];

  const chips = [
    { label: "همه", href: buildHref({ q, sort }) + "#users-list", active: !role && !status && !activity, count: totalAll },
    {
      label: "مشتری",
      href: buildHref({ q, role: "CUSTOMER", status, sort, activity }) + "#users-list",
      active: role === "CUSTOMER",
      count: customerCount,
    },
    {
      label: "همکار",
      href: buildHref({ q, role: "PARTNER", status, sort, activity }) + "#users-list",
      active: role === "PARTNER",
      count: partnerCount,
    },
    {
      label: "ادمین",
      href: buildHref({ q, role: "ADMIN", status, sort, activity }) + "#users-list",
      active: role === "ADMIN",
      count: adminCount,
    },
    {
      label: "فعال",
      href: buildHref({ q, role, status: "active", sort, activity }) + "#users-list",
      active: status === "active",
      count: totalAll - disabledCount,
    },
    {
      label: "غیرفعال",
      href: buildHref({ q, role, status: "disabled", sort, activity }) + "#users-list",
      active: status === "disabled",
      count: disabledCount,
    },
    {
      label: "با سفارش",
      href: buildHref({ q, role, status, sort, activity: "orders" }) + "#users-list",
      active: activity === "orders",
      count: withOrders,
    },
    {
      label: "با تیکت",
      href: buildHref({ q, role, status, sort, activity: "tickets" }) + "#users-list",
      active: activity === "tickets",
      count: withTickets,
    },
  ];

  return (
    <AdminShell
      title="کاربران"
      subtitle="نقش‌ها، وضعیت حساب و دسترسی پنل"
      active="/admin/users"
      actions={<AdminCreateUserForm />}
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((c) => (
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

      <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-on-surface-variant">
        <span className="cyber-chamfer-sm border border-outline bg-surface-container-low px-2.5 py-1">
          <span className="font-bold text-on-surface tabular-nums">{withOrders}</span> با سفارش
        </span>
        <span className="cyber-chamfer-sm border border-outline bg-surface-container-low px-2.5 py-1">
          <span className="font-bold text-on-surface tabular-nums">{withTickets}</span> با تیکت
        </span>
        <span className="cyber-chamfer-sm border border-outline bg-surface-container-low px-2.5 py-1">
          <span className="font-bold text-on-surface tabular-nums">{recentCount}</span> جدید ۷ روز
        </span>
      </div>

      {disabledCount > 0 ? (
        <section className="mt-5">
          <Link
            href={buildHref({ status: "disabled" }) + "#users-list"}
            className="flex flex-wrap items-center justify-between gap-2 cyber-chamfer-sm border alert-danger px-3.5 py-3 hover:border-primary-container/40"
          >
            <div>
              <p className="text-[11px] font-bold text-on-surface-variant">نیازمند اقدام</p>
              <p className="mt-1 text-sm font-semibold">{disabledCount} حساب غیرفعال — برای بررسی کلیک کنید</p>
            </div>
            <span className="rounded-lg border border-error/40 bg-surface px-2.5 py-1 text-xs font-semibold text-error">
              مشاهده
            </span>
          </Link>
        </section>
      ) : null}

      <div className="mt-5 max-w-full min-w-0 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {chips.map((chip) => (
          <Link
            key={chip.label}
            href={chip.href}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${
              chip.active
                ? "border-primary-container bg-cta text-on-primary"
                : "border-outline bg-surface-container-low text-on-surface-variant hover:border-primary-container"
            }`}
          >
            {chip.label}
            <span className={`rounded-md px-1.5 py-0.5 tabular-nums ${chip.active ? "bg-on-primary/20" : "bg-surface-container-low"}`}>
              {chip.count}
            </span>
          </Link>
        ))}
      </div>

      <section id="users-list" className="mt-6 scroll-mt-4">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold">لیست کاربران</h2>
            <p className="mt-0.5 text-sm text-on-surface-variant">
              {total} مورد
              {role ? ` · ${ROLE_FA[role]}` : ""}
              {status === "active" ? " · فعال" : ""}
              {status === "disabled" ? " · غیرفعال" : ""}
              {activity === "orders" ? " · با سفارش" : ""}
              {activity === "tickets" ? " · با تیکت" : ""}
              {q ? ` · «${q}»` : ""}
            </p>
          </div>
        </div>

        <form
          method="get"
          action="/admin/users"
          className="mb-4 flex flex-wrap items-center gap-2 cyber-chamfer border border-outline bg-surface-container-lowest p-3"
        >
          {status ? <input type="hidden" name="status" value={status} /> : null}
          {activity ? <input type="hidden" name="activity" value={activity} /> : null}
          <div className="relative min-w-0 flex-1 basis-[160px]">
            <Icon
              name="search"
              className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-on-surface-variant"
            />
            <input
              name="q"
              defaultValue={q}
              placeholder="نام، ایمیل یا تلفن"
              className="w-full cyber-chamfer-sm border border-outline bg-surface-container-lowest-container-low py-2.5 pr-10 pl-3 text-sm outline-none focus:border-primary-container"
            />
          </div>
          <select
            name="role"
            defaultValue={sp.role ?? ""}
            className="cyber-chamfer-sm border border-outline bg-surface-container-lowest-container-low px-3 py-2.5 text-sm outline-none focus:border-primary-container"
          >
            <option value="">همه نقش‌ها</option>
            <option value="CUSTOMER">{ROLE_FA.CUSTOMER}</option>
            <option value="PARTNER">{ROLE_FA.PARTNER}</option>
            <option value="ADMIN">{ROLE_FA.ADMIN}</option>
          </select>
          <select
            name="sort"
            defaultValue={sort}
            className="cyber-chamfer-sm border border-outline bg-surface-container-lowest-container-low px-3 py-2.5 text-sm outline-none focus:border-primary-container"
          >
            <option value="newest">جدیدترین</option>
            <option value="oldest">قدیمی‌ترین</option>
            <option value="orders">بیشترین سفارش</option>
            <option value="tickets">بیشترین تیکت</option>
          </select>
          <button
            type="submit"
            className="cyber-chamfer-sm bg-cta px-4 py-2.5 text-sm font-semibold text-on-primary"
          >
            اعمال
          </button>
          {(q || role || status || activity || sort !== "newest") && (
            <Link
              href="/admin/users#users-list"
              className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-2.5 text-sm font-semibold hover:border-primary-container hover:text-primary-container"
            >
              پاک کردن
            </Link>
          )}
        </form>

        <div className="cyber-chamfer border border-outline bg-surface-container-lowest">
          <div className="table-scroll hidden max-w-full min-w-0 overflow-x-auto md:block">
            <table className="w-full min-w-[920px] text-sm">
              <thead className="border-b border-outline bg-surface-container font-mono text-[11px] uppercase tracking-wider text-on-surface-variant">
                <tr>
                  <th className="px-4 py-3 text-right font-medium">کاربر</th>
                  <th className="px-4 py-3 text-right font-medium">فعالیت</th>
                  <th className="px-4 py-3 text-right font-medium">عضویت</th>
                  <th className="px-4 py-3 text-right font-medium">وضعیت</th>
                  <th className="px-4 py-3 text-right font-medium">نقش</th>
                  <th className="px-4 py-3 text-right font-medium">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-outline hover:bg-surface-container-low/40">
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-container/10 text-xs font-bold text-primary-container">
                          {initials(u.name)}
                        </span>
                        <div className="min-w-0">
                          <Link href={`/admin/users/${u.id}`} className="font-semibold text-primary-container hover:underline">
                            {u.name}
                          </Link>
                          <span className="mt-0.5 block truncate text-[11px] text-on-surface-variant" dir="ltr">
                            {u.email}
                          </span>
                          {u.phone ? (
                            <span className="mt-0.5 block text-[11px] text-on-surface-variant" dir="ltr">
                              {u.phone}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <span className="rounded-md bg-surface-container-low px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-on-surface-variant">
                          {u._count.orders} سفارش
                        </span>
                        <span className="rounded-md bg-surface-container-low px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-on-surface-variant">
                          {u._count.tickets} تیکت
                        </span>
                        {u.role === "PARTNER" ? (
                          <span className="rounded-md alert-info px-1.5 py-0.5 text-[10px] font-semibold tabular-nums">
                            {u._count.products} محصول
                          </span>
                        ) : u._count.reviews > 0 ? (
                          <span className="rounded-md bg-surface-container-low px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-on-surface-variant">
                            {u._count.reviews} نظر
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-on-surface-variant">
                      <span className="block font-medium text-on-surface">{relativeFa(u.createdAt)}</span>
                      <span className="mt-0.5 block tabular-nums">{new Date(u.createdAt).toLocaleDateString("fa-IR")}</span>
                    </td>
                    <td className="px-4 py-3">
                      {u.disabled ? (
                        <span className="alert-danger px-2 py-0.5 text-[10px] font-bold">
                          غیرفعال
                        </span>
                      ) : (
                        <span className="alert-ok px-2 py-0.5 text-[10px] font-bold">
                          فعال
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <RoleSelect userId={u.id} role={u.role} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <Link
                          href={`/admin/users/${u.id}`}
                          className="cyber-chamfer-sm border border-outline bg-surface-container-low px-2.5 py-1.5 text-xs font-semibold hover:border-primary-container"
                        >
                          جزئیات
                        </Link>
                        {u._count.orders > 0 ? (
                          <Link
                            href="/admin/orders"
                            className="cyber-chamfer-sm border border-outline bg-surface-container-low px-2.5 py-1.5 text-xs font-semibold text-on-surface-variant hover:border-primary-container"
                          >
                            سفارش‌ها
                          </Link>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-outline md:hidden">
            {users.map((u) => (
              <div key={u.id} className="p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container/10 text-xs font-bold text-primary-container">
                    {initials(u.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/admin/users/${u.id}`} className="font-semibold text-primary-container">
                        {u.name}
                      </Link>
                      {u.disabled ? (
                        <span className="alert-danger px-2 py-0.5 text-[10px] font-bold">غیرفعال</span>
                      ) : (
                        <span className="alert-ok px-2 py-0.5 text-[10px] font-bold">فعال</span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-on-surface-variant" dir="ltr">
                      {u.email}
                    </p>
                    <p className="mt-2 text-xs text-on-surface-variant">
                      {u._count.orders} سفارش · {u._count.tickets} تیکت · {relativeFa(u.createdAt)}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <RoleSelect userId={u.id} role={u.role} />
                      <Link
                        href={`/admin/users/${u.id}`}
                        className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-1.5 text-xs font-semibold hover:border-primary-container"
                      >
                        جزئیات
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {!users.length ? (
            <div className="p-10 text-center">
              <p className="text-sm text-on-surface-variant">کاربری با این فیلتر پیدا نشد.</p>
              <Link href="/admin/users#users-list" className="mt-3 inline-flex text-sm font-semibold text-primary-container hover:underline">
                پاک کردن فیلترها
              </Link>
            </div>
          ) : null}
        </div>

        {totalPages > 1 ? (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm">
            {page > 1 ? (
              <Link
                href={buildHref({ q, role, status, sort, activity, page: page - 1 }) + "#users-list"}
                className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-1.5 font-semibold hover:border-primary-container"
              >
                قبلی
              </Link>
            ) : null}
            <span className="text-on-surface-variant">
              صفحه {page} از {totalPages}
            </span>
            {page < totalPages ? (
              <Link
                href={buildHref({ q, role, status, sort, activity, page: page + 1 }) + "#users-list"}
                className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-1.5 font-semibold hover:border-primary-container"
              >
                بعدی
              </Link>
            ) : null}
          </div>
        ) : null}
      </section>
    </AdminShell>
  );
}
