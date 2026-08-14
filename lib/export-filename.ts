/** Safe ASCII token for a download basename (no path, no spaces). */
export function slugifyFilenamePart(text: string): string {
  return (
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9-]+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 40) || ""
  );
}

/** `Prenom_Nom` from a full name (`Jean Dupont` → `Jean_Dupont`). */
export function personFileSlug(fullName: string): string {
  const parts = slugifyFilenamePart(fullName).split("_").filter(Boolean);
  if (parts.length === 0) return "Candidat";
  if (parts.length === 1) return parts[0]!;
  return `${parts[0]}_${parts[parts.length - 1]}`;
}

export type ExportKind = "cv" | "letter";
export type ExportExt = "pdf" | "docx";

export function exportFilename(kind: ExportKind, fullName: string, ext: ExportExt): string {
  const person = personFileSlug(fullName);
  const stem = kind === "cv" ? `CV_${person}` : `lettre_motivation_${person}`;
  return `${stem}.${ext}`;
}

const DOWNLOAD_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]{0,118}\.(pdf|docx)$/;

/** Rejects header-injection / path traversal in a `?filename=` query. */
export function sanitizeDownloadFilename(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const value = raw.trim();
  if (!DOWNLOAD_NAME.test(value)) return null;
  return value;
}

/** Appends a sanitized filename query so `/api/files` can set Content-Disposition. */
export function withDownloadFilename(url: string, filename: string): string {
  const safe = sanitizeDownloadFilename(filename);
  if (!safe) return url;
  const join = url.includes("?") ? "&" : "?";
  return `${url}${join}filename=${encodeURIComponent(safe)}`;
}
