import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Activité · Admin" };

const dateTimeFr = (d: Date) =>
  new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "medium" }).format(d);

export default async function AdminActivityPage({
  searchParams,
}: {
  searchParams: { userId?: string; q?: string };
}) {
  await requireAdmin();
  const userId = searchParams.userId?.trim();
  const q = searchParams.q?.trim();

  const logs = await db.activityLog.findMany({
    where: {
      AND: [
        userId ? { OR: [{ subjectUserId: userId }, { actorId: userId }] } : {},
        q ? { action: { contains: q, mode: "insensitive" } } : {},
      ],
    },
    include: {
      actor: { select: { email: true } },
      subject: { select: { email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <article className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-display text-2xl font-bold">Journal d&apos;activité</h1>
        <p className="text-sm text-muted-foreground">
          <Link href="/admin/users" className="underline hover:text-foreground">
            Retour utilisateurs
          </Link>
        </p>
      </header>

      <form method="get" className="flex flex-wrap gap-2">
        <label htmlFor="userId" className="sr-only">
          Filtrer par user id
        </label>
        <input
          id="userId"
          name="userId"
          defaultValue={userId}
          placeholder="userId…"
          className="h-10 rounded-md border px-3 text-sm"
        />
        <label htmlFor="q" className="sr-only">
          Filtrer par action
        </label>
        <input
          id="q"
          name="q"
          defaultValue={q}
          placeholder="action (ex. account.archive)…"
          className="h-10 rounded-md border px-3 text-sm"
        />
        <button type="submit" className="h-10 rounded-md border px-4 text-sm font-medium">
          Filtrer
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th scope="col" className="p-3 font-medium">
                Quand
              </th>
              <th scope="col" className="p-3 font-medium">
                Action
              </th>
              <th scope="col" className="p-3 font-medium">
                Acteur
              </th>
              <th scope="col" className="p-3 font-medium">
                Cible
              </th>
              <th scope="col" className="p-3 font-medium">
                Meta
              </th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-t align-top">
                <td className="p-3 whitespace-nowrap text-muted-foreground">
                  {dateTimeFr(log.createdAt)}
                </td>
                <td className="p-3 font-mono text-xs">{log.action}</td>
                <td className="p-3">{log.actor?.email ?? "—"}</td>
                <td className="p-3">{log.subject?.email ?? "—"}</td>
                <td className="p-3 font-mono text-xs text-muted-foreground">
                  {log.meta ? JSON.stringify(log.meta) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {logs.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune activité pour ce filtre.</p>
      ) : null}
    </article>
  );
}
