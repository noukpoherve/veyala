import type { Metadata } from "next";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { getLocale } from "@/i18n/get-locale";
import { getMessages } from "@/i18n/messages";
import { formatCurrency } from "@/i18n/format";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getMessages(getLocale()).adminUi.meta.stats };
}

/** Single-hue horizontal bars: magnitude comparison, direct labels, table semantics. */
function BarList({
  title,
  rows,
  emptyLabel,
}: {
  title: string;
  rows: { label: string; value: number; display: string }[];
  emptyLabel: string;
}) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyLabel}</p>
        ) : (
          <table className="w-full text-sm">
            <tbody>
              {rows.map((row) => (
                <tr key={row.label}>
                  <th
                    scope="row"
                    className="w-32 py-1.5 pr-3 text-left font-normal text-muted-foreground"
                  >
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

export default async function AdminStatsPage() {
  const locale = getLocale();
  const m = getMessages(locale);
  const t = m.adminUi.stats;
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
    label: t.packLabel(sale.creditsPurchased, formatCurrency(sale.amountCents, locale)),
    value: sale._count,
    display: t.salesCount(sale._count),
  }));

  return (
    <article className="space-y-6">
      <h1 className="font-display text-2xl font-bold">{m.admin.stats}</h1>

      <section aria-label={t.kpisLabel} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={m.admin.users} value={userCount} />
        <StatCard label={t.cvGenerated} value={cvCount} hint={t.cvGeneratedHint(cvCount30d)} />
        <StatCard
          label={t.revenue}
          value={formatCurrency(paidPayments._sum.amountCents ?? 0, locale)}
          hint={t.paymentsCount(paidPayments._count)}
        />
        <StatCard
          label={t.pendingTemplates}
          value={pendingTemplates}
          hint={pendingTemplates > 0 ? t.queueNotEmpty : t.queueEmpty}
        />
      </section>

      <section aria-label={t.chartsLabel} className="grid gap-4 lg:grid-cols-2">
        <BarList title={t.topPacks} rows={packRows} emptyLabel={t.noData} />
        <BarList
          title={t.creditsSold}
          emptyLabel={t.noData}
          rows={[
            {
              label: t.total,
              value: paidPayments._sum.creditsPurchased ?? 0,
              display: t.creditsValue(paidPayments._sum.creditsPurchased ?? 0),
            },
          ]}
        />
      </section>
    </article>
  );
}
