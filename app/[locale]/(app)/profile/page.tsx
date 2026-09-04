import type { Metadata } from "next";
import { FileUp, ShieldAlert } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { cvSchema } from "@/lib/cv-schema";
import { ArchiveAccountForm } from "@/components/profile/archive-account-form";
import { CvUpload } from "@/components/profile/cv-upload";
import { ProfileForm } from "@/components/profile/profile-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { getLocale } from "@/i18n/get-locale";
import { getMessages } from "@/i18n/messages";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getMessages(getLocale()).seo.profileTitle };
}

export default async function ProfilePage() {
  const session = await auth();
  const m = getMessages(getLocale());
  const profile = await db.baseProfile.findUnique({ where: { userId: session!.user.id } });

  const parsed = profile ? cvSchema.safeParse(profile.data) : null;
  const cvData = parsed?.success ? parsed.data : null;

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <PageHeader title={m.app.profileTitle} description={m.app.profileSubtitle} />

      <section aria-labelledby="import-title" data-tour="profile">
        <Card>
          <CardHeader>
            <CardTitle id="import-title" className="flex items-center gap-2 text-base">
              <FileUp className="size-4 text-primary" aria-hidden />
              {m.pages.profile.importTitle}
            </CardTitle>
            <CardDescription>{m.pages.profile.importBody}</CardDescription>
          </CardHeader>
          <CardContent>
            <CvUpload hasProfile={!!cvData} />
          </CardContent>
        </Card>
      </section>

      <section aria-label={m.pages.profile.structuredAria}>
        {cvData ? (
          <ProfileForm key={profile!.updatedAt.toISOString()} initialData={cvData} />
        ) : (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            {m.pages.profile.noCv}
          </p>
        )}
      </section>

      <section aria-labelledby="danger-title">
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle
              id="danger-title"
              className="flex items-center gap-2 text-base text-destructive"
            >
              <ShieldAlert className="size-4" aria-hidden />
              {m.pages.profile.dangerTitle}
            </CardTitle>
            <CardDescription>{m.pages.profile.dangerBody}</CardDescription>
          </CardHeader>
          <CardContent>
            <ArchiveAccountForm />
          </CardContent>
        </Card>
      </section>
    </article>
  );
}
