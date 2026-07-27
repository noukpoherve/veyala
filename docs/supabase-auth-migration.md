# Migration vers Supabase Auth — analyse et plan d'implémentation

> Statut : **EN ATTENTE DE VALIDATION** — ne rien implémenter avant le GO explicite.
> Ce document est autoporteur : un développeur (ou un autre modèle) doit pouvoir
> exécuter la migration de bout en bout sans autre contexte.

## 1. État des lieux (existant NextAuth v5)

L'authentification actuelle (`lib/auth.ts`, `auth.config.ts`, `middleware.ts`) est
fonctionnelle et testée : credentials email+mot de passe (bcrypt), OTP 6 chiffres
maison (`lib/verification.ts` + `lib/mailer.ts`), Google OAuth (optionnel), magic
link (optionnel), dev-login hors production, sessions JWT, rôles USER/ADMIN,
rate limiting sur login/register/OTP.

**Manques réels** (quel que soit le choix) :
- Réinitialisation de mot de passe (aucun flux « mot de passe oublié »)
- Invitation d'administrateurs par email
- MFA (absent, non exigé aujourd'hui)

## 2. Options

### Option A — Compléter NextAuth (statu quo amélioré)
Ajouter reset password (réutilise `verificationToken`) + invitations admin
(server action + `inviteToken`). ~1 jour, risque quasi nul, mais on continue de
posséder ~400 lignes de code d'auth maison (OTP, tokens, mailer) à maintenir.

### Option B — Migrer vers Supabase Auth (recommandée si validée)
GoTrue gère inscription, confirmation email, reset password, invitations
(`admin.inviteUserByEmail`), OAuth Google, magic links, rate limiting, MFA
futur. On **supprime** `lib/verification.ts`, les providers credentials/OTP,
les templates OTP de `lib/mailer.ts` (le mailer support reste), `auth.config.ts`,
`types/next-auth.d.ts`, `app/api/auth/[...nextauth]`.

**Arguments pour** : l'infra Supabase est déjà en place (DB locale + cloud,
`[auth] enabled = true` dans `supabase/config.toml`) ; moins de code possédé ;
fonctionnalités demandées (invitations admin) natives.
**Risques** : migration des utilisateurs existants, réécriture du middleware et
des pages auth, période de bascule. Mitigés par la décision d'architecture §3.

## 3. Décision d'architecture clé (à respecter impérativement)

**Conserver la table Prisma `User` comme table de profil applicatif.**
Ne PAS remplacer les ids `cuid` par les UUID de `auth.users` : `Credits`,
`CreditTransaction`, `Payment`, `BaseProfile`, `CV`, `SupportThread`,
`Template.ownerId` et les clés de stockage `cv-source/<userId>/…` y sont liés.

À la place :
1. Migration Prisma : `ALTER TABLE "User" ADD COLUMN "authId" UUID UNIQUE;`
2. `auth()` (helper applicatif) résout `supabase.auth.getUser()` →
   `db.user.findUnique({ where: { authId } })` et renvoie **la même forme
   qu'aujourd'hui** : `{ user: { id, email, role } }` (id = cuid Prisma).
