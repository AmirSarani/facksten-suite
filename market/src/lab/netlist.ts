import type { ComponentDef, LabProject, PinDef, PlacedPart } from "./types";
import { pinPosition } from "./geometry";

/**
 * Electrical connectivity of a project. Two pins share a net when they are joined by
 *   1. a wire,
 *   2. the part itself (breadboard strips, the Uno's three GND pins, A4 = SDA …), or
 *   3. sitting on the same grid point — a lead pushed into a breadboard hole or header.
 * Everything that reasons about the circuit (checks, LEDs, simulation) works on nets,
 * never on individual wires.
 */

export type PinRef = { key: string; part: PlacedPart; def: ComponentDef; pin: PinDef };
/** Two pins of different parts touching on the canvas (a plugged-in lead). */
export type Contact = { a: string; b: string; x: number; y: number };

export type Net = {
  id: number;
  pins: PinRef[];
  wireIds: string[];
  /** A board supply pin (5V, 3.3V, VIN, IOREF) is on this net. */
  supply: number[];
  /** Board ground (an MCU GND pin) is on this net. */
  gnd: boolean;
  /** MCU I/O pins on this net, by pin id (e.g. "d13"). */
  mcuPins: string[];
};

export type Netlist = {
  pins: Map<string, PinRef>;
  netOf: Map<string, number>;
  nets: Map<number, Net>;
  contacts: Contact[];
};

export const pinKey = (instanceId: string, pinId: string) => `${instanceId}:${pinId}`;

const isMcu = (def: ComponentDef) => def.behaviorModel.kind === "mcu";
const isGndPin = (pin: PinDef) => pin.signal === "gnd" || pin.direction === "gnd";

/** `closed`: push-buttons held down, whose two sides are joined while pressed. */
export function buildNetlist(
  project: Pick<LabProject, "parts" | "wires">,
  components: ComponentDef[],
  opts: { closed?: Set<string> } = {},
): Netlist {
  const defs = new Map(components.map((c) => [c.id, c]));
  const pins = new Map<string, PinRef>();
  const parent = new Map<string, string>();

  const find = (k: string): string => {
    let r = k;
    while (parent.get(r) !== r) r = parent.get(r)!;
    // path compression
    let c = k;
    while (parent.get(c) !== r) {
      const next = parent.get(c)!;
      parent.set(c, r);
      c = next;
    }
    return r;
  };
  const union = (a: string, b: string) => {
    if (!parent.has(a) || !parent.has(b)) return;
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  };

  const byPoint = new Map<string, string[]>();
  for (const part of project.parts) {
    const def = defs.get(part.componentId);
    if (!def) continue;
    for (const pin of def.pins) {
      const key = pinKey(part.instanceId, pin.id);
      pins.set(key, { key, part, def, pin });
      parent.set(key, key);
      const p = pinPosition(part, def, pin);
      const at = `${Math.round(p.x)},${Math.round(p.y)}`;
      const list = byPoint.get(at);
      if (list) list.push(key);
      else byPoint.set(at, [key]);
    }
    for (const group of def.internalNets ?? []) {
      for (let i = 1; i < group.length; i++) union(pinKey(part.instanceId, group[0]), pinKey(part.instanceId, group[i]));
    }
    if (def.behaviorModel.kind === "button" && opts.closed?.has(part.instanceId) && def.pins.length >= 2) {
      union(pinKey(part.instanceId, def.pins[0].id), pinKey(part.instanceId, def.pins[1].id));
    }
  }

  // Plugged-in leads: different parts on the same grid point.
  const contacts: Contact[] = [];
  for (const [at, keys] of byPoint) {
    if (keys.length < 2) continue;
    const [x, y] = at.split(",").map(Number);
    for (let i = 0; i < keys.length; i++) {
      for (let j = i + 1; j < keys.length; j++) {
        if (pins.get(keys[i])!.part.instanceId === pins.get(keys[j])!.part.instanceId) continue;
        union(keys[i], keys[j]);
        contacts.push({ a: keys[i], b: keys[j], x, y });
      }
    }
  }

  for (const w of project.wires) union(pinKey(w.from.instanceId, w.from.pinId), pinKey(w.to.instanceId, w.to.pinId));

  const rootId = new Map<string, number>();
  const netOf = new Map<string, number>();
  const nets = new Map<number, Net>();
  for (const [key, ref] of pins) {
    const root = find(key);
    let id = rootId.get(root);
    if (id == null) {
      id = rootId.size;
      rootId.set(root, id);
      nets.set(id, { id, pins: [], wireIds: [], supply: [], gnd: false, mcuPins: [] });
    }
    netOf.set(key, id);
    const net = nets.get(id)!;
    net.pins.push(ref);
    if (isMcu(ref.def)) {
      if (ref.pin.signal === "vcc" && ref.pin.voltage != null) net.supply.push(ref.pin.voltage);
      if (ref.pin.arduinoPin != null) net.mcuPins.push(ref.pin.id);
      if (isGndPin(ref.pin)) net.gnd = true;
    }
  }
  for (const w of project.wires) {
    const id = netOf.get(pinKey(w.from.instanceId, w.from.pinId));
    if (id != null) nets.get(id)!.wireIds.push(w.id);
  }
  return { pins, netOf, nets, contacts };
}

