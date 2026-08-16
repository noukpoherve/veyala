import { Download } from "lucide-react";
import { withDownloadFilename } from "@/lib/export-filename";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Word + PDF download pair — 3 near-identical copies before this (CV and
 * Letter on /cv/[id], plus the editor's version) had drifted: Word was the
 * primary button on /cv/[id] but outline in the editor. Standardized here on
 * Word=primary / PDF=outline everywhere (Word is the one people re-edit).
 */
export function ExportButtons({
  docxUrl,
  pdfUrl,
  docxName,
  pdfName,
  dirty = false,
  size = "sm",
}: {
  docxUrl?: string | null;
  pdfUrl?: string | null;
  docxName: string;
  pdfName: string;
  /** Downloads point at the last saved export — disable while there are unsaved edits. */
  dirty?: boolean;
  size?: "sm" | "default";
}) {
  if (!docxUrl && !pdfUrl) return null;

  return (
    <div
      className="flex items-center gap-2"
      title={dirty ? "Enregistrez pour télécharger votre dernière version." : undefined}
    >
      {docxUrl ? (
        <Button asChild size={size} aria-disabled={dirty}>
          <a
            href={dirty ? undefined : withDownloadFilename(docxUrl, docxName)}
            download={docxName}
            className={cn(dirty && "pointer-events-none opacity-50")}
          >
            <Download className="size-4" aria-hidden />
            Word (.docx)
          </a>
        </Button>
      ) : null}
      {pdfUrl ? (
        <Button asChild size={size} variant="outline" aria-disabled={dirty}>
          <a
            href={dirty ? undefined : withDownloadFilename(pdfUrl, pdfName)}
            download={pdfName}
            className={cn(dirty && "pointer-events-none opacity-50")}
          >
            <Download className="size-4" aria-hidden />
            PDF
          </a>
        </Button>
      ) : null}
    </div>
  );
}
