import { describe, expect, it } from "vitest";
import {
  applyCollaboratorLabels,
  collaboratorLabel,
  collaboratorsFromProject,
  mediaUrlsFromProject,
  toProjectWritePayload,
} from "./projectPayload";
import type { ProjectInput } from "../types";

function sampleInput(overrides: Partial<ProjectInput> = {}): ProjectInput {
  return {
    titleFa: "پالس",
    titleEn: "Pulse",
    summaryFa: "",
    summaryEn: "",
    bodyFa: "",
    bodyEn: "",
    coverUrl: "/api/media/cover.png",
    mediaUrls: ["/api/media/a.png", "  ", "/api/media/b.webp"],
    collaborators: ["Ada"],
    status: "DRAFT",
    sortOrder: 0,
    ...overrides,
  };
}

describe("project payload", () => {
  it("reads cover and media urls from API item.media", () => {
    expect(
      mediaUrlsFromProject({
        coverUrl: "/api/media/cover.png",
        media: [{ url: "/api/media/a.png" }, { url: "/api/media/b.webp" }],
      }),
    ).toEqual(["/api/media/a.png", "/api/media/b.webp"]);
  });

  it("maps uploaded urls onto coverUrl and media[] for the CMS write", () => {
    const payload = toProjectWritePayload(sampleInput());
    expect(payload.coverUrl).toBe("/api/media/cover.png");
    expect(payload.media).toEqual([
      { url: "/api/media/a.png", sortOrder: 0 },
      { url: "/api/media/b.webp", sortOrder: 1 },
    ]);
    expect(payload).not.toHaveProperty("mediaUrls");
    expect(payload.collaborators).toEqual([
      { nameFa: "Ada", nameEn: "Ada", roleFa: "", roleEn: "", sortOrder: 0 },
    ]);
  });

  it("formats seed collaborator objects as Name — Role, never [object Object]", () => {
    const pulse = {
      collaborators: [
        { nameFa: "امیر سارانی", nameEn: "Amir Sarani", roleFa: "سخت‌افزار", roleEn: "Hardware", sortOrder: 1 },
        { name: "Navid Karimi", role: "Firmware" },
        "Ada Lovelace",
      ],
    };

    expect(collaboratorsFromProject(pulse).map(collaboratorLabel)).toEqual([
      "Amir Sarani — Hardware",
      "Navid Karimi — Firmware",
      "Ada Lovelace",
    ]);
    expect(collaboratorLabel({ foo: "bar" })).toBe("");
    expect(collaboratorLabel({ nameFa: "امیر سارانی", nameEn: "Amir Sarani", roleFa: "سخت‌افزار", roleEn: "Hardware" })).not.toContain(
      "[object Object]",
    );
  });

  it("writes collaborators as CMS objects and keeps bilingual rows when the label is unchanged", () => {
    const original = collaboratorsFromProject({
      collaborators: [
        { nameFa: "امیر سارانی", nameEn: "Amir Sarani", roleFa: "سخت‌افزار", roleEn: "Hardware", sortOrder: 1 },
      ],
    });
    const labels = original.map(collaboratorLabel);
    const merged = applyCollaboratorLabels(original, [...labels, "Fatemeh — Systems & UI"]);
    const payload = toProjectWritePayload(sampleInput({ collaborators: merged }));

    expect(payload.collaborators).toEqual([
      { nameFa: "امیر سارانی", nameEn: "Amir Sarani", roleFa: "سخت‌افزار", roleEn: "Hardware", sortOrder: 0 },
      { nameFa: "Fatemeh", nameEn: "Fatemeh", roleFa: "Systems & UI", roleEn: "Systems & UI", sortOrder: 1 },
    ]);
  });
});
