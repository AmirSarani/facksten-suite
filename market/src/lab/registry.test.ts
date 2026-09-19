import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { LAB_COMPONENTS_SEED, getComponentById } from "./registry";
import { LAB_TEMPLATES } from "./templates";

describe("registry", () => {
  it("has 14+ components with pins", () => {
    assert.ok(LAB_COMPONENTS_SEED.length >= 14);
    for (const c of LAB_COMPONENTS_SEED) {
      assert.ok(c.pins.length > 0, c.id);
      assert.ok(c.simulationStatus === "simulated" || c.simulationStatus === "wireable" || c.simulationStatus === "3d-only");
    }
  });

  it("arduino uno is simulated mcu", () => {
    const u = getComponentById("arduino-uno");
    assert.ok(u);
    assert.equal(u.simulationStatus, "simulated");
    assert.equal(u.behaviorModel.kind, "mcu");
  });
});

describe("blink template", () => {
  it("has parts, wires, code, and BOM", () => {
    const t = LAB_TEMPLATES.find((x) => x.id === "blink-led");
    assert.ok(t);
    assert.ok(t.project.parts.length >= 3);
    assert.ok(t.project.wires.length >= 2);
    assert.match(t.project.code, /pinMode\s*\(\s*13/);
    assert.ok(t.bom.length >= 3);
  });
});
