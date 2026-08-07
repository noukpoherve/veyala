import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { describeActivity, formatActivityMeta } from "@/lib/activity-labels";
import { parsePage, paginationSkip, totalPages, DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { Pagination } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Activité · Admin" };

const dateTimeFr = (d: Date) =>
  new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "medium" }).format(d);

export default async function AdminActivityPage({
  searchParams,
}: {
  searchParams: { userId?: string; q?: string; page?: string };
}) {
  await requireAdmin();
  const userId = searchParams.userId?.trim();
  const q = searchParams.q?.trim();
  const page = parsePage(searchParams.page);

  const where = {
    AND: [
      userId ? { OR: [{ subjectUserId: userId }, { actorId: userId }] } : {},
      q
        ? {
            OR: [
              { action: { contains: q, mode: "insensitive" as const } },
              // Allow searching French-ish terms mapped to known actions
              ...(q.toLowerCase().includes("paiement") || q.toLowerCase().includes("pay")
                ? [{ action: { startsWith: "payment." } }]
                : []),
              ...(q.toLowerCase().includes("crédit") || q.toLowerCase().includes("credit")
                ? [{ action: { contains: "credits" } }]
                : []),
            ],
          }
        : {},
    ],
  };

  const [total, logs] = await Promise.all([
    db.activityLog.count({ where }),
    db.activityLog.findMany({
      where,
      include: {
        actor: { select: { email: true } },
        subject: { select: { email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: paginationSkip(page),
      take: DEFAULT_PAGE_SIZE,
    }),
  ]);

  return (
    <article className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-display text-2xl font-bold">Journal d&apos;activité</h1>
        <p className="text-sm text-muted-foreground">
          Historique lisible des actions utilisateurs et admin (paiements, crédits, comptes…).{" "}
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
          Filtrer
        </label>
        <input
          id="q"
          name="q"
          defaultValue={q}
          placeholder="ex. paiement, crédits, archive…"
          className="h-10 min-w-[16rem] rounded-md border px-3 text-sm"
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
                Événement
              </th>
              <th scope="col" className="p-3 font-medium">
                Acteur
              </th>
              <th scope="col" className="p-3 font-medium">
                Cible
              </th>
              <th scope="col" className="p-3 font-medium">
                Détails
              </th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => {
              const desc = describeActivity(log.action);
              const meta = formatActivityMeta(log.meta);
              const isPayment = log.action.startsWith("payment.");
              return (
                <tr key={log.id} className="border-t align-top">
                  <td className="p-3 whitespace-nowrap text-muted-foreground">
                    {dateTimeFr(log.createdAt)}
                  </td>
                  <td className="p-3">
                    <div className="font-medium">{desc.title}</div>
                    <p className="text-xs text-muted-foreground">{desc.description}</p>
                    <p className="mt-1 font-mono text-[10px] text-muted-foreground/80">
                      {log.action}
                    </p>
                    {isPayment ? (
                      <Badge
                        variant={log.action === "payment.paid" ? "success" : "secondary"}
                        className="mt-1"
                      >
                        {log.action === "payment.paid"
                          ? "Paiement OK"
                          : log.action === "payment.failed"
                            ? "Non encaissé"
                            : "Checkout"}
                      </Badge>
                    ) : null}
                  </td>
                  <td className="p-3">{log.actor?.email ?? "—"}</td>
                  <td className="p-3">{log.subject?.email ?? "—"}</td>
                  <td className="p-3">
                    {meta.length === 0 ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <ul className="space-y-0.5 text-xs">
                        {meta.map((m) => (
                          <li key={m.label}>
                            <span className="text-muted-foreground">{m.label} :</span>{" "}
                            <span className="font-medium">{m.value}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {logs.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune activité pour ce filtre.</p>
      ) : null}

      <Pagination
        pathname="/admin/activity"
        searchParams={searchParams}
        page={page}
        totalPages={totalPages(total)}
        totalItems={total}
      />
    </article>
  );
}
