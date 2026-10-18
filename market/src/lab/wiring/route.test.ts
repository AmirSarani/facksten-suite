import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { intersects, nearest, orthoBends, rectFrom, segmentMids, simplify, wirePath } from "./route";

describe("wire routing", () => {
  it("bends an L only when the ends are not aligned", () => {
    assert.deepEqual(orthoBends({ x: 0, y: 0 }, { x: 50, y: 30 }), [{ x: 50, y: 0 }]);
    assert.deepEqual(orthoBends({ x: 0, y: 0 }, { x: 50, y: 0 }), []);
  });

  it("drops repeated and collinear points", () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 20, y: 0 },
      { x: 20, y: 10 },
    ];
    assert.deepEqual(simplify(pts), [
      { x: 0, y: 0 },
      { x: 20, y: 0 },
      { x: 20, y: 10 },
    ]);
  });

  it("draws a jumper curve without bends and straight runs with them", () => {
    assert.match(wirePath({ x: 0, y: 0 }, [], { x: 100, y: 0 }), /^M 0 0 C /);
    const d = wirePath({ x: 0, y: 0 }, [{ x: 100, y: 0 }], { x: 100, y: 100 });
    assert.match(d, /Q 100 0/);
    assert.match(d, /L 100 100$/);
  });

  it("offers a mid handle on long segments only", () => {
    const mids = segmentMids({ x: 0, y: 0 }, [{ x: 100, y: 0 }], { x: 100, y: 10 });
    assert.equal(mids.length, 1);
    assert.deepEqual(mids[0], { at: { x: 50, y: 0 }, index: 0 });
  });

  it("finds the nearest candidate inside the radius", () => {
    const c = [{ at: { x: 0, y: 0 }, id: "a" }, { at: { x: 10, y: 0 }, id: "b" }];
    assert.equal(nearest(c, { x: 8, y: 1 }, 6)?.id, "b");
    assert.equal(nearest(c, { x: 40, y: 0 }, 6), null);
  });

  it("intersects boxes", () => {
    const r = rectFrom({ x: 10, y: 10 }, { x: 0, y: 0 });
    assert.deepEqual(r, { x: 0, y: 0, w: 10, h: 10 });
    assert.ok(intersects(r, { x: 5, y: 5, w: 10, h: 10 }));
    assert.ok(!intersects(r, { x: 20, y: 20, w: 5, h: 5 }));
  });
});
