import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { storageDriverStatus } from "@/lib/storage";

export const dynamic = "force-dynamic";

/**
 * Liveness probe. Detailed config flags are only returned when
 * `Authorization: Bearer $HEALTH_SECRET` matches (avoids info disclosure).
 */
export async function GET(req: Request) {
  const checks: Record<string, "ok" | "error" | "unconfigured" | "ephemeral"> = {};

  try {
    await db.$queryRaw`SELECT 1`;
    checks.database = "ok";
  } catch {
    checks.database = "error";
  }
  checks.storage = storageDriverStatus();

  const healthy = checks.database === "ok" && checks.storage !== "error";
  const secret = process.env.HEALTH_SECRET;
  const auth = req.headers.get("authorization");
  const detailed = Boolean(secret && auth === `Bearer ${secret}`);

  if (detailed) {
    const { isMailerConfigured } = await import("@/lib/mailer");
    checks.mailer = isMailerConfigured() ? "ok" : "unconfigured";
    checks.stripe = process.env.STRIPE_SECRET_KEY ? "ok" : "unconfigured";
    checks.llm = process.env.LLM_API_KEY ? "ok" : "unconfigured";
    checks.upstash =
      process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
        ? "ok"
        : "unconfigured";
  }

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      ...(detailed
        ? { checks }
        : { checks: { database: checks.database, storage: checks.storage } }),
      timestamp: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 }
  );
}
