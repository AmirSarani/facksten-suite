import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  deserializeProject,
  serializeProject,
  newEmptyProject,
  LAB_PROJECT_VERSION,
} from "./schema";

describe("project serialize", () => {
  it("round-trips a project", () => {
    const p = newEmptyProject("تست");
    p.parts.push({
      instanceId: "a",
      componentId: "arduino-uno",
      x: 1,
      y: 2,
      rotation: 0,
    });
    const json = serializeProject(p);
    const back = deserializeProject(json);
    assert.equal(back.version, LAB_PROJECT_VERSION);
    assert.equal(back.name, "تست");
    assert.equal(back.parts.length, 1);
  });
});
