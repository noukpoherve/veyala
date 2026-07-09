import "server-only";
import { db } from "@/lib/db";
import { decryptSecret } from "@/lib/crypto";

/**
 * Couche LLM agnostique : n'importe quel fournisseur OpenAI-compatible
 * (Groq, Gemini, Mistral, Cerebras, OpenRouter, DeepSeek, OpenAI, xAI…)
 * ou protocole Anthropic. La config vient des variables d'env, surchargée
 * par le fournisseur par défaut défini en base par l'admin (LLMProvider).
 */

export type LLMProtocolName = "openai" | "anthropic";

export interface LLMConfig {
  protocol: LLMProtocolName;
  baseUrl: string;
  apiKey: string;
  model: string;
  providerName: string;
}

export interface ChatParams {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
}

export class LLMError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly retryable = false
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

/** Fournisseur effectif : défaut admin en base, sinon variables d'env. */
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
      // Clé indéchiffrable (ENCRYPTION_KEY changée ?) : on retombe sur l'env.
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

/** Envoie system + user au fournisseur configuré et renvoie le texte brut. */
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
      await new Promise((r) => setTimeout(r, 800 * 2 ** attempt));
    }
  }
  throw lastError ?? new LLMError("Erreur LLM inconnue.");
}

function errorFromStatus(status: number, body: string, provider: string): LLMError {
  if (status === 429) {
    return new LLMError(
      `Quota atteint chez ${provider}. Patientez ou changez de fournisseur dans l'admin.`,
      status,
      true
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
  { system, user, maxTokens = 4000, temperature = 0.4 }: ChatParams,
  cfg: LLMConfig
): Promise<string> {
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
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) throw errorFromStatus(res.status, await res.text(), cfg.providerName);
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content ?? "";
}

async function chatAnthropic(
  { system, user, maxTokens = 4000, temperature = 0.4 }: ChatParams,
  cfg: LLMConfig
): Promise<string> {
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
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) throw errorFromStatus(res.status, await res.text(), cfg.providerName);
  const data = (await res.json()) as { content?: { type: string; text?: string }[] };
  return (data.content ?? [])
    .filter((b) => b.type === "text")
    .map((b) => b.text ?? "")
    .join("\n");
}

/**
 * Extraction JSON tolérante : retire les fences markdown et, à défaut d'un
 * parse direct, récupère le premier objet {…} de la réponse.
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

/** chat() + parsing JSON tolérant en un appel. */
export async function chatJSON<T = unknown>(params: ChatParams, config?: LLMConfig): Promise<T> {
  return parseJSONLoose<T>(await chat(params, config));
}
