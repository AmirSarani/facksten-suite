import type { ComponentDef, LabProject, PlacedPart, WiringIssue } from "../types";
import { buildNetlist, isConnected, netAt, pinKey, type Net, type Netlist } from "../netlist";

/** Wire color helpers used by UI */
export function suggestWireColor(
  fromSignal: string,
  toSignal: string,
): string {
  const s = `${fromSignal}|${toSignal}`;
  if (s.includes("gnd")) return "#111111";
  if (s.includes("vcc") || fromSignal === "vcc" || toSignal === "vcc") return "#e11d48";
  if (s.includes("clock")) return "#eab308";
  if (s.includes("uart") || s.includes("i2c") || s.includes("spi")) return "#22c55e";
  return "#3b82f6";
}

/**
 * Check the circuit's nets for common beginner mistakes. Works on nets (see netlist.ts), so a
 * circuit built on the breadboard is checked exactly like one wired point to point.
 * Returns Persian messages — no silent auto-fix.
 */
export function validateWiring(
  project: Pick<LabProject, "parts" | "wires">,
  components: ComponentDef[],
  netlist?: Netlist,
): WiringIssue[] {
  const issues: WiringIssue[] = [];
  const { parts } = project;

  if (parts.length === 0) {
    issues.push({
      code: "empty",
      severity: "hint",
      message: "هنوز قطعه‌ای روی بوم نیست. از پنل قطعات یک برد و LED اضافه کنید.",
    });
    return issues;
  }

  const nl = netlist ?? buildNetlist(project, components);
  const registry = new Map(components.map((c) => [c.id, c]));
  const kindOf = (p: PlacedPart) => registry.get(p.componentId)?.behaviorModel.kind;

  if (!parts.some((p) => kindOf(p) === "mcu")) {
    issues.push({
      code: "no-board",
      severity: "warning",
      message: "هیچ برد میکروکنترلری در پروژه نیست. برای شبیه‌سازی Blink به Arduino Uno/Nano نیاز دارید.",
    });
  }

  const at = (instanceId: string, pinId: string) => netAt(nl, pinKey(instanceId, pinId));
  const partsOf = (net: Net) => [...new Set(net.pins.map((p) => p.part.instanceId))];

  for (const w of project.wires) {
    if (!nl.pins.has(pinKey(w.from.instanceId, w.from.pinId)) || !nl.pins.has(pinKey(w.to.instanceId, w.to.pinId))) {
      issues.push({ code: "missing-pin", severity: "error", message: "یک سر سیم به پینی وصل است که دیگر وجود ندارد.", wireIds: [w.id] });
    }
  }

  for (const net of nl.nets.values()) {
    if (!isConnected(net)) continue;
    const ids = { wireIds: net.wireIds, partIds: partsOf(net) };

    if (net.supply.length && net.gnd) {
      issues.push({ code: "power-gnd-short", severity: "error", message: "اتصال کوتاه تغذیه به GND! تغذیه‌ی برد مستقیم به زمین رسیده است.", ...ids });
    }
    const volts = [...new Set(net.supply)];
    if (volts.length > 1 && Math.max(...volts) - Math.min(...volts) >= 1.5) {
      issues.push({
        code: "voltage-mismatch",
        severity: "error",
        message: `دو منبع تغذیه با ولتاژ متفاوت (${volts.join("V و ")}V) به هم وصل شده‌اند. ممکن است برد آسیب ببیند.`,
        ...ids,
      });
    }
    // a part fed with more than it tolerates (e.g. a 3.3 V-only module on 5 V)
    const supplyV = Math.max(0, ...net.supply);
    for (const ref of net.pins) {
      if (supplyV && ref.pin.signal === "vcc" && ref.def.behaviorModel.kind !== "mcu" && supplyV > ref.def.voltageRange.max + 0.25) {
        issues.push({
          code: "over-voltage",
          severity: "error",
          message: `«${ref.def.name}» حداکثر ${ref.def.voltageRange.max}V تحمل می‌کند ولی به ${supplyV}V وصل شده.`,
          wireIds: net.wireIds,
          partIds: [ref.part.instanceId],
        });
      }
    }
    const outputs = net.pins.filter((p) => p.pin.direction === "output" && (p.pin.signal === "digital" || p.pin.signal === "analog"));
    if (outputs.length > 1) {
      issues.push({
        code: "out-to-out",
        severity: "error",
        message: `خروجی به خروجی: ${outputs.map((p) => p.pin.label).join(" ↔ ")}. دو خروجی را مستقیم به هم وصل نکنید.`,
        ...ids,
      });
    }
    const tx = net.pins.filter((p) => p.pin.signal === "uart-tx");
    const rx = net.pins.filter((p) => p.pin.signal === "uart-rx");
    if (tx.length > 1 || rx.length > 1) {
      issues.push({ code: "uart-swap", severity: "hint", message: "احتمالاً RX/TX جابه‌جا است: TX یک طرف باید به RX طرف دیگر وصل شود.", ...ids });
    }
  }

  function checkLed(part: PlacedPart, def: ComponentDef) {
    if (def.pins.length !== 2) return;
    const anode = at(part.instanceId, "anode");
    const cathode = at(part.instanceId, "cathode");
    if (!anode || !cathode) return;
    const driven = (n: Net) => n.supply.length > 0 || n.mcuPins.length > 0;
    if (driven(anode) && cathode.gnd) {
      issues.push({
        code: "led-no-resistor",
        severity: "error",
        message: `LED «${def.name}» بدون مقاومت سری بین خروجی و GND است و می‌سوزد. یک مقاومت ۲۲۰Ω سر راهش بگذارید.`,
        partIds: [part.instanceId],
        wireIds: [...anode.wireIds, ...cathode.wireIds],
      });
    } else if (anode.gnd && (driven(cathode) || cathode.pins.some((p) => p.def.behaviorModel.kind === "resistor"))) {
      issues.push({
        code: "led-reversed",
        severity: "warning",
        message: `LED «${def.name}» برعکس است: پایه‌ی بلند (آند +) باید سمت خروجی و پایه‌ی کوتاه (کاتد −) سمت GND باشد.`,
        partIds: [part.instanceId],
      });
    } else if (isConnected(anode) !== isConnected(cathode)) {
      issues.push({
        code: "led-open",
        severity: "hint",
        message: `یک پایه‌ی LED «${def.name}» به جایی وصل نیست؛ مدار بسته نمی‌شود.`,
        partIds: [part.instanceId],
      });
    }
  }

  for (const part of parts) {
    const def = registry.get(part.componentId);
    if (!def) continue;
    const kind = def.behaviorModel.kind;
    if (kind === "mcu" || kind === "breadboard") continue;
    const nets = def.pins.map((p) => at(part.instanceId, p.id));
    const used = nets.some((n) => isConnected(n));

    // both leads of a two-lead part in the same strip — the classic breadboard mistake
    if (def.pins.length === 2 && nets[0] && nets[0] === nets[1] && used) {
      issues.push({
        code: "shorted-part",
        severity: "warning",
        message: `هر دو پایه‌ی «${def.name}» در یک ستون/مسیر هستند و اتصال کوتاه شده‌اند. یکی از پایه‌ها را به ستون دیگری ببرید.`,
        partIds: [part.instanceId],
      });
      continue;
    }

    // powered parts need the board's ground (LEDs may reach it through a resistor)
    const gndPins = def.pins.filter((p) => p.signal === "gnd" || p.direction === "gnd");
    if (used && gndPins.length && kind !== "led" && !gndPins.some((p) => at(part.instanceId, p.id)?.gnd)) {
      issues.push({
        code: "no-common-gnd",
        severity: "error",
        message: `GND «${def.name}» به GND برد وصل نیست. بدون زمین مشترک مدار کار نمی‌کند.`,
        partIds: [part.instanceId],
      });
    }

    if (kind === "led") checkLed(part, def);

    if (["dht22", "hcsr04", "pir"].includes(kind)) {
      for (const pin of def.pins.filter((p) => p.signal === "digital" || p.direction === "bidirectional")) {
        if (!isConnected(at(part.instanceId, pin.id))) {
          issues.push({
            code: "floating-pin",
            severity: "warning",
            message: `پایه حیاتی ${pin.label} روی «${def.name}» شناور است و به جایی وصل نیست.`,
            partIds: [part.instanceId],
          });
        }
      }
    }
  }

  return issues;
}

export function canConnectPins(
  a: { direction: string; signal: string; voltage?: number },
  b: { direction: string; signal: string; voltage?: number },
  simpleMode: boolean,
): { ok: boolean; message?: string } {
  if (
    (a.signal === "vcc" && b.signal === "gnd") ||
    (b.signal === "vcc" && a.signal === "gnd")
  ) {
    return { ok: false, message: "نمی‌توان تغذیه را به GND وصل کرد." };
  }
  if (a.direction === "output" && b.direction === "output" && a.signal === "digital" && b.signal === "digital") {
    return { ok: false, message: "دو خروجی دیجیتال را به هم وصل نکنید." };
  }
  if (
    simpleMode &&
    a.voltage != null &&
    b.voltage != null &&
    a.signal === "vcc" &&
    b.signal === "vcc" &&
    Math.abs(a.voltage - b.voltage) >= 1.5
  ) {
    return { ok: false, message: "در حالت ساده اتصال ۵V به ۳٫۳V مجاز نیست." };
  }
  return { ok: true };
}
