import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPublicTemplates } from "@/lib/cached";
import { parseTemplateDefinition } from "@/lib/templates/definition";
import { TemplateSwatch } from "@/components/templates/template-swatch";
import { Skeleton } from "@/components/ui/skeleton";

// Import form (upload + vision extraction UI) is heavy and below the fold: lazy-loaded.
const TemplateImportForm = dynamic(
  () => import("@/components/templates/template-import-form").then((mod) => mod.TemplateImportForm),
  { loading: () => <Skeleton className="h-48 rounded-2xl" /> }
);
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Template, TemplateStatus } from "@prisma/client";

export const metadata: Metadata = { title: "Templates" };

const STATUS_BADGES: Partial<
  Record<TemplateStatus, { label: string; variant: "secondary" | "success" | "destructive" }>
> = {
  PENDING: { label: "En validation", variant: "secondary" },
  APPROVED: { label: "Approuvé", variant: "success" },
  REJECTED: { label: "Rejeté", variant: "destructive" },
};

function TemplateCard({ template, showStatus }: { template: Template; showStatus: boolean }) {
  const def = parseTemplateDefinition(template.definition);
  const badge = STATUS_BADGES[template.status];
  return (
    <Card>
      <CardContent className="space-y-2 p-4">
        <TemplateSwatch layout={def.layout} colors={def.colors.sidebar} band={def.colors.band} />
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-medium">{template.name}</h3>
          {showStatus && badge ? <Badge variant={badge.variant}>{badge.label}</Badge> : null}
        </div>
        <p className="text-xs text-muted-foreground">
          {def.layout === "sidebar-left" ? "Colonne latérale" : "Une colonne"} ·{" "}
          {template.ownerId ? "communautaire" : "officiel"}
        </p>
      </CardContent>
    </Card>
  );
}

export default async function TemplatesPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [publicTemplates, ownTemplates] = await Promise.all([
    getPublicTemplates(),
    db.template.findMany({ where: { ownerId: userId }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <article className="mx-auto max-w-4xl space-y-8">
      <header className="space-y-1">
        <h1 className="font-display text-2xl font-bold">Templates</h1>
        <p className="text-sm text-muted-foreground">
          Choisissez un template public ou proposez le vôtre à partir d&apos;une image de référence.
        </p>
      </header>

      <section aria-labelledby="gallery-title" className="space-y-4">
        <h2 id="gallery-title" className="font-display text-lg font-semibold">
          Galerie publique
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {publicTemplates.map((t) => (
            <TemplateCard key={t.id} template={t} showStatus={false} />
          ))}
        </div>
      </section>

      {ownTemplates.length > 0 ? (
        <section aria-labelledby="own-title" className="space-y-4">
          <h2 id="own-title" className="font-display text-lg font-semibold">
            Mes templates
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ownTemplates.map((t) => (
              <TemplateCard key={t.id} template={t} showStatus />
            ))}
          </div>
        </section>
      ) : null}

      <section aria-labelledby="import-title">
        <Card>
          <CardHeader>
            <CardTitle id="import-title" className="text-base">
              Proposer un template
            </CardTitle>
            <CardDescription>
              Les doublons sont détectés automatiquement ; les nouveaux templates passent en
              validation avant d&apos;être publics, mais restent utilisables par vous immédiatement.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TemplateImportForm />
          </CardContent>
        </Card>
      </section>
    </article>
  );
}
