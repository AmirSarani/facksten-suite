/** Shared labels and helpers for admin / partner / account panels */

export const ORDER_STATUS_FA: Record<string, string> = {
  PENDING: "در انتظار پرداخت",
  PAID: "پرداخت‌شده",
  PROCESSING: "در حال پردازش",
  SHIPPED: "ارسال‌شده",
  COMPLETED: "تکمیل‌شده",
  CANCELLED: "لغو شده",
};

export const ORDER_STATUS_BADGE: Record<string, string> = {
  PENDING: "alert-warn",
  PAID: "alert-info",
  PROCESSING: "alert-info",
  SHIPPED: "alert-warn",
  COMPLETED: "alert-ok",
  CANCELLED: "alert-danger",
};

export const TICKET_STATUS_FA: Record<string, string> = {
  OPEN: "باز",
  ANSWERED: "پاسخ‌داده‌شده",
  CLOSED: "بسته",
};

export const TICKET_STATUS_BADGE: Record<string, string> = {
  OPEN: "alert-warn",
  ANSWERED: "alert-info",
  CLOSED: "bg-surface-container-high text-on-surface-variant border border-outline",
};

export const ROLE_FA: Record<string, string> = {
  ADMIN: "ادمین",
  PARTNER: "همکار",
  CUSTOMER: "مشتری",
};

export const PRODUCT_TYPE_FA: Record<string, string> = {
  HARDWARE: "سخت‌افزار",
  DIGITAL: "دیجیتال",
};

export function orderStatusFa(status: string) {
  return ORDER_STATUS_FA[status] ?? status;
}

export function ticketStatusFa(status: string) {
  return TICKET_STATUS_FA[status] ?? status;
}

export function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

/** Last N calendar days starting from startOfDay N-1 days ago through today */
export function buildDaySeries(days: number) {
  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  since.setHours(0, 0, 0, 0);
  const keys: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    keys.push(dayKey(d));
  }
  return { since, keys };
}

export function formatDayLabel(isoDate: string) {
  const d = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString("fa-IR", { month: "numeric", day: "numeric" });
}

export function slugifyProduct(title: string) {
  return (
    title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\u0600-\u06FF-]/g, "")
      .slice(0, 40) +
    "-" +
    Date.now().toString().slice(-4)
  );
}

/** Stable slug for categories/articles — keeps Persian letters, falls back to timestamp */
export function slugifyContent(input: string, fallback = "item") {
  const base =
    input
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\u0600-\u06FF-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || fallback;
  return base;
}
