import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBalance } from "@/lib/credits";
import { parseTemplateDefinition } from "@/lib/templates/definition";
import { GenerateForm, type TemplateOption } from "@/components/generate/generate-form";

export const metadata: Metadata = { title: "Générer un CV" };

export default async function GeneratePage() {
  const session = await auth();
  const userId = session!.user.id;

  const [profile, balance, templates] = await Promise.all([
    db.baseProfile.findUnique({ where: { userId }, select: { userId: true } }),
    getBalance(userId),
    db.template.findMany({
      where: {
        OR: [{ isPublic: true, status: "APPROVED" }, { ownerId: userId, status: { not: "REJECTED" } }],
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

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
        <h1 className="font-display text-2xl font-bold">Générer un CV adapté</h1>
        <p className="text-sm text-muted-foreground">
          Collez une offre d&apos;emploi : l&apos;IA adapte votre CV de base sans rien
          inventer. Coût : 1 crédit par génération.
        </p>
      </header>

      {!profile ? (
        <p
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"
        >
          <AlertTriangle className="size-4 shrink-0" aria-hidden />
          <span>
            Importez d&apos;abord votre CV de base dans{" "}
            <Link href="/profile" className="font-medium underline">
              Mon CV de base
            </Link>{" "}
            — c&apos;est la source de vérité de toutes les générations.
          </span>
        </p>
      ) : null}

      <GenerateForm templates={templateOptions} balance={balance} disabled={!profile} />
    </article>
  );
}
