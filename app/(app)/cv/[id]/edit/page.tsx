import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { cvSchema } from "@/lib/cv-schema";
import { getPublicTemplates } from "@/lib/cached";
import { mergeTemplateLists } from "@/lib/templates/merge";
import { parseStyleOverride, parseTemplateDefinition } from "@/lib/templates/definition";
import type { EditorTemplate } from "@/components/cv/cv-editor";
import { Skeleton } from "@/components/ui/skeleton";

// Heavy client editor: lazy-loaded so its chunk doesn't weigh on the shared bundle.
const CvEditor = dynamic(() => import("@/components/cv/cv-editor").then((mod) => mod.CvEditor), {
  loading: () => <Skeleton className="mx-auto h-[70vh] max-w-4xl rounded-2xl" />,
});

export const metadata: Metadata = { title: "Éditeur de CV" };

export default async function CvEditPage({ params }: { params: { id: string } }) {
  const session = await auth();
  const userId = session!.user.id;

  const cv = await db.generatedCV.findUnique({ where: { id: params.id } });
  if (!cv || cv.userId !== userId) notFound();

  const [publicTemplates, ownTemplates] = await Promise.all([
    getPublicTemplates(),
    db.template.findMany({
      where: { ownerId: userId, status: { not: "REJECTED" } },
      orderBy: { createdAt: "asc" },
    }),
  ]);
  const templates = mergeTemplateLists(publicTemplates, ownTemplates);

  const editorTemplates: EditorTemplate[] = templates.map((t) => ({
    id: t.id,
    name: t.name,
    definition: parseTemplateDefinition(t.definition),
  }));

  return (
    <CvEditor
      cvId={cv.id}
      jobTitle={cv.jobTitle}
      initialData={cvSchema.parse(cv.tailoredData)}
      initialLetter={cv.coverLetter}
      initialTemplateId={cv.templateId}
      initialStyleOverride={parseStyleOverride(cv.styleOverride)}
      templates={editorTemplates}
    />
  );
}
