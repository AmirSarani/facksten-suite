import type { IconName } from "@/components/icon";
import type { DashboardAlert, DashboardKpi, DashboardListItem } from "@/lib/admin-dashboard-mock";
import { formatToman } from "@/lib/format";
import { buildDaySeries, formatDayLabel } from "@/lib/panel";

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

function buildOrderCountSeries() {
  const { keys } = buildDaySeries(30);
  const pattern = [4, 3, 5, 2, 6, 9, 10, 4, 3, 5, 5, 7, 8, 11, 4, 3, 6, 6, 8, 12, 13, 5, 4, 6, 7, 8, 10, 11, 5, 6];
  return keys.map((key, i) => ({
    key,
    value: pattern[i % pattern.length] ?? 4,
    label: formatDayLabel(key),
  }));
}

/** Ops hub mock for /admin/orders — charts + queues; list below stays live from DB. */
export function getAdminOrdersHubMock() {
  const salesSeries = buildSalesSeries();
  const orderCountSeries = buildOrderCountSeries();
  const sales30Total = salesSeries.reduce((s, p) => s + p.value, 0);
  const orders30Total = orderCountSeries.reduce((s, p) => s + p.value, 0);

  const primaryKpis: DashboardKpi[] = [
    {
      label: "فروش ۳۰ روز",
      value: formatToman(sales30Total),
      href: "#orders-analytics",
      hint: "تومان · بدون لغو",
      icon: "payments",
    },
    {
      label: "سفارش ۳۰ روز",
      value: String(orders30Total),
      href: "#orders-list",
      hint: `میانگین روز: ${Math.round(orders30Total / 30)}`,
      icon: "shopping_cart",
    },
    {
      label: "نیازمند اقدام",
      value: "۹",
      href: "#orders-action",
      hint: "۴ پرداخت · ۵ پردازش فوری",
      icon: "local_shipping",
    },
    {
      label: "میانگین سبد",
      value: formatToman(Math.round(sales30Total / Math.max(1, orders30Total))),
      href: "#orders-analytics",
      hint: "تومان / سفارش",
      icon: "payments",
    },
  ];

  const secondaryKpis: DashboardKpi[] = [
    {
      label: "در حال ارسال",
      value: "۶",
      href: "/admin/orders?status=SHIPPED#orders-list",
      hint: "پیگیری پست",
      icon: "local_shipping",
    },
    {
      label: "تیکت سفارش",
      value: "۵",
      href: "/admin/tickets?status=OPEN",
      hint: "درخواست مشتری",
      icon: "mail",
    },
    {
      label: "درخواست همکار",
      value: "۳",
      href: "#orders-queues",
      hint: "تسویه / موجودی",
      icon: "verified_user",
    },
    {
      label: "موجودی کم",
      value: "۹",
      href: "/admin/products?stock=low",
      hint: "تأثیر روی ارسال",
      icon: "inventory_2",
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

  const paymentMix = [
    { label: "زرین‌پال", count: 28, pct: 62 },
    { label: "پرداخت در محل", count: 11, pct: 24 },
    { label: "کارت به کارت", count: 6, pct: 14 },
  ];

  const fulfillment = [
    { label: "آماده ارسال", value: "۸", hint: "پردازش‌شده بدون کد رهگیری", href: "/admin/orders?status=PROCESSING" },
    { label: "تأخیر ارسال >۴۸س", value: "۲", hint: "پرداخت‌شده قدیمی", href: "/admin/orders?status=PAID" },
    { label: "لغو امروز", value: "۱", hint: "نیازمند بررسی موجودی", href: "/admin/orders?status=CANCELLED" },
  ];

  const topProducts = [
    { productId: "mock-1", title: "برد آردوینو Uno R3 اورجینال", qty: 48, revenue: 8_640_000, href: "/admin/products" },
    { productId: "mock-2", title: "ESP32 DevKit C", qty: 41, revenue: 7_380_000, href: "/admin/products" },
    { productId: "mock-3", title: "سنسور DHT22", qty: 36, revenue: 2_808_000, href: "/admin/products" },
    { productId: "mock-4", title: "ماژول OLED 0.96", qty: 33, revenue: 3_135_000, href: "/admin/products" },
    { productId: "mock-5", title: "کاهنده LM2596", qty: 29, revenue: 1_885_000, href: "/admin/products" },
    { productId: "mock-6", title: "آردوینو Nano", qty: 27, revenue: 3_240_000, href: "/admin/products" },
    { productId: "mock-7", title: "HC-SR04 فاصله‌سنج", qty: 25, revenue: 1_125_000, href: "/admin/products" },
    { productId: "mock-8", title: "سورس کنترلر ESP32", qty: 22, revenue: 2_640_000, href: "/admin/products" },
  ];

  const alerts: DashboardAlert[] = [
    {
      kind: "order",
      title: "سفارش نیازمند اقدام",
      detail: "FK-94320 · رضا محمدی · در انتظار پرداخت",
      href: "/admin/orders?status=PENDING",
    },
    {
      kind: "order",
      title: "پرداخت بدون پردازش",
      detail: "FK-94229 · بیش از ۱۲ ساعت در وضعیت پرداخت‌شده",
      href: "/admin/orders?status=PAID",
    },
    {
      kind: "stock",
      title: "موجودی بحرانی",
      detail: "STM32 Blue Pill · موجودی ۰ · سفارش‌های باز",
      href: "/admin/products?stock=low",
    },
    {
      kind: "ticket",
      title: "درخواست مشتری روی سفارش",
      detail: "پیگیری تحویل FK-84920 · علی احمدی",
      href: "/admin/tickets?status=OPEN",
    },
    {
      kind: "ticket",
      title: "درخواست همکار",
      detail: "تأخیر تسویه سهم فروش · نماینده اصفهان",
      href: "/admin/tickets",
    },
  ];

  const userRequests: DashboardListItem[] = [
    {
      title: "پیگیری زمان تحویل سفارش FK-84920",
      meta: "علی احمدی · باز · امروز",
      href: "/admin/tickets",
      badge: "باز",
      badgeClass: "alert-warn",
    },
    {
      title: "درخواست فاکتور رسمی شرکتی",
      meta: "سارا رضایی · باز · دیروز",
      href: "/admin/tickets",
      badge: "باز",
      badgeClass: "alert-warn",
    },
    {
      title: "لینک دانلود دیجیتال فعال نمی‌شود",
      meta: "رضا محمدی · FK-94257 · باز",
      href: "/admin/tickets",
      badge: "سفارش",
      badgeClass: "alert-info",
    },
    {
      title: "مغایرت مشخصات ماژول LM2596",
      meta: "نرگس احمدی · باز قدیمی",
      href: "/admin/tickets",
      badge: "اولویت",
      badgeClass: "bg-error-container text-error",
    },
  ];

  const partnerRequests: DashboardListItem[] = [
    {
      title: "تأخیر تسویه سهم فروش همکار",
      meta: "نماینده اصفهان · ۳ روز پیش",
      href: "/admin/tickets",
      badge: "تسویه",
      badgeClass: "alert-warn",
    },
    {
      title: "به‌روزرسانی موجودی بردهای ESP",
      meta: "مریم شریفی · دیروز",
      href: "/admin/tickets",
      badge: "موجودی",
      badgeClass: "alert-danger",
    },
    {
      title: "درخواست افزودن SKU جدید به پنل",
      meta: "الکترونیک پارس · امروز",
      href: "/admin/users?role=PARTNER",
      badge: "SKU",
      badgeClass: "alert-info",
    },
  ];

  const partnerLowStock: DashboardListItem[] = [
    { title: "ESP32 WROOM", meta: "مریم شریفی · ۳", href: "/admin/products?stock=low" },
    { title: "درایور L298N", meta: "نماینده اصفهان · ۱", href: "/admin/products?stock=low" },
    { title: "ماژول RFID RC522", meta: "مریم شریفی · ۴", href: "/admin/products?stock=low" },
  ];

  const statusShortcuts: { status: string; href: string; label: string; icon: IconName; count: string }[] = [
    { status: "", href: "/admin/orders#orders-list", label: "همه", icon: "shopping_cart", count: "۴۳" },
    { status: "PENDING", href: "/admin/orders?status=PENDING#orders-list", label: "در انتظار", icon: "local_shipping", count: "۴" },
    { status: "PAID", href: "/admin/orders?status=PAID#orders-list", label: "پرداخت‌شده", icon: "payments", count: "۵" },
    { status: "PROCESSING", href: "/admin/orders?status=PROCESSING#orders-list", label: "پردازش", icon: "inventory_2", count: "۷" },
    { status: "SHIPPED", href: "/admin/orders?status=SHIPPED#orders-list", label: "ارسال‌شده", icon: "local_shipping", count: "۶" },
    { status: "COMPLETED", href: "/admin/orders?status=COMPLETED#orders-list", label: "تکمیل", icon: "check_circle", count: "۱۸" },
    { status: "CANCELLED", href: "/admin/orders?status=CANCELLED#orders-list", label: "لغو", icon: "mail", count: "۳" },
  ];

  return {
    salesSeries,
    sales30Total,
    orderCountSeries,
    orders30Total,
    primaryKpis,
    secondaryKpis,
    byStatus,
    byType,
    paymentMix,
    fulfillment,
    topProducts,
    alerts,
    userRequests,
    partnerRequests,
    partnerLowStock,
    statusShortcuts,
  };
}
