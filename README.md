# Générateur de CV adapté à une offre

Application Next.js : collez l'URL d'une offre d'emploi (ou son texte), choisissez vos
critères, et téléchargez un CV Word (.docx) **adapté automatiquement à l'offre** — avec
exactement le design de votre CV (dégradé, logo IMIE, briques de compétences, liens
cliquables, une seule page).

Le code est **agnostique** : il fonctionne avec n'importe quel fournisseur d'IA
(Groq, Google Gemini, Mistral, Cerebras, OpenRouter, DeepSeek, OpenAI, Claude…),
sans rien changer au code — uniquement 3 variables dans `.env.local`.

## Installation

```bash
npm install
cp .env.local.example .env.local   # puis choisir/dé-commenter un fournisseur
npm run dev                         # http://localhost:3000
```

## Choisir son fournisseur d'IA

Tout se règle dans `.env.local` avec 3 variables :

| Variable | Rôle |
|---|---|
| `LLM_PROTOCOL` | `openai` (par défaut, marche partout) ou `anthropic` |
| `LLM_BASE_URL` | l'adresse de l'API du fournisseur |
| `LLM_API_KEY`  | votre clé |
| `LLM_MODEL`    | le nom du modèle |

`.env.local.example` contient déjà les blocs prêts à l'emploi pour chaque fournisseur :
dé-commentez celui que vous voulez, collez votre clé, c'est tout.

## Fournisseurs recommandés (du gratuit au payant)

> Les quotas des tiers gratuits changent souvent — vérifiez la page du fournisseur.

| Fournisseur | Coût | Carte bancaire | `LLM_BASE_URL` | Modèle conseillé |
|---|---|---|---|---|
| **Google Gemini** | Gratuit (~1500 req/jour) | Non | `https://generativelanguage.googleapis.com/v1beta/openai` | `gemini-2.5-flash` |
| **Groq** | Gratuit (rapide, ~1000 req/jour) | Non | `https://api.groq.com/openai/v1` | `llama-3.3-70b-versatile` |
| **Cerebras** | Gratuit (~1M tokens/jour) | Non | `https://api.cerebras.ai/v1` | `llama-3.3-70b` |
| **Mistral** | Gratuit (quota généreux) | Oui (tél.) | `https://api.mistral.ai/v1` | `mistral-small-latest` |
| **OpenRouter** | Gratuit (modèles `:free`) + payant | Non | `https://openrouter.ai/api/v1` | `meta-llama/llama-3.3-70b-instruct:free` |
| **DeepSeek** | Très bon marché (~0,14 $/M tokens) | Oui | `https://api.deepseek.com` | `deepseek-chat` |
| **OpenAI** | Payant | Oui | `https://api.openai.com/v1` | `gpt-4o-mini` |
| **Anthropic Claude** | Payant (`LLM_PROTOCOL=anthropic`) | Oui | `https://api.anthropic.com` | `claude-sonnet-4-6` |

**Pour démarrer sans rien payer** : Google Gemini ou Groq (aucune carte bancaire, une
minute d'inscription). **Le meilleur rapport qualité/prix une fois en production** :
DeepSeek (payant mais quelques centimes par mois pour cet usage).

Où récupérer une clé :
- Gemini → https://aistudio.google.com
- Groq → https://console.groq.com
- Cerebras → https://cloud.cerebras.ai
- Mistral → https://console.mistral.ai
- OpenRouter → https://openrouter.ai
- DeepSeek → https://platform.deepseek.com

## Structure du projet

| Fichier | Rôle |
|---|---|
| `lib/cv-data.js` | vos données (source de vérité : coordonnées, expériences, compétences) |
| `lib/llm.js` | **couche IA agnostique** — parle à n'importe quel fournisseur |
| `lib/tailor.js` | extraction de l'offre + règles d'adaptation ATS |
| `lib/docx-template.js` | le design Word exact (dégradé, logo, briques, liens) |
| `app/page.js` | l'interface |
| `assets/` | dégradé, logo IMIE, photo (remplacez `photo.png` par la vôtre) |

## Notes

- **Rien n'est inventé** : le prompt interdit d'ajouter des technos, chiffres ou
  responsabilités ; l'IA se contente de reformuler et réordonner vos vraies infos.
- **Sites qui bloquent les robots** (Indeed, LinkedIn…) : collez le texte de l'offre
  dans le champ prévu, le résultat est identique.
- **Format de sortie** : n'importe quel modèle correct sait renvoyer du JSON. Si un petit
  modèle échoue au parsing, le code tente de récupérer le JSON automatiquement ; sinon,
  changez de modèle (Gemini/Groq 70B/DeepSeek sont fiables).
- **Déploiement** : fonctionne sur Vercel tel quel. Ajoutez les variables `LLM_*` dans
  les variables d'environnement du projet.
