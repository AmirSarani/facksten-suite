import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validateWiring, canConnectPins } from "./validate";
import { LAB_COMPONENTS_SEED } from "../registry";

describe("validateWiring", () => {
  it("flags empty project", () => {
    const issues = validateWiring({ parts: [], wires: [] }, LAB_COMPONENTS_SEED);
    assert.equal(issues[0]?.code, "empty");
  });

  it("detects power-GND short", () => {
    const issues = validateWiring(
      {
        parts: [
          { instanceId: "u", componentId: "arduino-uno", x: 0, y: 0, rotation: 0 },
        ],
        wires: [
          {
            id: "w",
            from: { instanceId: "u", pinId: "5v" },
            to: { instanceId: "u", pinId: "gnd1" },
            color: "#f00",
          },
        ],
      },
      LAB_COMPONENTS_SEED,
    );
    assert.ok(issues.some((i) => i.code === "power-gnd-short"));
  });

  it("detects LED without resistor when wired to MCU", () => {
    const issues = validateWiring(
      {
        parts: [
          { instanceId: "u", componentId: "arduino-uno", x: 0, y: 0, rotation: 0 },
          { instanceId: "l", componentId: "led-red", x: 0, y: 0, rotation: 0 },
        ],
        wires: [
          {
            id: "w1",
            from: { instanceId: "u", pinId: "d13" },
            to: { instanceId: "l", pinId: "anode" },
            color: "#00f",
          },
          {
            id: "w2",
            from: { instanceId: "l", pinId: "cathode" },
            to: { instanceId: "u", pinId: "gnd1" },
            color: "#000",
          },
        ],
      },
      LAB_COMPONENTS_SEED,
    );
    assert.ok(issues.some((i) => i.code === "led-no-resistor"));
  });
});

describe("canConnectPins", () => {
  it("blocks vcc to gnd", () => {
    const r = canConnectPins(
      { direction: "power", signal: "vcc", voltage: 5 },
      { direction: "gnd", signal: "gnd" },
      true,
    );
    assert.equal(r.ok, false);
  });
});
