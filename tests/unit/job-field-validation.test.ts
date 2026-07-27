import { describe, expect, it } from "vitest";
import {
  validateCvLanguage,
  validateInstructions,
  validateJobText,
  validateJobTitle,
} from "@/lib/job-field-validation";

describe("validateCvLanguage", () => {
  it("allows empty and known languages", () => {
    expect(validateCvLanguage("")).toBeNull();
    expect(validateCvLanguage("français")).toBeNull();
    expect(validateCvLanguage("English")).toBeNull();
    expect(validateCvLanguage("FR")).toBeNull();
  });

  it("rejects gibberish", () => {
    expect(validateCvLanguage("lkfdnlkgnfdlkrnlak")).toMatch(/non reconnue/i);
  });
});

describe("validateJobTitle", () => {
  it("allows empty and real titles", () => {
    expect(validateJobTitle("")).toBeNull();
    expect(validateJobTitle("Développeur Full Stack")).toBeNull();
    expect(validateJobTitle("Data Engineer")).toBeNull();
  });

  it("rejects keyboard smash", () => {
    expect(validateJobTitle("lkfdnlkgnfdlkrnlak")).toMatch(/invalide/i);
  });
});

describe("validateInstructions", () => {
  it("allows empty and real notes", () => {
    expect(validateInstructions("")).toBeNull();
    expect(validateInstructions("Insister sur React et TypeScript")).toBeNull();
  });

  it("rejects keyboard smash", () => {
    expect(validateInstructions("lkfdnlkgnfdlkrnlak")).toMatch(/invalide/i);
  });
});

describe("validateJobText", () => {
  it("rejects tiny or smash pastes", () => {
    expect(validateJobText("hello")).toMatch(/court/i);
    expect(
      validateJobText("1111 2222 3333 4444 5555 6666 7777 8888 9999 0000 1111 2222 3333 4444 5555")
    ).toMatch(/lisible/i);
  });

  it("accepts a short but real offer blurb", () => {
    const text = `
Nous recherchons un développeur React expérimenté pour rejoindre notre équipe produit.
Vous travaillerez avec TypeScript, Next.js et PostgreSQL au quotidien.
`;
    expect(validateJobText(text)).toBeNull();
  });
});
