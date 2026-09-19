import type { IconName } from "@/components/icon";
import type { DashboardAlert, DashboardKpi, DashboardListItem } from "@/lib/admin-dashboard-mock";

/** Ops summary for /admin/tickets — list below stays live from DB. */
export function getAdminTicketsHubMock() {
  const primaryKpis: DashboardKpi[] = [
    {
      label: "تیکت باز",
      value: "۴",
      href: "/admin/tickets?status=OPEN#tickets-list",
      hint: "نیازمند پاسخ",
      icon: "mail",
    },
    {
      label: "پاسخ‌داده‌شده",
      value: "۶",
      href: "/admin/tickets?status=ANSWERED#tickets-list",
      hint: "منتظر مشتری",
      icon: "check_circle",
    },
    {
      label: "مرتبط با سفارش",
      value: "۵",
      href: "/admin/tickets?scope=order#tickets-list",
      hint: "پیگیری ارسال / دانلود",
      icon: "shopping_cart",
    },
    {
      label: "درخواست همکار",
      value: "۳",
      href: "/admin/tickets?scope=partner#tickets-list",
      hint: "تسویه / موجودی",
      icon: "verified_user",
    },
  ];

  const secondaryKpis: DashboardKpi[] = [
    {
      label: "بسته امروز",
      value: "۲",
      href: "/admin/tickets?status=CLOSED#tickets-list",
      hint: "حل‌شده",
      icon: "check_circle",
    },
    {
      label: "میانگین پاسخ",
      value: "۴س",
      href: "#tickets-action",
      hint: "هدف زیر ۸ ساعت",
      icon: "local_shipping",
    },
    {
      label: "باز قدیمی",
      value: "۱",
      href: "/admin/tickets?status=OPEN#tickets-list",
      hint: ">۳ روز بدون پاسخ",
      icon: "mail",
    },
    {
      label: "مشتری فعال",
      value: "۱۲",
      href: "/admin/users?role=CUSTOMER",
      hint: "دارای تیکت باز",
      icon: "person",
    },
  ];

  const alerts: DashboardAlert[] = [
    {
      kind: "ticket",
      title: "تیکت باز قدیمی",
      detail: "مغایرت مشخصات ماژول · نرگس احمدی · ۴ روز",
      href: "/admin/tickets?status=OPEN#tickets-list",
    },
    {
      kind: "order",
      title: "پیگیری سفارش",
      detail: "تحویل FK-84920 · علی احمدی · پاسخ‌داده‌شده",
      href: "/admin/tickets?scope=order#tickets-list",
    },
    {
      kind: "ticket",
      title: "درخواست همکار",
      detail: "تأخیر تسویه سهم فروش · نماینده اصفهان",
      href: "/admin/tickets?scope=partner#tickets-list",
    },
    {
      kind: "stock",
      title: "موجودی و تیکت",
      detail: "مغایرت موجودی پنل همکار · مرتبط با انبار",
      href: "/admin/products?stock=low",
    },
  ];

  const categories: DashboardListItem[] = [
    { title: "پیگیری سفارش / ارسال", meta: "۸ تیکت ۳۰روز", href: "/admin/tickets?scope=order#tickets-list" },
    { title: "دانلود دیجیتال", meta: "۳ تیکت ۳۰روز", href: "/admin/tickets?q=دانلود#tickets-list" },
    { title: "فاکتور و مالی", meta: "۴ تیکت ۳۰روز", href: "/admin/tickets?q=فاکتور#tickets-list" },
    { title: "موجودی و همکار", meta: "۵ تیکت ۳۰روز", href: "/admin/tickets?scope=partner#tickets-list" },
  ];

  const statusShortcuts: { status: string; href: string; label: string; icon: IconName; count: string }[] = [
    { status: "", href: "/admin/tickets#tickets-list", label: "همه", icon: "mail", count: "۱۲" },
    { status: "OPEN", href: "/admin/tickets?status=OPEN#tickets-list", label: "باز", icon: "mail", count: "۴" },
    {
      status: "ANSWERED",
      href: "/admin/tickets?status=ANSWERED#tickets-list",
      label: "پاسخ‌داده‌شده",
      icon: "check_circle",
      count: "۶",
    },
    { status: "CLOSED", href: "/admin/tickets?status=CLOSED#tickets-list", label: "بسته", icon: "check_circle", count: "۲" },
  ];

  const scopeShortcuts: { scope: string; href: string; label: string }[] = [
    { scope: "", href: "/admin/tickets#tickets-list", label: "همه منابع" },
    { scope: "customer", href: "/admin/tickets?scope=customer#tickets-list", label: "مشتری" },
    { scope: "partner", href: "/admin/tickets?scope=partner#tickets-list", label: "همکار" },
    { scope: "order", href: "/admin/tickets?scope=order#tickets-list", label: "با سفارش" },
  ];

  return {
    primaryKpis,
    secondaryKpis,
    alerts,
    categories,
    statusShortcuts,
    scopeShortcuts,
  };
}
