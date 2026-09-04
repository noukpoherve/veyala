"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getLocale } from "@/i18n/get-locale";
import { getMessages } from "@/i18n/messages";

export type DismissTourResult = { ok: true } | { ok: false; error: string };

const kindSchema = z.enum(["welcome", "result"]);

/** Marks a product tour as seen for the signed-in user. */
export async function dismissTour(kind: unknown = "welcome"): Promise<DismissTourResult> {
  const locale = getLocale();
  const m = getMessages(locale);
  const session = await auth();
  if (!session?.user) return { ok: false, error: m.errors.authRequired };

  const parsed = kindSchema.safeParse(kind);
  if (!parsed.success) return { ok: false, error: m.errors.invalidData };

  await db.user.update({
    where: { id: session.user.id },
    data:
      parsed.data === "welcome"
        ? { tourDismissedAt: new Date() }
        : { editorTourDismissedAt: new Date() },
  });

  return { ok: true };
}
