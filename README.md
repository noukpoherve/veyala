# CVGen — CV optimisés par IA, adaptés à chaque offre

Plateforme SaaS de génération de CV sur mesure : l'utilisateur importe son CV (source de
vérité), colle une offre d'emploi, choisit un template et télécharge un CV **Word (.docx) +
PDF** optimisé ATS, tenant sur une page, avec liens cliquables.

**Règle fondamentale : l'IA n'invente jamais rien.** Elle reformule, réordonne et met en
avant ce qui existe déjà dans le CV importé.

## Stack

- **Next.js 14** (App Router, Server Components) · **TypeScript strict** · **React 18**
- **Tailwind CSS** + **shadcn/ui** + **lucide-react**
- **PostgreSQL** via **Prisma** (transactions pour tous les mouvements de crédits)
- **Supabase Auth** : email/mot de passe, confirmation, reset, OAuth (Google/GitHub)
- **Stripe** : Checkout + webhook signé et idempotent
- **docx** pour le Word, **Playwright** + **@sparticuz/chromium** pour le PDF (local et Vercel)
- **Couche LLM agnostique** : tout fournisseur OpenAI-compatible ou Anthropic, configurable
  par variables d'env et surchargeable par l'admin (clés chiffrées AES-GCM en base)
- **zod** (validation), **react-hook-form** (formulaires)
- **Upstash Redis** (optionnel) pour le rate-limit distribué en multi-instance

## Démarrage rapide

```bash
# 1. Infra locale (Auth + Postgres via Supabase CLI)
npm run supabase:start
npm install
npm run setup:pdf              # Playwright Chromium (dev)

# 2. Configuration
cp .env.local.example .env.local
# Remplir au minimum :
#   DATABASE_URL / DIRECT_URL (supabase status),
#   NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY,
#   ADMIN_EMAILS, ENCRYPTION_KEY, LLM_*
# Prisma lit aussi .env : y mettre DATABASE_URL / DIRECT_URL.

# 3. Base de données + données de démo (packs, templates officiels, admins)
npx prisma migrate dev
npx prisma db seed

# 4. Lancer
npm run dev                    # http://localhost:3000
```

Secret à générer : `openssl rand -base64 32` pour `ENCRYPTION_KEY`.

## Fournisseurs LLM gratuits / peu chers

Le fournisseur se change **sans toucher au code** : variables d'env ou Admin → Réglages.

| Fournisseur | `LLM_BASE_URL` | Modèle conseillé (`LLM_MODEL`) | Notes |
|---|---|---|---|
| **Groq** | `https://api.groq.com/openai/v1` | `llama-3.3-70b-versatile` | Gratuit, très rapide |
| **Google Gemini** | `https://generativelanguage.googleapis.com/v1beta/openai` | `gemini-2.0-flash` | Tier gratuit généreux, vision |
| **Mistral** | `https://api.mistral.ai/v1` | `mistral-small-latest` | Tier gratuit, vision (pixtral) |
| **Cerebras** | `https://api.cerebras.ai/v1` | `llama-3.3-70b` | Gratuit, ultra rapide |
| **OpenRouter** | `https://openrouter.ai/api/v1` | `meta-llama/meta-llama-3.3-70b-instruct:free` | Agrégateur, modèles :free |
| **DeepSeek** | `https://api.deepseek.com/v1` | `deepseek-chat` | Très peu cher |
| **OpenAI** | `https://api.openai.com/v1` | `gpt-4o-mini` | Peu cher, vision |
| **Anthropic** | `https://api.anthropic.com` (+ `LLM_PROTOCOL=anthropic`) | `claude-haiku-4-5` | Protocole dédié, vision |

> L'import de template par image nécessite un modèle **vision** (Gemini, GPT-4o, Claude,
> Pixtral…). Les générations de CV fonctionnent avec n'importe quel modèle texte.

