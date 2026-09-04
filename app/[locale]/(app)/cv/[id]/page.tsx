import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FileText, Mail, PenLine } from "lucide-react";
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
import { exportFilename } from "@/lib/export-filename";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MatchReport } from "@/components/generate/match-report";
import { PrintPreview } from "@/components/cv/print-preview";
import { ExportButtons } from "@/components/cv/export-buttons";
import { BackLink } from "@/components/ui/back-link";
import { PageHeader } from "@/components/ui/page-header";
import { getLocale } from "@/i18n/get-locale";
import { getMessages } from "@/i18n/messages";
import { formatDateTime } from "@/i18n/format";
import { Link } from "@/i18n/navigation";
import { RegenerateForm } from "./regenerate-form";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getMessages(getLocale()).pages.cvDetail.optimizedCv };
}

export default async function CvDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  const locale = getLocale();
  const m = getMessages(locale);
  const t = m.pages.cvDetail;
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
  const previewHtml = renderCVHtml(data, definition, locale);
  const letterHtml = cv.coverLetter
    ? renderCoverLetterHtml(
        data,
        { body: cv.coverLetter, jobTitle: cv.jobTitle },
        definition,
        locale
      )
    : null;
  const matchBreakdown = parseMatchBreakdown(cv.matchBreakdown);
  const fullName = data.identity.fullName;
  const cvDocxName = exportFilename("cv", fullName, "docx");
  const cvPdfName = exportFilename("cv", fullName, "pdf");
  const letterDocxName = exportFilename("letter", fullName, "docx");
  const letterPdfName = exportFilename("letter", fullName, "pdf");
  const sourceLabel = cv.jobSource === "texte collé" ? t.pastedText : cv.jobSource;

  return (
    <article className="mx-auto max-w-4xl space-y-6">
      <nav aria-label={t.breadcrumbAria}>
        <BackLink href="/dashboard">{t.backToDashboard}</BackLink>
      </nav>

      <PageHeader
        title={cv.jobTitle}
        description={
          <>
            <p className="text-sm text-muted-foreground">
              {t.templateMeta(cv.template.name, formatDateTime(cv.createdAt, locale))}
            </p>
            <div className="mt-1 flex flex-wrap gap-2">
              {cv.universe === "CAMPUS_FRANCE" ? (
                <Badge variant="secondary">Campus France</Badge>
              ) : null}
              <Badge variant="secondary">{t.source(sourceLabel)}</Badge>
              {cv.matchScoreBefore != null && cv.matchScoreAfter != null ? (
                <Badge>
                  {cv.universe === "CAMPUS_FRANCE"
                    ? m.pages.scores.coherence
                    : m.pages.scores.matching}{" "}
                  {cv.matchScoreBefore}% → {cv.matchScoreAfter}%
                  {cv.matchScoreAfter - cv.matchScoreBefore >= 0
                    ? ` (+${cv.matchScoreAfter - cv.matchScoreBefore})`
                    : ` (${cv.matchScoreAfter - cv.matchScoreBefore})`}
                </Badge>
              ) : null}
            </div>
          </>
        }
        actions={
          <>
            <Button asChild variant="gradient">
              <Link href={`/cv/${cv.id}/edit`} data-tour="edit">
                <PenLine />
                {t.editInEditor}
              </Link>
            </Button>
            {cv.universe === "EMPLOYMENT" ? <RegenerateForm cvId={cv.id} /> : null}
          </>
        }
      />

      {matchBreakdown ? (
        <MatchReport
          breakdown={matchBreakdown}
          title={cv.universe === "CAMPUS_FRANCE" ? t.campusReportTitle : t.atsReportTitle}
        />
      ) : null}

      <section aria-labelledby="cv-title" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="cv-title" className="flex items-center gap-2 font-display text-lg font-semibold">
            <FileText className="size-5 text-primary" aria-hidden />
            {cv.universe === "CAMPUS_FRANCE" ? t.academicCv : t.optimizedCv}
          </h2>
          <ExportButtons
            docxUrl={cv.docxUrl}
            pdfUrl={cv.pdfUrl}
            docxName={cvDocxName}
            pdfName={cvPdfName}
          />
        </div>
        <PrintPreview
          srcDoc={previewHtml}
          title={t.previewTitle(cv.jobTitle)}
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
              {m.app.coverLetter}
            </h2>
            <ExportButtons
              docxUrl={cv.coverLetterDocxUrl}
              pdfUrl={cv.coverLetterPdfUrl}
              docxName={letterDocxName}
              pdfName={letterPdfName}
            />
          </div>
          <PrintPreview
            srcDoc={letterHtml}
            title={t.letterPreviewTitle(cv.jobTitle)}
            className="rounded-xl border shadow-sm"
          />
        </section>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{m.app.coverLetter}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{t.noLetterBody}</p>
          </CardContent>
        </Card>
      )}
    </article>
  );
}
