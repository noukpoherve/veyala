import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Send } from "lucide-react";
import { db } from "@/lib/db";
import { adminReplyToThread, setThreadStatus } from "../actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { BackLink } from "@/components/ui/back-link";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";
import { getLocale } from "@/i18n/get-locale";
import { getMessages } from "@/i18n/messages";
import { intlLocale } from "@/i18n/format";
import type { Locale } from "@/i18n/config";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getMessages(getLocale()).adminUi.meta.thread };
}

const dateTime = (d: Date, locale: Locale) =>
  new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "medium", timeStyle: "short" }).format(
    d
  );

export default async function AdminThreadPage({ params }: { params: { id: string } }) {
  const locale = getLocale();
  const m = getMessages(locale);
  const t = m.adminUi.thread;
  const thread = await db.supportThread.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { email: true, name: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!thread) notFound();

  // Opening the conversation marks the user's messages as read.
  await db.supportMessage.updateMany({
    where: { threadId: thread.id, fromAdmin: false, isRead: false },
    data: { isRead: true },
  });

  const nextStatus = thread.status === "OPEN" ? "CLOSED" : "OPEN";

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <BackLink href="/admin/inbox">{m.admin.inbox}</BackLink>

      <PageHeader
        title={thread.subject}
        description={
          <>
            {thread.user.name ? `${thread.user.name} · ` : ""}
            {thread.user.email}
          </>
        }
        actions={
          <>
            <Badge variant={thread.status === "OPEN" ? "secondary" : "outline"}>
              {thread.status === "OPEN" ? m.adminUi.inbox.open : m.adminUi.inbox.closed}
            </Badge>
            <form action={setThreadStatus}>
              <input type="hidden" name="threadId" value={thread.id} />
              <input type="hidden" name="status" value={nextStatus} />
              <Button type="submit" variant="outline" size="sm">
                {thread.status === "OPEN" ? t.close : t.reopen}
              </Button>
            </form>
          </>
        }
      />

      <Card>
        <CardContent className="space-y-3 p-5">
          <ol className="space-y-3">
            {thread.messages.map((message) => (
              <li
                key={message.id}
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                  message.fromAdmin ? "ml-auto bg-blue-600 text-white" : "bg-muted text-foreground"
                )}
              >
                <p className="whitespace-pre-wrap">{message.body}</p>
                <p
                  className={cn(
                    "mt-1.5 text-[11px]",
                    message.fromAdmin ? "text-blue-100" : "text-muted-foreground"
                  )}
                >
                  {message.fromAdmin ? t.fromTeam : thread.user.email} ·{" "}
                  {dateTime(message.createdAt, locale)}
                </p>
              </li>
            ))}
          </ol>

          <form
            className="flex items-end gap-2 border-t border-border pt-4"
            action={adminReplyToThread}
          >
            <input type="hidden" name="threadId" value={thread.id} />
            <Textarea
              name="body"
              required
              minLength={1}
              maxLength={5000}
              rows={3}
              placeholder={t.replyPlaceholder}
              className="flex-1"
              aria-label={t.replyLabel}
            />
            <Button type="submit" variant="gradient">
              <Send />
              {t.reply}
            </Button>
          </form>
        </CardContent>
      </Card>
    </article>
  );
}
