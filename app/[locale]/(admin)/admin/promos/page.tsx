import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { createPromoCode, togglePromoCode, updatePromoCode } from "./actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { parsePage, paginationSkip, totalPages, DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { getLocale } from "@/i18n/get-locale";
import { getMessages, type Messages } from "@/i18n/messages";
import { formatCurrency, intlLocale } from "@/i18n/format";
import type { Locale } from "@/i18n/config";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getMessages(getLocale()).adminUi.meta.promos };
}

const dateTime = (d: Date, locale: Locale) =>
  new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "medium", timeStyle: "short" }).format(
    d
  );

function kindLabel(
  p: {
    kind: string;
    percentOff: number | null;
    amountOffCents: number | null;
    bonusCredits: number | null;
  },
  t: Messages["adminUi"]["promos"],
  locale: Locale
) {
  if (p.kind === "PERCENT") return t.benefitPercent(p.percentOff ?? 0);
  if (p.kind === "FIXED_CENTS")
    return t.benefitFixed(formatCurrency(p.amountOffCents ?? 0, locale));
  return t.benefitBonus(p.bonusCredits ?? 0);
}

export default async function AdminPromosPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  await requireAdmin();
  const locale = getLocale();
  const m = getMessages(locale);
  const t = m.adminUi.promos;
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
      <PageHeader title={m.admin.promos} description={t.description} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.createTitle}</CardTitle>
          <CardDescription>{t.createHint}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createPromoCode} className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="code">{t.code}</Label>
              <Input
                id="code"
                name="code"
                required
                placeholder={t.codePlaceholder}
                className="w-40 uppercase"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="kind">{t.kind}</Label>
              <select
                id="kind"
                name="kind"
                required
                className="flex h-10 rounded-md border border-input bg-background px-3 text-sm"
                defaultValue="PERCENT"
              >
                <option value="PERCENT">{t.kindPercent}</option>
                <option value="FIXED_CENTS">{t.kindFixed}</option>
                <option value="BONUS_CREDITS">{t.kindBonus}</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="percentOff">{t.percentOff}</Label>
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
              <Label htmlFor="amountOffCents">{t.amountOff}</Label>
              <Input
                id="amountOffCents"
                name="amountOffCents"
                type="number"
                min={50}
                className="w-28"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bonusCredits">{t.bonusCredits}</Label>
              <Input id="bonusCredits" name="bonusCredits" type="number" min={1} className="w-28" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="packId">{t.pack}</Label>
              <select
                id="packId"
                name="packId"
                className="flex h-10 rounded-md border border-input bg-background px-3 text-sm"
                defaultValue=""
              >
                <option value="">{t.allPacksOption}</option>
                {packs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="maxRedemptions">{t.maxRedemptions}</Label>
              <Input
                id="maxRedemptions"
                name="maxRedemptions"
                type="number"
                min={1}
                className="w-24"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="perUserLimit">{t.perUserLimit}</Label>
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
              <Label htmlFor="expiresAt">{t.expiresAt}</Label>
              <Input id="expiresAt" name="expiresAt" type="datetime-local" className="w-52" />
            </div>
            <Button type="submit">{m.common.create}</Button>
          </form>
        </CardContent>
      </Card>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th scope="col" className="p-3 font-medium">
                {t.code}
              </th>
              <th scope="col" className="p-3 font-medium">
                {t.colBenefit}
              </th>
              <th scope="col" className="p-3 font-medium">
                {t.colRedemptions}
              </th>
              <th scope="col" className="p-3 font-medium">
                {t.colRestrictions}
              </th>
              <th scope="col" className="p-3 font-medium">
                {m.common.status}
              </th>
              <th scope="col" className="p-3 font-medium">
                {m.common.actions}
              </th>
            </tr>
          </thead>
          <tbody>
            {promos.map((p) => {
              const expired = p.expiresAt != null && p.expiresAt.getTime() < Date.now();
              return (
                <tr key={p.id} className="border-t align-top">
                  <td className="p-3 font-mono font-medium">{p.code}</td>
                  <td className="p-3">{kindLabel(p, t, locale)}</td>
                  <td className="p-3">
                    {p.redemptionCount}
                    {p.maxRedemptions != null ? ` / ${p.maxRedemptions}` : ""}
                  </td>
                  <td className="p-3 text-muted-foreground">
                    <div>{p.pack?.label ?? t.allPacks}</div>
                    <div>{t.perUser(p.perUserLimit)}</div>
                    <div>
                      {p.expiresAt ? t.expiresOn(dateTime(p.expiresAt, locale)) : t.noExpiry}
                    </div>
                  </td>
                  <td className="p-3">
                    {expired ? (
                      <Badge variant="destructive">{t.expired}</Badge>
                    ) : p.active ? (
                      <Badge variant="success">{t.active}</Badge>
                    ) : (
                      <Badge variant="secondary">{t.inactive}</Badge>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-col gap-2">
                      <form action={togglePromoCode}>
                        <input type="hidden" name="promoId" value={p.id} />
                        <Button type="submit" size="sm" variant="outline">
                          {p.active ? t.deactivate : t.activate}
                        </Button>
                      </form>
                      <form action={updatePromoCode} className="flex flex-wrap gap-2">
                        <input type="hidden" name="promoId" value={p.id} />
                        <select
                          name="packId"
                          defaultValue={p.packId ?? ""}
                          className="h-9 rounded-md border px-2 text-xs"
                        >
                          <option value="">{t.allPacks}</option>
                          {packs.map((pack) => (
                            <option key={pack.id} value={pack.id}>
                              {pack.label}
                            </option>
                          ))}
                        </select>
                        <Input
                          name="maxRedemptions"
                          type="number"
                          placeholder={t.maxPlaceholder}
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
                          {t.updateShort}
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

      {promos.length === 0 ? <p className="text-sm text-muted-foreground">{t.empty}</p> : null}

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
