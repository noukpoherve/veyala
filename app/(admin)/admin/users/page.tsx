import type { Metadata } from "next";
import { Search } from "lucide-react";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { adjustCredits, setUserRole } from "./actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = { title: "Utilisateurs · Admin" };

const dateFr = (d: Date) => new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(d);

export default async function AdminUsersPage({ searchParams }: { searchParams: { q?: string } }) {
  const session = await auth();
  const q = searchParams.q?.trim() ?? "";

  const users = await db.user.findMany({
    where: q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: { credits: true, _count: { select: { generatedCVs: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <article className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold">Utilisateurs</h1>
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

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th scope="col" className="p-3 font-medium">
                Utilisateur
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
                  <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                    {user.role}
                  </Badge>
                </td>
                <td className="p-3 font-medium">{user.credits?.balance ?? 0}</td>
                <td className="p-3">{user._count.generatedCVs}</td>
                <td className="p-3 text-muted-foreground">{dateFr(user.createdAt)}</td>
                <td className="p-3">
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
    </article>
  );
}
