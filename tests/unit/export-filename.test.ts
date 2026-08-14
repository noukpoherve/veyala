import { describe, expect, it } from "vitest";
import {
  exportFilename,
  personFileSlug,
  sanitizeDownloadFilename,
  slugifyFilenamePart,
  withDownloadFilename,
} from "@/lib/export-filename";

describe("personFileSlug", () => {
  it("uses first and last tokens as Prenom_Nom", () => {
    expect(personFileSlug("Jean Dupont")).toBe("Jean_Dupont");
    expect(personFileSlug("Marie-Claire Leblanc")).toBe("Marie-Claire_Leblanc");
    expect(personFileSlug("Noukpo Hervé")).toBe("Noukpo_Herve");
  });

  it("keeps a single given name", () => {
    expect(personFileSlug("Ada")).toBe("Ada");
  });

  it("falls back when the name is empty or punctuation", () => {
    expect(personFileSlug("   ")).toBe("Candidat");
    expect(personFileSlug("***")).toBe("Candidat");
  });
});

describe("exportFilename", () => {
  it("builds CV_Prenom_Nom and lettre_motivation_Prenom_Nom", () => {
    expect(exportFilename("cv", "Jean Dupont", "pdf")).toBe("CV_Jean_Dupont.pdf");
    expect(exportFilename("cv", "Jean Dupont", "docx")).toBe("CV_Jean_Dupont.docx");
    expect(exportFilename("letter", "Jean Dupont", "pdf")).toBe(
      "lettre_motivation_Jean_Dupont.pdf"
    );
    expect(exportFilename("letter", "Jean Dupont", "docx")).toBe(
      "lettre_motivation_Jean_Dupont.docx"
    );
  });
});

describe("sanitizeDownloadFilename", () => {
  it("accepts generated names and rejects injection", () => {
    expect(sanitizeDownloadFilename("CV_Jean_Dupont.pdf")).toBe("CV_Jean_Dupont.pdf");
    expect(sanitizeDownloadFilename("lettre_motivation_Jean_Dupont.docx")).toBe(
      "lettre_motivation_Jean_Dupont.docx"
    );
    expect(sanitizeDownloadFilename("../secret.pdf")).toBeNull();
    expect(sanitizeDownloadFilename("a.pdf\r\nX: 1")).toBeNull();
    expect(sanitizeDownloadFilename("photo.png")).toBeNull();
  });
});

describe("withDownloadFilename", () => {
  it("appends a query string without breaking existing params", () => {
    expect(withDownloadFilename("/api/files/a.pdf", "CV_Ada.pdf")).toBe(
      "/api/files/a.pdf?filename=CV_Ada.pdf"
    );
    expect(withDownloadFilename("/api/files/a.pdf?x=1", "CV_Ada.pdf")).toBe(
      "/api/files/a.pdf?x=1&filename=CV_Ada.pdf"
    );
  });
});

describe("slugifyFilenamePart", () => {
  it("strips accents and punctuation", () => {
    expect(slugifyFilenamePart("Hévéa / Nord")).toBe("Hevea_Nord");
  });
});
