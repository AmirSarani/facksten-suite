/** Single source of truth for checkout payment method ids, shared by the checkout API and UI. */
export const PAYMENT_METHODS = [
  { id: "zarinpal", label: "پرداخت اینترنتی (درگاه زرین‌پال)" },
  { id: "card", label: "کارت به کارت" },
] as const;

export type PaymentMethodId = (typeof PAYMENT_METHODS)[number]["id"];

export const PAYMENT_METHOD_IDS = PAYMENT_METHODS.map((m) => m.id) as [PaymentMethodId, ...PaymentMethodId[]];

export function paymentMethodLabel(id: string | null | undefined): string {
  if (!id) return "—";
  return PAYMENT_METHODS.find((m) => m.id === id)?.label ?? id;
}
