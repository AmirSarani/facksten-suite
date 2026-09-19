export function formatToman(amount: number): string {
  return new Intl.NumberFormat("fa-IR").format(amount);
}

export function discountPercent(price: number, compareAtPrice: number | null | undefined) {
  if (!compareAtPrice || compareAtPrice <= price) return 0;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

export function unitPrice(price: number, packQty: number) {
  const q = Math.max(1, packQty || 1);
  return Math.round(price / q);
}

export function parseSpecs(specs: string | null | undefined): { k: string; v: string }[] {
  if (!specs) return [];
  try {
    const obj = JSON.parse(specs) as Record<string, string>;
    return Object.entries(obj).map(([k, v]) => ({ k: k.replaceAll("_", " "), v: String(v) }));
  } catch {
    return [];
  }
}
