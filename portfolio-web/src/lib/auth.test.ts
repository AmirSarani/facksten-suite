import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveSessionCookieOptions } from "./auth";

describe("resolveSessionCookieOptions", () => {
  it("uses Lax and insecure cookies for local/dev HTTP so Chrome accepts them", () => {
    const options = resolveSessionCookieOptions({ NODE_ENV: "development" }, "http");

    assert.equal(options.sameSite, "lax");
    assert.equal(options.secure, false);
    assert.equal(options.httpOnly, true);
    assert.equal(options.path, "/");
  });

  it("defaults to Lax and insecure when NODE_ENV is not production", () => {
    const options = resolveSessionCookieOptions({ NODE_ENV: "test" });

    assert.equal(options.sameSite, "lax");
    assert.equal(options.secure, false);
  });

  it("uses None and Secure for production HTTPS (cross-origin admin)", () => {
    const options = resolveSessionCookieOptions({ NODE_ENV: "production" }, "https");

    assert.equal(options.sameSite, "none");
    assert.equal(options.secure, true);
  });

  it("defaults production to None + Secure when protocol is unknown", () => {
    const options = resolveSessionCookieOptions({ NODE_ENV: "production" });

    assert.equal(options.sameSite, "none");
    assert.equal(options.secure, true);
  });

  it("never emits SameSite=None without Secure (Chrome rejects it)", () => {
    const options = resolveSessionCookieOptions({
      NODE_ENV: "production",
      SESSION_SAMESITE: "none",
      COOKIE_SECURE: "false",
    });

    assert.notEqual(options.sameSite === "none" && options.secure === false, true);
    assert.equal(options.sameSite, "lax");
    assert.equal(options.secure, false);
  });

  it("honors SESSION_SAMESITE and COOKIE_SECURE overrides", () => {
    const options = resolveSessionCookieOptions({
      NODE_ENV: "production",
      SESSION_SAMESITE: "lax",
      COOKIE_SECURE: "true",
    });

    assert.equal(options.sameSite, "lax");
    assert.equal(options.secure, true);
  });

  it("returns matching attributes for set and clear (logout)", () => {
    const env = { NODE_ENV: "development" as const };
    const setOptions = resolveSessionCookieOptions(env, "http");
    const clearOptions = resolveSessionCookieOptions(env, "http");

    assert.deepEqual(setOptions, clearOptions);
    assert.equal(setOptions.path, "/");
    assert.equal(setOptions.httpOnly, true);
  });
});
