"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isMailerConfigured, sendSupportNotificationEmail } from "@/lib/mailer";
import { rateLimit } from "@/lib/rate-limit";

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
    console.error("support notification email failed:", error);
  }
}

export async function createSupportThread(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const parsed = threadSchema.safeParse({
    subject: formData.get("subject"),
    body: formData.get("body"),
  });
  if (!parsed.success) redirect("/support?status=invalid");
  if (!rateLimit(`support:${session.user.id}`, 5, 10 * 60 * 1000)) {
    redirect("/support?status=ratelimited");
  }

  await db.supportThread.create({
    data: {
      userId: session.user.id,
      subject: parsed.data.subject,
      messages: { create: { body: parsed.data.body, fromAdmin: false } },
    },
  });
  await notifyAdmins(session.user.email ?? "", parsed.data.subject, parsed.data.body);

  revalidatePath("/support");
  redirect("/support?status=sent");
}

export async function replyToSupportThread(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const parsed = replySchema.safeParse({
    threadId: formData.get("threadId"),
    body: formData.get("body"),
  });
  if (!parsed.success) redirect("/support?status=invalid");

  const thread = await db.supportThread.findUnique({ where: { id: parsed.data.threadId } });
  if (!thread || thread.userId !== session.user.id) redirect("/support");

  await db.supportThread.update({
    where: { id: thread.id },
    data: {
      status: "OPEN",
      messages: { create: { body: parsed.data.body, fromAdmin: false } },
    },
  });
  await notifyAdmins(session.user.email ?? "", thread.subject, parsed.data.body);

  revalidatePath("/support");
  redirect(`/support?status=sent#thread-${thread.id}`);
}
