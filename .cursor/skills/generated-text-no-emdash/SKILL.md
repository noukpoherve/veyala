---
name: generated-text-no-emdash
description: >-
  Ban em dashes in LLM-generated prose (tailored CVs, cover letters, Campus
  France projects). Use when editing generation prompts, lib/tailor.ts,
  lib/cover-letter.ts, lib/campus-france, lib/typography.ts, or when adding a
  new prompt that writes user-visible French.
---

# Textes générés : pas de tiret cadratin

S'applique **uniquement** aux sorties IA (CV adapté, lettre, projets Campus France). Le copy des pages du site n'est pas concerné.

## Règle

Les textes que le modèle rédige ne doivent jamais contenir `—` ni `–`.

- virgule, deux-points, parenthèses ou point à la place
- trait d'union `-` OK (`full-stack`, `2023-2025`)

## Implémentation

1. Ajouter `GENERATED_COPY_TYPOGRAPHY` (`lib/typography.ts`) dans le system prompt.
2. Passer la sortie dans `stripEmDashes` (string) ou `stripEmDashesDeep` (CV JSON).
