import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LineList } from "./bilingual";

/** Pulse Rack admin GET collaborator rows (portfolio-web include), as in the edit-form screenshot. */
const pulseRackCollaborators = [
  {
    id: "c1",
    projectId: "pulse",
    nameFa: "امیر سارانی",
    nameEn: "Amir Sarani",
    roleFa: "سخت‌افزار",
    roleEn: "Hardware",
    sortOrder: 1,
  },
  {
    id: "c2",
    projectId: "pulse",
    nameFa: "نوید کریمی",
    nameEn: "Navid Karimi",
    roleFa: "میان‌افزار",
    roleEn: "Firmware",
    sortOrder: 2,
  },
];

describe("LineList collaborators (admin project edit screenshot)", () => {
  it("renders Pulse Rack objects as Name — Role, not [object Object]", () => {
    const html = renderToStaticMarkup(
      createElement(LineList, {
        id: "collab",
        label: "Collaborators",
        labelFa: "همکاران",
        values: pulseRackCollaborators,
        placeholder: "Name — Role",
        onChange: () => undefined,
      }),
    );

    expect(html).not.toContain("[object Object]");
    expect(html).toContain('value="Amir Sarani — Hardware"');
    expect(html).toContain('value="Navid Karimi — Firmware"');
  });
});
