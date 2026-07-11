"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { isMailerConfigured, sendSupportReplyEmail } from "@/lib/mailer";

const replySchema = z.object({
  threadId: z.string().min(1),
  body: z.string().trim().min(1).max(5000),
});

export async function adminReplyToThread(formData: FormData) {
  await requireAdmin();
  const parsed = replySchema.safeParse({
    threadId: formData.get("threadId"),
    body: formData.get("body"),
  });
  if (!parsed.success) redirect("/admin/inbox");

  const thread = await db.supportThread.findUnique({
    where: { id: parsed.data.threadId },
    include: { user: { select: { email: true } } },
  });
  if (!thread) redirect("/admin/inbox");

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
      console.error("support reply email failed:", error);
    }
  }

  revalidatePath("/admin/inbox");
  redirect(`/admin/inbox/${thread.id}`);
}

export async function setThreadStatus(formData: FormData) {
  await requireAdmin();
  const threadId = String(formData.get("threadId") ?? "");
  const status = formData.get("status") === "CLOSED" ? "CLOSED" : "OPEN";
  if (!threadId) redirect("/admin/inbox");

  await db.supportThread.update({ where: { id: threadId }, data: { status } });
  revalidatePath("/admin/inbox");
  redirect(`/admin/inbox/${threadId}`);
}
