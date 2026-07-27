import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Sparkles } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getDashboardStats } from "@/lib/dashboard-stats";
import { ActivityBilan } from "@/components/dashboard/activity-bilan";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Tableau de bord" };

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [stats, cvs] = await Promise.all([
    getDashboardStats(userId),
    db.generatedCV.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { template: { select: { name: true } } },
    }),
  ]);

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Tableau de bord</h1>
          <p className="text-sm text-muted-foreground">
            Votre activité et l&apos;historique de vos CV générés.
          </p>
        </div>
        <Button asChild variant="gradient">
          <Link href="/generate">
            <Sparkles />
            Générer un CV
          </Link>
        </Button>
      </div>

      <ActivityBilan stats={stats} />

      <section aria-labelledby="history-title" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="history-title" className="font-display text-lg font-semibold">
              Historique des CV
            </h2>
            <p className="text-sm text-muted-foreground">
              {cvs.length === 0
                ? "Aucun CV pour le moment."
                : `${cvs.length} CV${cvs.length > 1 ? "s" : ""} (les 100 plus récents).`}
            </p>
          </div>
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
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cvs.map((cv) => (
              <li key={cv.id}>
                <Link href={`/cv/${cv.id}`} className="group block h-full">
                  <Card className="h-full transition-shadow group-hover:shadow-md">
                    <CardHeader className="space-y-2">
                      <CardTitle className="line-clamp-2 text-base">{cv.jobTitle}</CardTitle>
                      <CardDescription>
                        {cv.template.name} ·{" "}
                        <time dateTime={cv.createdAt.toISOString()}>
                          {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(
                            cv.createdAt
                          )}
                        </time>
                      </CardDescription>
                      {cv.matchScoreBefore != null && cv.matchScoreAfter != null ? (
                        <Badge variant="secondary" className="w-fit">
                          Matching {cv.matchScoreBefore}% → {cv.matchScoreAfter}%
                        </Badge>
                      ) : null}
                    </CardHeader>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
