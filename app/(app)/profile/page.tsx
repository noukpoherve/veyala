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

export const metadata: Metadata = { title: "Mon CV de base" };

export default async function ProfilePage() {
  const session = await auth();
  const profile = await db.baseProfile.findUnique({ where: { userId: session!.user.id } });

  const parsed = profile ? cvSchema.safeParse(profile.data) : null;
  const cvData = parsed?.success ? parsed.data : null;

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Mon CV de base"
        description="C'est la source de vérité utilisée pour toutes les générations : l'IA reformule et réordonne ces données, elle n'invente jamais rien."
      />

      <section aria-labelledby="import-title">
        <Card>
          <CardHeader>
            <CardTitle id="import-title" className="flex items-center gap-2 text-base">
              <FileUp className="size-4 text-primary" aria-hidden />
              Import automatique
            </CardTitle>
            <CardDescription>
              Importez votre CV existant (PDF ou DOCX, 8 Mo max) : il est analysé puis converti en
              données structurées éditables ci-dessous.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CvUpload hasProfile={!!cvData} />
          </CardContent>
        </Card>
      </section>

      <section aria-label="Données structurées du CV">
        {cvData ? (
          <ProfileForm key={profile!.updatedAt.toISOString()} initialData={cvData} />
        ) : (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Aucun CV importé pour le moment. Importez un fichier ci-dessus ou remplissez le
            formulaire après un premier import.
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
              Zone dangereuse
            </CardTitle>
            <CardDescription>
              Désactive votre compte (archivage). Vos données sont conservées. Pour retrouver
              l&apos;accès, contactez un administrateur — la suppression définitive (RGPD) est
              réservée à l&apos;équipe support.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ArchiveAccountForm />
          </CardContent>
        </Card>
      </section>
    </article>
  );
}
