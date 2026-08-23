import { describe, expect, it } from "vitest";
import { parseCV } from "@/lib/cv-schema";
import { renderCVHtml } from "@/lib/pdf/render-html";
import { OFFICIAL_TEMPLATES } from "@/lib/templates/official";

const template = OFFICIAL_TEMPLATES.find((t) => t.definition.layout === "single-column")!;

const cv = parseCV({
  identity: { fullName: "Ada Lovelace" },
  contact: { email: "ada@example.com" },
  experiences: [
    { title: "Analyste", company: "London Bureau", bullets: ["Notes on the Engine."] },
    { title: "Assistante", company: "Hidden Co", bullets: ["Secret work."], included: false },
  ],
  projects: [
    { title: "Analytical Engine notes", bullets: ["Published translation with notes."] },
    { title: "Hidden side project", bullets: ["Not ready to show."], included: false },
  ],
  education: [
    { degree: "Self-taught mathematics", included: true },
    { degree: "Hidden diploma", included: false },
  ],
});

describe("experience/project visibility toggle and section ordering (HTML)", () => {
  it("hides items marked included: false, everywhere", () => {
    const html = renderCVHtml(cv, template.definition);
    expect(html).toContain("Analyste");
    expect(html).not.toContain("Assistante");
    expect(html).toContain("Analytical Engine notes");
    expect(html).not.toContain("Hidden side project");
    expect(html).toContain("Self-taught mathematics");
    expect(html).not.toContain("Hidden diploma");
  });

  it("always renders work experience before personal projects", () => {
    const html = renderCVHtml(cv, template.definition);
    const experienceIdx = html.indexOf("Analyste");
    const projectIdx = html.indexOf("Analytical Engine notes");
    expect(experienceIdx).toBeGreaterThan(-1);
    expect(projectIdx).toBeGreaterThan(experienceIdx);
  });

  it("omits the projects heading entirely when every project is hidden or absent", () => {
    const noVisibleProjects = parseCV({
      ...cv,
      projects: cv.projects.map((p) => ({ ...p, included: false })),
    });
    const html = renderCVHtml(noVisibleProjects, template.definition);
    expect(html).not.toContain("Projets personnels");
    expect(html).not.toContain("Hidden side project");
    expect(html).not.toContain("Analytical Engine notes");
  });

  it("shows the projects heading only when at least one project is visible", () => {
    const html = renderCVHtml(cv, template.definition);
    expect(html).toContain("Projets personnels");
  });

  it("makes the project name a clickable link on every official template", () => {
    const withUrl = parseCV({
      ...cv,
      projects: [
        {
          title: "Founder",
          company: "Veyala",
          companyUrl: "https://veyala.fr",
          bullets: ["Built an AI resume tool."],
        },
      ],
    });
    expect(OFFICIAL_TEMPLATES.length).toBeGreaterThanOrEqual(4);
    for (const official of OFFICIAL_TEMPLATES) {
      const html = renderCVHtml(withUrl, official.definition);
      expect(html).toContain('href="https://veyala.fr"');
      expect(html).toMatch(/<a href="https:\/\/veyala\.fr">Veyala<\/a>/);
    }
  });

  it("links the project title when a URL is set without a project name", () => {
    const withUrl = parseCV({
      ...cv,
      projects: [
        {
          title: "ConfidentialAI",
          companyUrl: "confidential-ai.example",
          bullets: ["Chrome extension for LLM data protection."],
        },
      ],
    });
    const html = renderCVHtml(withUrl, template.definition);
    expect(html).toContain('href="https://confidential-ai.example"');
    expect(html).toMatch(/<a href="https:\/\/confidential-ai\.example">ConfidentialAI<\/a>/);
  });
});
