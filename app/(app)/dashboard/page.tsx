import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Sparkles } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBalance } from "@/lib/credits";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Tableau de bord" };

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [balance, cvs] = await Promise.all([
    getBalance(userId),
    db.generatedCV.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 12,
      include: { template: { select: { name: true } } },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Tableau de bord</h1>
          <p className="text-sm text-muted-foreground">
            {balance} crédit{balance > 1 ? "s" : ""} restant{balance > 1 ? "s" : ""}
          </p>
        </div>
        <Button asChild variant="gradient">
          <Link href="/generate">
            <Sparkles />
            Générer un CV
          </Link>
        </Button>
      </div>

      {cvs.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader className="items-center text-center">
            <FileText className="size-10 text-muted-foreground" aria-hidden />
            <CardTitle>Aucun CV généré pour le moment</CardTitle>
            <CardDescription>
              Importez d&apos;abord votre CV de base, puis collez une offre d&apos;emploi pour
              obtenir un CV sur mesure.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center gap-3 pb-8">
            <Button asChild variant="outline">
              <Link href="/profile">Importer mon CV</Link>
            </Button>
            <Button asChild>
              <Link href="/generate">Générer un CV</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cvs.map((cv) => (
            <Link key={cv.id} href={`/cv/${cv.id}`} className="group">
              <Card className="h-full transition-shadow group-hover:shadow-md">
                <CardHeader>
                  <CardTitle className="line-clamp-2 text-base">{cv.jobTitle}</CardTitle>
                  <CardDescription>
                    {cv.template.name} ·{" "}
                    {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(cv.createdAt)}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
