import type { Metadata } from "next";
import { Coins } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getActivePacks } from "@/lib/cached";
import { getBalance } from "@/lib/credits";
import { BillingCheckout } from "@/components/billing/billing-checkout";
import { BillingPaymentSync } from "@/components/billing/billing-payment-sync";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Pagination } from "@/components/ui/pagination";
import { parsePage, paginationSkip, totalPages, DEFAULT_PAGE_SIZE } from "@/lib/pagination";

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

const STATUS_LABELS: Record<
  string,
  { label: string; variant: "success" | "secondary" | "destructive" }
> = {
  PAID: { label: "Payé", variant: "success" },
  PENDING: { label: "En attente", variant: "secondary" },
  FAILED: { label: "Échoué", variant: "destructive" },
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams: { status?: string; page?: string; lpage?: string };
}) {
  const session = await auth();
  const userId = session!.user.id;
  const paymentsPage = parsePage(searchParams.page);
  const ledgerPage = parsePage(searchParams.lpage);

  const [balance, packs, paymentsTotal, payments, txTotal, transactions] = await Promise.all([
    getBalance(userId),
    getActivePacks(),
    db.payment.count({ where: { userId } }),
    db.payment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip: paginationSkip(paymentsPage),
      take: DEFAULT_PAGE_SIZE,
      include: { promoCode: { select: { code: true } } },
    }),
    db.creditTransaction.count({ where: { userId } }),
    db.creditTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip: paginationSkip(ledgerPage),
      take: DEFAULT_PAGE_SIZE,
    }),
  ]);

  const highlighted = Math.floor(packs.length / 2);
  const pendingExists = await db.payment.count({
    where: { userId, status: "PENDING" },
  });

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

      {searchParams.status === "success" ? <BillingPaymentSync auto /> : null}
      {searchParams.status === "cancelled" ? (
        <Alert variant="info" title="Paiement annulé">
          Aucun montant n&apos;a été débité. Vous pouvez réessayer quand vous voulez.
        </Alert>
      ) : null}

      {pendingExists > 0 && searchParams.status !== "success" ? (
        <Alert variant="info" title="Un paiement récent est encore en cours de traitement">
          <p className="mb-3">
            Un achat est resté « En attente » (souvent une page de paiement ouverte puis fermée sans
            aller au bout). La synchronisation met le statut à jour ;{" "}
            <strong>elle ne re-crédite jamais</strong> un achat déjà marqué « Payé ».
          </p>
          <BillingPaymentSync auto={false} />
        </Alert>
      ) : null}

      <section aria-labelledby="packs-title" className="space-y-4">
        <h2 id="packs-title" className="font-display text-lg font-semibold">
          Recharger mon compte
        </h2>
        <BillingCheckout packs={packs} highlightedIndex={highlighted} />
      </section>

      <section aria-labelledby="payments-title" className="space-y-3">
        <h2 id="payments-title" className="font-display text-lg font-semibold">
          Historique des paiements
        </h2>
        {payments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun paiement pour le moment.</p>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th scope="col" className="p-3 font-medium">
                      Date
                    </th>
                    <th scope="col" className="p-3 font-medium">
                      Montant
                    </th>
                    <th scope="col" className="p-3 font-medium">
                      Crédits
                    </th>
                    <th scope="col" className="p-3 font-medium">
                      Promo
                    </th>
                    <th scope="col" className="p-3 font-medium">
                      Statut
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => {
                    const status = STATUS_LABELS[p.status] ?? STATUS_LABELS.PENDING!;
                    return (
                      <tr key={p.id} className="border-t">
                        <td className="p-3">{dateFr(p.createdAt)}</td>
                        <td className="p-3">
                          {euros(p.amountCents)}
                          {p.discountCents > 0 ? (
                            <span className="ml-1 text-xs text-emerald-700">
                              (−{euros(p.discountCents)})
                            </span>
                          ) : null}
                        </td>
                        <td className="p-3">
                          {p.status === "PAID" ? `+${p.creditsPurchased}` : p.creditsPurchased}
                        </td>
                        <td className="p-3 font-mono text-xs">{p.promoCode?.code ?? "—"}</td>
                        <td className="p-3">
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination
              pathname="/billing"
              searchParams={searchParams}
              page={paymentsPage}
              totalPages={totalPages(paymentsTotal)}
              totalItems={paymentsTotal}
            />
          </>
        )}
      </section>

      <section aria-labelledby="transactions-title" className="space-y-3">
        <h2 id="transactions-title" className="font-display text-lg font-semibold">
          Mouvements de crédits
        </h2>
        {transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun mouvement pour le moment.</p>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th scope="col" className="p-3 font-medium">
                      Date
                    </th>
                    <th scope="col" className="p-3 font-medium">
                      Motif
                    </th>
                    <th scope="col" className="p-3 font-medium">
                      Crédits
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id} className="border-t">
                      <td className="p-3">{dateFr(t.createdAt)}</td>
                      <td className="p-3">{REASON_LABELS[t.reason] ?? t.reason}</td>
                      <td
                        className={`p-3 font-medium ${t.delta > 0 ? "text-emerald-600" : "text-destructive"}`}
                      >
                        {t.delta > 0 ? `+${t.delta}` : t.delta}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              pathname="/billing"
              searchParams={searchParams}
              page={ledgerPage}
              totalPages={totalPages(txTotal)}
              totalItems={txTotal}
              pageParam="lpage"
            />
          </>
        )}
      </section>
    </article>
  );
}
