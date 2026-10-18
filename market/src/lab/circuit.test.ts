import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { partStates, resolveInputs } from "./circuit";
import { SIM_PINS, type SimFrame } from "./engine/types";
import { buildNetlist } from "./netlist";
import { LAB_COMPONENTS_SEED } from "./registry";
import { LAB_TEMPLATES, templateToProject } from "./templates";
import type { PlacedPart, WireDef } from "./types";

const C = LAB_COMPONENTS_SEED;
const template = (id: string) => templateToProject(LAB_TEMPLATES.find((t) => t.id === id)!);
const part = (instanceId: string, componentId: string, x: number, y: number): PlacedPart => ({ instanceId, componentId, x, y, rotation: 0 });
const wire = (id: string, a: [string, string], b: [string, string]): WireDef => ({
  id,
  from: { instanceId: a[0], pinId: a[1] },
  to: { instanceId: b[0], pinId: b[1] },
  color: "#3b82f6",
});
/** A frame where `pins` are outputs with the given duty (1 = steady HIGH). */
const frame = (pins: Record<number, number>, extra: Partial<SimFrame> = {}): SimFrame => {
  const duty = Array(SIM_PINS).fill(0);
  let outputs = 0;
  for (const [p, d] of Object.entries(pins)) {
    duty[Number(p)] = d;
    outputs |= 1 << Number(p);
  }
  return { levels: 0, outputs, duty, freq: Array(SIM_PINS).fill(0), pulseUs: Array(SIM_PINS).fill(0), simMs: 0, realtime: 1, ...extra };
};

describe("resolveInputs", () => {
  it("leaves D2 floating until the button is pressed, then pulls it to GND", () => {
    const p = template("button-led");
    assert.equal(resolveInputs(buildNetlist(p, C), new Map()).digital[2], null);
    const pressed = buildNetlist(p, C, { closed: new Set(["btn1"]) });
    assert.equal(resolveInputs(pressed, new Map()).digital[2], 0);
  });

  it("reads the potentiometer wiper as a voltage on A0", () => {
    const nl = buildNetlist(template("pot-dimmer"), C);
    assert.ok(Math.abs(resolveInputs(nl, new Map([["pot1", 0.5]])).analog[0] - 2.5) < 1e-9);
    assert.ok(Math.abs(resolveInputs(nl, new Map([["pot1", 1]])).analog[0] - 5) < 1e-9);
    assert.equal(resolveInputs(nl, new Map([["pot1", 0]])).digital[14], 0);
  });

  it("sees a pull-down resistor as a weak LOW", () => {
    const p = {
      parts: [part("u", "arduino-uno", 0, 0), part("r", "resistor-10k", 400, 0)],
      wires: [wire("w1", ["u", "d4"], ["r", "a"]), wire("w2", ["r", "b"], ["u", "gnd1"])],
    };
    assert.equal(resolveInputs(buildNetlist(p, C), new Map()).digital[4], 0);
  });
});

describe("partStates", () => {
  it("lights the Blink LED only while D13 is HIGH", () => {
    const nl = buildNetlist(template("blink-led"), C);
    assert.equal(partStates(nl, frame({ 13: 1 })).leds.get("led1"), 1);
    assert.equal(partStates(nl, frame({ 13: 0 })).leds.size, 0);
    assert.equal(partStates(nl, null).leds.size, 0);
  });

  it("dims an LED with PWM duty", () => {
    const nl = buildNetlist(template("fade-pwm"), C);
    assert.ok(Math.abs(partStates(nl, frame({ 9: 0.3 })).leds.get("led1")! - 0.3) < 1e-9);
  });

  it("turns the servo to the angle its pulse asks for", () => {
    const nl = buildNetlist(template("servo-sweep"), C);
    const pulse = Array(SIM_PINS).fill(0);
    pulse[9] = 1472;
    const angle = partStates(nl, frame({ 9: 0.07 }, { pulseUs: pulse })).servos.get("srv1")!;
    assert.ok(Math.abs(angle - 90) < 1, `angle ${angle}`);
  });

  it("sounds the buzzer at the pin's tone frequency", () => {
    const nl = buildNetlist(template("buzzer-melody"), C);
    const freq = Array(SIM_PINS).fill(0);
    freq[8] = 440;
    assert.equal(partStates(nl, frame({ 8: 0.5 }, { freq })).buzzers.get("bz1"), 440);
  });
});
