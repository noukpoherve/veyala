---
name: french-site-copy
description: >-
  French product copy rules for Veyala site pages and generated texts (CV,
  letters, Campus France). Use when writing or editing user-visible French
  copy, landing/app/admin pages, emails, blog posts, LLM prompts that produce
  prose, or when the user mentions tiret cadratin, em dash, or —.
---

# Copy français Veyala

S'applique au **contenu visible** (pages, emails, blog, CV/lettres générés). Pas aux commentaires de code.

## Tirets

N'écris jamais `—` (cadratin) ni `–` (demi-cadratin) dans un texte montré à l'utilisateur.

À la place :

- virgule : `Un CV ciblé, pas un modèle générique.`
- deux-points : `Veyala : votre CV, adapté à chaque offre`
- parenthèses : `la génération complète (CV et lettre) prend moins de 30 secondes`
- point, pour enchaîner deux phrases

Le trait d'union `-` reste correct : `full-stack`, `2023-2025`, `savoir-faire`.

Les `—` de cellules vides (`?? "—"`) et les parsers d'entrée utilisateur ne sont pas du copy : ne pas y toucher.

## Textes générés par l'IA

Les prompts dans `lib/tailor.ts`, `lib/cover-letter.ts`, `lib/campus-france/*` et le filet `lib/typography.ts` (`GENERATED_COPY_TYPOGRAPHY` + `stripEmDashes`) interdisent déjà le cadratin. Si tu ajoutes un prompt qui rédige du français visible, réutilise cette règle et passe la sortie dans `stripEmDashes` / `stripEmDashesDeep`.
