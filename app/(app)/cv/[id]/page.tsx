import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Download, FileText, Mail, PenLine, RefreshCw } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { cvSchema } from "@/lib/cv-schema";
import { parseTemplateDefinition } from "@/lib/templates/definition";
import { renderCVHtml } from "@/lib/pdf/render-html";
import { renderCoverLetterHtml } from "@/lib/pdf/render-letter";
import { generateCV, GenerationError } from "@/lib/generate-cv";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Aperçu du CV" };

export default async function CvDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const session = await auth();
  const cv = await db.generatedCV.findUnique({
    where: { id: params.id },
    include: { template: true },
  });
  if (!cv || cv.userId !== session!.user.id) notFound();

  const data = cvSchema.parse(cv.tailoredData);
  const definition = parseTemplateDefinition(cv.template.definition);
  const previewHtml = renderCVHtml(data, definition);
  const letterHtml = cv.coverLetter
    ? renderCoverLetterHtml(data, { body: cv.coverLetter, jobTitle: cv.jobTitle }, definition)
    : null;

  async function regenerate() {
    "use server";
    const session = await auth();
    if (!session?.user) redirect("/login");
    const source = await db.generatedCV.findUnique({ where: { id: params.id } });
    if (!source || source.userId !== session.user.id) notFound();
    let newId: string;
    try {
      const next = await generateCV({
        userId: session.user.id,
        jobText: source.jobText,
        templateId: source.templateId,
        targetTitle: source.jobTitle,
      });
      newId = next.id;
    } catch (e) {
      const message = e instanceof GenerationError ? e.message : "La régénération a échoué.";
      redirect(`/cv/${params.id}?error=${encodeURIComponent(message)}`);
    }
    redirect(`/cv/${newId}`);
  }

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

      {searchParams.error ? (
        <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {searchParams.error}
        </p>
      ) : null}

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-bold">{cv.jobTitle}</h1>
          <p className="text-sm text-muted-foreground">
            Template « {cv.template.name} » ·{" "}
            {new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short" }).format(
              cv.createdAt
            )}
          </p>
          <Badge variant="secondary">
            Source : {cv.jobSource === "texte collé" ? "texte collé" : cv.jobSource}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="gradient">
            <Link href={`/cv/${cv.id}/edit`}>
              <PenLine />
              Modifier dans l&apos;éditeur
            </Link>
          </Button>
          <form action={regenerate}>
            <Button type="submit" variant="outline">
              <RefreshCw />
              Régénérer (1 crédit)
            </Button>
          </form>
        </div>
      </header>

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
