import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { clientIp, rateLimit, resetRateLimit } from "./rate-limit";
import { resolveSessionSecret } from "./session-secret";

describe("rateLimit", () => {
  const rule = { limit: 3, windowMs: 1000 };

  it("allows up to the limit then blocks with retry-after", () => {
    const key = "t:block";
    const now = 1_000_000;
    assert.equal(rateLimit(key, rule, now).ok, true);
    assert.equal(rateLimit(key, rule, now).ok, true);
    assert.equal(rateLimit(key, rule, now).ok, true);
    const blocked = rateLimit(key, rule, now + 100);
    assert.equal(blocked.ok, false);
    assert.ok(blocked.retryAfterSec >= 1);
  });

  it("resets after the window and on resetRateLimit", () => {
    const key = "t:reset";
    const now = 2_000_000;
    for (let i = 0; i < 4; i++) rateLimit(key, rule, now);
    assert.equal(rateLimit(key, rule, now + 1001).ok, true);
    for (let i = 0; i < 4; i++) rateLimit(key, rule, now + 2000);
    resetRateLimit(key);
    assert.equal(rateLimit(key, rule, now + 2001).ok, true);
  });
});

describe("clientIp", () => {
  it("uses the last X-Forwarded-For hop", () => {
    const req = new Request("http://x", { headers: { "x-forwarded-for": "6.6.6.6, 1.2.3.4" } });
    assert.equal(clientIp(req), "1.2.3.4");
  });
});

describe("resolveSessionSecret", () => {
  const good = "a".repeat(32);

  it("returns the configured secret", () => {
    assert.equal(resolveSessionSecret({ NODE_ENV: "production", SESSION_SECRET: good }), good);
  });

  it("throws in production when missing or short", () => {
    assert.throws(() => resolveSessionSecret({ NODE_ENV: "production" }));
    assert.throws(() => resolveSessionSecret({ NODE_ENV: "production", SESSION_SECRET: "short" }));
  });

  it("does not throw during next build or in development", () => {
    assert.doesNotThrow(() =>
      resolveSessionSecret({ NODE_ENV: "production", NEXT_PHASE: "phase-production-build" }),
    );
    assert.doesNotThrow(() => resolveSessionSecret({ NODE_ENV: "development" }));
  });
});
