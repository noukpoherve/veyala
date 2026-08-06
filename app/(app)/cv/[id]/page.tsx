import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, FileText, Mail, PenLine } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MatchReport } from "@/components/generate/match-report";
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

  return (
    <article className="mx-auto max-w-4xl space-y-6">
      <nav aria-label="Fil d'Ariane">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Retour au tableau de bord
        </Link>
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
            <Badge variant="secondary">
              Source : {cv.jobSource === "texte collé" ? "texte collé" : cv.jobSource}
            </Badge>
            {cv.matchScoreBefore != null && cv.matchScoreAfter != null ? (
              <Badge>
                Matching {cv.matchScoreBefore}% → {cv.matchScoreAfter}%
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
          <RegenerateForm cvId={cv.id} />
        </div>
      </header>

      {matchBreakdown ? <MatchReport breakdown={matchBreakdown} /> : null}

      <section aria-labelledby="cv-title" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="cv-title" className="flex items-center gap-2 font-display text-lg font-semibold">
            <FileText className="size-5 text-primary" aria-hidden />
            CV optimisé
          </h2>
          <div className="flex gap-2">
            {cv.docxUrl ? (
              <Button asChild size="sm">
                <a href={cv.docxUrl} download>
                  <Download />
                  Word (.docx)
                </a>
              </Button>
            ) : null}
            {cv.pdfUrl ? (
              <Button asChild size="sm" variant="outline">
                <a href={cv.pdfUrl} download>
                  <Download />
                  PDF
                </a>
              </Button>
            ) : null}
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border shadow-sm">
          <iframe
            srcDoc={previewHtml}
            title={`Aperçu du CV — ${cv.jobTitle}`}
            className="h-[1188px] w-full bg-white"
            sandbox=""
          />
        </div>
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
                  <a href={cv.coverLetterDocxUrl} download>
                    <Download />
                    Word (.docx)
                  </a>
                </Button>
              ) : null}
              {cv.coverLetterPdfUrl ? (
                <Button asChild size="sm" variant="outline">
                  <a href={cv.coverLetterPdfUrl} download>
                    <Download />
                    PDF
                  </a>
                </Button>
              ) : null}
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border shadow-sm">
            <iframe
              srcDoc={letterHtml}
              title={`Lettre de motivation — ${cv.jobTitle}`}
              className="h-[1188px] w-full bg-white"
              sandbox=""
            />
          </div>
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
