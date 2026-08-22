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
import { PageHeader } from "@/components/ui/page-header";
import { parsePage, paginationSkip, totalPages, DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { getLocale } from "@/i18n/get-locale";
import { getMessages } from "@/i18n/messages";
import { formatCurrency, intlLocale } from "@/i18n/format";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getMessages(getLocale()).seo.billingTitle };
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: { status?: string; page?: string; lpage?: string };
}) {
  const session = await auth();
  const locale = getLocale();
  const messages = getMessages(locale);
  const m = messages.pages.billing;
  const userId = session!.user.id;
  const paymentsPage = parsePage(searchParams.page);
  const ledgerPage = parsePage(searchParams.lpage);

  const money = (cents: number) => formatCurrency(cents, locale);
  const dateTime = new Intl.DateTimeFormat(intlLocale(locale), {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const reasonLabels = m.reasons as Record<string, string | undefined>;
  const statusLabels = m.paymentStatus as Record<string, string | undefined>;
  const statusVariants: Record<string, "success" | "secondary" | "destructive"> = {
    PAID: "success",
    PENDING: "secondary",
    FAILED: "destructive",
  };

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
      <PageHeader
        title={messages.app.billingTitle}
        description={messages.app.billingSubtitle}
        actions={
          <Badge variant="secondary" className="px-3 py-1.5 text-base">
            <Coins className="mr-1.5 size-4" aria-hidden />
            {messages.common.creditsCount(balance)}
          </Badge>
        }
      />

      {searchParams.status === "success" ? <BillingPaymentSync auto /> : null}
      {searchParams.status === "cancelled" ? (
        <Alert variant="info" title={m.cancelledTitle}>
          {m.cancelledBody}
        </Alert>
      ) : null}

      {pendingExists > 0 && searchParams.status !== "success" ? (
        <Alert variant="info" title={m.pendingTitle}>
          <p className="mb-3">
            {m.pendingBodyBefore} <strong>{m.pendingBodyStrong}</strong> {m.pendingBodyAfter}
          </p>
          <BillingPaymentSync auto={false} />
        </Alert>
      ) : null}

      <section aria-labelledby="packs-title" className="space-y-4">
        <h2 id="packs-title" className="font-display text-lg font-semibold">
          {m.packsTitle}
        </h2>
        <BillingCheckout packs={packs} highlightedIndex={highlighted} />
      </section>

      <section aria-labelledby="payments-title" className="space-y-3">
        <h2 id="payments-title" className="font-display text-lg font-semibold">
          {m.paymentsTitle}
        </h2>
        {payments.length === 0 ? (
          <p className="text-sm text-muted-foreground">{m.paymentsEmpty}</p>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th scope="col" className="p-3 font-medium">
                      {messages.common.date}
                    </th>
                    <th scope="col" className="p-3 font-medium">
                      {m.colAmount}
                    </th>
                    <th scope="col" className="p-3 font-medium">
                      {messages.common.credits}
                    </th>
                    <th scope="col" className="p-3 font-medium">
                      {m.colPromo}
                    </th>
                    <th scope="col" className="p-3 font-medium">
                      {messages.common.status}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-t">
                      <td className="p-3">{dateTime.format(p.createdAt)}</td>
                      <td className="p-3">
                        {money(p.amountCents)}
                        {p.discountCents > 0 ? (
                          <span className="ml-1 text-xs text-emerald-700">
                            (−{money(p.discountCents)})
                          </span>
                        ) : null}
                      </td>
                      <td className="p-3">
                        {p.status === "PAID" ? `+${p.creditsPurchased}` : p.creditsPurchased}
                      </td>
                      <td className="p-3 font-mono text-xs">
                        {p.promoCode?.code ?? messages.pages.noValue}
                      </td>
                      <td className="p-3">
                        <Badge variant={statusVariants[p.status] ?? "secondary"}>
                          {statusLabels[p.status] ?? statusLabels.PENDING}
                        </Badge>
                      </td>
                    </tr>
                  ))}
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
          {m.ledgerTitle}
        </h2>
        {transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground">{m.ledgerEmpty}</p>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th scope="col" className="p-3 font-medium">
                      {messages.common.date}
                    </th>
                    <th scope="col" className="p-3 font-medium">
                      {m.colReason}
                    </th>
                    <th scope="col" className="p-3 font-medium">
                      {messages.common.credits}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id} className="border-t">
                      <td className="p-3">{dateTime.format(t.createdAt)}</td>
                      <td className="p-3">{reasonLabels[t.reason] ?? t.reason}</td>
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
