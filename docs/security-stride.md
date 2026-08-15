# Sécurité — cartographie STRIDE (Veyala / cvgen)

Document de suivi (pas un audit formel exhaustif). Mis à jour 2026-07-27.

| Menace | Contrôles | Correctifs récents |
| --- | --- | --- |
| **S** Spoofing | Supabase `getUser()`, rôles Prisma, rate-limit auth | — |
| **T** Tampering | Crédits Serializable, Stripe signé + idempotent, jobs filtrés `userId` | Photo CV : plus de fetch HTTP arbitraire (`loadPhoto` + schéma) |
| **R** Repudiation | Ledger crédits / paiements / jobs | `AdminAuditLog` sur actions users & LLM |
| **I** Disclosure | Proxy `/api/files` ACL, erreurs filtrées, clés LLM AES-GCM | `/api/health` détails derrière `HEALTH_SECRET` |
| **D** DoS | Rate-limits (mémoire ou Upstash) | Configurer `UPSTASH_*` en multi-instance |
| **E** Elevation | `requireAdmin()`, invitation + `app_metadata` | Audit trail des changements de rôle |

## Variables liées

- `HEALTH_SECRET` — Bearer pour les checks détaillés de `/api/health`
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` — rate-limit distribué
- `S3_PUBLIC_URL` — à éviter pour données perso (préférer le proxy `/api/files`)
- `ENCRYPTION_KEY` — chiffrement clés LLM
- `NEXT_PUBLIC_SENTRY_DSN` — DSN public (identifiant de projet, pas un secret). Pas de Session Replay ; cookies / Authorization strippés avant envoi.

## Backlog

- Middleware auth aussi sur `/api/*` (défense en profondeur)
- URLs signées courtes si bucket public nécessaire
- Revue manuelle accessibilité (PageSpeed ne couvre qu'un sous-ensemble)
