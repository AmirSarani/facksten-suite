import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiFetch, fetchMe, legalApi, unwrapItem, uploadImage } from "./api";

function jsonResponse(body: unknown, status = 200, statusText = "OK") {
  return new Response(JSON.stringify(body), {
    status,
    statusText,
    headers: { "Content-Type": "application/json" },
  });
}

describe("api client", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("treats { user: null } from /me as unauthenticated", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ user: null }));
    await expect(fetchMe()).rejects.toMatchObject({ status: 401 });
  });

  it("unwraps { item } from portfolio-web admin writes", () => {
    expect(unwrapItem({ item: { id: "p1", titleEn: "Pulse" } })).toEqual({
      id: "p1",
      titleEn: "Pulse",
    });
  });

  it("surfaces nested { error: { message } } from upload/legal", async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ error: { code: "UNAUTHORIZED", message: "Unauthorized" } }, 401, "Unauthorized"),
    );

    await expect(apiFetch("/api/admin/upload", { method: "POST", body: new FormData() })).rejects.toMatchObject({
      name: "ApiError",
      status: 401,
      message: "Unauthorized",
    } satisfies Partial<ApiError>);
  });

  it("POSTs multipart upload with credentials and no JSON content-type", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ url: "/api/media/aabbccddeeff00112233445566778899.png" }, 201));

    const file = new File([new Uint8Array([137, 80, 78, 71])], "cover.png", { type: "image/png" });
    const url = await uploadImage(file);

    expect(url).toBe("/api/media/aabbccddeeff00112233445566778899.png");
    expect(fetch).toHaveBeenCalledTimes(1);
    const [requestUrl, init] = vi.mocked(fetch).mock.calls[0] ?? [];
    expect(String(requestUrl)).toMatch(/\/api\/admin\/upload$/);
    expect(init?.credentials).toBe("include");
    expect(init?.method).toBe("POST");
    expect(init?.body).toBeInstanceOf(FormData);
    const form = init?.body as FormData;
    expect(form.get("file")).toBe(file);
    const headers = new Headers(init?.headers);
    expect(headers.get("Content-Type") ?? "").not.toMatch(/application\/json/i);
  });

  it("loads and saves legal FA/EN privacy + terms", async () => {
    const legal = {
      privacy: { fa: "حریم", en: "Privacy" },
      terms: { fa: "شرایط", en: "Terms" },
    };
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ legal }))
      .mockResolvedValueOnce(jsonResponse({ legal }));

    await expect(legalApi.get()).resolves.toEqual(legal);

    const updated = {
      privacy: { fa: "حریم خصوصی", en: "Privacy policy" },
      terms: { fa: "قوانین", en: "Terms of use" },
    };
    await expect(legalApi.update(updated)).resolves.toEqual(legal);

    const [, putInit] = vi.mocked(fetch).mock.calls[1] ?? [];
    expect(putInit?.method).toBe("PUT");
    expect(putInit?.credentials).toBe("include");
    expect(JSON.parse(String(putInit?.body))).toEqual(updated);
  });
});
