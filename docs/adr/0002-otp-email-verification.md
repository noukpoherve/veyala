# ADR 0002 — Vérification d'email par OTP et connexion directe

- **Date** : 2026-07-11
- **Statut** : accepté

## Contexte

L'inscription email/mot de passe doit prouver la possession de l'adresse sans casser le
parcours (arriver connecté sur le dashboard, pas de détour par la page de connexion).

## Décision

1. Code à 6 chiffres : seul le hash sha256 est stocké (`EmailVerification`), TTL 15 min,
   5 tentatives, renvoi limité à 1/min.
2. Après vérification, un **jeton de connexion à usage unique** (5 min, haché, détruit à la
   consommation) est échangé via un provider Auth.js dédié (`otp-signin`) : l'utilisateur est
   connecté immédiatement.
3. Sans transport SMTP configuré, l'inscription active le compte directement (dégradation
   gracieuse) — l'OTP redevient obligatoire dès que `EMAIL_SERVER` existe.

## Conséquences

- Aucun secret en clair en base ; rejouabilité impossible.
- Le parcours d'inscription reste en un seul flux.
- En production, `EMAIL_SERVER`/`EMAIL_FROM` sont requis pour la vérification réelle.
