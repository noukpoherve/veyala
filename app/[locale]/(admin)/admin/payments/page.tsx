import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { parsePage, paginationSkip, totalPages, DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { getLocale } from "@/i18n/get-locale";
import { getMessages } from "@/i18n/messages";
import { formatCurrency, intlLocale } from "@/i18n/format";
import type { Locale } from "@/i18n/config";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getMessages(getLocale()).adminUi.meta.payments };
}

const dateTime = (d: Date, locale: Locale) =>
  new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "medium", timeStyle: "short" }).format(
    d
  );

const STATUS_VARIANT: Record<string, "success" | "secondary" | "destructive"> = {
  PAID: "success",
  PENDING: "secondary",
  FAILED: "destructive",
};

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const locale = getLocale();
  const m = getMessages(locale);
  const t = m.adminUi.payments;
  const statusLabel: Record<string, string> = {
    PAID: t.paid,
    PENDING: t.pending,
    FAILED: t.failed,
  };
  const page = parsePage(searchParams.page);
  const [total, payments] = await Promise.all([
    db.payment.count(),
    db.payment.findMany({
      include: {
        user: { select: { email: true } },
        promoCode: { select: { code: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: paginationSkip(page),
      take: DEFAULT_PAGE_SIZE,
    }),
  ]);

  return (
    <article className="space-y-6">
      <PageHeader title={m.admin.payments} />

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th scope="col" className="p-3 font-medium">
                {m.common.date}
              </th>
              <th scope="col" className="p-3 font-medium">
                {t.colUser}
              </th>
              <th scope="col" className="p-3 font-medium">
                {t.colAmount}
              </th>
              <th scope="col" className="p-3 font-medium">
                {m.common.credits}
              </th>
              <th scope="col" className="p-3 font-medium">
                {t.colPromo}
              </th>
              <th scope="col" className="p-3 font-medium">
                {m.common.status}
              </th>
              <th scope="col" className="p-3 font-medium">
                {t.colStripe}
              </th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id} className="border-t">
                <td className="p-3">{dateTime(payment.createdAt, locale)}</td>
                <td className="p-3">{payment.user.email}</td>
                <td className="p-3 font-medium">
                  {formatCurrency(payment.amountCents, locale)}
                  {payment.discountCents > 0 ? (
                    <span className="ml-1 text-xs text-emerald-700">
                      (−{formatCurrency(payment.discountCents, locale)})
                    </span>
                  ) : null}
                </td>
                <td className="p-3">+{payment.creditsPurchased}</td>
                <td className="p-3 font-mono text-xs">{payment.promoCode?.code ?? "—"}</td>
                <td className="p-3">
                  <Badge variant={STATUS_VARIANT[payment.status] ?? "secondary"}>
                    {statusLabel[payment.status] ?? t.pending}
                  </Badge>
                </td>
                <td className="p-3">
                  {payment.stripePaymentIntent ? (
                    <a
                      href={`https://dashboard.stripe.com/payments/${payment.stripePaymentIntent}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-primary underline"
                    >
                      {t.stripeLink}
                      <ExternalLink className="size-3.5" aria-hidden />
                    </a>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {payments.length === 0 ? <p className="text-sm text-muted-foreground">{t.empty}</p> : null}

      <Pagination
        pathname="/admin/payments"
        searchParams={searchParams}
        page={page}
        totalPages={totalPages(total)}
        totalItems={total}
      />
    </article>
  );
}
