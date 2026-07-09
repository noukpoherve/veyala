// Couche d'accès LLM agnostique.
// Fonctionne avec N'IMPORTE QUEL fournisseur : il suffit de renseigner
// LLM_BASE_URL, LLM_API_KEY et LLM_MODEL dans .env.local.
//
// Deux protocoles supportés (LLM_PROTOCOL) :
//   "openai"    -> endpoint /chat/completions (Groq, Gemini, Mistral, Cerebras,
//                  OpenRouter, DeepSeek, Together, OpenAI, xAI, GitHub Models…)
//   "anthropic" -> endpoint /v1/messages (Claude)
//
// Le format "openai" est le standard : la grande majorité des fournisseurs
// l'exposent. On l'utilise par défaut.

const PROTOCOL = (process.env.LLM_PROTOCOL || "openai").toLowerCase();
const BASE_URL = process.env.LLM_BASE_URL || "https://api.groq.com/openai/v1";
const API_KEY = process.env.LLM_API_KEY || "";
const MODEL = process.env.LLM_MODEL || "llama-3.3-70b-versatile";

/**
 * Envoie un prompt (system + user) et renvoie le texte brut de la réponse.
 * Interface unique quel que soit le fournisseur.
 */
export async function chat({ system, user, maxTokens = 4000, temperature = 0.4 }) {
  if (!API_KEY) {
    throw new Error("Clé API manquante : renseignez LLM_API_KEY dans .env.local.");
  }
  return PROTOCOL === "anthropic"
    ? chatAnthropic({ system, user, maxTokens, temperature })
    : chatOpenAI({ system, user, maxTokens, temperature });
}

// ---- Protocole OpenAI (le plus répandu) ----
async function chatOpenAI({ system, user, maxTokens, temperature }) {
  const url = BASE_URL.replace(/\/$/, "") + "/chat/completions";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      temperature,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Erreur API (${res.status}) : ${err.slice(0, 300)}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// ---- Protocole Anthropic ----
async function chatAnthropic({ system, user, maxTokens, temperature }) {
  const url = BASE_URL.replace(/\/$/, "") + "/v1/messages";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      temperature,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Erreur API Claude (${res.status}) : ${err.slice(0, 300)}`);
  }
  const data = await res.json();
  return (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
}

export const LLM_INFO = { PROTOCOL, BASE_URL, MODEL };
