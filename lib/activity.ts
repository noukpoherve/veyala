import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

/** Best-effort append-only activity trail (never throws into the UX path). */
export async function logActivity(input: {
  action: string;
  actorId?: string | null;
  subjectUserId?: string | null;
  meta?: Prisma.InputJsonValue;
}): Promise<void> {
  try {
    await db.activityLog.create({
      data: {
        action: input.action,
        actorId: input.actorId ?? undefined,
        subjectUserId: input.subjectUserId ?? undefined,
        meta: input.meta,
      },
    });
  } catch (error) {
    console.error("[activity] write failed", { action: input.action, error });
  }
}
