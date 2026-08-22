import type { Metadata } from "next";
import { Inbox } from "lucide-react";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { parsePage, paginationSkip, totalPages, DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { getLocale } from "@/i18n/get-locale";
import { getMessages } from "@/i18n/messages";
import { Link } from "@/i18n/navigation";
import { intlLocale } from "@/i18n/format";
import type { Locale } from "@/i18n/config";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getMessages(getLocale()).adminUi.meta.inbox };
}

const dateTime = (d: Date, locale: Locale) =>
  new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "medium", timeStyle: "short" }).format(
    d
  );

export default async function AdminInboxPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const locale = getLocale();
  const m = getMessages(locale);
  const t = m.adminUi.inbox;
  const page = parsePage(searchParams.page);
  const [total, threads] = await Promise.all([
    db.supportThread.count(),
    db.supportThread.findMany({
      orderBy: { updatedAt: "desc" },
      skip: paginationSkip(page),
      take: DEFAULT_PAGE_SIZE,
      include: {
        user: { select: { email: true, name: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
        _count: { select: { messages: { where: { fromAdmin: false, isRead: false } } } },
      },
    }),
  ]);

  const unreadTotal = threads.reduce((sum, thread) => sum + thread._count.messages, 0);

  return (
    <article className="space-y-6">
      <PageHeader
        title={m.admin.inbox}
        description={
          <>
            {t.threadsCount(total)}
            {unreadTotal > 0 ? ` · ${t.unreadCount(unreadTotal)}` : ""}
          </>
        }
      />

      {threads.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <Inbox className="size-10 text-muted-foreground" aria-hidden />
            <p className="font-medium">{t.emptyTitle}</p>
            <p className="text-sm text-muted-foreground">{t.emptyBody}</p>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {threads.map((thread) => {
            const last = thread.messages[0];
            const unread = thread._count.messages;
            return (
              <li key={thread.id}>
                <Link href={`/admin/inbox/${thread.id}`} className="block">
                  <Card
                    className={
                      unread > 0
                        ? "border-blue-200 transition-shadow hover:shadow-md"
                        : "transition-shadow hover:shadow-md"
                    }
                  >
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h2 className="truncate text-sm font-bold">{thread.subject}</h2>
                          {unread > 0 ? <Badge>{unread}</Badge> : null}
                          <Badge variant={thread.status === "OPEN" ? "secondary" : "outline"}>
                            {thread.status === "OPEN" ? t.open : t.closed}
                          </Badge>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {thread.user.name ?? thread.user.email}
                          {last
                            ? `: ${last.fromAdmin ? t.fromYou : ""}${last.body.slice(0, 90)}`
                            : ""}
                        </p>
                      </div>
                      <time
                        dateTime={thread.updatedAt.toISOString()}
                        className="shrink-0 text-xs text-muted-foreground"
                      >
                        {dateTime(thread.updatedAt, locale)}
                      </time>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <Pagination
        pathname="/admin/inbox"
        searchParams={searchParams}
        page={page}
        totalPages={totalPages(total)}
        totalItems={total}
      />
    </article>
  );
}
