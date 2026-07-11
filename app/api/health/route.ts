import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isMailerConfigured } from "@/lib/mailer";

export const dynamic = "force-dynamic";

/** Liveness/readiness probe: database connectivity plus config presence flags. */
export async function GET() {
  const checks: Record<string, "ok" | "error" | "unconfigured"> = {};

  try {
    await db.$queryRaw`SELECT 1`;
    checks.database = "ok";
  } catch {
    checks.database = "error";
  }
  checks.mailer = isMailerConfigured() ? "ok" : "unconfigured";
  checks.stripe = process.env.STRIPE_SECRET_KEY ? "ok" : "unconfigured";
  checks.llm = process.env.LLM_API_KEY ? "ok" : "unconfigured";

  const healthy = checks.database === "ok";
  return NextResponse.json(
    { status: healthy ? "ok" : "degraded", checks, timestamp: new Date().toISOString() },
    { status: healthy ? 200 : 503 }
  );
}
