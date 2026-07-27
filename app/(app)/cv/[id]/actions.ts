"use server";

import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateCV } from "@/lib/generate-cv";

function isNextRedirect(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    String((error as { digest: string }).digest).startsWith("NEXT_REDIRECT")
  );
}

/** Regenerates a CV from its stored job text (debits 1 credit). */
export async function regenerateCv(cvId: string) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const source = await db.generatedCV.findUnique({ where: { id: cvId } });
  if (!source || source.userId !== session.user.id) notFound();

  try {
    const next = await generateCV({
      userId: session.user.id,
      jobText: source.jobText,
      templateId: source.templateId,
      targetTitle: source.jobTitle,
    });
    redirect(`/cv/${next.id}`);
  } catch (e) {
    // `redirect()` throws — must not be turned into an error page.
    if (isNextRedirect(e)) throw e;
    redirect(`/erreur?reason=regenerate&back=${encodeURIComponent(`/cv/${cvId}`)}`);
  }
}
