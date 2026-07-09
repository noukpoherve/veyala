import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Download, FileText, RefreshCw } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { cvSchema } from "@/lib/cv-schema";
import { parseTemplateDefinition } from "@/lib/templates/definition";
import { renderCVHtml } from "@/lib/pdf/render-html";
import { generateCV, GenerationError } from "@/lib/generate-cv";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
          {cv.docxUrl ? (
            <Button asChild variant="gradient">
              <a href={cv.docxUrl} download>
                <Download />
                Télécharger Word
              </a>
            </Button>
          ) : null}
          {cv.pdfUrl ? (
            <Button asChild>
              <a href={cv.pdfUrl} download>
                <FileText />
                Télécharger PDF
              </a>
            </Button>
          ) : null}
          <form action={regenerate}>
            <Button type="submit" variant="outline">
              <RefreshCw />
              Régénérer (1 crédit)
            </Button>
          </form>
        </div>
      </header>

      <section aria-label="Aperçu du CV" className="overflow-hidden rounded-xl border shadow-sm">
        <iframe
          srcDoc={previewHtml}
          title={`Aperçu du CV — ${cv.jobTitle}`}
          className="h-[1188px] w-full bg-white"
          sandbox=""
        />
      </section>
    </article>
  );
}
