"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { isMailerConfigured, sendSupportReplyEmail } from "@/lib/mailer";
import { reportError } from "@/lib/sentry";
import { getLocale } from "@/i18n/get-locale";
import { redirectLocalized } from "@/i18n/redirect";
import { toInternalPath } from "@/i18n/path";

const replySchema = z.object({
  threadId: z.string().min(1),
  body: z.string().trim().min(1).max(5000),
});

export async function adminReplyToThread(formData: FormData) {
  await requireAdmin();
  const locale = getLocale();
  const parsed = replySchema.safeParse({
    threadId: formData.get("threadId"),
    body: formData.get("body"),
  });
  if (!parsed.success) redirectLocalized("/admin/inbox", locale);

  const thread = await db.supportThread.findUnique({
    where: { id: parsed.data.threadId },
    include: { user: { select: { email: true } } },
  });
  if (!thread) redirectLocalized("/admin/inbox", locale);

  await db.supportThread.update({
    where: { id: thread.id },
    data: {
      status: "OPEN",
      messages: { create: { body: parsed.data.body, fromAdmin: true } },
    },
  });

  // Email delivery is best-effort; the reply always lands in the user's Support page.
  if (isMailerConfigured() && thread.user.email) {
    try {
      await sendSupportReplyEmail({
        to: thread.user.email,
        subject: thread.subject,
        body: parsed.data.body,
      });
    } catch (error) {
      reportError(error, "admin/inbox/reply-email");
    }
  }

  revalidatePath(toInternalPath("/admin/inbox", locale));
  redirectLocalized(`/admin/inbox/${thread.id}`, locale);
}

export async function setThreadStatus(formData: FormData) {
  await requireAdmin();
  const locale = getLocale();
  const threadId = String(formData.get("threadId") ?? "");
  const status = formData.get("status") === "CLOSED" ? "CLOSED" : "OPEN";
  if (!threadId) redirectLocalized("/admin/inbox", locale);

  await db.supportThread.update({ where: { id: threadId }, data: { status } });
  revalidatePath(toInternalPath("/admin/inbox", locale));
  redirectLocalized(`/admin/inbox/${threadId}`, locale);
}
