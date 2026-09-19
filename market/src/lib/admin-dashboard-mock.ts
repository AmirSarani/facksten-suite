import type { IconName } from "@/components/icon";
import { buildDaySeries, formatDayLabel } from "@/lib/panel";
import { formatToman } from "@/lib/format";

export type DashboardKpi = {
  label: string;
  value: string;
  href: string;
  hint: string;
  icon: IconName;
};

export type DashboardAlert = {
  kind: "order" | "stock" | "ticket" | "article";
  title: string;
  detail: string;
  href: string;
};

export type DashboardListItem = {
  title: string;
  meta: string;
  href: string;
  badge?: string;
  badgeClass?: string;
};

/** Deterministic sales curve for 30 days. */
function buildSalesSeries() {
  const { keys } = buildDaySeries(30);
  const pattern = [
    420_000, 380_000, 510_000, 290_000, 640_000, 880_000, 920_000, 410_000, 360_000, 480_000, 520_000, 710_000,
    850_000, 980_000, 440_000, 390_000, 560_000, 610_000, 740_000, 1_050_000, 1_120_000, 480_000, 430_000, 590_000,
    670_000, 790_000, 960_000, 1_080_000, 520_000, 610_000,
  ];
  return keys.map((key, i) => ({
    key,
    value: pattern[i % pattern.length] ?? 400_000,
    label: formatDayLabel(key),
  }));
}

/**
 * Focused ops dashboard mock — only what an admin needs at a glance.
 * Users / reviews / catalog live on their own pages (KPI links only).
 */
