# Référence — Variables d'environnement

| Variable | Rôle | Requis |
| --- | --- | --- |
| `DATABASE_URL` | Postgres runtime — pooled/IPv4 (local : `127.0.0.1:55322` ; Vercel : **Transaction pooler** Supabase, port 6543, `?pgbouncer=true&connection_limit=1`) | oui |
| `DIRECT_URL` | Postgres pour `prisma migrate` uniquement — pooled/IPv4 mais hors mode transaction (Vercel : **Session pooler** Supabase, port 5432 via l'hôte `pooler.supabase.com`, PAS `db.<ref>.supabase.co`) | oui |
| `NEXTAUTH_URL` / `NEXTAUTH_SECRET` | Auth.js (URL publique + secret de session) | oui |
| `ENCRYPTION_KEY` | Chiffrement des réglages admin (32 octets base64) | oui |
| `ADMIN_EMAILS` | Emails promus ADMIN + destinataires des notifications support | oui |
| `EMAIL_SERVER` / `EMAIL_FROM` | SMTP (local : `smtp://127.0.0.1:55325`, UI Mailpit `:55324`) | pour OTP/magic link |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth Google | optionnel |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Paiements | pour la facturation |
| `LLM_PROTOCOL` / `LLM_BASE_URL` / `LLM_API_KEY` / `LLM_MODEL` / `LLM_VISION_MODEL` | Fournisseur IA | oui |
| `STORAGE_DRIVER` (+ `S3_*` ou `SUPABASE_*`) | Stockage fichiers (`local` interdit en prod Vercel) | oui |

Stack Supabase locale dédiée : API `55321`, DB `55322`, Studio `55323`, Mailpit `55324`,
SMTP `55325` (voir `supabase/config.toml`).
