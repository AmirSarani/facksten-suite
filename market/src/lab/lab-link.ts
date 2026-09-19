import { getComponentBySlug, LAB_COMPONENTS_SEED } from "./registry";
import { CATALOG_SLUG_MAP } from "./product-adapter";

/** Map shop product slug → lab component slug when mappable */
export function labSlugForProduct(productSlug: string): string | null {
  const direct = getComponentBySlug(productSlug);
  if (direct) return direct.slug;
  for (const c of LAB_COMPONENTS_SEED) {
    if (c.catalogSlug === productSlug) return c.slug;
    const aliases = CATALOG_SLUG_MAP[c.id] ?? [];
    if (aliases.includes(productSlug)) return c.slug;
  }
  return null;
}
