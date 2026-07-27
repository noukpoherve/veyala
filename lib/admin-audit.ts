import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/activity";

/** Best-effort append-only admin audit (never throws into the UX path). */
export async function logAdminAction(input: {
  actorId: string;
  action: string;
  targetId?: string | null;
  meta?: Prisma.InputJsonValue;
}): Promise<void> {
  try {
    await db.adminAuditLog.create({
      data: {
        actorId: input.actorId,
        action: input.action,
        targetId: input.targetId ?? undefined,
        meta: input.meta,
      },
    });
  } catch (error) {
    console.error("[admin-audit] write failed", { action: input.action, error });
  }
  // Mirror into the unified activity trail (subject = target user when present).
  await logActivity({
    action: input.action,
    actorId: input.actorId,
    subjectUserId: input.targetId,
    meta: input.meta,
  });
}