export function netAt(nl: Netlist, key: string): Net | undefined {
  const id = nl.netOf.get(key);
  return id == null ? undefined : nl.nets.get(id);
}

/** A net is "connected" when it reaches something beyond its own part (a wire or another part). */
export function isConnected(net: Net | undefined): boolean {
  if (!net) return false;
  if (net.wireIds.length) return true;
  const owner = net.pins[0]?.part.instanceId;
  return net.pins.some((p) => p.part.instanceId !== owner);
}

/** What a net effectively carries, for wire colouring and connection checks. */
export function netSignal(net: Net | undefined): "gnd" | "vcc" | "signal" | "none" {
  if (!net) return "none";
  if (net.gnd || net.pins.some((p) => isGndPin(p.pin))) return "gnd";
  if (net.supply.length || net.pins.some((p) => p.pin.signal === "vcc")) return "vcc";
  if (net.pins.some((p) => p.pin.signal !== "passive" && p.pin.signal !== "nc")) return "signal";
  return "none";
}

/** Would joining these two pins short a supply to ground? */
export function joinShortsSupply(nl: Netlist, a: string, b: string): boolean {
  const na = netAt(nl, a);
  const nb = netAt(nl, b);
  if (!na || !nb || na.id === nb.id) return false;
  return (na.supply.length > 0 && nb.gnd) || (nb.supply.length > 0 && na.gnd);
}

/**
 * LEDs that light for the given set of MCU output pins driven HIGH (e.g. {"d13"}).
 * An LED lights when its anode reaches a HIGH pin or a board supply and its cathode reaches
 * board GND, each side either directly or through resistors. Supplies count as HIGH, so
 * call this only while the board is powered (simulation running).
 */
export function litLeds(nl: Netlist, highPins: Set<string>): Set<string> {
  // resistors join their two nets for the purpose of "is there a path"
  const through = new Map<number, Set<number>>();
  const link = (a: number, b: number) => {
    if (!through.has(a)) through.set(a, new Set());
    if (!through.has(b)) through.set(b, new Set());
    through.get(a)!.add(b);
    through.get(b)!.add(a);
  };
  const leds = new Map<string, { anode?: number; cathode?: number }>();
  for (const ref of nl.pins.values()) {
    const kind = ref.def.behaviorModel.kind;
    const net = nl.netOf.get(ref.key)!;
    if (kind === "resistor" && ref.pin.id === "a") {
      const other = nl.netOf.get(pinKey(ref.part.instanceId, "b"));
      if (other != null) link(net, other);
    }
    if (kind === "led") {
      const entry = leds.get(ref.part.instanceId) ?? {};
      if (ref.pin.id === "anode") entry.anode = net;
      if (ref.pin.id === "cathode") entry.cathode = net;
      leds.set(ref.part.instanceId, entry);
    }
  }
  const reach = (start: number, ok: (n: Net) => boolean) => {
    const seen = new Set([start]);
    const queue = [start];
    while (queue.length) {
      const id = queue.shift()!;
      if (ok(nl.nets.get(id)!)) return true;
      for (const next of through.get(id) ?? []) {
        if (!seen.has(next)) {
          seen.add(next);
          queue.push(next);
        }
      }
    }
    return false;
  };
  const isHigh = (n: Net) => !n.gnd && (n.supply.length > 0 || n.mcuPins.some((p) => highPins.has(p)));
  const isGnd = (n: Net) => n.gnd;

  const lit = new Set<string>();
  for (const [id, { anode, cathode }] of leds) {
    if (anode == null || cathode == null || anode === cathode) continue;
    if (reach(anode, isHigh) && reach(cathode, isGnd)) lit.add(id);
  }
  return lit;
}

/** Parts plugged into `instanceId` (sharing a contact with it), so they can move together. */
export function pluggedInto(nl: Netlist, instanceId: string): Set<string> {
  const out = new Set<string>();
  for (const c of nl.contacts) {
    const pa = nl.pins.get(c.a)!.part.instanceId;
    const pb = nl.pins.get(c.b)!.part.instanceId;
    if (pa === instanceId && pb !== instanceId) out.add(pb);
    if (pb === instanceId && pa !== instanceId) out.add(pa);
  }
  return out;
}
