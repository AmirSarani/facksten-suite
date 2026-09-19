import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ALLOWED_IMAGE_TYPES,
  createMediaId,
  extensionForMime,
  isSafeMediaId,
} from "./upload";

describe("extensionForMime", () => {
  it("maps common image types", () => {
    assert.equal(extensionForMime("image/jpeg"), "jpg");
    assert.equal(extensionForMime("image/png"), "png");
    assert.equal(extensionForMime("image/webp"), "webp");
    assert.equal(extensionForMime("image/gif"), "gif");
  });

  it("rejects non-image or uncommon types", () => {
    assert.equal(extensionForMime("application/pdf"), null);
    assert.equal(extensionForMime("image/svg+xml"), null);
    assert.equal(extensionForMime("text/plain"), null);
  });
});

describe("createMediaId / isSafeMediaId", () => {
  it("creates a non-enumerable hex id with a safe extension", () => {
    const id = createMediaId("png");
    assert.match(id, /^[a-f0-9]{32}\.png$/);
    assert.equal(isSafeMediaId(id), true);
  });

  it("rejects path traversal and guessable names", () => {
    assert.equal(isSafeMediaId("../secret.png"), false);
    assert.equal(isSafeMediaId("cover.png"), false);
    assert.equal(isSafeMediaId("aaaa.png"), false);
  });
});

describe("ALLOWED_IMAGE_TYPES", () => {
  it("is a closed allowlist", () => {
    assert.deepEqual([...ALLOWED_IMAGE_TYPES].sort(), [
      "image/gif",
      "image/jpeg",
      "image/png",
      "image/webp",
    ]);
  });
});
