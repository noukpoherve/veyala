import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { createPromoCode, togglePromoCode, updatePromoCode } from "./actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { parsePage, paginationSkip, totalPages, DEFAULT_PAGE_SIZE } from "@/lib/pagination";

export const metadata: Metadata = { title: "Codes promo · Admin" };

const euros = (cents: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(cents / 100);

const dateFr = (d: Date) =>
  new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(d);

function kindLabel(p: {
  kind: string;
  percentOff: number | null;
  amountOffCents: number | null;
  bonusCredits: number | null;
}) {
  if (p.kind === "PERCENT") return `−${p.percentOff}%`;
  if (p.kind === "FIXED_CENTS") return `−${euros(p.amountOffCents ?? 0)}`;
  return `+${p.bonusCredits ?? 0} crédits`;
}

export default async function AdminPromosPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  await requireAdmin();
  const page = parsePage(searchParams.page);
  const where = {};

  const [total, promos, packs] = await Promise.all([
    db.promoCode.count({ where }),
    db.promoCode.findMany({
      where,
      include: { pack: { select: { label: true } } },
      orderBy: { createdAt: "desc" },
      skip: paginationSkip(page),
      take: DEFAULT_PAGE_SIZE,
    }),
    db.pack.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  const pages = totalPages(total);

  return (
    <article className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold">Codes promo</h1>
        <p className="text-sm text-muted-foreground">
          Remises % / montant fixe, ou crédits bonus — appliqués avant Stripe Checkout.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Créer un code</CardTitle>
          <CardDescription>
            Exemples : PERCENT 20, FIXED_CENTS 500 (= 5 €), BONUS_CREDITS 3.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createPromoCode} className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                name="code"
                required
                placeholder="BIENVENUE20"
                className="w-40 uppercase"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="kind">Type</Label>
              <select
                id="kind"
                name="kind"
                required
                className="flex h-10 rounded-md border border-input bg-background px-3 text-sm"
                defaultValue="PERCENT"
              >
                <option value="PERCENT">Pourcentage</option>
                <option value="FIXED_CENTS">Montant fixe (cts)</option>
                <option value="BONUS_CREDITS">Crédits bonus</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="percentOff">% off</Label>
              <Input
                id="percentOff"
                name="percentOff"
                type="number"
                min={1}
                max={90}
                className="w-24"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="amountOffCents">Remise cts</Label>
              <Input
                id="amountOffCents"
                name="amountOffCents"
                type="number"
                min={50}
                className="w-28"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bonusCredits">Bonus crédits</Label>
              <Input id="bonusCredits" name="bonusCredits" type="number" min={1} className="w-28" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="packId">Pack (optionnel)</Label>
              <select
                id="packId"
                name="packId"
                className="flex h-10 rounded-md border border-input bg-background px-3 text-sm"
                defaultValue=""
              >
                <option value="">Tous les packs</option>
                {packs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="maxRedemptions">Max total</Label>
              <Input
                id="maxRedemptions"
                name="maxRedemptions"
                type="number"
                min={1}
                className="w-24"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="perUserLimit">Max / user</Label>
              <Input
                id="perUserLimit"
                name="perUserLimit"
                type="number"
                min={0}
                defaultValue={1}
                className="w-24"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="expiresAt">Expire le</Label>
              <Input id="expiresAt" name="expiresAt" type="datetime-local" className="w-52" />
            </div>
            <Button type="submit">Créer</Button>
          </form>
        </CardContent>
      </Card>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th scope="col" className="p-3 font-medium">
                Code
              </th>
              <th scope="col" className="p-3 font-medium">
                Avantage
              </th>
              <th scope="col" className="p-3 font-medium">
                Utilisations
              </th>
              <th scope="col" className="p-3 font-medium">
                Restrictions
              </th>
              <th scope="col" className="p-3 font-medium">
                Statut
              </th>
              <th scope="col" className="p-3 font-medium">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {promos.map((p) => {
              const expired = p.expiresAt != null && p.expiresAt.getTime() < Date.now();
              return (
                <tr key={p.id} className="border-t align-top">
                  <td className="p-3 font-mono font-medium">{p.code}</td>
                  <td className="p-3">{kindLabel(p)}</td>
                  <td className="p-3">
                    {p.redemptionCount}
                    {p.maxRedemptions != null ? ` / ${p.maxRedemptions}` : ""}
                  </td>
                  <td className="p-3 text-muted-foreground">
                    <div>{p.pack?.label ?? "Tous packs"}</div>
                    <div>Max/user : {p.perUserLimit}</div>
                    <div>{p.expiresAt ? `Expire ${dateFr(p.expiresAt)}` : "Sans expiration"}</div>
                  </td>
                  <td className="p-3">
                    {expired ? (
                      <Badge variant="destructive">Expiré</Badge>
                    ) : p.active ? (
                      <Badge variant="success">Actif</Badge>
                    ) : (
                      <Badge variant="secondary">Inactif</Badge>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-col gap-2">
                      <form action={togglePromoCode}>
                        <input type="hidden" name="promoId" value={p.id} />
                        <Button type="submit" size="sm" variant="outline">
                          {p.active ? "Désactiver" : "Activer"}
                        </Button>
                      </form>
                      <form action={updatePromoCode} className="flex flex-wrap gap-2">
                        <input type="hidden" name="promoId" value={p.id} />
                        <select
                          name="packId"
                          defaultValue={p.packId ?? ""}
                          className="h-9 rounded-md border px-2 text-xs"
                        >
                          <option value="">Tous packs</option>
                          {packs.map((pack) => (
                            <option key={pack.id} value={pack.id}>
                              {pack.label}
                            </option>
                          ))}
                        </select>
                        <Input
                          name="maxRedemptions"
                          type="number"
                          placeholder="Max"
                          defaultValue={p.maxRedemptions ?? ""}
                          className="h-9 w-20"
                        />
                        <Input
                          name="perUserLimit"
                          type="number"
                          defaultValue={p.perUserLimit}
                          className="h-9 w-20"
                        />
                        <Button type="submit" size="sm" variant="ghost">
                          Maj
                        </Button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {promos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun code promo pour le moment.</p>
      ) : null}

      <Pagination
        pathname="/admin/promos"
        searchParams={searchParams}
        page={page}
        totalPages={pages}
        totalItems={total}
      />
    </article>
  );
}
