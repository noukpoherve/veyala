# Référence — Variables d'environnement

| Variable | Rôle | Requis |
| --- | --- | --- |
| `DATABASE_URL` | Postgres runtime — pooled/IPv4 (local : `127.0.0.1:55322` ; Vercel : **Transaction pooler** Supabase, port 6543, `?pgbouncer=true&connection_limit=1`) | oui |
| `DIRECT_URL` | Postgres pour `prisma migrate` uniquement — pooled/IPv4 hors mode transaction (Vercel : **Session pooler** Supabase, port 5432 via `pooler.supabase.com`, PAS `db.<ref>.supabase.co`) | oui |
| `NEXT_PUBLIC_SUPABASE_URL` | URL API Supabase (Auth + optionnellement Storage) | oui |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé anon (client navigateur / SSR cookies) | oui |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service-role (admin Auth, Storage REST) — **jamais** côté client | oui |
| `NEXT_PUBLIC_AUTH_GOOGLE` / `NEXT_PUBLIC_AUTH_LINKEDIN` | Affiche les boutons OAuth (`true`/`false`) — LinkedIn = provider Supabase `linkedin_oidc` | optionnel |
| `ENCRYPTION_KEY` | Chiffrement des clés LLM admin (32 octets base64) | oui |
| `ADMIN_EMAILS` | Emails promus ADMIN + destinataires des notifications support | oui |
| `EMAIL_SERVER` / `EMAIL_FROM` | SMTP app (support + Auth Send Email Hook) | recommandé |
| `SEND_EMAIL_HOOK_SECRET` | Secret du hook Auth « Send Email » (Standard Webhooks). Sans lui, GoTrue envoie les templates FR statiques. | pour l'anglais Auth |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Paiements | pour la facturation |
| `LLM_PROTOCOL` / `LLM_BASE_URL` / `LLM_API_KEY` / `LLM_MODEL` / `LLM_VISION_MODEL` | Fournisseur IA par défaut | oui |
| `STORAGE_DRIVER` (+ `S3_*` ou `SUPABASE_*`) | Stockage fichiers (`local` interdit en prod / Vercel) | oui |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Rate-limit distribué (sinon mémoire process) | recommandé en multi-instance |
| `NEXT_PUBLIC_SITE_URL` | URL publique (callbacks Auth, Stripe) | oui |
| `NEXT_PUBLIC_SENTRY_DSN` | Suivi des erreurs (client + serveur). Vide = désactivé | recommandé en prod |
| `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN` | Upload des source maps au build (token `project:releases`) | recommandé en prod |

Stack Supabase locale dédiée : API `55321`, DB `55322`, Studio `55323`, Mailpit `55324`,
SMTP `55325` (voir `supabase/config.toml`).
