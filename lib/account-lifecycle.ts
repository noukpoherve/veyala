import "server-only";
import type { ArchiveSource, User } from "@prisma/client";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { logAdminAction } from "@/lib/admin-audit";
import { deleteStoredUrl } from "@/lib/storage";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

/** ~100 years — Supabase ban until an admin restores the account. */
const ARCHIVE_BAN = "876000h";

async function setSupabaseBan(authId: string | null | undefined, ban: boolean): Promise<void> {
  if (!authId) return;
  try {
    await createSupabaseAdminClient().auth.admin.updateUserById(authId, {
      ban_duration: ban ? ARCHIVE_BAN : "none",
    });
  } catch (error) {
    console.error("[account] supabase ban sync failed", error);
  }
}

export async function archiveUser(input: {
  userId: string;
  by: ArchiveSource;
  actorId: string;
  reason?: string;
}): Promise<User> {
  const user = await db.user.update({
    where: { id: input.userId },
    data: {
      archivedAt: new Date(),
      archivedBy: input.by,
      archiveReason: input.reason?.slice(0, 500) || null,
    },
  });
  await setSupabaseBan(user.authId, true);
  if (input.by === "SELF") {
    await logActivity({
      action: "account.archive_self",
      actorId: input.actorId,
      subjectUserId: user.id,
      meta: { reason: input.reason ?? null },
    });
  } else {
    await logAdminAction({
      actorId: input.actorId,
      action: "user.archive",
      targetId: user.id,
      meta: { reason: input.reason ?? null },
    });
  }
  return user;
}

export async function restoreUser(input: { userId: string; actorId: string }): Promise<User> {
  const user = await db.user.update({
    where: { id: input.userId },
    data: {
      archivedAt: null,
      archivedBy: null,
      archiveReason: null,
    },
  });
  await setSupabaseBan(user.authId, false);
  await logAdminAction({
    actorId: input.actorId,
    action: "user.restore",
    targetId: user.id,
  });
  return user;
}

/**
 * Irreversible GDPR wipe (admin-only). Purges storage then deletes the Prisma
 * user (cascades) and the Supabase Auth user.
 */
export async function hardDeleteUser(input: { userId: string; actorId: string }): Promise<void> {
  const userId = input.userId;
  const [profile, cvs, templates, user] = await Promise.all([
    db.baseProfile.findUnique({ where: { userId }, select: { sourceFileUrl: true } }),
    db.generatedCV.findMany({
      where: { userId },
      select: {
        docxUrl: true,
        pdfUrl: true,
        coverLetterDocxUrl: true,
        coverLetterPdfUrl: true,
      },
    }),
    db.template.findMany({
      where: { ownerId: userId },
      select: { previewImageUrl: true },
    }),
    db.user.findUniqueOrThrow({ where: { id: userId } }),
  ]);

  const urls = [
    profile?.sourceFileUrl,
    ...templates.map((t) => t.previewImageUrl),
    ...cvs.flatMap((cv) => [cv.docxUrl, cv.pdfUrl, cv.coverLetterDocxUrl, cv.coverLetterPdfUrl]),
  ];
  await Promise.all(urls.map((url) => deleteStoredUrl(url)));

  await logAdminAction({
    actorId: input.actorId,
    action: "user.hard_delete",
    targetId: userId,
    meta: { email: user.email },
  });

  await db.user.delete({ where: { id: userId } });
  if (user.authId) {
    await createSupabaseAdminClient().auth.admin.deleteUser(user.authId);
  }
}
