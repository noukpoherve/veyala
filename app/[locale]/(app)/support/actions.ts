"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isMailerConfigured, sendSupportNotificationEmail } from "@/lib/mailer";
import { rateLimit } from "@/lib/rate-limit";
import { reportError } from "@/lib/sentry";
import { getLocale } from "@/i18n/get-locale";
import { localizePath } from "@/i18n/path";
import { redirectLocalized } from "@/i18n/redirect";

const threadSchema = z.object({
  subject: z.string().trim().min(3).max(120),
  body: z.string().trim().min(10).max(5000),
});

const replySchema = z.object({
  threadId: z.string().min(1),
  body: z.string().trim().min(1).max(5000),
});

function adminRecipients(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
}

async function notifyAdmins(userEmail: string, subject: string, body: string) {
  if (!isMailerConfigured()) return;
  try {
    await sendSupportNotificationEmail({ to: adminRecipients(), userEmail, subject, body });
  } catch (error) {
    // The message is stored in the inbox either way; email is best-effort.
    reportError(error, "support/notify");
  }
}

export async function createSupportThread(formData: FormData) {
  const locale = getLocale();
  const session = await auth();
  if (!session?.user) redirectLocalized("/login", locale);

  const parsed = threadSchema.safeParse({
    subject: formData.get("subject"),
    body: formData.get("body"),
  });
  if (!parsed.success) redirectLocalized("/support?status=invalid", locale);
  if (!(await rateLimit(`support:${session.user.id}`, 5, 10 * 60 * 1000))) {
    redirectLocalized("/support?status=ratelimited", locale);
  }

  await db.supportThread.create({
    data: {
      userId: session.user.id,
      subject: parsed.data.subject,
      messages: { create: { body: parsed.data.body, fromAdmin: false } },
    },
  });
  await notifyAdmins(session.user.email ?? "", parsed.data.subject, parsed.data.body);

  revalidatePath(localizePath("/support", locale));
  redirectLocalized("/support?status=sent", locale);
}

export async function replyToSupportThread(formData: FormData) {
  const locale = getLocale();
  const session = await auth();
  if (!session?.user) redirectLocalized("/login", locale);

  const parsed = replySchema.safeParse({
    threadId: formData.get("threadId"),
    body: formData.get("body"),
  });
  if (!parsed.success) redirectLocalized("/support?status=invalid", locale);

  const thread = await db.supportThread.findUnique({ where: { id: parsed.data.threadId } });
  if (!thread || thread.userId !== session.user.id) redirectLocalized("/support", locale);

  await db.supportThread.update({
    where: { id: thread.id },
    data: {
      status: "OPEN",
      messages: { create: { body: parsed.data.body, fromAdmin: false } },
    },
  });
  await notifyAdmins(session.user.email ?? "", thread.subject, parsed.data.body);

  revalidatePath(localizePath("/support", locale));
  redirectLocalized(`/support?status=sent#thread-${thread.id}`, locale);
}
