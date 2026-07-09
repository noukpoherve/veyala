import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { cvSchema } from "@/lib/cv-schema";
import { parseTemplateDefinition } from "@/lib/templates/definition";
import { CvEditor, type EditorTemplate } from "@/components/cv/cv-editor";

export const metadata: Metadata = { title: "Éditeur de CV" };

export default async function CvEditPage({ params }: { params: { id: string } }) {
  const session = await auth();
  const userId = session!.user.id;

  const cv = await db.generatedCV.findUnique({ where: { id: params.id } });
  if (!cv || cv.userId !== userId) notFound();

  const templates = await db.template.findMany({
    where: {
      OR: [{ isPublic: true, status: "APPROVED" }, { ownerId: userId, status: { not: "REJECTED" } }],
    },
    orderBy: { createdAt: "asc" },
  });

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
      templates={editorTemplates}
    />
  );
}
