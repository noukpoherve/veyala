import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolveCvMime, sniffCvKind } from "@/lib/extract-text";
import { coerceImportedCV } from "@/lib/import-cv";
import { cvSchema } from "@/lib/cv-schema";
import {
  applyStyleOverride,
  resolveDefinition,
  type TemplateDefinition,
} from "@/lib/templates/definition";

describe("resolveCvMime / sniffCvKind", () => {
  it("detects a real PDF by magic bytes even with an empty Content-Type", () => {
    const pdf = Buffer.from("%PDF-1.4\n%âãÏÓ\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");
    expect(sniffCvKind(pdf)).toBe("pdf");
    expect(resolveCvMime(pdf, "", "cv.pdf")).toEqual({
      mime: "application/pdf",
      kind: "pdf",
    });
    expect(resolveCvMime(pdf, "application/octet-stream", "resume")).toEqual({
      mime: "application/pdf",
      kind: "pdf",
    });
  });

  it("rejects non-CV binaries", () => {
    expect(sniffCvKind(Buffer.from("not a document"))).toBeNull();
    expect(resolveCvMime(Buffer.from("hello"), "", "notes.txt")).toBeNull();
  });
});

describe("coerceImportedCV", () => {
  it("strips remote photoUrl and empty LinkedIn-style links so Zod accepts the payload", () => {
    const coerced = coerceImportedCV({
      identity: { fullName: "Noukpo Herve", photoUrl: "https://evil.example/p.png" },
      contact: {
        email: "a@b.c",
        links: [
          { label: "LinkedIn", url: "" },
          { label: "GitHub", url: "https://github.com/x" },
          { label: "Site", url: "not-a-url" },
        ],
      },
      experiences: [{ title: "Dev", links: [{ label: "Demo", url: "" }] }],
      education: [{ degree: "Master" }],
      certifications: [
        { name: "AWS", issuer: "Amazon", url: "ftp://bad" },
        { name: "Scrum", url: "https://scrum.org/x" },
      ],
      skills: [{ category: "Langages", items: ["TypeScript"] }],
      languages: [{ name: "Français", level: "Natif" }],
    });
    const parsed = cvSchema.parse(coerced);
    expect(parsed.identity.photoUrl).toBe("");
    expect(parsed.contact.links).toEqual([{ label: "GitHub", url: "https://github.com/x" }]);
    expect(parsed.experiences[0]?.links).toEqual([]);
    expect(parsed.certifications).toEqual([
      { name: "AWS", issuer: "Amazon", dates: "", url: "", credentialId: "", included: true },
      {
        name: "Scrum",
        issuer: "",
        dates: "",
        url: "https://scrum.org/x",
        credentialId: "",
        included: true,
      },
    ]);
  });
});

describe("resolveDefinition / style override sections & chips", () => {
  const base: TemplateDefinition = {
    layout: "sidebar-left",
    colors: {
      sidebar: ["#1f3550"],
      sidebarText: "#ffffff",
      band: "#56a8dc",
      bandText: "#ffffff",
      heading: "#1f3550",
      body: "#555555",
      link: "#2563eb",
    },
    fonts: { heading: "Georgia", body: "Helvetica" },
    photo: false,
    photoShape: "square",
    skillsStyle: "bricks",
    chipStyle: "solid",
    sidebarDecor: true,
    headerStyle: "band",
    namePlacement: "main",
    datesStyle: "inline",
    sidebarSections: ["contact", "skills"],
    mainSections: ["summary", "experience", "education"],
    sidebarImageAsset: "assets/sidebar.png",
  };

  it("auto-enables photo when the CV has a portrait and the template hid it", () => {
    const def = resolveDefinition(base, { photoUrl: "data:image/jpeg;base64,xx" });
    expect(def.photo).toBe(true);
  });

  it("respects an explicit photo:false override", () => {
    const def = resolveDefinition(base, {
      photoUrl: "data:image/jpeg;base64,xx",
      override: { photo: false },
    });
    expect(def.photo).toBe(false);
  });

  it("replaces section order and applies chip / skills style overrides", () => {
    const def = applyStyleOverride(base, {
      mainSections: ["experience", "certifications", "summary"],
      sidebarSections: ["languages"],
      skillsStyle: "list",
      chipStyle: "ghost",
      chipText: "#112233",
      sidebarDecor: false,
    });
    expect(def.mainSections).toEqual(["experience", "certifications", "summary"]);
    expect(def.sidebarSections).toEqual(["languages"]);
    expect(def.skillsStyle).toBe("list");
    expect(def.chipStyle).toBe("ghost");
    expect(def.chipText).toBe("#112233");
    expect(def.sidebarDecor).toBe(false);
  });
});

describe("platform-generated PDF text extraction", () => {
  it("extracts enough text from a Chromium/Skia CV PDF", async () => {
    const path = "/Users/tnbsoftlab/Desktop/Stage/Cv/001_Noukpo_Herve.pdf";
    let buffer: Buffer;
    try {
      buffer = readFileSync(path);
    } catch {
      // File may be absent in CI — skip without failing the suite.
      return;
    }
    const { extractText } = await import("@/lib/extract-text");
    const text = await extractText(buffer, "application/pdf");
    expect(text.length).toBeGreaterThan(80);
    expect(text).toMatch(/Noukpo|Herve|Full Stack/i);
  });
});
