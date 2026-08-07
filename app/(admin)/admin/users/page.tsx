import type { Metadata } from "next";
import { Search, UserPlus } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { adjustCredits, inviteAdmin, setUserRole } from "./actions";
import { AdminUserLifecycleActions } from "@/components/admin/user-lifecycle-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Pagination } from "@/components/ui/pagination";
import { parsePage, paginationSkip, totalPages, DEFAULT_PAGE_SIZE } from "@/lib/pagination";

export const metadata: Metadata = { title: "Utilisateurs · Admin" };

const dateFr = (d: Date) => new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(d);

const INVITE_MESSAGES: Record<string, { text: string; tone: "success" | "error" }> = {
  sent: {
    text: "Invitation envoyée — l'administrateur recevra un lien par email.",
    tone: "success",
  },
  exists: {
    text: "Un compte existe déjà avec cet email (promouvez-le ci-dessous).",
    tone: "error",
  },
  invalid: { text: "Adresse email invalide.", tone: "error" },
  failed: { text: "L'envoi de l'invitation a échoué. Réessayez.", tone: "error" },
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { q?: string; invite?: string; deleted?: string; page?: string };
}) {
  const session = await auth();
  const q = searchParams.q?.trim() ?? "";
  const inviteMessage = searchParams.invite ? INVITE_MESSAGES[searchParams.invite] : null;
  const page = parsePage(searchParams.page);

  const where = q
    ? {
        OR: [
          { email: { contains: q, mode: "insensitive" as const } },
          { name: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  const [total, users] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      include: { credits: true, _count: { select: { generatedCVs: true } } },
      orderBy: { createdAt: "desc" },
      skip: paginationSkip(page),
      take: DEFAULT_PAGE_SIZE,
    }),
  ]);

  return (
    <article className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-bold">Utilisateurs</h1>
          <p className="text-sm text-muted-foreground">
            <Link href="/admin/activity" className="underline hover:text-foreground">
              Voir le journal d&apos;activité
            </Link>
          </p>
        </div>
        {/* biome-ignore lint/a11y/useSemanticElements: the <search> element lacks Safari support */}
        <form method="get" role="search" className="flex gap-2">
          <label htmlFor="q" className="sr-only">
            Rechercher un utilisateur
          </label>
          <Input
            id="q"
            name="q"
            defaultValue={q}
            placeholder="Rechercher par email ou nom…"
            className="w-64"
          />
          <Button type="submit" variant="outline">
            <Search />
            Rechercher
          </Button>
        </form>
      </header>

      {searchParams.deleted ? (
        <Alert variant="success" title="Compte effacé">
          L&apos;utilisateur et ses données associées ont été supprimés.
        </Alert>
      ) : null}

      <section
        aria-label="Inviter un administrateur"
        className="rounded-lg border bg-card p-4 shadow-sm"
      >
        <h2 className="text-sm font-bold">Inviter un administrateur</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          La personne reçoit un lien d&apos;invitation par email et choisit son mot de passe.
        </p>
        {inviteMessage ? (
          <p
            role={inviteMessage.tone === "error" ? "alert" : "status"}
            className={
              inviteMessage.tone === "error"
                ? "mt-2 rounded-md bg-destructive/10 p-2 text-sm text-destructive"
                : "mt-2 rounded-md bg-emerald-50 p-2 text-sm text-emerald-700"
            }
          >
            {inviteMessage.text}
          </p>
        ) : null}
        <form action={inviteAdmin} className="mt-3 flex flex-wrap items-center gap-2">
          <label htmlFor="invite-email" className="sr-only">
            Email du nouvel administrateur
          </label>
          <Input
            id="invite-email"
            name="email"
            type="email"
            required
            placeholder="admin@exemple.fr"
            className="w-64"
          />
          <Button type="submit" variant="outline">
            <UserPlus />
            Inviter
          </Button>
        </form>
      </section>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th scope="col" className="p-3 font-medium">
                Utilisateur
              </th>
              <th scope="col" className="p-3 font-medium">
                Statut
              </th>
              <th scope="col" className="p-3 font-medium">
                Rôle
              </th>
              <th scope="col" className="p-3 font-medium">
                Crédits
              </th>
              <th scope="col" className="p-3 font-medium">
                CV
              </th>
              <th scope="col" className="p-3 font-medium">
                Inscrit le
              </th>
              <th scope="col" className="p-3 font-medium">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t align-middle">
                <td className="p-3">
                  <p className="font-medium">{user.email}</p>
                  {user.name ? <p className="text-xs text-muted-foreground">{user.name}</p> : null}
                </td>
                <td className="p-3">
                  {user.archivedAt ? (
                    <Badge variant="destructive">Archivé</Badge>
                  ) : (
                    <Badge variant="secondary">Actif</Badge>
                  )}
                </td>
                <td className="p-3">
                  <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                    {user.role}
                  </Badge>
                </td>
                <td className="p-3 font-medium">{user.credits?.balance ?? 0}</td>
                <td className="p-3">{user._count.generatedCVs}</td>
                <td className="p-3 text-muted-foreground">{dateFr(user.createdAt)}</td>
                <td className="p-3">
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <form action={adjustCredits} className="flex items-center gap-1.5">
                        <input type="hidden" name="userId" value={user.id} />
                        <label htmlFor={`delta-${user.id}`} className="sr-only">
                          Ajustement de crédits pour {user.email}
                        </label>
                        <Input
                          id={`delta-${user.id}`}
                          name="delta"
                          type="number"
                          min={-1000}
                          max={1000}
                          defaultValue={0}
                          className="h-8 w-20"
                        />
                        <Button type="submit" size="sm" variant="outline">
                          Ajuster
                        </Button>
                      </form>
                      {user.id !== session!.user.id ? (
                        <form action={setUserRole}>
                          <input type="hidden" name="userId" value={user.id} />
                          <input
                            type="hidden"
                            name="role"
                            value={user.role === "ADMIN" ? "USER" : "ADMIN"}
                          />
                          <Button type="submit" size="sm" variant="ghost">
                            {user.role === "ADMIN" ? "Rétrograder" : "Promouvoir admin"}
                          </Button>
                        </form>
                      ) : null}
                    </div>
                    <AdminUserLifecycleActions
                      userId={user.id}
                      email={user.email}
                      archived={!!user.archivedAt}
                      isSelf={user.id === session!.user.id}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {users.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucun utilisateur ne correspond à la recherche.
        </p>
      ) : null}

      <Pagination
        pathname="/admin/users"
        searchParams={searchParams}
        page={page}
        totalPages={totalPages(total)}
        totalItems={total}
      />
    </article>
  );
}
