import type { Metadata } from "next";
import Image from "next/image";
import { Check, X } from "lucide-react";
import { db } from "@/lib/db";
import { parseTemplateDefinition } from "@/lib/templates/definition";
import { reviewTemplate } from "./actions";
import { TemplateSwatch, swatchFromDefinition } from "@/components/templates/template-swatch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { parsePage, paginationSkip, totalPages, DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { getLocale } from "@/i18n/get-locale";
import { getMessages } from "@/i18n/messages";
import { formatDate } from "@/i18n/format";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getMessages(getLocale()).adminUi.meta.templates };
}

export default async function AdminTemplatesPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const locale = getLocale();
  const m = getMessages(locale);
  const t = m.adminUi.templates;
  const page = parsePage(searchParams.page);
  const historyWhere = { status: { in: ["APPROVED", "REJECTED"] as ("APPROVED" | "REJECTED")[] } };

  const [pending, historyTotal, others] = await Promise.all([
    db.template.findMany({
      where: { status: "PENDING" },
      include: { owner: { select: { email: true } } },
      orderBy: { createdAt: "asc" },
    }),
    db.template.count({ where: historyWhere }),
    db.template.findMany({
      where: historyWhere,
      include: { owner: { select: { email: true } } },
      orderBy: { createdAt: "desc" },
      skip: paginationSkip(page),
      take: DEFAULT_PAGE_SIZE,
    }),
  ]);

  return (
    <article className="space-y-8">
      <section aria-labelledby="pending-title" className="space-y-4">
        <h1
          id="pending-title"
          className="flex flex-wrap items-center gap-2 font-display text-2xl font-bold"
        >
          <span>{t.queueTitle}</span>
          <Badge variant={pending.length ? "default" : "secondary"}>{pending.length}</Badge>
        </h1>

        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.queueEmpty}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pending.map((template) => {
              const def = parseTemplateDefinition(template.definition);
              return (
                <Card key={template.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {t.submittedBy(
                        template.owner?.email ?? t.unknownAuthor,
                        formatDate(template.createdAt, locale)
                      )}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {template.previewImageUrl ? (
                      <Image
                        src={template.previewImageUrl}
                        alt={t.previewAlt(template.name)}
                        width={400}
                        height={280}
                        className="h-40 w-full rounded-md border object-cover object-top"
                        unoptimized
                      />
                    ) : null}
                    <TemplateSwatch {...swatchFromDefinition(def)} size="md" />
                    <div className="flex gap-2">
                      <form action={reviewTemplate} className="flex-1">
                        <input type="hidden" name="templateId" value={template.id} />
                        <input type="hidden" name="decision" value="APPROVED" />
                        <Button type="submit" size="sm" className="w-full">
                          <Check />
                          {t.approve}
                        </Button>
                      </form>
                      <form action={reviewTemplate} className="flex-1">
                        <input type="hidden" name="templateId" value={template.id} />
                        <input type="hidden" name="decision" value="REJECTED" />
                        <Button type="submit" size="sm" variant="destructive" className="w-full">
                          <X />
                          {t.reject}
                        </Button>
                      </form>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section aria-labelledby="history-title" className="space-y-3">
        <h2 id="history-title" className="font-display text-lg font-semibold">
          {t.historyTitle}
        </h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th scope="col" className="p-3 font-medium">
                  {t.colTemplate}
                </th>
                <th scope="col" className="p-3 font-medium">
                  {t.colAuthor}
                </th>
                <th scope="col" className="p-3 font-medium">
                  {m.common.status}
                </th>
                <th scope="col" className="p-3 font-medium">
                  {t.colPublic}
                </th>
              </tr>
            </thead>
            <tbody>
              {others.map((template) => (
                <tr key={template.id} className="border-t">
                  <td className="p-3 font-medium">{template.name}</td>
                  <td className="p-3 text-muted-foreground">
                    {template.owner?.email ?? t.official}
                  </td>
                  <td className="p-3">
                    <Badge variant={template.status === "APPROVED" ? "success" : "destructive"}>
                      {template.status === "APPROVED" ? t.approved : t.rejected}
                    </Badge>
                  </td>
                  <td className="p-3">{template.isPublic ? m.common.yes : m.common.no}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          pathname="/admin/templates"
          searchParams={searchParams}
          page={page}
          totalPages={totalPages(historyTotal)}
          totalItems={historyTotal}
        />
      </section>
    </article>
  );
}
