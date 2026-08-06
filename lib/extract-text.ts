import "server-only";

export const ALLOWED_CV_TYPES: Record<string, "pdf" | "docx"> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 Mo

/** PDF magic (`%PDF`) or ZIP/DOCX (`PK`). */
export function sniffCvKind(buffer: Buffer): "pdf" | "docx" | null {
  if (buffer.length >= 5 && buffer.subarray(0, 5).toString("ascii") === "%PDF-") return "pdf";
  // DOCX is a ZIP package; reject bare PDFs mislabeled as docx via extension alone.
  if (buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b) {
    // Prefer OLE/OOXML: look for `[Content_Types].xml` or `word/` in the first chunk.
    const head = buffer.subarray(0, Math.min(buffer.length, 8_000)).toString("latin1");
    if (head.includes("word/") || head.includes("[Content_Types].xml")) return "docx";
  }
  return null;
}

/** Resolves PDF/DOCX from Content-Type, filename, then magic bytes. */
export function resolveCvMime(
  buffer: Buffer,
  declaredMime: string,
  filename = ""
): { mime: string; kind: "pdf" | "docx" } | null {
  const declared = ALLOWED_CV_TYPES[declaredMime];
  if (declared) return { mime: declaredMime, kind: declared };

  const lower = filename.toLowerCase();
  if (lower.endsWith(".pdf") && sniffCvKind(buffer) === "pdf") {
    return { mime: "application/pdf", kind: "pdf" };
  }
  if (lower.endsWith(".docx") && sniffCvKind(buffer) === "docx") {
    return {
      mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      kind: "docx",
    };
  }

  const sniffed = sniffCvKind(buffer);
  if (sniffed === "pdf") return { mime: "application/pdf", kind: "pdf" };
  if (sniffed === "docx") {
    return {
      mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      kind: "docx",
    };
  }
  return null;
}

/** Extracts raw text from a PDF or DOCX resume. */
export async function extractText(buffer: Buffer, mimeType: string): Promise<string> {
  const kind = ALLOWED_CV_TYPES[mimeType] ?? sniffCvKind(buffer);
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
