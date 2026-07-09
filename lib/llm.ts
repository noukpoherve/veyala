import "server-only";
import { db } from "@/lib/db";
import { decryptSecret } from "@/lib/crypto";

/**
 * Provider-agnostic LLM layer: any OpenAI-compatible provider
 * (Groq, Gemini, Mistral, Cerebras, OpenRouter, DeepSeek, OpenAI, xAI…)
 * or the Anthropic protocol. Config comes from env vars, overridden by
 * the default provider the admin configures in DB (LLMProvider).
 */

export type LLMProtocolName = "openai" | "anthropic";

export interface LLMConfig {
  protocol: LLMProtocolName;
  baseUrl: string;
  apiKey: string;
  model: string;
  providerName: string;
}

export interface ChatImage {
  /** image/png, image/jpeg or image/webp. */
  mimeType: string;
  base64: string;
}

export interface ChatParams {
  system: string;
  user: string;
  images?: ChatImage[];
  maxTokens?: number;
  temperature?: number;
}

export class LLMError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly retryable = false,
    /** Server-suggested wait before retrying (rate limits). */
    public readonly retryAfterMs?: number
  ) {
    super(message);
    this.name = "LLMError";
  }
}

function envConfig(): LLMConfig | null {
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) return null;
  return {
    protocol: (process.env.LLM_PROTOCOL?.toLowerCase() as LLMProtocolName) || "openai",
    baseUrl: process.env.LLM_BASE_URL || "https://api.groq.com/openai/v1",
    apiKey,
    model: process.env.LLM_MODEL || "llama-3.3-70b-versatile",
    providerName: "env",
  };
}

/** Effective provider: admin-defined DB default first, env vars otherwise. */
export async function resolveLLMConfig(): Promise<LLMConfig> {
  const provider = await db.lLMProvider
    .findFirst({
      where: { active: true, isDefault: true },
      orderBy: { createdAt: "desc" },
    })
    .catch(() => null);

  if (provider?.apiKeyEnc) {
    try {
      return {
        protocol: provider.protocol,
        baseUrl: provider.baseUrl,
        apiKey: decryptSecret(provider.apiKeyEnc),
        model: provider.model,
        providerName: provider.name,
      };
    } catch {
      // Undecryptable key (ENCRYPTION_KEY rotated?): fall back to env config.
    }
  }

  const fromEnv = envConfig();
  if (!fromEnv) {
    throw new LLMError(
      "Aucun fournisseur IA configuré : renseignez LLM_API_KEY dans .env.local ou ajoutez un fournisseur dans l'admin."
    );
  }
  return fromEnv;
}

const MAX_RETRIES = 3;

/** Sends system + user prompts to the configured provider, returns raw text. */
export async function chat(params: ChatParams, config?: LLMConfig): Promise<string> {
  const cfg = config ?? (await resolveLLMConfig());

  let lastError: LLMError | null = null;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return cfg.protocol === "anthropic"
        ? await chatAnthropic(params, cfg)
        : await chatOpenAI(params, cfg);
    } catch (e) {
      lastError = e instanceof LLMError ? e : new LLMError(String(e), undefined, true);
      if (!lastError.retryable || attempt === MAX_RETRIES - 1) throw lastError;
      // Honor the provider's suggested wait (TPM windows), capped at 30 s.
      const delay = Math.min(lastError.retryAfterMs ?? 800 * 2 ** attempt, 30000);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastError ?? new LLMError("Erreur LLM inconnue.");
}

function errorFromStatus(status: number, body: string, provider: string, headers?: Headers): LLMError {
  if (status === 429) {
    // Groq/OpenAI put the suggested wait in Retry-After or in the message
    // ("Please try again in 7.66s").
    const headerSeconds = Number(headers?.get("retry-after"));
    const messageSeconds = Number(/try again in ([\d.]+)s/i.exec(body)?.[1]);
    const seconds = headerSeconds || messageSeconds || 0;
    return new LLMError(
      `Quota atteint chez ${provider}. Patientez ou changez de fournisseur dans l'admin.`,
      status,
      true,
      seconds ? Math.ceil(seconds * 1000) + 500 : undefined
    );
  }
  if (status === 413) {
    return new LLMError(
      `Requête trop volumineuse pour le modèle chez ${provider} : raccourcissez le texte de l'offre ou allégez le CV de base.`,
      status
    );
  }
  if (status === 401 || status === 403) {
    return new LLMError(`Clé API refusée par ${provider}. Vérifiez la configuration.`, status);
  }
  return new LLMError(
    `Erreur API ${provider} (${status}) : ${body.slice(0, 300)}`,
    status,
    status >= 500
  );
}

async function chatOpenAI(
  { system, user, images, maxTokens = 4000, temperature = 0.4 }: ChatParams,
  cfg: LLMConfig
): Promise<string> {
  const userContent = images?.length
    ? [
        { type: "text", text: user },
        ...images.map((img) => ({
          type: "image_url",
          image_url: { url: `data:${img.mimeType};base64,${img.base64}` },
        })),
      ]
    : user;

  const res = await fetch(`${cfg.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify({
      model: cfg.model,
      max_tokens: maxTokens,
      temperature,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userContent },
      ],
    }),
  });
  if (!res.ok) throw errorFromStatus(res.status, await res.text(), cfg.providerName, res.headers);
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content ?? "";
}

async function chatAnthropic(
  { system, user, images, maxTokens = 4000, temperature = 0.4 }: ChatParams,
  cfg: LLMConfig
): Promise<string> {
  const userContent = images?.length
    ? [
        ...images.map((img) => ({
          type: "image",
          source: { type: "base64", media_type: img.mimeType, data: img.base64 },
        })),
        { type: "text", text: user },
      ]
    : user;

  const res = await fetch(`${cfg.baseUrl.replace(/\/$/, "")}/v1/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": cfg.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: cfg.model,
      max_tokens: maxTokens,
      temperature,
      system,
      messages: [{ role: "user", content: userContent }],
    }),
  });
  if (!res.ok) throw errorFromStatus(res.status, await res.text(), cfg.providerName, res.headers);
  const data = (await res.json()) as { content?: { type: string; text?: string }[] };
  return (data.content ?? [])
    .filter((b) => b.type === "text")
    .map((b) => b.text ?? "")
    .join("\n");
}

/**
 * Lenient JSON extraction: strips markdown fences and, when direct parsing
 * fails, recovers the first {…} object found in the response.
 */
export function parseJSONLoose<T = unknown>(raw: string): T {
  const clean = raw.replace(/```(?:json)?/g, "").trim();
  try {
    return JSON.parse(clean) as T;
  } catch {
    const match = clean.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new LLMError("Réponse IA non parsable en JSON. Réessayez ou changez de modèle.");
    }
    return JSON.parse(match[0]) as T;
  }
}

/** chat() + lenient JSON parsing in one call. */
export async function chatJSON<T = unknown>(params: ChatParams, config?: LLMConfig): Promise<T> {
  return parseJSONLoose<T>(await chat(params, config));
}
