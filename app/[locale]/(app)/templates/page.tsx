import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPublicTemplates } from "@/lib/cached";
import { parseTemplateDefinition } from "@/lib/templates/definition";
import { TemplateSwatch, swatchFromDefinition } from "@/components/templates/template-swatch";
import { Skeleton } from "@/components/ui/skeleton";

// Import form (upload + vision extraction UI) is heavy and below the fold: lazy-loaded.
const TemplateImportForm = dynamic(
  () => import("@/components/templates/template-import-form").then((mod) => mod.TemplateImportForm),
  { loading: () => <Skeleton className="h-48 rounded-2xl" /> }
);
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { getLocale } from "@/i18n/get-locale";
import { getMessages } from "@/i18n/messages";
import type { Template, TemplateStatus } from "@prisma/client";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getMessages(getLocale()).seo.templatesTitle };
}

const STATUS_VARIANTS: Partial<Record<TemplateStatus, "secondary" | "success" | "destructive">> = {
  PENDING: "secondary",
  APPROVED: "success",
  REJECTED: "destructive",
};

function TemplateCard({ template, showStatus }: { template: Template; showStatus: boolean }) {
  const m = getMessages(getLocale()).pages.templates;
  const def = parseTemplateDefinition(template.definition);
  const variant = STATUS_VARIANTS[template.status];
  const statusLabel = (m.status as Record<string, string | undefined>)[template.status];
  return (
    <Card>
      <CardContent className="space-y-2 p-4">
        <TemplateSwatch {...swatchFromDefinition(def)} size="lg" />
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-medium">{template.name}</h3>
          {showStatus && variant && statusLabel ? (
            <Badge variant={variant}>{statusLabel}</Badge>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">
          {def.layout === "sidebar-left" ? m.layoutSidebar : m.layoutSingle} ·{" "}
          {template.ownerId ? m.originCommunity : m.originOfficial}
        </p>
      </CardContent>
    </Card>
  );
}

export default async function TemplatesPage() {
  const session = await auth();
  const m = getMessages(getLocale());
  const userId = session!.user.id;

  const [publicTemplates, ownTemplates] = await Promise.all([
    getPublicTemplates(),
    db.template.findMany({ where: { ownerId: userId }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <article className="mx-auto max-w-4xl space-y-8">
      <PageHeader title={m.app.templatesTitle} description={m.app.templatesSubtitle} />

      <section aria-labelledby="gallery-title" className="space-y-4" data-tour="templates">
        <h2 id="gallery-title" className="font-display text-lg font-semibold">
          {m.pages.templates.galleryTitle}
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
            {m.pages.templates.ownTitle}
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
              {m.pages.templates.proposeTitle}
            </CardTitle>
            <CardDescription>{m.pages.templates.proposeBody}</CardDescription>
          </CardHeader>
          <CardContent>
            <TemplateImportForm />
          </CardContent>
        </Card>
      </section>
    </article>
  );
}
