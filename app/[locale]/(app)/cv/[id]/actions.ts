"use server";

import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateCV } from "@/lib/generate-cv";
import { getLocale } from "@/i18n/get-locale";
import { redirectLocalized } from "@/i18n/redirect";
import { localizeHref } from "@/i18n/path";

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
  const locale = getLocale();
  const session = await auth();
  if (!session?.user) redirectLocalized("/login", locale);

  const source = await db.generatedCV.findUnique({ where: { id: cvId } });
  if (!source || source.userId !== session.user.id) notFound();

  try {
    const next = await generateCV({
      userId: session.user.id,
      jobText: source.jobText,
      templateId: source.templateId,
      targetTitle: source.jobTitle,
    });
    redirectLocalized(`/cv/${next.id}`, locale);
  } catch (e) {
    // `redirect()` throws — must not be turned into an error page.
    if (isNextRedirect(e)) throw e;
    const back = localizeHref(`/cv/${cvId}`, locale);
    redirectLocalized(`/erreur?reason=regenerate&back=${encodeURIComponent(back)}`, locale);
  }
}
