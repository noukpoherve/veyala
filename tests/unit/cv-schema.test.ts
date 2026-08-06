import { describe, expect, it } from "vitest";
import { cvForLLM, cvSchema, parseCV } from "@/lib/cv-schema";

const minimalCv = {
  identity: { fullName: "Ada Lovelace" },
  contact: {},
};

describe("cvSchema", () => {
  it("fills every optional field with safe defaults", () => {
    const parsed = cvSchema.parse(minimalCv);
    expect(parsed.identity.headline).toBe("");
    expect(parsed.summary).toBe("");
    expect(parsed.experiences).toEqual([]);
    expect(parsed.education).toEqual([]);
    expect(parsed.certifications).toEqual([]);
    expect(parsed.skills).toEqual([]);
    expect(parsed.languages).toEqual([]);
    expect(parsed.interests).toEqual([]);
    expect(parsed.contact.links).toEqual([]);
  });

  it("preserves certifications", () => {
    const parsed = cvSchema.parse({
      ...minimalCv,
      certifications: [
        {
          name: "AWS SAA",
          issuer: "Amazon",
          dates: "2024",
          url: "https://aws.amazon.com/verify/x",
          credentialId: "ABC",
        },
      ],
    });
    expect(parsed.certifications[0]?.name).toBe("AWS SAA");
    expect(parsed.certifications[0]?.url).toBe("https://aws.amazon.com/verify/x");
  });

  it("rejects a CV without a full name", () => {
    expect(() => cvSchema.parse({ identity: { fullName: "" }, contact: {} })).toThrow();
    expect(() => cvSchema.parse({ contact: {} })).toThrow();
  });

  it("preserves nested experience content and defaults its blanks", () => {
    const parsed = cvSchema.parse({
      ...minimalCv,
      experiences: [{ title: "Développeuse", bullets: ["A fait X"] }],
    });
    expect(parsed.experiences[0]?.title).toBe("Développeuse");
    expect(parsed.experiences[0]?.bullets).toEqual(["A fait X"]);
    expect(parsed.experiences[0]?.company).toBe("");
    expect(parsed.experiences[0]?.companyUrl).toBe("");
    expect(parsed.experiences[0]?.stack).toEqual([]);
    expect(parsed.experiences[0]?.links).toEqual([]);
  });

  it("preserves experience companyUrl and reference links", () => {
    const parsed = cvSchema.parse({
      ...minimalCv,
      experiences: [
        {
          title: "Dev",
          company: "Acme",
          companyUrl: "https://acme.example",
          links: [{ label: "Extension", url: "https://marketplace.example/x" }],
        },
      ],
    });
    expect(parsed.experiences[0]?.companyUrl).toBe("https://acme.example");
    expect(parsed.experiences[0]?.links).toEqual([
      { label: "Extension", url: "https://marketplace.example/x" },
    ]);
  });

  it("parseCV mirrors cvSchema.parse", () => {
    expect(parseCV(minimalCv).identity.fullName).toBe("Ada Lovelace");
    expect(() => parseCV({})).toThrow();
  });

  it("cvForLLM strips the photo without touching the rest", () => {
    const cv = cvSchema.parse({
      identity: { fullName: "Ada", photoUrl: "data:image/png;base64,xxxx" },
      contact: {},
      summary: "Pionnière",
    });
    const light = cvForLLM(cv);
    expect(light.identity.photoUrl).toBe("");
    expect(light.summary).toBe("Pionnière");
    expect(cv.identity.photoUrl).not.toBe("");
  });

  it("rejects remote http photo URLs (SSRF)", () => {
    expect(() =>
      cvSchema.parse({
        identity: { fullName: "Ada", photoUrl: "https://evil.example/x.png" },
        contact: {},
      })
    ).toThrow();
  });
});
