# Documentation Veyala

Organisée selon [Diátaxis](https://diataxis.fr) :

- **[tutorials/](tutorials/)** — prise en main pas à pas (premier CV, premier compte).
- **[how-to/](how-to/)** — guides opérationnels (LLM, Stripe, déploiement Vercel, Supabase local).
- **[reference/](reference/)** — variables d'environnement, scripts npm, endpoints.
- **[explanation/](explanation/)** — architecture et choix de conception.
- **[adr/](adr/)** — Architecture Decision Records (décisions structurantes datées).

## Ingénierie

| Sujet | Où |
| --- | --- |
| Lint & format | Biome (`npm run lint`, `npm run format`), config `biome.json` |
| Hooks git | Husky : pre-commit (lint-staged), commit-msg (commitlint), pre-push (typecheck + tests) |
| Tests | Vitest (`npm test`, `npm run coverage`, seuil 80 % sur les modules couverts) |
| CI | `.github/workflows/ci.yml` — lint, typecheck, tests+couverture, build, sécurité |
| Sécurité | gitleaks + npm audit + Semgrep (CI), CodeQL (`codeql.yml`), Dependabot |
| Releases | semantic-release sur `main` : SemVer, tag, [GitHub Releases](https://github.com/noukpoherve/veyala/releases), `CHANGELOG.md` (commit Conventional Commits) |
| Santé | `GET /api/health` (DB + drapeaux de configuration) |
