import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { describeActivity, formatActivityMeta } from "@/lib/activity-labels";
import { parsePage, paginationSkip, totalPages, DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { Pagination } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { getLocale } from "@/i18n/get-locale";
import { getMessages } from "@/i18n/messages";
import { Link } from "@/i18n/navigation";
import { intlLocale } from "@/i18n/format";
import type { Locale } from "@/i18n/config";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getMessages(getLocale()).adminUi.meta.activity };
}

const dateTime = (d: Date, locale: Locale) =>
  new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "short", timeStyle: "medium" }).format(
    d
  );

export default async function AdminActivityPage({
  searchParams,
}: {
  searchParams: { userId?: string; q?: string; page?: string };
}) {
  await requireAdmin();
  const locale = getLocale();
  const m = getMessages(locale);
  const t = m.adminUi.activity;
  const userId = searchParams.userId?.trim();
  const q = searchParams.q?.trim();
  const page = parsePage(searchParams.page);

  const where = {
    AND: [
      userId ? { OR: [{ subjectUserId: userId }, { actorId: userId }] } : {},
      q
        ? {
            OR: [
              { action: { contains: q, mode: "insensitive" as const } },
              // Allow searching French-ish terms mapped to known actions
              ...(q.toLowerCase().includes("paiement") || q.toLowerCase().includes("pay")
                ? [{ action: { startsWith: "payment." } }]
                : []),
              ...(q.toLowerCase().includes("crédit") || q.toLowerCase().includes("credit")
                ? [{ action: { contains: "credits" } }]
                : []),
            ],
          }
        : {},
    ],
  };

  const [total, logs] = await Promise.all([
    db.activityLog.count({ where }),
    db.activityLog.findMany({
      where,
      include: {
        actor: { select: { email: true } },
        subject: { select: { email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: paginationSkip(page),
      take: DEFAULT_PAGE_SIZE,
    }),
  ]);

  return (
    <article className="space-y-6">
      <PageHeader
        title={t.title}
        description={
          <>
            {t.description}{" "}
            <Link href="/admin/users" className="underline hover:text-foreground">
              {t.backToUsers}
            </Link>
          </>
        }
      />

      <form method="get" className="flex flex-wrap gap-2">
        <label htmlFor="userId" className="sr-only">
          {t.userIdLabel}
        </label>
        <input
          id="userId"
          name="userId"
          defaultValue={userId}
          placeholder={t.userIdPlaceholder}
          className="h-10 rounded-md border px-3 text-sm"
        />
        <label htmlFor="q" className="sr-only">
          {m.common.filter}
        </label>
        <input
          id="q"
          name="q"
          defaultValue={q}
          placeholder={t.queryPlaceholder}
          className="h-10 min-w-[16rem] rounded-md border px-3 text-sm"
        />
        <button type="submit" className="h-10 rounded-md border px-4 text-sm font-medium">
          {m.common.filter}
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th scope="col" className="p-3 font-medium">
                {t.colWhen}
              </th>
              <th scope="col" className="p-3 font-medium">
                {t.colEvent}
              </th>
              <th scope="col" className="p-3 font-medium">
                {t.colActor}
              </th>
              <th scope="col" className="p-3 font-medium">
                {t.colTarget}
              </th>
              <th scope="col" className="p-3 font-medium">
                {t.colDetails}
              </th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => {
              const desc = describeActivity(log.action, locale);
              const meta = formatActivityMeta(log.meta, locale);
              const isPayment = log.action.startsWith("payment.");
              return (
                <tr key={log.id} className="border-t align-top">
                  <td className="p-3 whitespace-nowrap text-muted-foreground">
                    {dateTime(log.createdAt, locale)}
                  </td>
                  <td className="p-3">
                    <div className="font-medium">{desc.title}</div>
                    <p className="text-xs text-muted-foreground">{desc.description}</p>
                    <p className="mt-1 font-mono text-[10px] text-muted-foreground/80">
                      {log.action}
                    </p>
                    {isPayment ? (
                      <Badge
                        variant={log.action === "payment.paid" ? "success" : "secondary"}
                        className="mt-1"
                      >
                        {log.action === "payment.paid"
                          ? t.paymentOk
                          : log.action === "payment.failed"
                            ? t.paymentFailed
                            : t.paymentCheckout}
                      </Badge>
                    ) : null}
                  </td>
                  <td className="p-3">{log.actor?.email ?? "—"}</td>
                  <td className="p-3">{log.subject?.email ?? "—"}</td>
                  <td className="p-3">
                    {meta.length === 0 ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <ul className="space-y-0.5 text-xs">
                        {meta.map((entry) => (
                          <li key={entry.label}>
                            <span className="text-muted-foreground">
                              {t.metaLabel(entry.label)}
                            </span>{" "}
                            <span className="font-medium">{entry.value}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {logs.length === 0 ? <p className="text-sm text-muted-foreground">{t.empty}</p> : null}

      <Pagination
        pathname="/admin/activity"
        searchParams={searchParams}
        page={page}
        totalPages={totalPages(total)}
        totalItems={total}
      />
    </article>
  );
}
