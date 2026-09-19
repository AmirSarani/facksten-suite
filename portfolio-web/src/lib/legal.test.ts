import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isLegalPage, normalizeLegal, resolveLegalBody } from "./legal";
import type { SettingsMap } from "./settings";

const settings: SettingsMap = {
  legal: {
    privacy: { fa: "حریم خصوصی", en: "Privacy text" },
    terms: { fa: "شرایط", en: "Terms text" },
  },
};

describe("isLegalPage", () => {
  it("accepts privacy and terms", () => {
    assert.equal(isLegalPage("privacy"), true);
    assert.equal(isLegalPage("terms"), true);
  });

  it("rejects unknown pages", () => {
    assert.equal(isLegalPage("cookies"), false);
    assert.equal(isLegalPage(""), false);
  });
});

describe("resolveLegalBody", () => {
  it("returns FA privacy by default", () => {
    assert.deepEqual(resolveLegalBody(settings, "privacy", null), {
      page: "privacy",
      locale: "fa",
      body: "حریم خصوصی",
    });
  });

  it("returns EN terms when locale=en", () => {
    assert.deepEqual(resolveLegalBody(settings, "terms", "en"), {
      page: "terms",
      locale: "en",
      body: "Terms text",
    });
  });

  it("returns null for unknown page or missing copy", () => {
    assert.equal(resolveLegalBody(settings, "cookies", "fa"), null);
    assert.equal(resolveLegalBody({}, "privacy", "fa"), null);
  });
});

describe("normalizeLegal", () => {
  it("fills missing locale strings", () => {
    assert.deepEqual(normalizeLegal({ privacy: { fa: "p" } }), {
      privacy: { fa: "p", en: "" },
      terms: { fa: "", en: "" },
    });
  });
});
