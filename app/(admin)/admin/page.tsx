import type { Metadata } from "next";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Statistiques · Admin" };

const euros = (cents: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(cents / 100);

/** Single-hue horizontal bars: magnitude comparison, direct labels, table semantics. */
function BarList({
  title,
  rows,
  format,
}: {
  title: string;
  rows: { label: string; value: number; display: string }[];
  format?: never;
}) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune donnée pour le moment.</p>
        ) : (
          <table className="w-full text-sm">
            <tbody>
              {rows.map((row) => (
                <tr key={row.label}>
                  <th scope="row" className="w-32 py-1.5 pr-3 text-left font-normal text-muted-foreground">
                    {row.label}
                  </th>
                  <td className="py-1.5">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 rounded-r-sm bg-[#49558f]"
                        style={{ width: `${Math.max((row.value / max) * 100, 2)}%` }}
                        aria-hidden
                      />
                      <span className="whitespace-nowrap text-xs font-medium">{row.display}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}

function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-display text-3xl font-bold">{value}</p>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

export default async function AdminStatsPage() {
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [userCount, cvCount, cvCount30d, paidPayments, pendingTemplates, packSales] =
    await Promise.all([
      db.user.count(),
      db.generatedCV.count(),
      db.generatedCV.count({ where: { createdAt: { gte: since } } }),
      db.payment.aggregate({
        where: { status: "PAID" },
        _sum: { amountCents: true, creditsPurchased: true },
        _count: true,
      }),
      db.template.count({ where: { status: "PENDING" } }),
      db.payment.groupBy({
        by: ["creditsPurchased", "amountCents"],
        where: { status: "PAID" },
        _count: true,
        orderBy: { _count: { creditsPurchased: "desc" } },
      }),
    ]);

  const packRows = packSales.map((sale) => ({
    label: `${sale.creditsPurchased} CV — ${euros(sale.amountCents)}`,
    value: sale._count,
    display: `${sale._count} vente${sale._count > 1 ? "s" : ""}`,
  }));

  return (
    <article className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Statistiques</h1>

      <section aria-label="Indicateurs clés" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Utilisateurs" value={String(userCount)} />
        <StatTile label="CV générés" value={String(cvCount)} hint={`${cvCount30d} sur 30 jours`} />
        <StatTile
          label="Revenus"
          value={euros(paidPayments._sum.amountCents ?? 0)}
          hint={`${paidPayments._count} paiement${paidPayments._count > 1 ? "s" : ""}`}
        />
        <StatTile
          label="Templates à valider"
          value={String(pendingTemplates)}
          hint={pendingTemplates > 0 ? "File d'attente non vide" : "File d'attente vide"}
        />
      </section>

      <section aria-label="Graphiques" className="grid gap-4 lg:grid-cols-2">
        <BarList title="Packs les plus vendus" rows={packRows} />
        <BarList
          title="Crédits vendus"
          rows={[
            {
              label: "Total",
              value: paidPayments._sum.creditsPurchased ?? 0,
              display: `${paidPayments._sum.creditsPurchased ?? 0} crédits`,
            },
          ]}
        />
      </section>
    </article>
  );
}
