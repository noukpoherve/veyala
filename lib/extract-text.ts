import "server-only";

export const ALLOWED_CV_TYPES: Record<string, "pdf" | "docx"> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 Mo

/** Extracts raw text from a PDF or DOCX resume. */
export async function extractText(buffer: Buffer, mimeType: string): Promise<string> {
  const kind = ALLOWED_CV_TYPES[mimeType];
  if (!kind) throw new Error("Format non supporté : envoyez un PDF ou un DOCX.");

  if (kind === "pdf") {
    // Import the internal module to skip pdf-parse's demo-mode entry point.
    const { default: pdfParse } = await import("pdf-parse/lib/pdf-parse.js");
    const result = await pdfParse(buffer);
    return normalize(result.text);
  }

  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return normalize(result.value);
}

function normalize(text: string): string {
  const clean = text
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (clean.length < 80) {
    throw new Error(
      "Impossible d'extraire assez de texte de ce fichier (scan ou document vide ?)."
    );
  }
  // Enough for a dense multi-page resume while staying within free-tier
  // token-per-minute quotas at structuring time.
  return clean.slice(0, 14000);
}
