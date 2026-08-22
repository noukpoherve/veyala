import type { Metadata } from "next";
import { FileText, Sparkles } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getDashboardStats } from "@/lib/dashboard-stats";
import { ActivityBilan } from "@/components/dashboard/activity-bilan";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/ui/page-header";
import { parsePage, paginationSkip, totalPages, DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { getLocale } from "@/i18n/get-locale";
import { getMessages } from "@/i18n/messages";
import { Link } from "@/i18n/navigation";
import { formatDate } from "@/i18n/format";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getMessages(getLocale()).seo.dashboardTitle };
}

export default async function DashboardPage({ searchParams }: { searchParams: { page?: string } }) {
  const session = await auth();
  const locale = getLocale();
  const m = getMessages(locale);
  const userId = session!.user.id;
  const page = parsePage(searchParams.page);

  const [stats, total, cvs] = await Promise.all([
    getDashboardStats(userId),
    db.generatedCV.count({ where: { userId } }),
    db.generatedCV.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip: paginationSkip(page),
      take: DEFAULT_PAGE_SIZE,
      include: { template: { select: { name: true } } },
    }),
  ]);

  return (
    <div className="space-y-10">
      <PageHeader
        title={m.nav.dashboard}
        description={m.pages.dashboard.description}
        actions={
          <Button asChild variant="gradient">
            <Link href="/generate">
              <Sparkles />
              {m.nav.generate}
            </Link>
          </Button>
        }
      />

      <ActivityBilan stats={stats} />

      <section aria-labelledby="history-title" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="history-title" className="font-display text-lg font-semibold">
              {m.pages.dashboard.historyTitle}
            </h2>
            <p className="text-sm text-muted-foreground">
              {total === 0 ? m.pages.dashboard.historyEmpty : m.pages.dashboard.historyCount(total)}
            </p>
          </div>
        </div>

        {cvs.length === 0 && page === 1 ? (
          <Card className="border-dashed">
            <CardHeader className="items-center text-center">
              <FileText className="size-10 text-muted-foreground" aria-hidden />
              <CardTitle>{m.app.emptyCvTitle}</CardTitle>
              <CardDescription>{m.app.emptyCvBody}</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center gap-3 pb-8">
              <Button asChild variant="outline">
                <Link href="/profile">{m.pages.dashboard.importCta}</Link>
              </Button>
              <Button asChild>
                <Link href="/generate">{m.nav.generate}</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
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
                            {formatDate(cv.createdAt, locale)}
                          </time>
                        </CardDescription>
                        {cv.universe === "CAMPUS_FRANCE" ? (
                          <Badge variant="secondary" className="w-fit">
                            {m.nav.campusFrance}
                          </Badge>
                        ) : null}
                        {cv.matchScoreBefore != null && cv.matchScoreAfter != null ? (
                          <Badge variant="secondary" className="w-fit">
                            {cv.universe === "CAMPUS_FRANCE"
                              ? m.pages.scores.coherence
                              : m.pages.scores.matching}{" "}
                            {cv.matchScoreBefore}% → {cv.matchScoreAfter}%
                          </Badge>
                        ) : null}
                      </CardHeader>
                    </Card>
                  </Link>
                </li>
              ))}
            </ul>
            <Pagination
              pathname="/dashboard"
              searchParams={searchParams}
              page={page}
              totalPages={totalPages(total)}
              totalItems={total}
            />
          </>
        )}
      </section>
    </div>
  );
}
