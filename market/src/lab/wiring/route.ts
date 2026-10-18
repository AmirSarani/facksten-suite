/** Pure geometry for drawing and editing wires on the bench (canvas units, 10 = 0.1"). */

export type Pt = { x: number; y: number };

/** Corner of an L from `a` to `b`: horizontal first, then vertical. */
export function orthoCorner(a: Pt, b: Pt): Pt {
  return { x: b.x, y: a.y };
}

/** Bend points for an orthogonal run from `a` to `b` (none when already aligned). */
export function orthoBends(a: Pt, b: Pt): Pt[] {
  if (a.x === b.x || a.y === b.y) return [];
  return [orthoCorner(a, b)];
}

/** Drop points that repeat or sit on a straight line between their neighbours. */
export function simplify(points: Pt[]): Pt[] {
  const out: Pt[] = [];
  for (const p of points) {
    const last = out[out.length - 1];
    if (last && last.x === p.x && last.y === p.y) continue;
    out.push(p);
  }
  for (let i = out.length - 2; i >= 1; i--) {
    const [a, b, c] = [out[i - 1], out[i], out[i + 1]];
    if ((a.x === b.x && b.x === c.x) || (a.y === b.y && b.y === c.y)) out.splice(i, 1);
  }
  return out;
}

/**
 * SVG path for a wire. With no bend points it is a soft hanging jumper (a curve that sags a
 * little); with bend points it runs straight through them with rounded corners.
 */
export function wirePath(a: Pt, points: Pt[], b: Pt, radius = 5): string {
  if (!points.length) {
    const sag = Math.min(60, Math.hypot(b.x - a.x, b.y - a.y) * 0.25);
    return `M ${a.x} ${a.y} C ${a.x} ${a.y + sag}, ${b.x} ${b.y + sag}, ${b.x} ${b.y}`;
  }
  const all = [a, ...points, b];
  let d = `M ${a.x} ${a.y}`;
  for (let i = 1; i < all.length - 1; i++) {
    const [p, c, n] = [all[i - 1], all[i], all[i + 1]];
    const lin = Math.hypot(c.x - p.x, c.y - p.y);
    const lout = Math.hypot(n.x - c.x, n.y - c.y);
    const r = Math.min(radius, lin / 2, lout / 2);
    if (r < 0.5) {
      d += ` L ${c.x} ${c.y}`;
      continue;
    }
    const inPt = { x: c.x - ((c.x - p.x) / lin) * r, y: c.y - ((c.y - p.y) / lin) * r };
    const outPt = { x: c.x + ((n.x - c.x) / lout) * r, y: c.y + ((n.y - c.y) / lout) * r };
    d += ` L ${inPt.x} ${inPt.y} Q ${c.x} ${c.y} ${outPt.x} ${outPt.y}`;
  }
  return `${d} L ${b.x} ${b.y}`;
}

/** Midpoints of each straight segment (handles for inserting a new bend). */
export function segmentMids(a: Pt, points: Pt[], b: Pt): { at: Pt; index: number }[] {
  const all = [a, ...points, b];
  const out: { at: Pt; index: number }[] = [];
  for (let i = 0; i < all.length - 1; i++) {
    const [p, n] = [all[i], all[i + 1]];
    if (Math.hypot(n.x - p.x, n.y - p.y) < 24) continue;
    // `index` is where the new point goes in `points`
    out.push({ at: { x: (p.x + n.x) / 2, y: (p.y + n.y) / 2 }, index: i });
  }
  return out;
}

/** Nearest candidate within `radius`, or null. */
export function nearest<T extends { at: Pt }>(candidates: T[], p: Pt, radius: number): T | null {
  let best: T | null = null;
  let bestD = radius;
  for (const c of candidates) {
    const d = Math.hypot(c.at.x - p.x, c.at.y - p.y);
    if (d <= bestD) {
      bestD = d;
      best = c;
    }
  }
  return best;
}

/** Axis-aligned rectangle from two corners (for box selection). */
export function rectFrom(a: Pt, b: Pt) {
  return { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(b.x - a.x), h: Math.abs(b.y - a.y) };
}

export function intersects(r: { x: number; y: number; w: number; h: number }, s: { x: number; y: number; w: number; h: number }) {
  return r.x < s.x + s.w && s.x < r.x + r.w && r.y < s.y + s.h && s.y < r.y + r.h;
}
