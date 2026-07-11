import type { Metadata } from "next";
import { FileUp, ShieldAlert } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { cvSchema } from "@/lib/cv-schema";
import { deleteAccount } from "./actions";
import { CvUpload } from "@/components/profile/cv-upload";
import { ProfileForm } from "@/components/profile/profile-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Mon CV de base" };

export default async function ProfilePage() {
  const session = await auth();
  const profile = await db.baseProfile.findUnique({ where: { userId: session!.user.id } });

  const parsed = profile ? cvSchema.safeParse(profile.data) : null;
  const cvData = parsed?.success ? parsed.data : null;

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-1">
        <h1 className="font-display text-2xl font-bold">Mon CV de base</h1>
        <p className="text-sm text-muted-foreground">
          C&apos;est la source de vérité utilisée pour toutes les générations : l&apos;IA reformule
          et réordonne ces données, elle n&apos;invente jamais rien.
        </p>
      </header>

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
              Supprime définitivement votre compte, votre CV de base, vos CV générés et vos
              historiques de crédits et de paiements (RGPD). Cette action est irréversible.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={deleteAccount} className="flex flex-wrap items-end gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="confirm-delete">Tapez SUPPRIMER pour confirmer</Label>
                <Input
                  id="confirm-delete"
                  name="confirm"
                  required
                  pattern="SUPPRIMER"
                  placeholder="SUPPRIMER"
                  className="w-48"
                />
              </div>
              <Button type="submit" variant="destructive">
                Supprimer mon compte
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </article>
  );
}
