import type { ComponentDef, PinDef, PlacedPart } from "./types";

export const GRID = 10;

export function snap(v: number, grid = GRID): number {
  return Math.round(v / grid) * grid;
}

/** Normalise any angle to one of 0 / 90 / 180 / 270. */
export function normRotation(deg: number): 0 | 90 | 180 | 270 {
  const r = ((Math.round(deg / 90) * 90) % 360 + 360) % 360;
  return r as 0 | 90 | 180 | 270;
}

/** Rotate a point (local to the part box) clockwise around the box centre. */
export function rotateLocal(x: number, y: number, w: number, h: number, deg: number) {
  const r = normRotation(deg);
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  switch (r) {
    case 90:
      return { x: cx - dy, y: cy + dx };
    case 180:
      return { x: cx - dx, y: cy - dy };
    case 270:
      return { x: cx + dy, y: cy - dx };
    default:
      return { x, y };
  }
}

/** Absolute canvas position of a pin, honouring the part's rotation. */
export function pinPosition(part: PlacedPart, def: ComponentDef, pin: Pick<PinDef, "x" | "y">) {
  const p = rotateLocal(pin.x, pin.y, def.width, def.height, part.rotation ?? 0);
  return { x: part.x + p.x, y: part.y + p.y };
}

export type Box = { x: number; y: number; w: number; h: number };

/** Axis-aligned bounds of a placed part (rotation swaps w/h for 90/270). */
export function partBox(part: PlacedPart, def: ComponentDef): Box {
  const r = normRotation(part.rotation ?? 0);
  const swap = r === 90 || r === 270;
  const w = swap ? def.height : def.width;
  const h = swap ? def.width : def.height;
  // rotation is around the centre of the unrotated box
  return {
    x: part.x + (def.width - w) / 2,
    y: part.y + (def.height - h) / 2,
    w,
    h,
  };
}

export function unionBox(boxes: Box[]): Box | null {
  if (!boxes.length) return null;
  let x1 = Infinity;
  let y1 = Infinity;
  let x2 = -Infinity;
  let y2 = -Infinity;
  for (const b of boxes) {
    x1 = Math.min(x1, b.x);
    y1 = Math.min(y1, b.y);
    x2 = Math.max(x2, b.x + b.w);
    y2 = Math.max(y2, b.y + b.h);
  }
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
}

/** Zoom/pan that fits `box` into a viewport with padding. */
export function fitView(box: Box, viewW: number, viewH: number, pad = 40, maxZoom = 1.6) {
  const zoom = Math.min(maxZoom, Math.max(0.3, Math.min((viewW - pad * 2) / box.w, (viewH - pad * 2) / box.h)));
  return {
    zoom,
    pan: {
      x: (viewW - box.w * zoom) / 2 - box.x * zoom,
      y: (viewH - box.h * zoom) / 2 - box.y * zoom,
    },
  };
}
