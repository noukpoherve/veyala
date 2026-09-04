"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getLocale } from "@/i18n/get-locale";
import { getMessages } from "@/i18n/messages";

export type DismissTourResult = { ok: true } | { ok: false; error: string };

/** Marks the first-run product tour as seen for the signed-in user. */
export async function dismissTour(): Promise<DismissTourResult> {
  const locale = getLocale();
  const m = getMessages(locale);
  const session = await auth();
  if (!session?.user) return { ok: false, error: m.errors.authRequired };

  await db.user.update({
    where: { id: session.user.id },
    data: { tourDismissedAt: new Date() },
  });

  return { ok: true };
}