## Stripe (mode test)

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
# copier le whsec_... affiché dans STRIPE_WEBHOOK_SECRET
```

Achat test avec la carte `4242 4242 4242 4242`. Le webhook `checkout.session.completed`
crédite le compte de façon **idempotente** (les retries Stripe ne créditent jamais deux fois).

## Architecture

```
app/
  (marketing)/        Landing, pricing, FAQ, pages légales (SSR public)
  (auth)/             Connexion, inscription, reset (Supabase Auth)
  (app)/              Espace connecté : dashboard, generate, cv/[id], profile,
                      templates, billing, support
  (admin)/admin/      Back-office : stats, users, templates, paiements, réglages LLM
  api/                analyze, generate, import-cv, templates, stripe, files, health
lib/
  llm.ts              Couche IA agnostique (openai/anthropic, retries, vision)
  tailor.ts           Adaptation CV ↔ offre (prompt ATS, zéro invention)
  match-score.ts      Score déterministe avant/après + claims soft skills
  analyze-job.ts      Analyse gratuite (0 crédit) + gaps
  generate-cv.ts      Pipeline : débit → IA → rendu → scores (remboursé si échec)
  credits.ts          Débit/crédit atomique (Serializable, never négatif, refund retry)
  payments.ts         Fulfillment Stripe idempotent
  rate-limit.ts       Sliding window (mémoire locale ou Upstash Redis)
  storage.ts          local (dev) / S3-R2 / Supabase — local interdit en prod
  pdf/                Playwright + @sparticuz/chromium (Vercel-ready)
prisma/               Schéma + migrations + seed
```

### Matching

1. **Analyse** (`POST /api/analyze`, 0 crédit) : extrait les exigences (cache `JobAnalysis`),
   calcule le score avant, propose les gaps à revendiquer.
2. **Génération** (`POST /api/generate`, 1 crédit) : adapte le CV, stocke
   `matchScoreBefore` / `matchScoreAfter` / breakdown, clé d'idempotence client.

### Crédits

- 2 crédits offerts à l'inscription (`SIGNUP_BONUS`)
- 1 génération = 1 crédit, débité **avant** l'appel IA, **remboursé** avec retries si échec
- Packs éditables par l'admin (seed : 5 / 20 / 50 CV)

## Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` / `build` / `start` | Next.js |
| `npm run supabase:start\|stop\|status` | Stack Auth + Postgres locale |
| `npm run typecheck` / `test` / `lint` | Qualité |
| `npm run db:migrate` / `db:studio` / `db:seed` | Prisma |
| `npm run setup:pdf` | Installe Chromium Playwright |

## Déploiement (Vercel + Supabase)

1. Projet Supabase (Auth + DB) → renseigner `NEXT_PUBLIC_SUPABASE_*`,
   `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL` (transaction pooler) et `DIRECT_URL`
   (session pooler) — voir `.env.local.example`.
2. Importer le repo dans **Vercel** ; variables de `.env.local.example`.
3. PDF : déjà branché sur `playwright-core` + `@sparticuz/chromium` dans `lib/pdf/index.ts`
   (pas besoin de puppeteer). Prévoir ≥ 2048 MB de mémoire fonction.
4. Build : `prisma migrate deploy && next build` (`vercel-build` script).
5. Webhook Stripe prod → `/api/stripe/webhook`.
6. Stockage : `STORAGE_DRIVER=s3` (R2) ou `supabase` — **`local` est refusé en prod/Vercel**.
7. Rate-limit multi-instance : `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`.

## Sécurité

- Validation **zod** de toutes les entrées API ; uploads limités en taille et en types.
- Rate-limiting (mémoire ou Upstash) sur generate, analyze, import, auth, support.
- Fetch d'offres : garde **SSRF** (`lib/job-url.ts`).
- Webhooks Stripe : signature vérifiée + idempotence transactionnelle.
- Clés LLM chiffrées (AES-256-GCM) ; aucun secret côté client.
- RGPD : suppression de compte = blobs storage + lignes Prisma + identité Supabase Auth.
