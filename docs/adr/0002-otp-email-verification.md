# ADR 0002 — Vérification d'email par OTP et connexion directe

- **Date** : 2026-07-11
- **Statut** : **supersédé** (2026-07-26) — Auth.js + table `EmailVerification` retirés ;
  la confirmation d'email et le reset passent par **Supabase Auth**.

## Contexte (historique)

L'inscription email/mot de passe devait prouver la possession de l'adresse sans casser le
parcours (arriver connecté sur le dashboard, pas de détour par la page de connexion).

## Décision d'origine (obsolète)

1. Code à 6 chiffres : seul le hash sha256 était stocké (`EmailVerification`), TTL 15 min,
   5 tentatives, renvoi limité à 1/min.
2. Après vérification, un **jeton de connexion à usage unique** était échangé via un
   provider Auth.js dédié (`otp-signin`).
3. Sans SMTP, l'inscription activait le compte directement.

## Remplacement

Supabase Auth gère confirmation, magic links et reset. Voir `lib/auth.ts`,
`app/(auth)/*` et `docs/supabase-auth-migration.md`.
