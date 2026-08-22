import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPublicTemplates } from "@/lib/cached";
import { getBalance } from "@/lib/credits";
import { mergeTemplateLists } from "@/lib/templates/merge";
import { parseTemplateDefinition } from "@/lib/templates/definition";
import type { TemplateOption } from "@/components/generate/generate-form";
import { CampusFranceForm } from "@/components/campus-france/campus-france-form";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
import { getLocale } from "@/i18n/get-locale";
import { getMessages } from "@/i18n/messages";
import { Link } from "@/i18n/navigation";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getMessages(getLocale()).seo.campusFranceTitle };
}

export default async function CampusFrancePage() {
  const session = await auth();
  const m = getMessages(getLocale());
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
      <PageHeader title={m.app.campusTitle} description={m.app.campusSubtitle} />

      {!profile ? (
        <Alert
          variant="warning"
          title={m.pages.baseCvAlert.title}
          action={
            <Link href="/profile" className="font-medium">
              {m.pages.baseCvAlert.cta}
            </Link>
          }
        >
          {m.pages.baseCvAlert.campusBody}
        </Alert>
      ) : null}

      <CampusFranceForm templates={templateOptions} balance={balance} disabled={!profile} />
    </article>
  );
}
