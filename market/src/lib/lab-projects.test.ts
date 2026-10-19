import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { LAB_TEMPLATES, templateToProject } from "@/lab/templates";
import { LAB_PROJECT_LIMITS, newShareToken, parseIncomingProject, storedProject, summarize } from "./lab-projects";

const blink = () => templateToProject(LAB_TEMPLATES.find((t) => t.id === "blink-led")!);

describe("saved lab projects", () => {
  it("accepts a real project and drops the client's cloudId", () => {
    const r = parseIncomingProject({ ...blink(), cloudId: "someone-elses-row" });
    assert.ok(r.ok);
    if (r.ok) {
      assert.equal(r.project.cloudId, undefined);
      assert.equal(JSON.parse(r.json).cloudId, undefined);
    }
  });

  it("rejects junk and oversized projects", () => {
    assert.equal(parseIncomingProject({ hello: "world", parts: "nope" }).ok, false);
    assert.equal(parseIncomingProject(null).ok, false);
    const huge = { ...blink(), code: "x".repeat(LAB_PROJECT_LIMITS.maxBytes) };
    assert.equal(parseIncomingProject(huge).ok, false);
  });

  it("names unnamed projects", () => {
    const r = parseIncomingProject({ ...blink(), name: "   " });
    assert.ok(r.ok && r.project.name === "پروژه بدون نام");
  });

  it("hands shared projects out as copies, own projects with their id", () => {
    const row = { id: "row1", data: JSON.stringify(blink()) };
    assert.equal(storedProject(row).cloudId, "row1");
    assert.equal(storedProject(row, { asCopy: true }).cloudId, undefined);
  });

  it("summarizes rows", () => {
    const s = summarize({ id: "r", name: "n", updatedAt: new Date(0), shareToken: null, data: JSON.stringify(blink()) });
    assert.equal(s.parts, 4);
    assert.equal(s.shared, false);
  });

  it("makes long, URL-safe, unique share tokens", () => {
    const a = newShareToken();
    assert.match(a, /^[A-Za-z0-9_-]{22}$/);
    assert.notEqual(a, newShareToken());
  });
});
