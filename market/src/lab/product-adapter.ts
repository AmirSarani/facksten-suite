/**
 * Maps lab component catalogSlug → live shop Product (id, price, stock).
 * Server-side or client via /api/lab/products. Never invents prices.
 */

import type { ComponentDef, StockStatus } from "./types";

export type ShopProductLite = {
  id: string;
  slug: string;
  title: string;
  price: number;
  inStock: boolean;
  stock: number;
  active: boolean;
};

/** Preferred shop slug aliases for each lab component id */
export const CATALOG_SLUG_MAP: Record<string, string[]> = {
  "arduino-uno": ["arduino-uno-r3", "arduino-uno-ch340"],
  "arduino-nano": ["arduino-nano"],
  breadboard: ["breadboard-830"],
  "led-red": ["led-5mm-red-pack"],
  "led-rgb": ["led-5mm-rgb"],
  "resistor-220": ["resistor-220r"],
  "resistor-10k": ["resistor-10k"],
  button: [],
  potentiometer: [],
  buzzer: [],
  "servo-sg90": ["servo-sg90"],
  dht22: ["dht22"],
  "hc-sr04": ["hc-sr04"],
  pir: ["pir-hc-sr501"],
  "lcd-1602": ["lcd-1602"],
  "oled-128x64": ["oled-128x64"],
};

export function resolveStock(p: ShopProductLite | null | undefined): StockStatus {
  if (!p) return "unknown";
  if (!p.active) return "unknown";
  return p.inStock && p.stock > 0 ? "in-stock" : "out-of-stock";
}

export function matchProduct(
  componentId: string,
  catalogSlug: string | null,
  bySlug: Map<string, ShopProductLite>,
): ShopProductLite | null {
  const candidates = [
    ...(catalogSlug ? [catalogSlug] : []),
    ...(CATALOG_SLUG_MAP[componentId] ?? []),
  ];
  for (const slug of candidates) {
    const hit = bySlug.get(slug);
    if (hit) return hit;
  }
  return null;
}

export function applyShopData(
  defs: ComponentDef[],
  products: ShopProductLite[],
): ComponentDef[] {
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  return defs.map((d) => {
    const match = matchProduct(d.id, d.catalogSlug, bySlug);
    if (!match) {
      return { ...d, productId: null, price: null, stockStatus: "unknown" as const };
    }
    return {
      ...d,
      productId: match.id,
      price: match.price,
      stockStatus: resolveStock(match),
      catalogSlug: match.slug,
    };
  });
}
