import { withBasePath } from "./base-path";
import type { BomLine, ComponentDef, LabProject } from "./types";

export function buildBom(
  project: Pick<LabProject, "parts">,
  components: ComponentDef[],
): BomLine[] {
  const byId = new Map(components.map((c) => [c.id, c]));
  const qty = new Map<string, number>();
  for (const p of project.parts) {
    qty.set(p.componentId, (qty.get(p.componentId) ?? 0) + 1);
  }
  const lines: BomLine[] = [];
  for (const [componentId, n] of qty) {
    const c = byId.get(componentId);
    if (!c) continue;
    lines.push({
      componentId,
      slug: c.slug,
      name: c.name,
      qty: n,
      productId: c.productId,
      price: c.price,
      stockStatus: c.stockStatus,
    });
  }
  return lines;
}

export type BomCartResult = {
  componentId: string;
  ok: boolean;
  error?: string;
};

/** Client-side: add each BOM line with productId to cart API */
export async function addBomToCart(
  lines: BomLine[],
  fetchImpl: typeof fetch = fetch,
): Promise<BomCartResult[]> {
  const results: BomCartResult[] = [];
  for (const line of lines) {
    if (!line.productId) {
      results.push({
        componentId: line.componentId,
        ok: false,
        error: "این قطعه به محصول فروشگاه متصل نیست",
      });
      continue;
    }
    try {
      const res = await fetchImpl(withBasePath("/api/cart"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ productId: line.productId, qty: line.qty }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        results.push({
          componentId: line.componentId,
          ok: false,
          error: (data as { error?: string }).error ?? `خطا ${res.status}`,
        });
      } else {
        results.push({ componentId: line.componentId, ok: true });
      }
    } catch (e) {
      results.push({
        componentId: line.componentId,
        ok: false,
        error: e instanceof Error ? e.message : "خطای شبکه",
      });
    }
  }
  return results;
}
