import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { pinPosition } from "./geometry";
import { buildNetlist, litLeds, netAt, pinKey, pluggedInto } from "./netlist";
import { BB, LAB_COMPONENTS_SEED, PITCH } from "./registry";
import { LAB_TEMPLATES, templateToProject } from "./templates";
import type { LabProject, PlacedPart, WireDef } from "./types";
import { validateWiring } from "./wiring/validate";

const C = LAB_COMPONENTS_SEED;
const def = (id: string) => C.find((c) => c.id === id)!;
const template = (id: string) => templateToProject(LAB_TEMPLATES.find((t) => t.id === id)!);
const project = (parts: PlacedPart[], wires: WireDef[] = []): Pick<LabProject, "parts" | "wires"> => ({ parts, wires });
const part = (instanceId: string, componentId: string, x: number, y: number, rotation = 0): PlacedPart => ({ instanceId, componentId, x, y, rotation });
const wire = (id: string, a: [string, string], b: [string, string]): WireDef => ({
  id,
  from: { instanceId: a[0], pinId: a[1] },
  to: { instanceId: b[0], pinId: b[1] },
  color: "#3b82f6",
});
const sameNet = (p: Pick<LabProject, "parts" | "wires">, a: [string, string], b: [string, string]) => {
  const nl = buildNetlist(p, C);
  return netAt(nl, pinKey(...a))!.id === netAt(nl, pinKey(...b))!.id;
};

describe("0.1\" grid", () => {
  it("puts every pin of every part on the grid, at every rotation", () => {
    for (const d of C) {
      assert.equal(d.width % PITCH, 0, `${d.id} width`);
      assert.equal(d.height % PITCH, 0, `${d.id} height`);
      assert.equal((d.width + d.height) % (2 * PITCH), 0, `${d.id} w+h must be a multiple of 20 to rotate on grid`);
      for (const rotation of [0, 90, 180, 270]) {
        for (const pin of d.pins) {
          const p = pinPosition(part("p", d.id, 100, 200, rotation), d, pin);
          assert.equal(p.x % PITCH, 0, `${d.id}.${pin.id} x @${rotation}`);
          assert.equal(p.y % PITCH, 0, `${d.id}.${pin.id} y @${rotation}`);
        }
      }
    }
  });

  it("has unique pin ids and pins inside the part", () => {
    for (const d of C) {
      assert.equal(new Set(d.pins.map((p) => p.id)).size, d.pins.length, d.id);
      for (const p of d.pins) assert.ok(p.x >= 0 && p.x <= d.width && p.y >= 0 && p.y <= d.height, `${d.id}.${p.id}`);
      for (const g of d.internalNets ?? []) for (const id of g) assert.ok(d.pins.some((p) => p.id === id), `${d.id} net ${id}`);
    }
  });
});

describe("830-point breadboard", () => {
  const bb = def("breadboard");
  it("has exactly 830 holes: 63×10 + 4 rails × 50", () => {
    assert.equal(bb.pins.length, 830);
    assert.equal(bb.pins.filter((p) => /^[a-j]\d+$/.test(p.id)).length, BB.cols * 10);
  });

  it("joins a–e of one column but not across the trench or to the next column", () => {
    const p = project([part("bb", "breadboard", 0, 0)]);
    assert.ok(sameNet(p, ["bb", "a5"], ["bb", "e5"]));
    assert.ok(!sameNet(p, ["bb", "e5"], ["bb", "f5"]));
    assert.ok(!sameNet(p, ["bb", "a5"], ["bb", "a6"]));
    assert.ok(sameNet(p, ["bb", "tn1"], ["bb", "tn50"]));
    assert.ok(!sameNet(p, ["bb", "tn1"], ["bb", "tp1"]));
  });
});

describe("plugging in", () => {
  it("connects a lead sitting in a hole, with no wire", () => {
    const bb = def("breadboard");
    const led = def("led-red");
    const hole = bb.pins.find((p) => p.id === "c10")!;
    const cathode = led.pins.find((p) => p.id === "cathode")!;
    const p = project([part("bb", "breadboard", 0, 0), part("led", "led-red", hole.x - cathode.x, hole.y - cathode.y)]);
    assert.ok(sameNet(p, ["led", "cathode"], ["bb", "a10"]));
    assert.ok(sameNet(p, ["led", "anode"], ["bb", "e11"]));
    const nl = buildNetlist(p, C);
    assert.deepEqual([...pluggedInto(nl, "bb")], ["led"]);
  });

  it("disconnects when the part is moved off the holes", () => {
    const p = project([part("bb", "breadboard", 0, 0), part("led", "led-red", 1000, 1000)]);
    assert.ok(!sameNet(p, ["led", "cathode"], ["bb", "a10"]));
  });

  it("treats the Uno's GND pins and A4/SDA as one net", () => {
    const p = project([part("u", "arduino-uno", 0, 0)]);
    assert.ok(sameNet(p, ["u", "gnd1"], ["u", "gnd3"]));
    assert.ok(sameNet(p, ["u", "a4"], ["u", "sda"]));
  });
});

