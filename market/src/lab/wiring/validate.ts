import type { ComponentDef, LabProject, PlacedPart, WireDef, WiringIssue } from "../types";

function pinOf(def: ComponentDef | undefined, pinId: string) {
  return def?.pins.find((p) => p.id === pinId);
}

function partDef(
  part: PlacedPart,
  registry: Map<string, ComponentDef>,
): ComponentDef | undefined {
  return registry.get(part.componentId);
}

function findPart(parts: PlacedPart[], id: string) {
  return parts.find((p) => p.instanceId === id);
}

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
 * Validate breadboard-style nets for common beginner mistakes.
 * Returns Persian messages — no silent auto-fix.
 */
export function validateWiring(
  project: Pick<LabProject, "parts" | "wires">,
  components: ComponentDef[],
): WiringIssue[] {
  const registry = new Map(components.map((c) => [c.id, c]));
  const issues: WiringIssue[] = [];
  const { parts, wires } = project;

  if (parts.length === 0) {
    issues.push({
      code: "empty",
      severity: "hint",
      message: "هنوز قطعه‌ای روی بوم نیست. از پنل قطعات یک برد و LED اضافه کنید.",
    });
    return issues;
  }

  const hasBoard = parts.some((p) => {
    const d = partDef(p, registry);
    return d?.behaviorModel.kind === "mcu";
  });
  if (!hasBoard) {
    issues.push({
      code: "no-board",
      severity: "warning",
      message: "هیچ برد میکروکنترلری در پروژه نیست. برای شبیه‌سازی Blink به Arduino Uno/Nano نیاز دارید.",
    });
  }

  // GND connectivity: any powered part should share a GND path with the board
  const gndEndpoints = new Set<string>();
  for (const w of wires) {
    for (const end of [w.from, w.to]) {
      const part = findPart(parts, end.instanceId);
      const def = part ? partDef(part, registry) : undefined;
      const pin = pinOf(def, end.pinId);
      if (pin && (pin.signal === "gnd" || pin.direction === "gnd")) {
        gndEndpoints.add(`${end.instanceId}:${end.pinId}`);
      }
    }
  }

  const boardGndConnected = [...gndEndpoints].some((key) => {
    const iid = key.split(":")[0];
    const part = findPart(parts, iid);
    const def = part ? partDef(part, registry) : undefined;
    return def?.behaviorModel.kind === "mcu";
  });

  const needsGnd = parts.filter((p) => {
    const d = partDef(p, registry);
    if (!d) return false;
    if (d.behaviorModel.kind === "mcu" || d.behaviorModel.kind === "breadboard") return false;
    return d.pins.some((pin) => pin.signal === "gnd" || pin.direction === "gnd");
  });

  if (needsGnd.length > 0 && !boardGndConnected && wires.length > 0) {
    issues.push({
      code: "no-common-gnd",
      severity: "error",
      message: "زمین مشترک (GND) بین برد و قطعات برقرار نیست. حداقل یک سیم مشکی از GND برد به GND قطعات بکشید.",
      partIds: needsGnd.map((p) => p.instanceId),
    });
  }

  for (const w of wires) {
    const fromPart = findPart(parts, w.from.instanceId);
    const toPart = findPart(parts, w.to.instanceId);
    const fromDef = fromPart ? partDef(fromPart, registry) : undefined;
    const toDef = toPart ? partDef(toPart, registry) : undefined;
    const fromPin = pinOf(fromDef, w.from.pinId);
    const toPin = pinOf(toDef, w.to.pinId);
    if (!fromPin || !toPin) {
      issues.push({
        code: "missing-pin",
        severity: "error",
        message: "یک سر سیم به پینی وصل است که دیگر وجود ندارد.",
        wireIds: [w.id],
      });
      continue;
    }

    // 5V ↔ 3.3V
    const vFrom = fromPin.voltage ?? (fromPin.signal === "vcc" ? fromDef?.voltageRange.max : undefined);
    const vTo = toPin.voltage ?? (toPin.signal === "vcc" ? toDef?.voltageRange.max : undefined);
    if (
      vFrom != null &&
      vTo != null &&
      Math.abs(vFrom - vTo) >= 1.5 &&
      fromPin.signal === "vcc" &&
      toPin.signal === "vcc"
    ) {
      issues.push({
        code: "voltage-mismatch",
        severity: "error",
        message: `اختلاف ولتاژ خطرناک: ${vFrom}V به ${vTo}V وصل شده (۵V↔۳٫۳V). ممکن است قطعه بسوزد.`,
        wireIds: [w.id],
      });
    }

    // output-to-output digital
    if (
      fromPin.direction === "output" &&
      toPin.direction === "output" &&
      fromPin.signal === "digital" &&
      toPin.signal === "digital"
    ) {
      issues.push({
        code: "out-to-out",
        severity: "error",
        message: `خروجی به خروجی: ${fromPin.label} ↔ ${toPin.label}. دو خروجی دیجیتال را مستقیم به هم وصل نکنید.`,
        wireIds: [w.id],
      });
    }

    // power-GND short
    const powerGnd =
      (fromPin.signal === "vcc" && (toPin.signal === "gnd" || toPin.direction === "gnd")) ||
      (toPin.signal === "vcc" && (fromPin.signal === "gnd" || fromPin.direction === "gnd"));
    if (powerGnd) {
      issues.push({
        code: "power-gnd-short",
        severity: "error",
        message: "اتصال کوتاه تغذیه به GND! فوراً این سیم را حذف کنید.",
        wireIds: [w.id],
      });
    }

    // RX/TX swap hint
    if (
      (fromPin.signal === "uart-tx" && toPin.signal === "uart-tx") ||
      (fromPin.signal === "uart-rx" && toPin.signal === "uart-rx")
    ) {
      issues.push({
        code: "uart-swap",
        severity: "hint",
        message: "احتمالاً RX/TX جابه‌جا است: معمولاً TX یک طرف به RX طرف دیگر وصل می‌شود.",
        wireIds: [w.id],
      });
    }
  }

  // LED without series resistor
  for (const ledPart of parts) {
    const ledDef = partDef(ledPart, registry);
    if (ledDef?.behaviorModel.kind !== "led") continue;
    const ledPinIds = new Set(ledDef.pins.map((p) => p.id));
    const connectedWires = wires.filter(
      (w) =>
        (w.from.instanceId === ledPart.instanceId && ledPinIds.has(w.from.pinId)) ||
        (w.to.instanceId === ledPart.instanceId && ledPinIds.has(w.to.pinId)),
    );
    if (connectedWires.length === 0) continue;

    const touchesResistor = connectedWires.some((w) => {
      const otherId =
        w.from.instanceId === ledPart.instanceId ? w.to.instanceId : w.from.instanceId;
      const other = findPart(parts, otherId);
      const od = other ? partDef(other, registry) : undefined;
      return od?.behaviorModel.kind === "resistor";
    });

    // Also accept LED anode wired to board pin that already has resistor in series via net — MVP: direct check
    const anodeToBoardDirect = connectedWires.some((w) => {
      const ends = [w.from, w.to];
      const other = ends.find((e) => e.instanceId !== ledPart.instanceId);
      if (!other) return false;
      const otherPart = findPart(parts, other.instanceId);
      const od = otherPart ? partDef(otherPart, registry) : undefined;
      return od?.behaviorModel.kind === "mcu";
    });

    if (!touchesResistor && anodeToBoardDirect) {
      issues.push({
        code: "led-no-resistor",
        severity: "error",
        message: `LED «${ledDef.name}» بدون مقاومت سری به پایه برد وصل شده. یک مقاومت ۲۲۰Ω بین پایه دیجیتال و آند قرار دهید.`,
        partIds: [ledPart.instanceId],
        wireIds: connectedWires.map((w) => w.id),
      });
    }
  }

  // Floating critical pins on sensors that are placed but unwired
  for (const part of parts) {
    const def = partDef(part, registry);
    if (!def) continue;
    if (!["dht22", "hcsr04", "pir"].includes(def.behaviorModel.kind)) continue;
    const critical = def.pins.filter((p) => p.signal === "digital" || p.direction === "bidirectional");
    for (const pin of critical) {
      const wired = wires.some(
        (w) =>
          (w.from.instanceId === part.instanceId && w.from.pinId === pin.id) ||
          (w.to.instanceId === part.instanceId && w.to.pinId === pin.id),
      );
      if (!wired) {
        issues.push({
          code: "floating-pin",
          severity: "warning",
          message: `پایه حیاتی ${pin.label} روی «${def.name}» شناور است و سیمی ندارد.`,
          partIds: [part.instanceId],
        });
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
