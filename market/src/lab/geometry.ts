import type { ComponentDef, LabProject, PinDef, PlacedPart } from "./types";

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

/**
 * LED instances whose anode is driven by `boardPinId` (e.g. "d13") on an MCU board, either
 * directly or through one series resistor. The simulator only reports that pin, so only these
 * LEDs should light up.
 */
export function ledsDrivenBy(
  project: Pick<LabProject, "parts" | "wires">,
  components: ComponentDef[],
  boardPinId: string,
): Set<string> {
  const defs = new Map(components.map((c) => [c.id, c]));
  const kindOf = (instanceId: string) => {
    const part = project.parts.find((p) => p.instanceId === instanceId);
    return part ? defs.get(part.componentId)?.behaviorModel.kind : undefined;
  };
  const key = (instanceId: string, pinId: string) => `${instanceId}:${pinId}`;

  const adj = new Map<string, string[]>();
  const link = (a: string, b: string) => {
    adj.set(a, [...(adj.get(a) ?? []), b]);
    adj.set(b, [...(adj.get(b) ?? []), a]);
  };
  for (const w of project.wires) link(key(w.from.instanceId, w.from.pinId), key(w.to.instanceId, w.to.pinId));

  // A resistor passes the signal from one lead to the other.
  for (const part of project.parts) {
    const def = defs.get(part.componentId);
    if (def?.behaviorModel.kind === "resistor" && def.pins.length === 2) {
      link(key(part.instanceId, def.pins[0].id), key(part.instanceId, def.pins[1].id));
    }
  }

  const start = project.parts
    .filter((p) => kindOf(p.instanceId) === "mcu")
    .map((p) => key(p.instanceId, boardPinId));

  const seen = new Set<string>(start);
  const queue = [...start];
  const lit = new Set<string>();
  while (queue.length) {
    const cur = queue.shift()!;
    const [iid, pid] = cur.split(":");
    const kind = kindOf(iid);
    if (kind === "led" && pid !== "cathode" && pid !== "gnd") lit.add(iid);
    for (const next of adj.get(cur) ?? []) {
      if (seen.has(next)) continue;
      // don't walk back through other MCU pins
      if (kindOf(next.split(":")[0]) === "mcu") continue;
      seen.add(next);
      queue.push(next);
    }
  }
  return lit;
}