3. **Aucun autre point d'appel ne change** : routes API, actions, pages
   consomment `auth()` à l'identique (~20 call sites). C'est la garantie
   anti-régression (Stripe metadata.userId, contrôle d'accès fichiers, crédits).

Le rôle est stocké dans `app_metadata.role` côté GoTrue (modifiable uniquement
via service role) ET recopié dans `User.role` — le middleware edge lit le JWT
sans requête DB, le reste de l'app lit Prisma.

## 4. Plan d'implémentation (phases)

### Phase 0 — Préparation
- `npm i @supabase/supabase-js @supabase/ssr` (ne PAS retirer next-auth encore).
- Env : `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY` (local : valeurs de `supabase status` ; prod :
  dashboard Supabase → à mettre dans Vercel).
- `supabase/config.toml` : `[auth.email] enable_confirmations = true`,
  vérifier `site_url` et `additional_redirect_urls` (local + veyala.fr).
- Migration Prisma `authId` (nullable, unique) + `npx prisma migrate dev`.

### Phase 1 — Infrastructure Supabase côté Next
- `lib/supabase/server.ts` : `createServerClient` (@supabase/ssr) avec cookies
  Next ; variante `createAdminClient` (service role, `server-only`).
- `lib/supabase/middleware.ts` : refresh de session (pattern officiel
  @supabase/ssr `updateSession`).
- Réécrire `middleware.ts` : `updateSession` + protection des mêmes
  `PROTECTED_PREFIXES` + garde `/admin` via `app_metadata.role`.
- Réécrire `lib/auth.ts` : `auth()` (React `cache`) comme décrit §3 +
  `ensureUser(supabaseUser)` : upsert du profil Prisma au premier login
  (crée `User` avec `authId`, `role` depuis app_metadata, crédits
  `SIGNUP_BONUS_CREDITS` si absents — remplace l'event `createUser` NextAuth).
  Conserver l'export `SIGNUP_BONUS_CREDITS` et `isAdminEmail`.

### Phase 2 — Pages auth (dans `app/(auth)/`, layout partagé conservé)
- `/login` : `signInWithPassword` (server action) ; lien « mot de passe
  oublié » ; bouton Google si configuré (`signInWithOAuth` + callback route
  `app/api/auth/callback/route.ts` avec `exchangeCodeForSession`).
- `/register` : `signUp({ email, password, options: { emailRedirectTo } })` —
  la confirmation email est gérée par Supabase (email dans Mailpit en local).
- `/verify-email` : soit lien de confirmation (rien à faire), soit
  `verifyOtp({ type: "signup" })` si on garde la saisie de code — **choisir le
  lien** (KISS, supprime la page de saisie de code).
- `/forgot-password` + `/reset-password` : `resetPasswordForEmail` puis
  `updateUser({ password })` sur la session de recovery.
- `/admin/invitations` : server action `requireAdmin` +
  `createAdminClient().auth.admin.inviteUserByEmail(email, { data: … })`,
  avec `app_metadata.role = "ADMIN"` posé via `admin.updateUserById` ; l'invité
  atterrit sur `/reset-password` pour définir son mot de passe.
- Conserver le rate limiting applicatif existant (`lib/rate-limit.ts`) sur les
  server actions en défense en profondeur (GoTrue a le sien côté API).
- Supprimer le dev-login : en local, `enable_confirmations` peut rester à
  false OU utiliser Mailpit (http://127.0.0.1:55324) — les emails arrivent
  instantanément, le dev-login n'a plus de raison d'être.

### Phase 2 bis — OAuth Google & GitHub (implémenté)
- Boutons dans `components/auth/oauth-buttons.tsx` (login + register), affichés
  quand `NEXT_PUBLIC_AUTH_GOOGLE` / `NEXT_PUBLIC_AUTH_GITHUB` valent `true`.
- Action `app/(auth)/oauth-actions.ts` → `signInWithOAuth` (PKCE) → retour via
  `/auth/callback`.
- Activation côté Supabase requise en plus des flags :
  - **Local** : `supabase/config.toml` → `[auth.external.google]` /
    `[auth.external.github]` → `enabled = true`, avec
    `SUPABASE_AUTH_EXTERNAL_<PROVIDER>_CLIENT_ID/_SECRET` exportés avant
    `supabase stop && supabase start`. Callback OAuth chez le fournisseur :
    `http://127.0.0.1:55321/auth/v1/callback`.
  - **Cloud** : dashboard → Authentication → Providers → renseigner client id +
    secret. Callback : `https://<project-ref>.supabase.co/auth/v1/callback`.
- Comptes OAuth : `ensureUser` relie par email un compte existant (même
  logique que la migration) — pas de doublon de profil.

### Phase 3 — Migration des utilisateurs existants
Script `scripts/migrate-users-to-supabase.ts` (tsx, idempotent) :
```
pour chaque User Prisma sans authId :
  admin.createUser({
    email,
    email_confirm: !!emailVerified,
    password_hash: passwordHash ?? undefined,   // bcrypt accepté par GoTrue
    app_metadata: { role },
  })
  → User.update({ authId: nouvelId })
```
- Les comptes Google se relient seuls (même email confirmé).
- Exécuter d'abord sur la base locale, vérifier, puis en prod.

### Phase 4 — Nettoyage ✅ (2026-07-26)
- Auth.js packages / routes déjà retirés.
- Prisma : tables `Account`, `Session`, `VerificationToken`, `EmailVerification` et
  colonne `passwordHash` purgées (migration `purge_authjs_and_idempotency`).
- Docs README / env alignées sur Supabase Auth + Playwright/`@sparticuz/chromium`.

### Phase 5 — Recette (obligatoire avant merge)
Local puis préprod : inscription + email de confirmation ; login mot de passe
(bon/mauvais) ; reset password ; invitation admin de bout en bout ; Google
OAuth ; crédits d'inscription versés une seule fois ; génération CV (débit
crédit) ; achat Stripe (metadata.userId intact) ; accès fichiers
`/api/files/...` ; middleware `/admin` ; suppression de compte RGPD
(`deleteAccount` doit aussi appeler `admin.deleteUser(authId)`). Lint,
typecheck, tests, build.

## 5. Estimation & risques

| Sujet | Estimation | Risque | Mitigation |
|---|---|---|---|
| Phases 0–2 | 1,5–2 j | Moyen | interface `auth()` inchangée |
| Phase 3 (migration users) | 0,5 j | Élevé si mal fait | script idempotent, dry-run local |
| Phases 4–5 | 0,5–1 j | Faible | nettoyage seulement après recette |

Rollback : tant que la phase 4 n'est pas mergée, revenir au commit précédent
suffit (NextAuth intact, `authId` est une colonne additive inoffensive).

## 6. Recommandation

GO pour l'option B **si** les invitations admin, le reset password managé et la
réduction du code possédé justifient ~3 jours d'effort ; sinon option A (1 jour).
Dans les deux cas, la règle « `auth()` garde la même signature » est le garde-fou
anti-régression principal.
