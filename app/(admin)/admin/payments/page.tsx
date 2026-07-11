import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Paiements · Admin" };

const euros = (cents: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(cents / 100);

const dateFr = (d: Date) =>
  new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(d);

const STATUS: Record<string, { label: string; variant: "success" | "secondary" | "destructive" }> = {
  PAID: { label: "Payé", variant: "success" },
  PENDING: { label: "En attente", variant: "secondary" },
  FAILED: { label: "Échoué", variant: "destructive" },
};

export default async function AdminPaymentsPage() {
  const payments = await db.payment.findMany({
    include: { user: { select: { email: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <article className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Paiements</h1>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th scope="col" className="p-3 font-medium">Date</th>
              <th scope="col" className="p-3 font-medium">Utilisateur</th>
              <th scope="col" className="p-3 font-medium">Montant</th>
              <th scope="col" className="p-3 font-medium">Crédits</th>
              <th scope="col" className="p-3 font-medium">Statut</th>
              <th scope="col" className="p-3 font-medium">Stripe</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => {
              const status = STATUS[payment.status] ?? STATUS.PENDING!;
              return (
                <tr key={payment.id} className="border-t">
                  <td className="p-3">{dateFr(payment.createdAt)}</td>
                  <td className="p-3">{payment.user.email}</td>
                  <td className="p-3 font-medium">{euros(payment.amountCents)}</td>
                  <td className="p-3">+{payment.creditsPurchased}</td>
                  <td className="p-3">
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </td>
                  <td className="p-3">
                    {payment.stripePaymentIntent ? (
                      <a
                        href={`https://dashboard.stripe.com/test/payments/${payment.stripePaymentIntent}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-primary underline"
                      >
                        Voir / rembourser
                        <ExternalLink className="size-3.5" aria-hidden />
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {payments.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun paiement pour le moment.</p>
      ) : null}
    </article>
  );
}
