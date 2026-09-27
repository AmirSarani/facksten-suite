import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fitView, ledsDrivenBy, normRotation, partBox, pinPosition, rotateLocal, snap } from "./geometry";
import { LAB_COMPONENTS_SEED } from "./registry";
import { LAB_TEMPLATES, templateToProject } from "./templates";

const def = (id: string) => LAB_COMPONENTS_SEED.find((c) => c.id === id)!;

describe("snap / normRotation", () => {
  it("snaps to the grid", () => {
    assert.equal(snap(14), 10);
    assert.equal(snap(15), 20);
    assert.equal(snap(-4), -0);
  });
  it("normalises angles", () => {
    assert.equal(normRotation(0), 0);
    assert.equal(normRotation(450), 90);
    assert.equal(normRotation(-90), 270);
  });
});

describe("rotateLocal / pinPosition", () => {
  it("is identity at 0° and round-trips after 4×90°", () => {
    assert.deepEqual(rotateLocal(4, 16, 80, 32, 0), { x: 4, y: 16 });
    let p = { x: 4, y: 16 };
    for (let i = 0; i < 4; i++) p = rotateLocal(p.x, p.y, 80, 32, 90);
    assert.deepEqual(p, { x: 4, y: 16 });
  });

  it("moves a resistor lead to the top when rotated 90° clockwise", () => {
    const r = def("resistor-220");
    const part = { instanceId: "r", componentId: r.id, x: 100, y: 100, rotation: 90 };
    const a = pinPosition(part, r, r.pins[0]); // left lead (4,16)
    const b = pinPosition(part, r, r.pins[1]); // right lead (76,16)
    assert.equal(a.x, b.x);
    assert.ok(a.y < b.y);
  });

  it("partBox swaps w/h for 90° and keeps the centre", () => {
    const r = def("resistor-220");
    const part = { instanceId: "r", componentId: r.id, x: 0, y: 0, rotation: 90 };
    const box = partBox(part, r);
    assert.equal(box.w, r.height);
    assert.equal(box.h, r.width);
    assert.equal(box.x + box.w / 2, r.width / 2);
  });
});

describe("fitView", () => {
  it("centres the box", () => {
    const { zoom, pan } = fitView({ x: 0, y: 0, w: 100, h: 100 }, 400, 400, 0, 10);
    assert.equal(zoom, 4);
    assert.deepEqual(pan, { x: 0, y: 0 });
  });
});

describe("ledsDrivenBy", () => {
  it("lights the Blink LED through its series resistor", () => {
    const t = LAB_TEMPLATES.find((x) => x.id === "blink-led")!;
    const lit = ledsDrivenBy(templateToProject(t), LAB_COMPONENTS_SEED, "d13");
    assert.deepEqual([...lit], ["led1"]);
  });

  it("only lights the LED on D13 in the traffic light", () => {
    const t = LAB_TEMPLATES.find((x) => x.id === "traffic-light")!;
    const lit = ledsDrivenBy(templateToProject(t), LAB_COMPONENTS_SEED, "d13");
    assert.deepEqual([...lit], ["led3"]);
  });

  it("returns nothing when nothing is wired", () => {
    const lit = ledsDrivenBy({ parts: [], wires: [] }, LAB_COMPONENTS_SEED, "d13");
    assert.equal(lit.size, 0);
  });
});
