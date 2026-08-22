import type { Metadata } from "next";
import { MessageCircle, Send } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createSupportThread, replyToSupportThread } from "./actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";
import { getLocale } from "@/i18n/get-locale";
import { getMessages } from "@/i18n/messages";
import { formatDateTime } from "@/i18n/format";
import { redirectLocalized } from "@/i18n/redirect";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getMessages(getLocale()).app.supportTitle };
}

export default async function SupportPage({ searchParams }: { searchParams: { status?: string } }) {
  const locale = getLocale();
  const m = getMessages(locale);
  const t = m.pages.support;
  const session = await auth();
  if (!session?.user) redirectLocalized("/login", locale);

  const threads = await db.supportThread.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  await db.supportMessage.updateMany({
    where: { thread: { userId: session.user.id }, fromAdmin: true, isRead: false },
    data: { isRead: true },
  });

  const feedback =
    searchParams.status === "sent"
      ? { text: t.statusSent, tone: "ok" as const }
      : searchParams.status === "invalid"
        ? { text: t.statusInvalid, tone: "error" as const }
        : searchParams.status === "ratelimited"
          ? { text: t.statusRateLimited, tone: "error" as const }
          : null;

  return (
    <article className="mx-auto max-w-3xl space-y-8">
      <PageHeader title={m.app.supportTitle} description={t.description} />

      {feedback ? (
        <Alert
          variant={feedback.tone === "ok" ? "success" : "error"}
          title={feedback.tone === "ok" ? t.sentTitle : t.failedTitle}
        >
          {feedback.text}
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.newMessage}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" action={createSupportThread}>
            <div className="space-y-1.5">
              <Label htmlFor="subject">{t.subject}</Label>
              <Input
                id="subject"
                name="subject"
                required
                minLength={3}
                maxLength={120}
                placeholder={t.subjectPlaceholder}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="body">{t.message}</Label>
              <Textarea
                id="body"
                name="body"
                required
                minLength={10}
                maxLength={5000}
                rows={5}
                placeholder={t.messagePlaceholder}
              />
            </div>
            <Button type="submit" variant="gradient">
              <Send />
              {m.common.send}
            </Button>
          </form>
        </CardContent>
      </Card>

      {threads.length > 0 ? (
        <section aria-label={t.threadsTitle} className="space-y-4">
          <h2 className="font-display text-lg font-bold">{t.threadsTitle}</h2>
          {threads.map((thread) => (
            <Card key={thread.id} id={`thread-${thread.id}`}>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageCircle className="size-4 text-blue-600" aria-hidden />
                  {thread.subject}
                </CardTitle>
                <Badge variant={thread.status === "OPEN" ? "secondary" : "outline"}>
                  {thread.status === "OPEN" ? t.statusOpen : t.statusClosed}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <ol className="space-y-3">
                  {thread.messages.map((message) => (
                    <li
                      key={message.id}
                      className={cn(
                        "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                        message.fromAdmin
                          ? "bg-muted text-foreground"
                          : "ml-auto bg-blue-600 text-white"
                      )}
                    >
                      <p className="whitespace-pre-wrap">{message.body}</p>
                      <p
                        className={cn(
                          "mt-1.5 text-[11px]",
                          message.fromAdmin ? "text-muted-foreground" : "text-blue-100"
                        )}
                      >
                        {message.fromAdmin ? t.fromTeam : t.fromYou} ·{" "}
                        {formatDateTime(message.createdAt, locale)}
                      </p>
                    </li>
                  ))}
                </ol>
                <form className="flex items-end gap-2" action={replyToSupportThread}>
                  <input type="hidden" name="threadId" value={thread.id} />
                  <Textarea
                    name="body"
                    required
                    minLength={1}
                    maxLength={5000}
                    rows={2}
                    placeholder={t.replyPlaceholder}
                    className="flex-1"
                    aria-label={t.replyAria(thread.subject)}
                  />
                  <Button type="submit" size="icon" aria-label={t.sendReply}>
                    <Send />
                  </Button>
                </form>
              </CardContent>
            </Card>
          ))}
        </section>
      ) : null}
    </article>
  );
}
