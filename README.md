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
- **Auth.js v5** : magic link (email) + Google OAuth (+ connexion dev sans SMTP hors production)
- **Stripe** : Checkout + webhook signé et idempotent
- **docx** pour le Word, **Playwright (Chromium headless)** pour le PDF pixel-perfect
- **Couche LLM agnostique** : tout fournisseur OpenAI-compatible ou Anthropic, configurable
  par variables d'env et surchargeable par l'admin (clés chiffrées AES-GCM en base)
- **zod** (validation), **react-hook-form** (formulaires)

## Démarrage rapide

```bash
# 1. Dépendances + navigateur PDF
npm install
npx playwright install chromium

# 2. Configuration
cp .env.local.example .env.local     # remplir au minimum DATABASE_URL, NEXTAUTH_SECRET,
                                     # ADMIN_EMAILS, ENCRYPTION_KEY, LLM_*
# Prisma lit .env : y mettre DATABASE_URL également.

# 3. Base de données + données de démo (packs, 3 templates officiels, admins)
npx prisma migrate dev
npx prisma db seed

# 4. Lancer
npm run dev                          # http://localhost:3000
```

Secrets à générer : `openssl rand -base64 32` pour `NEXTAUTH_SECRET` et `ENCRYPTION_KEY`.

En développement sans SMTP ni Google OAuth, un formulaire **« Connexion dev »** sur `/login`
permet de se connecter avec un simple email (désactivé en production).

## Fournisseurs LLM gratuits / peu chers

Le fournisseur se change **sans toucher au code** : variables d'env ou Admin → Réglages.

| Fournisseur | `LLM_BASE_URL` | Modèle conseillé (`LLM_MODEL`) | Notes |
|---|---|---|---|
| **Groq** | `https://api.groq.com/openai/v1` | `llama-3.3-70b-versatile` | Gratuit, très rapide |
| **Google Gemini** | `https://generativelanguage.googleapis.com/v1beta/openai` | `gemini-2.0-flash` | Tier gratuit généreux, vision |
| **Mistral** | `https://api.mistral.ai/v1` | `mistral-small-latest` | Tier gratuit, vision (pixtral) |
| **Cerebras** | `https://api.cerebras.ai/v1` | `llama-3.3-70b` | Gratuit, ultra rapide |
| **OpenRouter** | `https://openrouter.ai/api/v1` | `meta-llama/llama-3.3-70b-instruct:free` | Agrégateur, modèles :free |
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
  (auth)/login        Connexion (magic link, Google, dev)
  (app)/              Espace connecté : dashboard, generate, cv/[id], profile,
                      templates, billing
  (admin)/admin/      Back-office : stats, users, validation templates, paiements, réglages
  api/                generate, import-cv, templates, stripe/{checkout,webhook},
                      files (stockage local), llm/test, auth
lib/
  llm.ts              Couche IA agnostique (openai/anthropic, retries, vision)
  tailor.ts           Adaptation CV ↔ offre (prompt ATS, zéro invention)
  cv-schema.ts        Schéma zod du CV structuré (source de vérité)
  generate-cv.ts      Pipeline complet : débit → IA → rendu → stockage (remboursé si échec)
  credits.ts          Débit/crédit atomique (transactions Serializable, jamais négatif)
  payments.ts         Fulfillment Stripe idempotent
  docx/               Moteur .docx piloté par définition de template
  pdf/                Rendu HTML partagé (aperçu + PDF Playwright)
  templates/          Définitions zod, templates officiels, fingerprint sha256 anti-doublon
  storage.ts          Stockage fichiers : local (dev) / Supabase / S3
prisma/               Schéma + migrations + seed (packs, templates, admins)
```

### Détection de doublon de template

`fingerprint = sha256(définition canonique)` : JSON trié, couleurs normalisées. Unique en
base — importer deux fois le même design renvoie le template existant au lieu de le dupliquer.
Les nouveaux templates passent en statut `PENDING` (validation admin) mais restent utilisables
immédiatement par leur auteur.

### Crédits

- 2 crédits offerts à l'inscription (`SIGNUP_BONUS`)
- 1 génération = 1 crédit, débité **avant** l'appel IA, **remboursé** automatiquement si la
  génération échoue — solde jamais négatif (transaction Serializable)
- Packs éditables par l'admin (seed : 5 CV — 1,99 €, 20 CV — 5,99 €, 50 CV — 12,99 €)

## Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` / `build` / `start` | Next.js |
| `npm run typecheck` | TypeScript strict |
| `npm run db:migrate` / `db:studio` / `db:seed` | Prisma |
| `npx tsx scripts/render-demo.ts [dossier]` | Génère un CV de démo (HTML+PDF+DOCX) avec chaque template officiel |

## Déploiement (Vercel + Neon)

1. Créer une base **Neon** (ou Supabase) → `DATABASE_URL`.
2. Importer le repo dans **Vercel** ; renseigner toutes les variables de `.env.local.example`
   (avec `NEXTAUTH_URL=https://votre-domaine`).
3. PDF serverless : Chromium complet n'est pas disponible sur Vercel — remplacer le launch de
   `lib/pdf/index.ts` par `puppeteer-core` + `@sparticuz/chromium`, ou déporter la génération
   PDF sur un petit service Node (Railway/Fly) avec Playwright. En VPS/Docker, Playwright
   fonctionne tel quel.
4. `npx prisma migrate deploy && npx prisma db seed` sur la base de production.
5. Configurer le webhook Stripe de production → `https://votre-domaine/api/stripe/webhook`.
6. Stockage fichiers : `STORAGE_DRIVER=supabase` + bucket, le driver local étant réservé au dev.

## Sécurité

- Validation **zod** de toutes les entrées API ; uploads limités en taille et en types.
- Rate-limiting sur `/api/generate`, `/api/import-cv` et `/api/templates`.
- Webhooks Stripe : signature vérifiée + idempotence transactionnelle.
- Clés LLM stockées chiffrées (AES-256-GCM, `ENCRYPTION_KEY`) ; aucun secret côté client.
- RGPD : politique de confidentialité, suppression de compte + données en un clic
  (Mon CV de base → Zone dangereuse).
