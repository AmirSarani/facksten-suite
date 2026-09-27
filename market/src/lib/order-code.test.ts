import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { generateOrderCode, generateUniqueOrderCode } from "./order-code";

describe("generateOrderCode", () => {
  it("matches FS-<8 unambiguous chars>", () => {
    for (let i = 0; i < 200; i++) {
      assert.match(generateOrderCode(), /^FS-[2-9A-HJ-NP-Z]{8}$/);
    }
  });

  it("does not repeat across many draws (birthday bound is astronomically larger)", () => {
    const codes = new Set(Array.from({ length: 500 }, generateOrderCode));
    assert.equal(codes.size, 500);
  });
});

describe("generateUniqueOrderCode", () => {
  it("returns the first code that doesn't exist", async () => {
    const code = await generateUniqueOrderCode(async () => false);
    assert.match(code, /^FS-/);
  });

  it("retries past collisions", async () => {
    let calls = 0;
    const exists = async () => {
      calls += 1;
      return calls < 3; // first two are "taken", third is free
    };
    const code = await generateUniqueOrderCode(exists);
    assert.match(code, /^FS-/);
    assert.equal(calls, 3);
  });

  it("gives up after the attempt budget", async () => {
    await assert.rejects(() => generateUniqueOrderCode(async () => true, 3));
  });
});
