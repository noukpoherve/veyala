import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, FileText, Mail, PenLine } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { cvSchema } from "@/lib/cv-schema";
import {
  resolveDefinition,
  parseStyleOverride,
  parseTemplateDefinition,
} from "@/lib/templates/definition";
import { renderCVHtml } from "@/lib/pdf/render-html";
import { renderCoverLetterHtml } from "@/lib/pdf/render-letter";
import { parseMatchBreakdown } from "@/lib/match-score";
import { exportFilename, withDownloadFilename } from "@/lib/export-filename";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MatchReport } from "@/components/generate/match-report";
import { PrintPreview } from "@/components/cv/print-preview";
import { BackLink } from "@/components/ui/back-link";
import { RegenerateForm } from "./regenerate-form";

export const metadata: Metadata = { title: "Aperçu du CV" };

export default async function CvDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  const cv = await db.generatedCV.findUnique({
    where: { id: params.id },
    include: { template: true },
  });
  if (!cv || cv.userId !== session!.user.id) notFound();

  const data = cvSchema.parse(cv.tailoredData);
  const definition = resolveDefinition(parseTemplateDefinition(cv.template.definition), {
    override: parseStyleOverride(cv.styleOverride),
    photoUrl: data.identity.photoUrl,
  });
  const previewHtml = renderCVHtml(data, definition);
  const letterHtml = cv.coverLetter
    ? renderCoverLetterHtml(data, { body: cv.coverLetter, jobTitle: cv.jobTitle }, definition)
    : null;
  const matchBreakdown = parseMatchBreakdown(cv.matchBreakdown);
  const fullName = data.identity.fullName;
  const cvDocxName = exportFilename("cv", fullName, "docx");
  const cvPdfName = exportFilename("cv", fullName, "pdf");
  const letterDocxName = exportFilename("letter", fullName, "docx");
  const letterPdfName = exportFilename("letter", fullName, "pdf");

  return (
    <article className="mx-auto max-w-4xl space-y-6">
      <nav aria-label="Fil d'Ariane">
        <BackLink href="/dashboard">Retour au tableau de bord</BackLink>
      </nav>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-bold">{cv.jobTitle}</h1>
          <p className="text-sm text-muted-foreground">
            Template « {cv.template.name} » ·{" "}
            {new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short" }).format(
              cv.createdAt
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            {cv.universe === "CAMPUS_FRANCE" ? (
              <Badge variant="secondary">Campus France</Badge>
            ) : null}
            <Badge variant="secondary">
              Source : {cv.jobSource === "texte collé" ? "texte collé" : cv.jobSource}
            </Badge>
            {cv.matchScoreBefore != null && cv.matchScoreAfter != null ? (
              <Badge>
                {cv.universe === "CAMPUS_FRANCE" ? "Cohérence" : "Matching"} {cv.matchScoreBefore}%
                → {cv.matchScoreAfter}%
                {cv.matchScoreAfter - cv.matchScoreBefore >= 0
                  ? ` (+${cv.matchScoreAfter - cv.matchScoreBefore})`
                  : ` (${cv.matchScoreAfter - cv.matchScoreBefore})`}
              </Badge>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="gradient">
            <Link href={`/cv/${cv.id}/edit`}>
              <PenLine />
              Modifier dans l&apos;éditeur
            </Link>
          </Button>
          {cv.universe === "EMPLOYMENT" ? <RegenerateForm cvId={cv.id} /> : null}
        </div>
      </header>

      {matchBreakdown ? (
        <MatchReport
          breakdown={matchBreakdown}
          title={
            cv.universe === "CAMPUS_FRANCE"
              ? "Bilan de cohérence Campus France"
              : "Bilan matching ATS"
          }
        />
      ) : null}

      <section aria-labelledby="cv-title" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="cv-title" className="flex items-center gap-2 font-display text-lg font-semibold">
            <FileText className="size-5 text-primary" aria-hidden />
            {cv.universe === "CAMPUS_FRANCE" ? "CV académique" : "CV optimisé"}
          </h2>
          <div className="flex gap-2">
            {cv.docxUrl ? (
              <Button asChild size="sm">
                <a href={withDownloadFilename(cv.docxUrl, cvDocxName)} download={cvDocxName}>
                  <Download />
                  Word (.docx)
                </a>
              </Button>
            ) : null}
            {cv.pdfUrl ? (
              <Button asChild size="sm" variant="outline">
                <a href={withDownloadFilename(cv.pdfUrl, cvPdfName)} download={cvPdfName}>
                  <Download />
                  PDF
                </a>
              </Button>
            ) : null}
          </div>
        </div>
        <PrintPreview
          srcDoc={previewHtml}
          title={`Aperçu du CV — ${cv.jobTitle}`}
          className="rounded-xl border shadow-sm"
        />
      </section>

      {letterHtml ? (
        <section aria-labelledby="letter-title" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2
              id="letter-title"
              className="flex items-center gap-2 font-display text-lg font-semibold"
            >
              <Mail className="size-5 text-primary" aria-hidden />
              Lettre de motivation
            </h2>
            <div className="flex gap-2">
              {cv.coverLetterDocxUrl ? (
                <Button asChild size="sm">
                  <a
                    href={withDownloadFilename(cv.coverLetterDocxUrl, letterDocxName)}
                    download={letterDocxName}
                  >
                    <Download />
                    Word (.docx)
                  </a>
                </Button>
              ) : null}
              {cv.coverLetterPdfUrl ? (
                <Button asChild size="sm" variant="outline">
                  <a
                    href={withDownloadFilename(cv.coverLetterPdfUrl, letterPdfName)}
                    download={letterPdfName}
                  >
                    <Download />
                    PDF
                  </a>
                </Button>
              ) : null}
            </div>
          </div>
          <PrintPreview
            srcDoc={letterHtml}
            title={`Lettre de motivation — ${cv.jobTitle}`}
            className="rounded-xl border shadow-sm"
          />
        </section>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lettre de motivation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Ce CV a été généré avant l&apos;ajout des lettres de motivation. Régénérez-le pour en
              obtenir une, ou rédigez-la dans l&apos;éditeur.
            </p>
          </CardContent>
        </Card>
      )}
    </article>
  );
}
