# ADR 0001 — Abstraction du fournisseur LLM

- **Date** : 2026-07-11
- **Statut** : accepté

## Contexte

Le produit dépend d'un LLM pour l'import, l'adaptation du CV et la lettre de motivation. Les
fournisseurs (Groq, OpenAI, Anthropic, Mistral…) changent de prix et de qualité rapidement.

## Décision

`lib/llm.ts` expose une interface unique pilotée par la configuration (`LLM_PROTOCOL`,
`LLM_BASE_URL`, `LLM_MODEL`, clés), surchargée à chaud par les réglages admin chiffrés en base.
Aucun appel direct à un SDK fournisseur en dehors de ce module (SOLID/DIP).

## Conséquences

- Changement de fournisseur sans toucher au code métier.
- Les tests mockent une seule interface.
- Le coût : un dénominateur commun de fonctionnalités (pas de spécificités fournisseur).
