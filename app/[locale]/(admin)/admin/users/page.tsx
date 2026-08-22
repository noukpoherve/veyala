import type { Metadata } from "next";
import { Search, UserPlus } from "lucide-react";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { adjustCredits, inviteAdmin, setUserRole } from "./actions";
import { AdminUserLifecycleActions } from "@/components/admin/user-lifecycle-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { parsePage, paginationSkip, totalPages, DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { getLocale } from "@/i18n/get-locale";
import { getMessages } from "@/i18n/messages";
import { Link } from "@/i18n/navigation";
import { formatDate } from "@/i18n/format";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getMessages(getLocale()).adminUi.meta.users };
}

const INVITE_TONES = {
  sent: "success",
  exists: "error",
  invalid: "error",
  failed: "error",
} as const satisfies Record<string, "success" | "error">;

type InviteKey = keyof typeof INVITE_TONES;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { q?: string; invite?: string; deleted?: string; page?: string };
}) {
  const session = await auth();
  const locale = getLocale();
  const m = getMessages(locale);
  const t = m.adminUi.users;
  const q = searchParams.q?.trim() ?? "";
  const inviteKey = searchParams.invite as InviteKey | undefined;
  const inviteTone = inviteKey ? INVITE_TONES[inviteKey] : undefined;
  const inviteText = inviteKey && inviteTone ? t.invite[inviteKey] : undefined;
  const page = parsePage(searchParams.page);

  const where = q
    ? {
        OR: [
          { email: { contains: q, mode: "insensitive" as const } },
          { name: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  const [total, users] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      include: { credits: true, _count: { select: { generatedCVs: true } } },
      orderBy: { createdAt: "desc" },
      skip: paginationSkip(page),
      take: DEFAULT_PAGE_SIZE,
    }),
  ]);

  return (
    <article className="space-y-6">
      <PageHeader
        title={m.admin.users}
        description={
          <Link href="/admin/activity" className="underline hover:text-foreground">
            {t.activityLink}
          </Link>
        }
        actions={
          // biome-ignore lint/a11y/useSemanticElements: the <search> element lacks Safari support
          <form method="get" role="search" className="flex gap-2">
            <label htmlFor="q" className="sr-only">
              {t.searchLabel}
            </label>
            <Input
              id="q"
              name="q"
              defaultValue={q}
              placeholder={t.searchPlaceholder}
              className="w-64"
            />
            <Button type="submit" variant="outline">
              <Search />
              {m.common.search}
            </Button>
          </form>
        }
      />

      {searchParams.deleted ? (
        <Alert variant="success" title={t.deletedTitle}>
          {t.deletedBody}
        </Alert>
      ) : null}

      <section aria-label={t.inviteTitle} className="rounded-lg border bg-card p-4 shadow-sm">
        <h2 className="text-sm font-bold">{t.inviteTitle}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{t.inviteHint}</p>
        {inviteText ? (
          <p
            role={inviteTone === "error" ? "alert" : "status"}
            className={
              inviteTone === "error"
                ? "mt-2 rounded-md bg-destructive/10 p-2 text-sm text-destructive"
                : "mt-2 rounded-md bg-emerald-50 p-2 text-sm text-emerald-700"
            }
          >
            {inviteText}
          </p>
        ) : null}
        <form action={inviteAdmin} className="mt-3 flex flex-wrap items-center gap-2">
          <label htmlFor="invite-email" className="sr-only">
            {t.inviteEmailLabel}
          </label>
          <Input
            id="invite-email"
            name="email"
            type="email"
            required
            placeholder={t.inviteEmailPlaceholder}
            className="w-64"
          />
          <Button type="submit" variant="outline">
            <UserPlus />
            {t.inviteCta}
          </Button>
        </form>
      </section>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th scope="col" className="p-3 font-medium">
                {t.colUser}
              </th>
              <th scope="col" className="p-3 font-medium">
                {m.common.status}
              </th>
              <th scope="col" className="p-3 font-medium">
                {t.colRole}
              </th>
              <th scope="col" className="p-3 font-medium">
                {m.common.credits}
              </th>
              <th scope="col" className="p-3 font-medium">
                {t.colCvs}
              </th>
              <th scope="col" className="p-3 font-medium">
                {t.colSignedUp}
              </th>
              <th scope="col" className="p-3 font-medium">
                {m.common.actions}
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t align-middle">
                <td className="p-3">
                  <p className="font-medium">{user.email}</p>
                  {user.name ? <p className="text-xs text-muted-foreground">{user.name}</p> : null}
                </td>
                <td className="p-3">
                  {user.archivedAt ? (
                    <Badge variant="destructive">{t.archived}</Badge>
                  ) : (
                    <Badge variant="secondary">{t.active}</Badge>
                  )}
                </td>
                <td className="p-3">
                  <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                    {user.role}
                  </Badge>
                </td>
                <td className="p-3 font-medium">{user.credits?.balance ?? 0}</td>
                <td className="p-3">{user._count.generatedCVs}</td>
                <td className="p-3 text-muted-foreground">{formatDate(user.createdAt, locale)}</td>
                <td className="p-3">
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <form action={adjustCredits} className="flex items-center gap-1.5">
                        <input type="hidden" name="userId" value={user.id} />
                        <label htmlFor={`delta-${user.id}`} className="sr-only">
                          {t.creditsDeltaLabel(user.email)}
                        </label>
                        <Input
                          id={`delta-${user.id}`}
                          name="delta"
                          type="number"
                          min={-1000}
                          max={1000}
                          defaultValue={0}
                          className="h-8 w-20"
                        />
                        <Button type="submit" size="sm" variant="outline">
                          {t.adjust}
                        </Button>
                      </form>
                      {user.id !== session!.user.id ? (
                        <form action={setUserRole}>
                          <input type="hidden" name="userId" value={user.id} />
                          <input
                            type="hidden"
                            name="role"
                            value={user.role === "ADMIN" ? "USER" : "ADMIN"}
                          />
                          <Button type="submit" size="sm" variant="ghost">
                            {user.role === "ADMIN" ? t.demote : t.promote}
                          </Button>
                        </form>
                      ) : null}
                    </div>
                    <AdminUserLifecycleActions
                      userId={user.id}
                      email={user.email}
                      archived={!!user.archivedAt}
                      isSelf={user.id === session!.user.id}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {users.length === 0 ? <p className="text-sm text-muted-foreground">{t.empty}</p> : null}

      <Pagination
        pathname="/admin/users"
        searchParams={searchParams}
        page={page}
        totalPages={totalPages(total)}
        totalItems={total}
      />
    </article>
  );
}
