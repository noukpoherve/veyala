import type { Metadata } from "next";
import { redirect } from "next/navigation";
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
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Support" };

const dateFr = (d: Date) =>
  new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(d);

const STATUS_MESSAGES: Record<string, { text: string; tone: "ok" | "error" }> = {
  sent: { text: "Message envoyé — notre équipe vous répondra par email et ici même.", tone: "ok" },
  invalid: {
    text: "Message invalide : sujet de 3 caractères minimum, message de 10 caractères minimum.",
    tone: "error",
  },
  ratelimited: {
    text: "Trop de messages envoyés — réessayez dans quelques minutes.",
    tone: "error",
  },
};

export default async function SupportPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const threads = await db.supportThread.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  // Opening the page marks admin replies as read for this user.
  await db.supportMessage.updateMany({
    where: { thread: { userId: session.user.id }, fromAdmin: true, isRead: false },
    data: { isRead: true },
  });

  const feedback = searchParams.status ? STATUS_MESSAGES[searchParams.status] : null;

  return (
    <article className="mx-auto max-w-3xl space-y-8">
      <header className="space-y-1">
        <h1 className="font-display text-2xl font-bold">Support</h1>
        <p className="text-sm text-muted-foreground">
          Une question, un problème ? Écrivez-nous : la réponse arrive ici et par email.
        </p>
      </header>

      {feedback ? (
        <p
          role={feedback.tone === "error" ? "alert" : "status"}
          className={cn(
            "rounded-xl p-3 text-sm",
            feedback.tone === "ok"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-destructive/10 text-destructive"
          )}
        >
          {feedback.text}
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nouveau message</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" action={createSupportThread}>
            <div className="space-y-1.5">
              <Label htmlFor="subject">Sujet</Label>
              <Input
                id="subject"
                name="subject"
                required
                minLength={3}
                maxLength={120}
                placeholder="Ex. : problème d'export PDF"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="body">Message</Label>
              <Textarea
                id="body"
                name="body"
                required
                minLength={10}
                maxLength={5000}
                rows={5}
                placeholder="Décrivez votre demande le plus précisément possible…"
              />
            </div>
            <Button type="submit" variant="gradient">
              <Send />
              Envoyer
            </Button>
          </form>
        </CardContent>
      </Card>

      {threads.length > 0 ? (
        <section aria-label="Vos conversations" className="space-y-4">
          <h2 className="font-display text-lg font-bold">Vos conversations</h2>
          {threads.map((thread) => (
            <Card key={thread.id} id={`thread-${thread.id}`}>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageCircle className="size-4 text-blue-600" aria-hidden />
                  {thread.subject}
                </CardTitle>
                <Badge variant={thread.status === "OPEN" ? "secondary" : "outline"}>
                  {thread.status === "OPEN" ? "En cours" : "Clôturé"}
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
                        {message.fromAdmin ? "Équipe Veyala" : "Vous"} ·{" "}
                        {dateFr(message.createdAt)}
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
                    placeholder="Répondre…"
                    className="flex-1"
                    aria-label={`Répondre à « ${thread.subject} »`}
                  />
                  <Button type="submit" size="icon" aria-label="Envoyer la réponse">
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
