import type { SimFrame, SimInputs } from "./engine/types";
import { SIM_PINS } from "./engine/types";
import { pinKey, type Net, type Netlist } from "./netlist";

/**
 * Glue between the circuit (netlist) and the simulated MCU:
 *  - what each MCU input pin sees (GND, a supply, a pull resistor, a potentiometer wiper…),
 *  - what the MCU's outputs do to LEDs, servos and buzzers.
 * This is a logic-level model, not SPICE: a pin is driven, pulled through a resistor, or floats.
 */

export type PartState = {
  /** 0–1 LED brightness (PWM duty when driven from a pin). */
  leds: Map<string, number>;
  /** Servo horn angle in degrees, by servo instance. */
  servos: Map<string, number>;
  /** Buzzer tone frequency in Hz, by buzzer instance. */
  buzzers: Map<string, number>;
};

const MCU = "mcu";

/** Arduino pin number of an MCU pin id on this net's board, e.g. "d13" → 13, "a0" → 14. */
function mcuPinNumbers(net: Net): number[] {
  return net.pins.filter((p) => p.def.behaviorModel.kind === MCU && p.pin.arduinoPin != null).map((p) => p.pin.arduinoPin!);
}

/** Nets joined through resistors, for "is there a path" questions. */
function resistorGraph(nl: Netlist) {
  const through = new Map<number, Set<number>>();
  const link = (a: number, b: number) => {
    if (!through.has(a)) through.set(a, new Set());
    if (!through.has(b)) through.set(b, new Set());
    through.get(a)!.add(b);
    through.get(b)!.add(a);
  };
  for (const ref of nl.pins.values()) {
    if (ref.def.behaviorModel.kind !== "resistor" || ref.pin.id !== "a") continue;
    const a = nl.netOf.get(ref.key);
    const b = nl.netOf.get(pinKey(ref.part.instanceId, "b"));
    if (a != null && b != null && a !== b) link(a, b);
  }
  return through;
}

function reach(nl: Netlist, graph: Map<number, Set<number>>, start: number, ok: (n: Net) => boolean): Net | null {
  const seen = new Set([start]);
  const queue = [start];
  while (queue.length) {
    const id = queue.shift()!;
    const n = nl.nets.get(id)!;
    if (ok(n)) return n;
    for (const next of graph.get(id) ?? []) {
      if (!seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
  return null;
}

/** Voltage a net is held at directly (supply or GND), or null. */
const hardVolts = (n: Net): number | null => (n.gnd ? 0 : n.supply.length ? Math.max(...n.supply) : null);

/**
 * What every MCU pin sees from the circuit. `pots` holds potentiometer positions (0–1).
 * Order of strength: a supply/GND on the net, a potentiometer wiper, then a supply/GND
 * reached through a resistor (pull-up / pull-down). Otherwise the pin floats (null).
 */
export function resolveInputs(nl: Netlist, pots: Map<string, number>): SimInputs {
  const digital: (0 | 1 | null)[] = Array(SIM_PINS).fill(null);
  const analog: number[] = Array(8).fill(0);
  const graph = resistorGraph(nl);

  const wiperVolts = (n: Net): number | null => {
    for (const ref of n.pins) {
      if (ref.def.behaviorModel.kind !== "potentiometer" || ref.pin.id !== "wiper") continue;
      const top = nl.nets.get(nl.netOf.get(pinKey(ref.part.instanceId, "vcc"))!);
      const bottom = nl.nets.get(nl.netOf.get(pinKey(ref.part.instanceId, "gnd"))!);
      const vt = top ? hardVolts(top) : null;
      const vb = bottom ? hardVolts(bottom) : null;
      if (vt == null || vb == null) continue;
      return vb + (vt - vb) * (pots.get(ref.part.instanceId) ?? 0.5);
    }
    return null;
  };

  for (const net of nl.nets.values()) {
    const pins = mcuPinNumbers(net);
    if (!pins.length) continue;
    let v = hardVolts(net) ?? wiperVolts(net);
    if (v == null) {
      const pulled = reach(nl, graph, net.id, (n) => n.id !== net.id && hardVolts(n) != null);
      if (pulled) v = hardVolts(pulled);
    }
    for (const p of pins) {
      if (p >= SIM_PINS) continue;
      digital[p] = v == null ? null : v > 2.5 ? 1 : 0;
      if (p >= 14) analog[p - 14] = v ?? 0;
    }
  }
  return { digital, analog };
}

/** Level an MCU-driven net is at in this frame: 0–1 (PWM averages), or null if not driven. */
function drivenLevel(net: Net, frame: SimFrame): number | null {
  let best: number | null = null;
  for (const p of mcuPinNumbers(net)) {
    if (p >= SIM_PINS || !(frame.outputs & (1 << p))) continue;
    best = Math.max(best ?? 0, frame.duty[p]);
  }
  return best;
}

/** LEDs, servos and buzzers for one simulation frame. */
export function partStates(nl: Netlist, frame: SimFrame | null): PartState {
  const state: PartState = { leds: new Map(), servos: new Map(), buzzers: new Map() };
  if (!frame) return state;
  const graph = resistorGraph(nl);
  const netOf = (instanceId: string, pinId: string) => {
    const id = nl.netOf.get(pinKey(instanceId, pinId));
    return id == null ? undefined : nl.nets.get(id);
  };
  // how hard a net is pulled up: supply = 1, a pin at its PWM duty
  const source = (n: Net) => (n.gnd ? null : n.supply.length ? 1 : drivenLevel(n, frame));
  const sink = (n: Net) => n.gnd || drivenLevel(n, frame) === 0;

  const parts = new Map<string, { kind: string }>();
  for (const ref of nl.pins.values()) parts.set(ref.part.instanceId, { kind: ref.def.behaviorModel.kind });

  for (const [id, { kind }] of parts) {
    if (kind === "led") {
      const anode = netOf(id, "anode");
      const cathode = netOf(id, "cathode");
      if (!anode || !cathode || anode.id === cathode.id) continue;
      let level = 0;
      const seen = new Set([anode.id]);
      const queue = [anode.id];
      while (queue.length) {
        const n = nl.nets.get(queue.shift()!)!;
        level = Math.max(level, source(n) ?? 0);
        for (const next of graph.get(n.id) ?? []) {
          if (seen.has(next)) continue;
          seen.add(next);
          queue.push(next);
        }
      }
      if (level > 0.01 && reach(nl, graph, cathode.id, sink)) state.leds.set(id, level);
    } else if (kind === "servo") {
      const sig = netOf(id, "sig");
      const vcc = netOf(id, "vcc");
      const gnd = netOf(id, "gnd");
      if (!sig || !vcc?.supply.length || !gnd?.gnd) continue;
      const p = mcuPinNumbers(sig)[0];
      const us = p != null ? frame.pulseUs[p] : 0;
      if (us >= 400 && us <= 2600) state.servos.set(id, Math.max(0, Math.min(180, ((us - 544) / (2400 - 544)) * 180)));
    } else if (kind === "buzzer") {
      const sig = netOf(id, "sig");
      const gnd = netOf(id, "gnd");
      if (!sig || !gnd?.gnd) continue;
      const p = mcuPinNumbers(sig)[0];
      const f = p != null ? frame.freq[p] : 0;
      if (f >= 20 && f <= 20000) state.buzzers.set(id, f);
    }
  }
  return state;
}
