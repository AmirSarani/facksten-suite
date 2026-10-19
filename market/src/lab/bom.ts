import { withBasePath } from "./base-path";
import { LED_COLORS, formatOhms, ledColor, resistorOhms } from "./part-props";
import type { BomLine, ComponentDef, LabProject } from "./types";

/**
 * One line per (part, variant). A resistor or LED whose value/colour differs from the catalog
 * part it was placed as gets its own line and, unless another catalog part has exactly that
 * value, no product — so "add to cart" never buys a 220Ω resistor for a 330Ω one.
 */
export function buildBom(
  project: Pick<LabProject, "parts">,
  components: ComponentDef[],
): BomLine[] {
  const byId = new Map(components.map((c) => [c.id, c]));
  const lines = new Map<string, BomLine>();
  for (const p of project.parts) {
    const c = byId.get(p.componentId);
    if (!c) continue;
    let key = c.id;
    let line: BomLine = { componentId: c.id, slug: c.slug, name: c.name, qty: 0, productId: c.productId, price: c.price, stockStatus: c.stockStatus };
    if (c.behaviorModel.kind === "resistor") {
      const ohms = resistorOhms(p, c);
      // the catalog part with exactly this value, if any
      const match = components.find((x) => x.behaviorModel.kind === "resistor" && x.behaviorModel.ohms === ohms);
      key = `resistor:${ohms}`;
      line = match
        ? { componentId: match.id, slug: match.slug, name: match.name, qty: 0, productId: match.productId, price: match.price, stockStatus: match.stockStatus }
        : { ...line, name: `مقاومت ${formatOhms(ohms)}`, productId: null, price: null, stockStatus: "unknown" };
    } else if (c.behaviorModel.kind === "led" && c.pins.length === 2) {
      const color = ledColor(p, c);
      if (color !== (c.properties.color ?? "red")) {
        key = `${c.id}:${color}`;
        line = { ...line, name: `LED ${LED_COLORS[color].label} ۵mm`, productId: null, price: null, stockStatus: "unknown" };
      }
    }
    const existing = lines.get(key);
    if (existing) existing.qty += 1;
    else lines.set(key, { ...line, qty: 1 });
  }
  return [...lines.values()];
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
