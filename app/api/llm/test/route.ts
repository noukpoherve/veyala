import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { chat, resolveLLMConfig, LLMError } from "@/lib/llm";
import { getLocaleFromRequest } from "@/i18n/get-locale";
import { getMessages } from "@/i18n/messages";

export const runtime = "nodejs";

const bodySchema = z.object({
  prompt: z.string().min(1).max(500).default("Réponds uniquement : OK"),
});

/** LLM layer test endpoint — admin only. */
export async function POST(req: Request) {
  const m = getMessages(getLocaleFromRequest(req));
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: m.api.llmTest.adminOnly }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: m.api.llmTest.invalidBody }, { status: 400 });
  }

  try {
    const config = await resolveLLMConfig();
    const started = Date.now();
    const reply = await chat(
      { system: "Tu es un assistant de test. Réponds brièvement.", user: parsed.data.prompt },
      config
    );
    return NextResponse.json({
      ok: true,
      provider: config.providerName,
      protocol: config.protocol,
      model: config.model,
      latencyMs: Date.now() - started,
      reply: reply.slice(0, 1000),
    });
  } catch (e) {
    const status = e instanceof LLMError && e.status === 429 ? 429 : 502;
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : m.api.llmTest.failed },
      { status }
    );
  }
}
