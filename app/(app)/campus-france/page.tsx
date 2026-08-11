import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPublicTemplates } from "@/lib/cached";
import { getBalance } from "@/lib/credits";
import { mergeTemplateLists } from "@/lib/templates/merge";
import { parseTemplateDefinition } from "@/lib/templates/definition";
import type { TemplateOption } from "@/components/generate/generate-form";
import { CampusFranceForm } from "@/components/campus-france/campus-france-form";
import { Alert } from "@/components/ui/alert";

export const metadata: Metadata = { title: "Campus France" };

export default async function CampusFrancePage() {
  const session = await auth();
  const userId = session!.user.id;

  const [profile, balance, publicTemplates, ownTemplates] = await Promise.all([
    db.baseProfile.findUnique({ where: { userId }, select: { userId: true } }),
    getBalance(userId),
    getPublicTemplates(),
    db.template.findMany({
      where: { ownerId: userId, status: { not: "REJECTED" } },
      orderBy: { createdAt: "asc" },
    }),
  ]);
  const templates = mergeTemplateLists(publicTemplates, ownTemplates);

  const templateOptions: TemplateOption[] = templates.map((t) => {
    const def = parseTemplateDefinition(t.definition);
    return {
      id: t.id,
      name: t.name,
      layout: def.layout,
      colors: def.colors.sidebar,
      band: def.colors.band,
      isOwn: t.ownerId === userId,
    };
  });

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-1">
        <h1 className="font-display text-2xl font-bold">Dossier Campus France</h1>
        <p className="text-sm text-muted-foreground">
          1. Analysez la formation : le système propose un projet d&apos;études et un projet
          professionnel adaptés. 2. Validez / ajustez. 3. Générez (1 crédit) la lettre et le CV.
        </p>
      </header>

      {!profile ? (
        <Alert
          variant="warning"
          title="CV de base manquant"
          action={
            <Link href="/profile" className="font-medium">
              Importer mon CV de base
            </Link>
          }
        >
          C&apos;est la source de vérité du dossier — aucune invention par l&apos;IA.
        </Alert>
      ) : null}

      <CampusFranceForm templates={templateOptions} balance={balance} disabled={!profile} />
    </article>
  );
}
