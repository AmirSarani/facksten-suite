import type { ComponentDef, PlacedPart } from "./types";

/**
 * Per-instance properties a part can override (stored in PlacedPart.props): a resistor's value,
 * an LED's colour. Everything else reads the catalog definition.
 */

export const LED_COLORS = {
  red: { label: "قرمز", hex: "#ef4444", forwardVoltage: 2.0 },
  yellow: { label: "زرد", hex: "#facc15", forwardVoltage: 2.1 },
  green: { label: "سبز", hex: "#22c55e", forwardVoltage: 2.2 },
  blue: { label: "آبی", hex: "#3b82f6", forwardVoltage: 3.0 },
  white: { label: "سفید", hex: "#f8fafc", forwardVoltage: 3.0 },
} as const;
export type LedColor = keyof typeof LED_COLORS;

/** E12-series values people actually reach for. */
export const RESISTOR_PRESETS = [100, 150, 220, 330, 470, 680, 1000, 2200, 4700, 10_000, 22_000, 47_000, 100_000, 1_000_000];

export function resistorOhms(part: Pick<PlacedPart, "props">, def: ComponentDef): number {
  const v = Number(part.props?.ohms);
  if (Number.isFinite(v) && v > 0) return v;
  return def.behaviorModel.kind === "resistor" ? def.behaviorModel.ohms : 0;
}

export function ledColor(part: Pick<PlacedPart, "props">, def: ComponentDef): LedColor {
  const c = String(part.props?.color ?? def.properties.color ?? "red");
  return c in LED_COLORS ? (c as LedColor) : "red";
}

/** 220 → "220Ω", 4700 → "4.7kΩ", 1e6 → "1MΩ". */
export function formatOhms(ohms: number): string {
  const trim = (n: number) => String(Number(n.toFixed(2)));
  if (ohms >= 1e6) return `${trim(ohms / 1e6)}MΩ`;
  if (ohms >= 1e3) return `${trim(ohms / 1e3)}kΩ`;
  return `${trim(ohms)}Ω`;
}

/** Parse "4.7k", "220", "1M", "330 ohm" → ohms, or null. */
export function parseOhms(text: string): number | null {
  const m = /^\s*([\d.]+)\s*([kKmM]?)\s*(?:Ω|ohm|ohms|R)?\s*$/.exec(text.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))));
  if (!m) return null;
  const n = Number(m[1]) * (m[2].toLowerCase() === "k" ? 1e3 : m[2] === "M" ? 1e6 : m[2] === "m" ? 1e6 : 1);
  return Number.isFinite(n) && n > 0 && n <= 1e8 ? n : null;
}

/** 4-band colour code: two digits, multiplier, gold tolerance. */
export function resistorBands(ohms: number): string[] {
  const colors = ["#111118", "#7a4a1f", "#dc2626", "#f97316", "#facc15", "#16a34a", "#2563eb", "#7c3aed", "#6b7280", "#f8fafc"];
  const gold = "#d4af37";
  const silver = "#c0c0c0";
  if (ohms < 10) {
    // e.g. 4.7Ω → yellow violet gold(×0.1)
    const d = Math.round(ohms * 10);
    return [colors[Math.floor(d / 10) % 10], colors[d % 10], gold, gold];
  }
  const exp = Math.floor(Math.log10(ohms)) - 1;
  const two = Math.round(ohms / 10 ** exp);
  const [a, b] = two >= 100 ? [1, 0] : [Math.floor(two / 10), two % 10];
  return [colors[a], colors[b], colors[Math.min(9, exp + (two >= 100 ? 1 : 0))] ?? silver, gold];
}
