import type { Metadata } from "next";
import { CheckCircle2, Coins, XCircle } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBalance } from "@/lib/credits";
import { BuyPackButton } from "@/components/billing/buy-pack-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Crédits & factures" };

const euros = (cents: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(cents / 100);

const dateFr = (d: Date) =>
  new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(d);

const REASON_LABELS: Record<string, string> = {
  PURCHASE: "Achat de pack",
  GENERATION: "Génération de CV",
  ADMIN_ADJUST: "Ajustement admin",
  SIGNUP_BONUS: "Bonus d'inscription",
  REFUND: "Remboursement (échec)",
};

const STATUS_LABELS: Record<string, { label: string; variant: "success" | "secondary" | "destructive" }> = {
  PAID: { label: "Payé", variant: "success" },
  PENDING: { label: "En attente", variant: "secondary" },
  FAILED: { label: "Échoué", variant: "destructive" },
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const session = await auth();
  const userId = session!.user.id;

  const [balance, packs, payments, transactions] = await Promise.all([
    getBalance(userId),
    db.pack.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    db.payment.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 20 }),
    db.creditTransaction.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 30 }),
  ]);

  const highlighted = Math.floor(packs.length / 2);

  return (
    <article className="mx-auto max-w-4xl space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Crédits & factures</h1>
          <p className="text-sm text-muted-foreground">1 crédit = 1 génération de CV.</p>
        </div>
        <Badge variant="secondary" className="px-3 py-1.5 text-base">
          <Coins className="mr-1.5 size-4" aria-hidden />
          {balance} crédit{balance > 1 ? "s" : ""}
        </Badge>
      </header>

      {searchParams.status === "success" ? (
        <p role="status" className="flex items-center gap-2 rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900">
          <CheckCircle2 className="size-4" aria-hidden />
          Paiement confirmé ! Vos crédits sont ajoutés dès la réception du webhook Stripe
          (quelques secondes).
        </p>
      ) : null}
      {searchParams.status === "cancelled" ? (
        <p role="status" className="flex items-center gap-2 rounded-md border bg-muted p-3 text-sm text-muted-foreground">
          <XCircle className="size-4" aria-hidden />
          Paiement annulé — aucun montant débité.
        </p>
      ) : null}

      <section aria-labelledby="packs-title" className="space-y-4">
        <h2 id="packs-title" className="font-display text-lg font-semibold">
          Recharger mon compte
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {packs.map((pack, i) => (
            <Card key={pack.id} className={i === highlighted ? "border-primary shadow-md" : ""}>
              <CardHeader className="items-center text-center">
                {i === highlighted ? <Badge className="mb-1">Le plus populaire</Badge> : null}
                <CardTitle className="text-xl">{pack.label}</CardTitle>
                <CardDescription>
                  {pack.credits} génération{pack.credits > 1 ? "s" : ""} —{" "}
                  {euros(Math.round(pack.priceCents / pack.credits))}/CV
                </CardDescription>
                <p className="font-display text-3xl font-bold">{euros(pack.priceCents)}</p>
              </CardHeader>
              <CardContent>
                <BuyPackButton packId={pack.id} highlighted={i === highlighted} />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="payments-title" className="space-y-3">
        <h2 id="payments-title" className="font-display text-lg font-semibold">
          Historique des paiements
        </h2>
        {payments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun paiement pour le moment.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th scope="col" className="p-3 font-medium">Date</th>
                  <th scope="col" className="p-3 font-medium">Montant</th>
                  <th scope="col" className="p-3 font-medium">Crédits</th>
                  <th scope="col" className="p-3 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => {
                  const status = STATUS_LABELS[p.status] ?? STATUS_LABELS.PENDING!;
                  return (
                    <tr key={p.id} className="border-t">
                      <td className="p-3">{dateFr(p.createdAt)}</td>
                      <td className="p-3">{euros(p.amountCents)}</td>
                      <td className="p-3">+{p.creditsPurchased}</td>
                      <td className="p-3">
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-labelledby="transactions-title" className="space-y-3">
        <h2 id="transactions-title" className="font-display text-lg font-semibold">
          Mouvements de crédits
        </h2>
        {transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun mouvement pour le moment.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th scope="col" className="p-3 font-medium">Date</th>
                  <th scope="col" className="p-3 font-medium">Motif</th>
                  <th scope="col" className="p-3 font-medium">Crédits</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} className="border-t">
                    <td className="p-3">{dateFr(t.createdAt)}</td>
                    <td className="p-3">{REASON_LABELS[t.reason] ?? t.reason}</td>
                    <td className={`p-3 font-medium ${t.delta > 0 ? "text-emerald-600" : "text-destructive"}`}>
                      {t.delta > 0 ? `+${t.delta}` : t.delta}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </article>
  );
}
