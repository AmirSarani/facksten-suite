import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatOhms, parseOhms, resistorBands } from "./part-props";

const NAMES: Record<string, string> = {
  "#111118": "black", "#7a4a1f": "brown", "#dc2626": "red", "#f97316": "orange", "#facc15": "yellow",
  "#16a34a": "green", "#2563eb": "blue", "#7c3aed": "violet", "#6b7280": "grey", "#f8fafc": "white", "#d4af37": "gold",
};
const bands = (ohms: number) => resistorBands(ohms).map((c) => NAMES[c]);

describe("resistor colour code", () => {
  it("matches the standard code", () => {
    assert.deepEqual(bands(220), ["red", "red", "brown", "gold"]);
    assert.deepEqual(bands(10_000), ["brown", "black", "orange", "gold"]);
    assert.deepEqual(bands(4700), ["yellow", "violet", "red", "gold"]);
    assert.deepEqual(bands(100), ["brown", "black", "brown", "gold"]);
    assert.deepEqual(bands(1_000_000), ["brown", "black", "green", "gold"]);
    assert.deepEqual(bands(47), ["yellow", "violet", "black", "gold"]);
  });
});

describe("ohms text", () => {
  it("formats and parses", () => {
    assert.equal(formatOhms(220), "220Ω");
    assert.equal(formatOhms(4700), "4.7kΩ");
    assert.equal(formatOhms(1e6), "1MΩ");
    assert.equal(parseOhms("4.7k"), 4700);
    assert.equal(parseOhms("330 ohm"), 330);
    assert.equal(parseOhms("۲۲۰"), 220);
    assert.equal(parseOhms("1M"), 1e6);
    assert.equal(parseOhms("abc"), null);
    assert.equal(parseOhms("-5"), null);
  });
});
