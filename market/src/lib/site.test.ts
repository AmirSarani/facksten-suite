import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { NAV, getHeaderNav, getPortfolioUrl } from "./site";

describe("getPortfolioUrl", () => {
  it("returns null when the env value is missing, empty, or whitespace", () => {
    assert.equal(getPortfolioUrl(undefined), null);
    assert.equal(getPortfolioUrl(""), null);
    assert.equal(getPortfolioUrl("   "), null);
  });

  it("returns the trimmed public portfolio origin when set", () => {
    assert.equal(getPortfolioUrl("http://localhost:3020"), "http://localhost:3020");
    assert.equal(getPortfolioUrl("  http://localhost:3020  "), "http://localhost:3020");
  });
});

describe("getHeaderNav", () => {
  it("includes آزمایشگاه مجازی in base NAV", () => {
    assert.ok(NAV.some((item) => item.href === "/lab" && item.label === "آزمایشگاه مجازی"));
  });

  it("omits the portfolio item when the URL is unset", () => {
    const nav = getHeaderNav(null);
    assert.deepEqual(nav, NAV);
    assert.equal(
      nav.some((item) => item.label === "نمونه کارها"),
      false,
    );
  });

  it("inserts نمونه کارها after مقالات when the URL is set", () => {
    const nav = getHeaderNav("http://localhost:3020");
    const articlesIndex = nav.findIndex((item) => item.href === "/articles");
    const portfolio = nav[articlesIndex + 1];

    assert.ok(articlesIndex >= 0);
    assert.deepEqual(portfolio, {
      href: "http://localhost:3020",
      label: "نمونه کارها",
      external: true,
    });
    assert.equal(nav[articlesIndex + 2]?.href, "/about");
  });
});