export function getAdminDashboardMock() {
  const salesSeries = buildSalesSeries();
  const sales30Total = salesSeries.reduce((s, p) => s + p.value, 0);

  const primaryKpis: DashboardKpi[] = [
    {
      label: "فروش ۳۰ روز",
      value: formatToman(sales30Total),
      href: "/admin/orders",
      hint: "تومان · بدون لغو",
      icon: "payments",
    },
    {
      label: "سفارش امروز",
      value: "۷",
      href: "/admin/orders",
      hint: "غیرلغو",
      icon: "shopping_cart",
    },
    {
      label: "نیازمند اقدام",
      value: "۵",
      href: "/admin/orders?status=PENDING",
      hint: "پرداخت / تایید",
      icon: "local_shipping",
    },
    {
      label: "تیکت باز",
      value: "۴",
      href: "/admin/tickets?status=OPEN",
      hint: "پاسخ در صف",
      icon: "mail",
    },
  ];

  const secondaryKpis: DashboardKpi[] = [
    {
      label: "موجودی کم",
      value: "۹",
      href: "/admin/products?stock=low",
      hint: "≤۵ عدد",
      icon: "inventory_2",
    },
    {
      label: "کاربر جدید",
      value: "۲۸",
      href: "/admin/users?role=CUSTOMER",
      hint: "۷ روز",
      icon: "person",
    },
    {
      label: "همکار فعال",
      value: "۶",
      href: "/admin/users?role=PARTNER",
      hint: "پنل فروش",
      icon: "verified_user",
    },
    {
      label: "نظر جدید",
      value: "۱۴",
      href: "/admin/reviews",
      hint: "۷ روز",
      icon: "check_circle",
    },
  ];

  const byStatus = [
    { status: "PENDING", count: 4 },
    { status: "PAID", count: 5 },
    { status: "PROCESSING", count: 7 },
    { status: "SHIPPED", count: 6 },
    { status: "COMPLETED", count: 18 },
    { status: "CANCELLED", count: 3 },
  ];

  const byType = [
    { type: "HARDWARE", count: 142, revenue: Math.round(sales30Total * 0.72) },
    { type: "DIGITAL", count: 38, revenue: Math.round(sales30Total * 0.28) },
  ];

  const topProducts = [
    { productId: "mock-1", title: "برد آردوینو Uno R3 اورجینال", qty: 48, revenue: 8_640_000, href: "/admin/products" },
    { productId: "mock-2", title: "ESP32 DevKit C", qty: 41, revenue: 7_380_000, href: "/admin/products" },
    { productId: "mock-3", title: "سنسور DHT22", qty: 36, revenue: 2_808_000, href: "/admin/products" },
    { productId: "mock-4", title: "ماژول OLED 0.96", qty: 33, revenue: 3_135_000, href: "/admin/products" },
    { productId: "mock-5", title: "کاهنده LM2596", qty: 29, revenue: 1_885_000, href: "/admin/products" },
  ];

  const alerts: DashboardAlert[] = [
    {
      kind: "order",
      title: "سفارش نیازمند اقدام",
      detail: "FK-94102 · مریم کریمی · در انتظار پرداخت",
      href: "/admin/orders?status=PENDING",
    },
    {
      kind: "order",
      title: "پرداخت بدون پردازش",
      detail: "FK-94088 · پیمان نوری · بیش از ۱۲ ساعت",
      href: "/admin/orders?status=PAID",
    },
    {
      kind: "stock",
      title: "موجودی بحرانی",
      detail: "STM32 Blue Pill · موجودی ۰",
      href: "/admin/products?stock=low",
    },
    {
      kind: "ticket",
      title: "تیکت باز قدیمی",
      detail: "مغایرت مشخصات ماژول · نرگس احمدی",
      href: "/admin/tickets?status=OPEN",
    },
  ];

  const tickets: DashboardListItem[] = [
    {
      title: "پیگیری زمان تحویل سفارش FK-84920",
      meta: "علی احمدی · امروز",
      href: "/admin/tickets",
      badge: "باز",
      badgeClass: "alert-warn",
    },
    {
      title: "درخواست فاکتور رسمی شرکتی",
      meta: "سارا رضایی · دیروز",
      href: "/admin/tickets",
      badge: "باز",
      badgeClass: "alert-warn",
    },
    {
      title: "لینک دانلود دیجیتال فعال نمی‌شود",
      meta: "رضا محمدی · ۲ روز پیش",
      href: "/admin/tickets",
      badge: "باز",
      badgeClass: "alert-warn",
    },
    {
      title: "مغایرت مشخصات ماژول LM2596",
      meta: "نرگس احمدی · ۴ روز پیش",
      href: "/admin/tickets",
      badge: "اولویت",
      badgeClass: "bg-error-container text-error",
    },
  ];

  const partnerTickets: DashboardListItem[] = [
    {
      title: "تأخیر تسویه سهم فروش",
      meta: "نماینده اصفهان · ۳ روز",
      href: "/admin/tickets",
      badge: "تسویه",
      badgeClass: "alert-warn",
    },
    {
      title: "به‌روزرسانی موجودی ESP",
      meta: "مریم شریفی · دیروز",
      href: "/admin/tickets",
      badge: "موجودی",
      badgeClass: "alert-danger",
    },
  ];

  const recentOrders: DashboardListItem[] = [
    {
      title: "FK-94102 — مریم کریمی",
      meta: formatToman(1_240_000),
      href: "/admin/orders",
      badge: "در انتظار پرداخت",
      badgeClass: "alert-warn",
    },
    {
      title: "FK-94088 — پیمان نوری",
      meta: formatToman(860_000),
      href: "/admin/orders",
      badge: "پرداخت‌شده",
      badgeClass: "alert-info",
    },
    {
      title: "FK-94051 — سارا رضایی",
      meta: formatToman(2_150_000),
      href: "/admin/orders",
      badge: "در حال پردازش",
      badgeClass: "alert-info",
    },
    {
      title: "FK-93990 — رضا محمدی",
      meta: formatToman(540_000),
      href: "/admin/orders",
      badge: "ارسال‌شده",
      badgeClass: "alert-warn",
    },
    {
      title: "FK-93940 — نرگس احمدی",
      meta: formatToman(1_780_000),
      href: "/admin/orders",
      badge: "تکمیل‌شده",
      badgeClass: "alert-ok",
    },
  ];

  return {
    salesSeries,
    sales30Total,
    primaryKpis,
    secondaryKpis,
    byStatus,
    byType,
    topProducts,
    alerts,
    tickets,
    partnerTickets,
    recentOrders,
  };
}
