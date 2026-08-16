import type { Metadata } from "next";
import Link from "next/link";
import { Inbox } from "lucide-react";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { parsePage, paginationSkip, totalPages, DEFAULT_PAGE_SIZE } from "@/lib/pagination";

export const metadata: Metadata = { title: "Boîte de réception" };

const dateFr = (d: Date) =>
  new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(d);

export default async function AdminInboxPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
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
        title="Boîte de réception"
        description={
          <>
            {total} conversation{total > 1 ? "s" : ""}
            {unreadTotal > 0 ? ` · ${unreadTotal} non lu${unreadTotal > 1 ? "s" : ""} (page)` : ""}
          </>
        }
      />

      {threads.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <Inbox className="size-10 text-muted-foreground" aria-hidden />
            <p className="font-medium">Aucun message pour le moment</p>
            <p className="text-sm text-muted-foreground">
              Les messages envoyés depuis la page Support des utilisateurs arrivent ici.
            </p>
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
                            {thread.status === "OPEN" ? "En cours" : "Clôturé"}
                          </Badge>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {thread.user.name ?? thread.user.email}
                          {last
                            ? `: ${last.fromAdmin ? "Vous : " : ""}${last.body.slice(0, 90)}`
                            : ""}
                        </p>
                      </div>
                      <time
                        dateTime={thread.updatedAt.toISOString()}
                        className="shrink-0 text-xs text-muted-foreground"
                      >
                        {dateFr(thread.updatedAt)}
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