describe("litLeds", () => {
  it("lights the Blink LED (built on the breadboard) when D13 is HIGH", () => {
    const nl = buildNetlist(template("blink-led"), C);
    assert.deepEqual([...litLeds(nl, new Set(["d13"]))], ["led1"]);
    assert.equal(litLeds(nl, new Set()).size, 0);
  });

  it("lights only the LED on the pin that is HIGH in the traffic light", () => {
    const nl = buildNetlist(template("traffic-light"), C);
    assert.deepEqual([...litLeds(nl, new Set(["d13"]))], ["led3"]);
    assert.deepEqual([...litLeds(nl, new Set(["d11"]))], ["led1"]);
  });

  it("does not light an LED whose cathode never reaches GND", () => {
    const p = template("blink-led");
    const open = { ...p, wires: p.wires.filter((w) => w.from.pinId !== "gnd3") };
    assert.equal(litLeds(buildNetlist(open, C), new Set(["d13"])).size, 0);
  });

  it("lights an LED fed from 5V through a resistor", () => {
    const p = project(
      [part("u", "arduino-uno", 0, 0), part("r", "resistor-220", 400, 0), part("l", "led-red", 500, 0)],
      [wire("w1", ["u", "5v"], ["r", "a"]), wire("w2", ["r", "b"], ["l", "anode"]), wire("w3", ["l", "cathode"], ["u", "gnd1"])],
    );
    assert.deepEqual([...litLeds(buildNetlist(p, C), new Set())], ["l"]);
  });
});

describe("validateWiring on nets", () => {
  const codes = (p: Pick<LabProject, "parts" | "wires">) => validateWiring(p, C).map((i) => i.code);

  it("finds no errors in any template", () => {
    for (const t of LAB_TEMPLATES) {
      const errors = validateWiring(templateToProject(t), C).filter((i) => i.severity === "error");
      assert.deepEqual(errors, [], t.id);
    }
  });

  it("warns when both resistor leads are in the same column", () => {
    // rotated 90° the leads are 4 holes apart vertically: rows a and e of one column
    const r = def("resistor-220");
    const bbHole = def("breadboard").pins.find((p) => p.id === "a20")!;
    const rot = pinPosition(part("r", r.id, 0, 0, 90), r, r.pins[0]);
    const p = project(
      [part("bb", "breadboard", 0, 0), part("r", r.id, bbHole.x - rot.x, bbHole.y - rot.y, 90)],
      [wire("w", ["bb", "c20"], ["bb", "c30"])],
    );
    assert.ok(sameNet(p, ["r", "a"], ["r", "b"]));
    assert.ok(codes(p).includes("shorted-part"));
  });

  it("catches a short made through the breadboard rails", () => {
    const p = project(
      [part("u", "arduino-uno", 0, 0), part("bb", "breadboard", 400, 0)],
      [wire("w1", ["u", "5v"], ["bb", "tp1"]), wire("w2", ["u", "gnd1"], ["bb", "tp40"])],
    );
    assert.ok(codes(p).includes("power-gnd-short"));
  });

  it("flags an LED wired straight from D13 to GND on the breadboard", () => {
    const p = template("blink-led");
    // move the resistor away: D13's column no longer reaches the anode, so wire it directly
    const parts = p.parts.filter((x) => x.instanceId !== "r1");
    const wires = [...p.wires, wire("w9", ["bb1", "a11"], ["uno1", "d13"])];
    assert.ok(codes({ parts, wires }).includes("led-no-resistor"));
  });

  it("warns about a reversed LED", () => {
    const p = project(
      [part("u", "arduino-uno", 0, 0), part("r", "resistor-220", 400, 0), part("l", "led-red", 500, 0)],
      [wire("w1", ["u", "d13"], ["r", "a"]), wire("w2", ["r", "b"], ["l", "cathode"]), wire("w3", ["l", "anode"], ["u", "gnd1"])],
    );
    assert.ok(codes(p).includes("led-reversed"));
  });

  it("needs a common ground for powered modules", () => {
    const p = project([part("u", "arduino-uno", 0, 0), part("s", "hc-sr04", 400, 0)], [wire("w1", ["u", "5v"], ["s", "vcc"])]);
    assert.ok(codes(p).includes("no-common-gnd"));
  });
});

describe("part properties in checks", () => {
  it("warns when the LED's series resistor is too small, not with the template's 220Ω", () => {
    const p = template("blink-led");
    assert.ok(!validateWiring(p, C).some((i) => i.code === "led-overcurrent"));
    const small = { ...p, parts: p.parts.map((x) => (x.instanceId === "r1" ? { ...x, props: { ohms: 47 } } : x)) };
    const issue = validateWiring(small, C).find((i) => i.code === "led-overcurrent");
    assert.ok(issue, "expected an over-current warning");
    assert.match(issue!.message, /47Ω/);
  });
});
