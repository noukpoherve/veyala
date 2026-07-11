import "server-only";
import { createHash, randomInt } from "crypto";
import { db } from "@/lib/db";
import { isMailerConfigured, sendVerificationCodeEmail } from "@/lib/mailer";

export const CODE_TTL_MS = 15 * 60 * 1000;
export const RESEND_MIN_MS = 60 * 1000;
export const MAX_ATTEMPTS = 5;

const hashCode = (code: string) => createHash("sha256").update(code).digest("hex");

/** Whether sign-up must go through email verification (requires a mail transport). */
export function verificationRequired(): boolean {
  return isMailerConfigured();
}

/**
 * Generates a fresh 6-digit code for the user and emails it.
 * Returns false when called again before the resend cooldown elapsed.
 */
export async function sendVerificationCode(userId: string, email: string): Promise<boolean> {
  const existing = await db.emailVerification.findUnique({ where: { userId } });
  if (existing && Date.now() - existing.lastSentAt.getTime() < RESEND_MIN_MS) return false;

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await db.emailVerification.upsert({
    where: { userId },
    create: { userId, codeHash: hashCode(code), expiresAt: new Date(Date.now() + CODE_TTL_MS) },
    update: {
      codeHash: hashCode(code),
      expiresAt: new Date(Date.now() + CODE_TTL_MS),
      lastSentAt: new Date(),
      attempts: 0,
    },
  });
  await sendVerificationCodeEmail(email, code);
  return true;
}

export type VerifyResult = "ok" | "invalid" | "expired" | "locked";

/** Checks a submitted code; marks the account verified on success. */
export async function verifyCode(userId: string, code: string): Promise<VerifyResult> {
  const record = await db.emailVerification.findUnique({ where: { userId } });
  if (!record) return "expired";
  if (record.expiresAt.getTime() < Date.now()) return "expired";
  if (record.attempts >= MAX_ATTEMPTS) return "locked";

  if (record.codeHash !== hashCode(code)) {
    await db.emailVerification.update({
      where: { userId },
      data: { attempts: { increment: 1 } },
    });
    return record.attempts + 1 >= MAX_ATTEMPTS ? "locked" : "invalid";
  }

  await db.$transaction([
    db.user.update({ where: { id: userId }, data: { emailVerified: new Date() } }),
    db.emailVerification.delete({ where: { userId } }),
  ]);
  return "ok";
}
