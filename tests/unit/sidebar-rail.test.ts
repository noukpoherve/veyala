import { describe, expect, it } from "vitest";
import { parseCV } from "@/lib/cv-schema";
import { sidebarFillPng } from "@/lib/docx/sidebar-fill-png";
import { renderCVHtml } from "@/lib/pdf/render-html";
import { OFFICIAL_TEMPLATES } from "@/lib/templates/official";

const cv = parseCV({
  identity: { fullName: "Ada Lovelace" },
  contact: { email: "ada@example.com" },
  summary: "Mathématicienne.",
  experiences: [
    {
      title: "Analyste",
      company: "London",
      bullets: ["Notes on the Analytical Engine."],
    },
  ],
  skills: [{ category: "Langages", items: ["Ada", "Mathématiques"] }],
  softSkills: ["Rigueur"],
  languages: [{ name: "Anglais", level: "Natif" }],
});

function pngSize(buf: Buffer): { width: number; height: number } {
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

describe("sidebar rail (HTML / PDF)", () => {
  it("applies full-bleed rail and repeating column gaps on every official sidebar template", () => {
    const sidebarTemplates = OFFICIAL_TEMPLATES.filter(
      (t) => t.definition.layout === "sidebar-left"
    );
    expect(sidebarTemplates.length).toBeGreaterThanOrEqual(3);

    for (const template of sidebarTemplates) {
      const html = renderCVHtml(cv, template.definition);
      expect(html).toContain("@page { size: A4; margin: 0; }");
      expect(html).not.toContain("@page :first");
      expect(html).toContain('class="sidebar-rail"');
      expect(html).toContain("position: fixed");
      expect(html).toContain("height: 297mm");
      expect(html).toContain("table-header-group");
      expect(html).toContain('class="col-flow"');
      expect(html).toContain('class="page-gap"');
    }
  });

  it("insets every page of the single-column template with @page margins, not a table flow", () => {
    const single = OFFICIAL_TEMPLATES.find((t) => t.definition.layout === "single-column");
    expect(single).toBeDefined();
    const html = renderCVHtml(cv, single!.definition);
    expect(html).not.toContain("sidebar-rail");
    expect(html).not.toContain('class="col-flow"');
    expect(html).toContain("@page { size: A4; margin: 12mm 14mm; }");
  });

  it("applies the same rail and page gaps on a custom atelier sidebar definition", () => {
    const horizon = OFFICIAL_TEMPLATES.find((t) => t.slug === "horizon-bleu-nuit");
    expect(horizon).toBeDefined();
    if (!horizon) return;
    const custom = {
      ...horizon.definition,
      namePlacement: "sidebar" as const,
      skillsStyle: "list" as const,
      colors: { ...horizon.definition.colors, sidebar: ["#032b44"] },
      sidebarSections: [
        "contact",
        "summary",
        "skills",
      ] as typeof horizon.definition.sidebarSections,
      mainSections: ["experience", "education"] as typeof horizon.definition.mainSections,
    };
    const html = renderCVHtml(cv, custom);
    expect(html).toContain("@page { size: A4; margin: 0; }");
    expect(html).not.toContain("@page :first");
    expect(html).toContain('class="sidebar-rail"');
    expect(html).toContain('class="col-flow"');
    expect(html).toContain('class="page-gap"');
    expect(html).toContain("table-header-group");
    expect(html).toContain("Rigueur");
    expect(html).toContain("Soft skills");
  });
});

describe("sidebarFillPng", () => {
  it("encodes a 1x1 PNG for a solid color", () => {
    const png = sidebarFillPng(["#16324f"]);
    expect(
      png.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    ).toBe(true);
    expect(pngSize(png)).toEqual({ width: 1, height: 1 });
  });

  it("encodes a vertical strip for a gradient", () => {
    const png = sidebarFillPng(["#5491c7", "#a03e50"]);
    expect(pngSize(png)).toEqual({ width: 1, height: 297 });
  });
});
