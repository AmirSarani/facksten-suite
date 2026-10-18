import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fitView, normRotation, partBox, pinPosition, rotateLocal, snap } from "./geometry";
import { LAB_COMPONENTS_SEED } from "./registry";

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
    const a = pinPosition(part, r, r.pins[0]); // left lead
    const b = pinPosition(part, r, r.pins[1]); // right lead
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
