# Veyala — Product Design & UX Strategy

**Staff Product Design / UX Engineering / Frontend Architecture audit**
Périmètre : repository complet (`cvgen`, Next.js 14 / Tailwind v3 / Prisma / Supabase Auth) + inspection en direct de veyala.fr (compte réel, données réelles) sur desktop/tablette/mobile.
Aucun fichier n'a été modifié — ce document est une stratégie, pas un changelog.

---

## Table des matières

1. Executive summary
2. Architecture actuelle
3. Audit UX
4. Audit UI
5. Responsive audit
6. Mobile UX audit
7. Design system proposé
8. Application shell
9. Architecture cible
10. Component strategy
11. Performance strategy
12. Accessibility strategy
13. Roadmap P0 / P1 / P2 / P3
14. Plan d'implémentation par étapes

---

## 1. Executive summary

**Verdict global : le produit a de meilleures fondations que son rendu à l'écran ne le laisse paraître.** Le design system technique (tokens HSL sémantiques, dark mode câblé de bout en bout, pairing typographique Inter/Bricolage Grotesque, `next/font`, gestion d'erreur centralisée et filtrée, rate-limiting, focus-visible sur les primitives `ui/`) est du niveau qu'on attend d'une équipe senior. Ce qui manque, ce n'est pas une refonte — c'est **de la discipline d'exécution** : les composants `ui/` existent mais sont contournés à la main dans un tiers des cas, trois panneaux d'aperçu (CV Builder, CV Editor, CV Preview) partagent un bug de mise à l'échelle qui casse la fonction cœur du produit sur mobile et parfois desktop, et deux flows quasi-identiques (génération CV / génération Campus France) ont divergé silencieusement en copiant-collant plutôt qu'en partageant.

**Chiffres clés de cet audit :**
- **3 bugs Critical** confirmés en navigateur réel (pas des suppositions) qui cassent une fonctionnalité, pas juste l'esthétique.
- **~15 duplications de composants** identifiées avec fichier:ligne — dont une (le pipeline Campus France vs CV) a déjà produit une **divergence fonctionnelle réelle** (ordre des étapes inversé entre deux copies du même flow).
- **Design system technique solide** : tokens sémantiques HSL, dark mode déjà câblé (script anti-FOUC + toggle + variables complètes), `prefers-reduced-motion` géré globalement, pas de dépendance de motion lourde (pas de Framer Motion), erreurs utilisateur filtrées anti-fuite technique. Peu de produits à ce stade arrivent avec cette hygiène déjà en place.
- **Aucune régression de performance à craindre** dans les recommandations : elles consolident l'existant (moins de CSS dupliqué, pas plus), n'ajoutent aucune dépendance lourde.

**Ce que ce document n'est pas** : une proposition de refonte visuelle "plus jolie". Chaque recommandation est reliée à un impact mesurable — compréhension, conversion, confiance, efficacité, accessibilité, cohérence, perception premium, responsive ou performance — précisé à chaque section.

**Priorité absolue (P0)** : corriger la mise à l'échelle du rendu CV/Lettre (cause racine partagée par 2 des 3 Critical), rendre l'éditeur utilisable sur mobile, débloquer le champ Email du profil. Ces trois points cassent une fonction, tout le reste est de la finition — même une finition très en retard sur l'ambition affichée (Linear/Stripe/Vercel/Ramp/Notion/Attio/Apple).

---

## 2. Architecture actuelle

### Stack
| Couche | Techno | Détail |
|---|---|---|
| Framework | Next.js `^14.2.5`, App Router | Route groups `(marketing)`, `(auth)`, `(app)`, `(admin)` |
| Styling | Tailwind CSS `^3.4.19` (config classique, pas v4) | `tailwindcss-animate`, `class-variance-authority`, `tailwind-merge` |
| UI primitives | shadcn/ui minimal (`components.json`) | Seulement 2 dépendances Radix : `react-label`, `react-slot` — pas de Radix Dialog/Popover/DropdownMenu |
| DB / ORM | PostgreSQL via Prisma `^6.19.3`, pooler Supabase | Modèle `User` en cuid, découplé de l'UUID Supabase Auth (`authId`) |
| Auth | Supabase Auth (GoTrue) | `@supabase/ssr` + `@supabase/supabase-js`, session validée par `getUser()` à chaque requête |
| Emails transactionnels | Templates HTML maison (`lib/emails/`) | Auth via moteur GoTrue, support via SMTP applicatif |
| PDF/DOCX export | `playwright-core` + `@sparticuz/chromium` (PDF), `docx` (Word) | Isolés server-only, `outputFileTracingIncludes` dédié |
| Monitoring | `@sentry/nextjs` | `tunnelRoute` configuré, `withSentryConfig` |
| Icons | `lucide-react` | 56 fichiers, aucune autre lib |
| Fonts | `next/font/google` : Inter (`--font-sans`) + Bricolage Grotesque (`--font-display`) | Chargées au root layout uniquement |
| Motion | CSS pur (keyframes custom + `tailwindcss-animate`) | Aucune lib JS de motion |

### Organisation `components/` (17 dossiers, densité très inégale)
```
ui/ 10 · landing/ 9 · cv/ 6 · layout/ 5 · profile/ 3 · generate/ 3 · blog/ 3
templates/ 2 · campus-france/ 2 · billing/ 2 · admin/ 2
marketing/ 1 · errors/ 1 · dashboard/ 1 · auth/ 1
```
`components/ui/` ne compte que **10 primitives** : `alert`, `badge`, `button`, `card`, `input`, `label`, `pagination`, `separator`, `skeleton`, `textarea`. Ni `dialog`, ni `tabs`, ni `dropdown-menu`, ni `tooltip`, ni `toast` — ce qui explique mécaniquement une bonne partie des duplications trouvées en section 4 et 10 : quand la primitive n'existe pas, chaque écran la réinvente.

### Flux d'authentification → profil (rappel, déjà documenté ailleurs dans le repo)
Supabase Auth gère identité/mot de passe/OAuth ; `lib/auth.ts#ensureUser()` fait le pont vers la table Prisma `User` (id cuid stable) au premier login, avec crédit de bienvenue. Aucun couplage SQL dur entre les deux — architecture saine, hors périmètre design mais notable comme preuve de rigueur d'ingénierie ailleurs dans le projet.

### Deux univers produit, un seul moteur
EMPLOI (`/generate`, `components/generate/`) et ÉTUDES (`/campus-france`, `components/campus-france/`) sont deux implémentations **parallèles et non partagées** du même moteur (analyse → matching → génération IA en pipeline à étapes → CV + lettre). C'est le point d'architecture le plus significatif de tout l'audit — détaillé en section 4.4 et 10.

---

## 3. Audit UX

### 3.1 Parcours utilisateur bout-en-bout (Landing → nouvelle candidature)

Marche testée en direct : Landing → Dashboard → Generate → coller offre → Analyser le matching → Générer mon CV → CV Preview → Lettre → ATS → Export → Billing → Profile.

| Transition | Rupture observée | Sévérité |
|---|---|---|
| Landing → Dashboard | Aucune — cohérent, la marque tient sur les deux | — |
| Generate → Analyse matching | Fluide, feedback clair ("Analyse en cours…") | — |
| Analyse → Génération IA | Pipeline à étapes numérotées avec statut live — un des meilleurs moments du produit | — |
| Génération → CV Preview | **Le livrable (CV+lettre) ne s'affiche pas correctement** sur mobile (lettre tronquée) | Critical |
| CV Preview → CV Editor | **L'éditeur perd l'accès à la lettre, à la personnalisation et à l'aperçu sur mobile** | Critical |
| Dashboard → Profile | **Le bouton d'enregistrement cache le champ Email** | Critical |
| Partout (authentifié) | Sidebar toggle qui chevauche le contenu en tablette | High |
| N'importe quel écran → Billing | Bannière évoque "Stripe" (jargon interne exposé) | Medium |

**Constat transverse** : le produit "raconte une seule histoire" tant qu'on reste sur desktop — c'est sur les livrables eux-mêmes (CV, lettre) que la promesse casse, précisément là où la confiance utilisateur se joue le plus (voir/télécharger le résultat qu'on va envoyer à un recruteur).

### 3.2 Hiérarchie, navigation, compréhension — par zone

| Zone | Problème | Impact | Sévérité |
|---|---|---|---|
| Dashboard | Toggle de sidebar superposé au titre "Historique des CV" (confirmé à 820px) | Impression de bug dès le 2ᵉ écran vu | High |
| CV Editor (desktop) | Aperçu live coupé même à 1440px — impossible de vérifier le rendu final pendant l'édition | Fonction cœur dégradée pour 100% des utilisateurs | Critical |
| CV Editor (mobile) | Onglet Lettre, bouton Personnaliser et aperçu absents sous ~768px (présents dans le DOM, inatteignables) | Un tiers du produit disparaît selon l'appareil | Critical |
| CV Preview / Lettre (mobile) | Texte de la lettre tronqué à droite, sans wrap ni scroll visible | Livrable illisible | High |
| Profile | Bouton flottant "Enregistrer" superposé au champ Email (desktop) et à "Nom complet" + nav mobile (mobile) | Champ obligatoire invisible | Critical |
| Billing | "Checkout non finalisé **côté Stripe**" — vocabulaire d'implémentation exposé | Confusion utilisateur non-technique | Medium |
| Templates | `<input type="file">` natif visible dans "Proposer un template", seul flux d'upload sur 4 à ne pas masquer l'input natif | Rupture visuelle immédiate | Medium |
| Deux univers (Emploi/Études) | Aucune rupture perçue à l'usage — les deux flows *se ressemblent* à l'écran alors qu'ils divergent en code (voir 3.3) | Risque latent, pas encore visible utilisateur | Medium |

### 3.3 Surcharge cognitive / friction — points positifs à noter aussi
Contrairement à un audit qui ne cherche que les fautes : plusieurs décisions UX sont déjà au niveau visé.
- **Pipeline de génération** : étapes numérotées, statut live, scores avant/après affichés en direct — modèle de clarté, à répliquer ailleurs (command palette, imports).
- **Rate limiting + messages d'erreur filtrés** : `lib/user-facing-error.ts` bloque activement toute fuite de vocabulaire technique (stripe/prisma/stack/api_key…) dans les messages dynamiques — seule la bannière statique de Billing y échappe (elle n'est pas un message d'erreur généré, c'est du texte codé en dur).
- **États de chargement de formulaire** : quasiment tous les boutons d'action ont un état `disabled` + spinner + texte différent pendant la soumission (`profile-form`, `generate-form`, `campus-france-form`, `regenerate-form`, `billing-checkout`…) — cohérence rare à ce niveau de détail.

### 3.4 Empty states — friction silencieuse
15 empty states recensés, **seuls 2 ont une vraie mise en forme** (icône + carte dédiée : dashboard "Aucun CV généré", admin inbox). Les 13 autres sont un simple `<p>` gris (paiements vides, mouvements de crédits vides, résultats de recherche admin vides, etc.) — pas d'erreur, mais une occasion manquée de guider l'utilisateur (aucun CTA de reprise dans 14 cas sur 15).

---

## 4. Audit UI

### 4.1 Ce qui donne déjà une impression "premium"
- Landing hero : hiérarchie nette, dégradé de marque maîtrisé (`bg-brand-gradient`, HSL 222→268→340°), CTA bien positionnés — tient au mobile comme au desktop.
- Pipeline de génération et panneau de matching ATS : lisibles, actionnables, pas de bruit visuel.
- Palette sémantique cohérente au niveau token (`--primary`, `--destructive`, `--muted`…) — la marque a une vraie identité chromatique (bleu #2563EB dominant, pas un bleu Tailwind générique choisi au hasard).

### 4.2 Ce qui donne une impression "template"/"amateur" — incohérences mesurées

**Border-radius — 4 valeurs pour un seul et même motif visuel ("panneau stat/info" : bordure + fond + padding) :**
| Rayon | Occurrences |
|---|---|
| `rounded-lg` (8px, lié au token `--radius`) | `admin/users/page.tsx:100`, `billing-checkout.tsx:118` |
| `rounded-xl` (12px, **non lié** au token — valeur Tailwind littérale) | `coherence-panel.tsx:41`, `match-analyze-panel.tsx:49`, `design-controls.tsx:63`, `customization-studio.tsx:281`, `match-report.tsx:77` |
| `rounded-2xl` (16px, littéral) | `app-shell.tsx:62`, `activity-bilan.tsx:62,75` |
| `rounded-3xl` (24px, littéral) | toutes les cards `app/(auth)/*` |

Le token `--radius: 0.75rem` (12px) n'est en réalité utilisé que par les 3 classes shadcn `rounded-lg/md/sm` — tout le reste de l'app pioche dans l'échelle Tailwind par défaut au petit bonheur. **C'est la preuve la plus nette d'un système de design existant mais non appliqué**, pas d'un système absent.

**Ombres** : cards d'auth en `shadow-xl shadow-blue-900/5` vs `shadow-sm` partout ailleurs pour un poids visuel équivalent (simple carte de formulaire). Les variants du composant `Button` lui-même ont des poids d'ombre incohérents entre eux (`default`/`gradient` en `shadow-md`, `destructive`/`outline` en `shadow-sm`).

**Padding** : `p-3`, `p-3.5`, `p-4`, `p-5`, `p-6` pour des cards de nature équivalente, sans règle apparente (`card.tsx` par défaut = `p-6`, mais quasiment aucune card "stat" custom ne l'utilise).

**Un `<input type="file">` natif non stylé** dans le formulaire "Proposer un template" — seul flux d'upload sur 4 à afficher le bouton "Choose File" du système d'exploitation. Se voit au premier coup d'œil, contraste avec le reste de l'app.

**Boutons ad-hoc** (marketing/blog, ~10 occurrences fichier:ligne déjà cataloguées) : dupliquent les classes du composant `Button` à la main plutôt que `<Button asChild>` — perdent le `focus-visible:ring` centralisé.

### 4.3 Duplication de composants (catalogue fichier:ligne)

| Pattern | Occurrences | Composant partagé existant ? |
|---|---|---|
| "Stat/info panel" (bordure+fond+padding) | 7 implémentations, 3 rayons différents (`admin/users:100`, `billing-checkout:118`, `coherence-panel:41`, `match-analyze-panel:49`, `design-controls:63`, `customization-studio:281`, `match-report:77`) | Non — `Card` existe mais n'est pas utilisé pour ce motif précis |
| Mini "score card" | `match-analyze-panel.tsx:62,66,72` ≈ copie mot pour mot dans `coherence-panel.tsx:65,69` | Non |
| Carte pliable (chevron + contenu conditionnel) | `cv-fields.tsx:18-46` (via `Card`) vs `design-controls.tsx:53-78` (HTML brut) | Partiellement — une des deux réutilise `Card`, l'autre non |
| "Back link" (retour avec icône) | 5 copies identiques : `cv/[id]/page.tsx:52-55`, `admin/inbox/[id]/page.tsx:38-41`, `admin/blog/new/page.tsx:12-15`, `admin/blog/[id]/edit/page.tsx:26-29`, `cv-editor.tsx:189-192` | Non |
| Badge/pill de statut | `Badge` bien adopté partout **sauf** `match-report.tsx:34-54` (`StatusCell` hand-rolled dans le même fichier qui importe déjà `Badge`) | Oui, mais contourné localement |
| Bouton export PDF/Word | 3 blocs JSX quasi identiques avec divergence de variante (`cv/[id]/page.tsx:117-132`, `:156-177`, `cv-editor.tsx:214-251` — Word primaire vs Word/PDF tous deux outline) | Non |
| Tuile de sélection de template | 3 wrappers autour du même `TemplateSwatch` partagé — 2 identiques (`generate-form.tsx:414-419`, `campus-france-form.tsx:424-429`), 1 divergente (`customization-studio.tsx:211-216`, avec badge de coche en plus) | Partiel — le swatch est partagé, pas le wrapper sélecteur |
| **Pipeline de génération complet** (constante d'étapes + JSX timeline + logique de polling) | 2 implémentations parallèles complètes : `generate-form.tsx:35-43,282-329,570-604` vs `campus-france-form.tsx:27-35,636-670` — **divergence déjà actée** : l'ordre `adapting_cv`/`writing_letter` est inversé entre les deux copies malgré des IDs de step censés être équivalents | Non — aucun hook/composant partagé |

**Le cas le plus sérieux est le dernier** : ce n'est plus une question esthétique, c'est une dette qui a déjà produit un bug latent (deux pipelines qui devraient se comporter pareil, divergent). Chaque futur correctif sur le pipeline de génération devra être appliqué deux fois, avec le risque de l'oublier une fois — ce qui vient précisément d'arriver.

### 4.4 Dark mode — infrastructure prête, adoption quasi nulle
Le thème sombre est entièrement câblé (toggle 3 états dans `user-menu.tsx`, script anti-FOUC dans `layout.tsx`, jeu complet de variables `.dark` dans `globals.css`) mais **une seule** classe `dark:` explicite existe hors config/`globals.css` (`activity-bilan.tsx:100`). Bonne nouvelle : comme la quasi-totalité de l'app consomme des tokens sémantiques (`bg-card`, `text-muted-foreground`…) plutôt que des couleurs Tailwind littérales, le mode sombre "marche probablement" par transitivité — mais ça n'a pas été vérifié visuellement à grande échelle dans cet audit (voir limites en fin de document) et les endroits qui utilisent des couleurs Tailwind littérales (`bg-blue-50`, `text-blue-700`, très présents sur le marketing) ne basculeront pas.

### 4.5 Code mort repéré en passant
`components/landing/demo-player.tsx` : la branche modale complète (Escape, backdrop cliquable, bouton X, `role="dialog"`) n'est **jamais invoquée avec `onClose`** dans le repo — le seul point d'appel utilise la variante `embedded`. À supprimer ou à activer, pas à laisser en l'état (dette de lisibilité, pas de risque fonctionnel).

---

## 5. Responsive audit

**Rappel de méthode** : breakpoints Tailwind **non redéfinis** dans `tailwind.config.ts` — l'app utilise les seuils par défaut (`sm:640 md:768 lg:1024 xl:1280 2xl:1536`). Les 14 largeurs demandées sont donc regroupées ici par bande de comportement réel plutôt que listées une à une redondamment — chaque bande précise les tailles qu'elle couvre.

| Bande | Largeurs | Navigation | Layout / grids | Cards | Typographie | Boutons / forms | Tables | Modals | Editor / Preview | CTA |
|---|---|---|---|---|---|---|---|---|---|---|
| **Mobile petit** | 320·360·375·390 | Bottom bar 4 items (44px touch targets ✓) + drawer "Menu" | 1 colonne, grilles stat en `grid-cols-1` | Pleine largeur, `p-4` | Body 14-15px, headings compressés | Champs pleine largeur, boutons `min-h-11` | Scroll horizontal (jamais de cards empilées) | Drawer plein écran ou `<dialog>` natif | **Cassé** : éditeur perd Lettre/Personnaliser/Aperçu ; lettre tronquée en Preview | 1 CTA primaire visible, secondaire en dessous |
| **Mobile grand** | 414·430·480 | Identique à ci-dessus | Identique | Identique, un peu plus d'air | Identique | Identique | Identique | Identique | Identique (le bug n'est pas lié à la largeur exacte, il est structurel) | Identique |
| **Tablette portrait** | 768·820·834 | Sidebar apparaît, **toggle chevauche le contenu (confirmé à 820px)** | 2 colonnes possibles sur formulaires larges | `sm:grid-cols-2` s'active | Échelle desktop | Formulaires 2 colonnes | Toujours scroll horizontal | Overlay plein écran (studio) devient viable | Aperçu CV toujours coupé (bug non lié à cette bande) | 2 CTA côte à côte possible |
| **Tablette paysage / petit desktop** | 1024 | Sidebar fixe ouverte par défaut | `lg:grid-cols-4` (dashboard KPI) | Grille complète | Échelle desktop pleine | Formulaires multi-colonnes | Scroll horizontal résiduel sur grandes tables admin | Overlay confortable | Aperçu CV **toujours coupé même ici** (root cause = échelle intrinsèque, pas la largeur du viewport) | Boutons groupés, pas de contrainte |
| **Desktop** | 1280·1440 | Layout 2 colonnes éditeur pleinement fonctionnel *si le bug d'échelle est corrigé* | Container centré à 1280px (`theme.screens["2xl"]`) | Confortable | Échelle desktop | Idem | Idem | Idem | Bug confirmé ici en dur (1440px testé en direct) | Idem |
| **Wide** | 1920 | Idem, plus de marge | Container reste à 1280px → grandes marges latérales, pas de grille qui s'étire à l'infini (bon réflexe déjà en place) | Idem | Idem | Idem | Tables ne s'élargissent pas au-delà du contenu | Idem | Non testé visuellement dans cette passe (bug déjà confirmé aux tailles inférieures, s'applique par construction) | Idem |

**Constat central** : le bug d'aperçu CV/Lettre n'est **pas** un problème de breakpoint — il apparaît à 606px comme à 1562px (les deux confirmés en direct). Le corriger une fois résout la bande mobile entière ET desktop simultanément (voir section 13, P0).

**Trou identifié dans la stratégie responsive actuelle** : aucune table ne se transforme en cards empilées sous 768px (pattern absent du repo) — c'est un choix cohérent avec la faible densité de colonnes des tables actuelles (2-4 colonnes), donc pas un défaut en soi, mais à surveiller si une table plus dense (ex. futur reporting) est ajoutée.

---

## 6. Mobile UX audit

Testé conceptuellement sur 375×812 / 390×844 / 393×852 / 430×932 (redimensionnement réel limité à un plancher d'environ 606px sur ce poste — voir limites méthodologiques en fin de document ; le reste est déduit du code Tailwind, cohérent avec les bandes ci-dessus qui ne varient pas dans cette plage).

| Dimension | Constat | Preuve |
|---|---|---|
| Touch targets | **Bon** — `min-h-11` (44px, commentaire explicite "WCAG 2.2 AA") + `touch-manipulation` sur toute la nav mobile | `mobile-bottom-nav.tsx:19` |
| Thumb zone | **Bon** — nav principale en bottom bar (zone naturelle du pouce), pas en haut | `mobile-bottom-nav.tsx` |
| Bottom navigation | Présente, 3 liens + 1 toggle menu, item actif désactivé quand le drawer est ouvert (évite la confusion double-état) | `mobile-bottom-nav.tsx:15-17,32` |
| Sticky CTA | **Absent/cassé** là où il compte : le seul CTA flottant observé (Profile) chevauche des champs au lieu d'être correctement ancré | Confirmé en direct |
| Mobile editor | **Cassé** — Lettre, Personnaliser, Aperçu totalement inaccessibles | Confirmé en direct |
| Mobile preview | **Cassé** — lettre tronquée sans wrap | Confirmé en direct |
| Mobile forms | Globalement bons — champs pleine largeur, labels au-dessus, validation avec messages FR compréhensibles | `login/register/profile` pages |
| Keyboard behavior | Non testé en direct (nécessite device réel, hors portée de cet audit) — à vérifier notamment sur les `textarea` de saisie d'offre (`generate-form`) qui doivent rester visibles au-dessus du clavier virtuel | — |
| Modals / drawers | Drawer sidebar mobile : backdrop cliquable + Escape géré en JS, mais **pas de focus trap** (le focus clavier peut sortir du drawer ouvert) | `collapsible-sidebar.tsx:80-104` |
| Horizontal scrolling | Tables toujours en scroll horizontal sous 768px (jamais de cards) — acceptable vu la faible densité de colonnes actuelle | Section 5 |
| Cards | S'empilent correctement en 1 colonne (`grid-cols-1` par défaut, `sm:`/`lg:` pour élargir) | Confirmé en direct (dashboard, templates) |
| Typography | Body reste lisible (14-15px), pas de texte en dessous de 12px repéré dans les zones testées | Confirmé en direct |

---

## 7. Design system proposé

**Principe directeur : consolider, ne pas réinventer.** Les tokens sémantiques existent déjà et sont bien pensés (HSL, dark mode complet). Le travail est de les faire respecter, pas de les remplacer.

### Typography
| Rôle | Face | Taille de référence | Usage |
|---|---|---|---|
| Display | Bricolage Grotesque (`--font-display`, déjà chargée) | 28-42px, `font-weight: 800` | Titres de page, chiffres de stat (`tabular-nums`) |
| H1 | Bricolage Grotesque | 24-28px / 700 | Titre de page authentifiée |
| H2 | Bricolage Grotesque ou Inter 700 | 18-20px | Titre de section |
| H3 | Inter 700 | 15-16px | Sous-section, titre de card |
| Body | Inter (`--font-sans`) | 14-15px / 400-500 | Texte courant |
| Small | Inter | 13px | Métadonnées, labels de champ |
| Caption | Inter | 11-12px, `letter-spacing: 0.02em` si majuscules | Labels de section, badges |
| Label | Inter 500-600 | 13px | Labels de formulaire |

*(Échelle de facto déjà observée : `text-sm` et `text-xs` dominent à 60% des usages — cohérent avec une UI dense de type SaaS, à documenter formellement plutôt qu'à changer.)*

### Colors — tokens existants (déjà en HSL, ne pas dupliquer une 2ᵉ palette)
| Token | Light | Dark | Usage |
|---|---|---|---|
| `--background` | `210 40% 99%` | `218 56% 10%` (navy) | Fond de page |
| `--card` / Surface | dérivé background | dérivé | Cards, panneaux |
| `--primary` | `221 83% 53%` (#2563EB) | `217 91% 60%` | Actions principales |
| `--secondary` | `214 100% 97%` (#EFF6FF) | dérivé | Fond d'accent doux |
| `--muted-foreground` | — | — | Texte secondaire |
| `--border` | `214 32% 91%` | dérivé | Bordures |
| `--destructive` | `0 72% 51%` | dérivé | Erreurs, actions destructives |

**Manquant** : pas de token `--success`/`--warning` explicite au niveau CSS (le composant `Badge` a des variants `success` codés en Tailwind littéral `emerald`/`amber`). À élever au rang de token CSS pour cohérence avec le reste du système sémantique.

**Règle à documenter et faire respecter** : toute couleur doit passer par un token sémantique (`bg-card`, `text-destructive`…), jamais par une couleur Tailwind littérale (`bg-blue-50`) — c'est ce qui garantit que le dark mode déjà câblé fonctionne partout sans effort supplémentaire.

### Spacing — proposition d'échelle à tokens (remplace le choix au cas par cas actuel)
| Nom | Valeur | Remplace |
|---|---|---|
| `compact` | `p-3` (12px) | Cards denses (mini score, badge) |
| `standard` | `p-4` (16px) | Cards par défaut, la majorité des panneaux |
| `spacieux` | `p-6` (24px) | Cards de formulaire principal (déjà la valeur par défaut de `CardContent`) |

Trois valeurs, pas cinq — assez pour couvrir tous les cas trouvés en section 4.2 sans perdre en expressivité.

### Radius — hiérarchie à 2 niveaux (au lieu de 4 aujourd'hui)
| Niveau | Valeur | Usage |
|---|---|---|
| `interactif` | `rounded-lg` (= `var(--radius)`, 12px) | Boutons secondaires, inputs, badges, cards denses |
| `panneau` | `rounded-2xl` (16px) | Cards, modales, sections — le niveau "conteneur" |

`rounded-full` reste réservé au composant `Button` primaire (déjà cohérent) et aux avatars/badges ronds. `rounded-xl` et `rounded-3xl` sont supprimés de la palette de facto — remplacés par l'un des deux niveaux ci-dessus selon le rôle réel de l'élément.

### Shadows — 3 niveaux, très subtils (déjà l'intention du produit, à uniformiser)
| Niveau | Valeur | Usage |
|---|---|---|
| `repos` | `shadow-sm` | Cards statiques, panneaux |
| `hover` | `shadow-md` | Au survol d'un élément interactif |
| `flottant` | `shadow-lg` | Dropdowns, popovers, drawer, modal |

Supprime `shadow-xl`/`shadow-2xl` de l'usage courant (aujourd'hui réservés aux cards auth et à quelques cards pricing marketing sans raison fonctionnelle) — les CTA de conversion (pricing, hero) peuvent garder une exception documentée, pas une dérive silencieuse.

### Motion — formaliser ce qui existe déjà
| Token | Valeur | Usage actuel confirmé |
|---|---|---|
| `duration-fast` | 150ms | Micro-interactions (hover d'icône) |
| `duration-base` | 300ms | **Déjà la valeur dominante** (12 occurrences) — transitions standards |
| `duration-slow` | 500ms | Barres de progression |
| `ease-standard` | `cubic-bezier(0.22, 1, 0.36, 1)` | Déjà utilisée (`.reveal`, `.tab-panel`) |
| `ease-bounce` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Déjà nommée `.transition-bounce` dans `globals.css:158` |

Rien à ajouter techniquement — juste documenter ces 5 valeurs comme la palette de motion officielle pour éviter qu'une 6ᵉ valeur arbitraire n'apparaisse dans un futur composant. `prefers-reduced-motion` déjà géré globalement (`globals.css:67-76`) : aucune action requise, juste à préserver.

---

## 8. Application shell

### Desktop (≥1024px)
- **Header** : absent au niveau app (le header n'existe que côté marketing) — la sidebar fait office de point d'ancrage de marque. Cohérent avec Linear/Notion (pas de header redondant au-dessus d'une sidebar).
- **Sidebar** : collapsible, contient logo, nav principale, section Administration (si rôle admin), bloc crédits, menu utilisateur. **Corriger le toggle** (section 3/13, P0) : le sortir du flux de contenu, l'ancrer dans le header propre de la sidebar.
- **Content area** : pas de page header standardisé (chaque page définit son propre `<h1>`+description en HTML libre) — fonctionne mais gagnerait en cohérence avec un composant `PageHeader` partagé (titre, description, actions à droite) — actuellement recréé à la main sur chaque page.
- **Breadcrumbs** : présents seulement sur `cv/[id]` et `blog/[slug]` (`aria-label="Fil d'Ariane"`) — absents ailleurs, y compris dans l'admin où la profondeur de navigation (users → detail, blog → edit) le justifierait.
- **Command/search** : **absent**. Un point de différenciation "premium" (Linear/Notion/Attio) que Veyala n'a pas — proposé en P2/P3, pas prioritaire vu la densité de contenu actuelle du produit (peu de listes assez profondes pour justifier un Cmd+K aujourd'hui, sauf peut-être l'admin).
- **Notifications** : **aucun système transverse** — uniquement des `<Alert>` inline par page. Proposé en P1 : un toast minimal (succès/erreur) pour les actions asynchrones qui ne rechargent pas la page (ex. code promo appliqué, sauvegarde profil) — ce sont justement les endroits où l'absence de feedback ambiant est la plus gênante aujourd'hui.
- **User menu** : déjà riche (thème clair/sombre/système, cohérent avec le reste du design system) — bon niveau de finition, rien à changer.

### Tablette (768-1024px)
- Sidebar toujours visible mais en mode réduit possible — **corriger le chevauchement du toggle** (High, confirmé à 820px) avant tout ajout.
- Formulaires passent en 2 colonnes là où c'est déjà implémenté (`sm:grid-cols-2`) — cohérent.
- L'éditeur CV doit basculer vers le pattern mobile (onglets) plutôt que de rester en 2 colonnes serrées — le bug d'aperçu coupé apparaît dès cette largeur.

### Mobile (<768px)
- **Bottom nav** : 3 liens + Menu — déjà bien exécuté (44px targets, `aria-current`, item actif désactivé si drawer ouvert). Ne pas ajouter de 5ᵉ item sans repenser la hiérarchie (4 est déjà dense pour du pouce).
- **Drawer "Menu"** : accès à Templates, Crédits, Support, Administration — ajouter un focus trap (accessibilité, P1).
- **Éditeur CV mobile** : remplacer le layout 2 colonnes masqué par une barre d'onglets persistante (Formulaire / Aperçu / Lettre / Style) — voir mockup déjà livré dans l'audit précédent de cette session.

---

## 9. Architecture cible

```
components/
├── ui/                        ← primitives partagées (étendre, pas remplacer)
│   ├── button.tsx              (existant)
│   ├── card.tsx                (existant — dériver StatCard dessus, pas à côté)
│   ├── badge.tsx                (existant — ajouter variant si besoin, pas de pill hand-rolled)
│   ├── dialog.tsx               ← NOUVEAU (Radix Dialog — remplace les 2 patterns overlay custom)
│   ├── stat-card.tsx            ← NOUVEAU (factorise les 7 implémentations §4.3)
│   ├── back-link.tsx            ← NOUVEAU (factorise les 5 implémentations §4.3)
│   ├── page-header.tsx          ← NOUVEAU (titre + description + actions, factorise le HTML libre actuel)
│   ├── toast.tsx / toaster.tsx  ← NOUVEAU (notifications transverses, §8)
│   └── export-buttons.tsx       ← NOUVEAU (factorise les 3 blocs PDF/Word §4.3)
├── pipeline/                    ← NOUVEAU dossier
│   ├── use-pipeline-progress.ts ← hook partagé (polling, timeout, gestion d'erreur)
│   └── pipeline-timeline.tsx    ← JSX partagé (generate-form + campus-france-form le consomment)
├── templates/
│   └── template-option.tsx      ← NOUVEAU (factorise le wrapper sélecteur §4.3, `TemplateSwatch` reste tel quel)
```

**Ce qui doit disparaître** :
- La branche modale morte de `demo-player.tsx` (jamais invoquée).
- Les 7 implémentations HTML brutes du panneau "stat/info" (remplacées par `StatCard`).
- Les 2 implémentations du pipeline (`generate-form`/`campus-france-form` consomment le même hook + la même timeline — seuls les libellés/couleurs restent spécifiques à chaque univers).

**Ce qui doit être centralisé** :
- Les 4 valeurs de radius → 2 (§7).
- Les 5 valeurs de padding de card → 3 (§7).
- Les couleurs de statut de `match-report.tsx` (`StatusCell`) → variante de `badgeVariants`.

**Comment éviter la récidive** : un composant n'est ajouté à `ui/` qu'après sa 2ᵉ occurrence dans le produit (règle "rule of two"), et toute nouvelle "card" custom doit justifier pourquoi elle n'utilise pas `StatCard`/`Card` en revue de code plutôt que de la laisser passer silencieusement — c'est très exactement le mécanisme qui a manqué ici.

---

## 10. Component strategy

| Composant | Action | Justification | Effort |
|---|---|---|---|
| `Dialog` (Radix) | **Créer** | Remplace les 2 patterns overlay custom sans focus trap (`customization-studio`, drawer mobile) par un composant accessible par construction | M |
| `StatCard` | **Créer** | Unifie 7 implémentations, 3 rayons → cohérence immédiate sur Dashboard/Generate/Billing/Campus France/Admin | S |
| `BackLink` | **Créer** | Unifie 5 copies identiques | XS |
| `PageHeader` | **Créer** | Standardise titre+description+actions, actuellement recréé par page | S |
| `Toast`/`Toaster` | **Créer** | Comble un vrai vide produit (§8) — pas de dépendance lourde nécessaire (peut être fait en CSS+contexte React, sans lib externe, dans l'esprit "pas de motion lib" déjà en place) | M |
| `ExportButtons` | **Refactoriser** | Unifie 3 blocs divergents (Word primaire vs outline) en un seul comportement défini une fois | S |
| `TemplateOption` | **Refactoriser** | Unifie 3 wrappers de sélection autour de `TemplateSwatch` déjà partagé | S |
| `usePipelineProgress` + `PipelineTimeline` | **Refactoriser** | Le point le plus important de cette section — élimine la divergence déjà actée entre Emploi/Études | L |
| Rendu CV/Lettre (iframe srcdoc) | **Refactoriser** | Cause racine des 2 bugs Critical/High de mise à l'échelle — un seul point de correction pour CV Builder, CV Editor et CV Preview | M |
| `DemoPlayer` (branche modale) | **Supprimer** | Code mort, jamais invoqué | XS |
| `StatusCell` (match-report.tsx) | **Supprimer** | Remplacer par une variante de `Badge` | XS |
| `badge.tsx` | **Étendre** | Ajouter des tokens `--success`/`--warning` CSS pour que les variants `success`/`warning` héritent du système sémantique plutôt que de couleurs Tailwind littérales | XS |

*(Effort : XS = &lt;2h, S = demi-journée, M = 1-2 jours, L = 2-4 jours — ordres de grandeur, pas des engagements.)*

---

## 11. Performance strategy

### Ce qui est déjà bien fait (à ne pas casser)
- **Isolation server-only rigoureuse** des dépendances lourdes : `pdf-parse`, `mammoth`, `docx`, `playwright-core`, `@sparticuz/chromium` sont toutes en `experimental.serverComponentsExternalPackages` (`next.config.mjs:9-15`) — zéro risque qu'elles gonflent le bundle client.
- **`next/dynamic` déjà utilisé à bon escient** : 5 composants lourds/rarement visibles au premier paint (éditeur CV, import de template, 3 sections marketing secondaires) sont lazy-loadés avec un fallback `Skeleton` cohérent.
- **Pas de librairie de motion JS** (pas de Framer Motion) — tout est en CSS, choix cohérent pour le poids du bundle.
- **`"use client"` globalement justifié** — aucun composant purement présentationnel marqué client sans raison identifiée dans l'audit de code.

### À corriger
| Point | Détail | Impact Core Web Vitals |
|---|---|---|
| Images | Seulement 2 usages de `next/image` (logo, admin templates) vs 3 `<img>` bruts (avatar, photo CV, logo custom) — ces 3 cas manipulent des data-URLs utilisateur, `next/image` y apporte moins mais mérite vérification au cas par cas | LCP marginal (pas de hero image concernée) |
| `next/config` images | Aucune config `images.remotePatterns`/`formats` définie — si des images externes (avatars OAuth Google par ex.) sont un jour affichées via `next/image`, ça bloquera au build | Préventif |
| `transition-[width]` sur la sidebar collapsible | Anime une propriété non composée sur un panneau structurant entier (`collapsible-sidebar.tsx:138`) | Risque de jank sur machines lentes, fréquence d'usage faible |
| `loading.tsx` manquants | `cv/[id]/edit`, `support`, sous-routes admin, `blog`, `blog/[slug]` font du fetch serveur sans état de chargement dédié | CLS / feedback perçu |
| Duplication CSS (radius/shadow/padding sprawl) | N'affecte pas le bundle JS mais gonfle légèrement le CSS généré par Tailwind (classes utilitaires non réutilisées) | Marginal, mais consolidation = bonus gratuit en filigrane du chantier design system |

### Ce que le redesign ne doit PAS faire
- N'ajouter aucune dépendance de motion (Framer Motion, GSAP) — le CSS pur suffit à tout ce qui est proposé ici (toasts, focus trap sont gérables sans lib lourde côté animation ; Radix Dialog ajoute ~10kb gzip, déjà le même ordre de grandeur que `react-label`/`react-slot` déjà présents).
- Ne pas transformer des Server Components en Client Components pour des raisons purement esthétiques (le radius/shadow/padding se corrige en CSS, jamais en JS).

---

## 12. Accessibility strategy

### Déjà solide (confirmé par audit de code, pas de régression à craindre)
- `focus-visible:ring-2 focus-visible:ring-ring` centralisé sur les primitives `ui/` (`button`, `input`, `textarea`, `alert`).
- Boutons icon-only systématiquement `aria-label`-és (3 usages `size="icon"` vérifiés, tous conformes).
- `prefers-reduced-motion` géré globalement au niveau CSS (`globals.css:67-76`) — aucun composant n'a besoin de le re-gérer individuellement.
- Structure sémantique propre : `<h1>` unique par page (22 pages vérifiées), landmarks `<nav>`/`<main>`/`<aside>` cohérents, breadcrumbs avec `aria-label`.
- Touch targets 44px + `touch-manipulation` sur toute la navigation mobile.
- Aucun `<div onClick>` à la place d'un `<button>` détecté.
- Gestion d'erreur utilisateur centralisée et non technique (`lib/user-facing-error.ts`).

### À corriger
| Problème | Détail | Sévérité WCAG |
|---|---|---|
| CTA ad-hoc sans focus-visible | ~10 CTA marketing/blog dupliquant `Button` à la main perdent le ring de focus clavier | AA (2.4.7 Focus Visible) |
| Pas de focus trap sur les overlays custom | `customization-studio.tsx` (studio plein écran) et le drawer mobile de `collapsible-sidebar.tsx` gèrent Escape mais pas le piégeage du focus — un `Tab` répété peut faire sortir le focus du panneau ouvert | AA (2.4.3 Focus Order) — se corrige automatiquement en migrant vers `Dialog` Radix (§9/10) |
| Login sans validation zod | `loginWithPassword` (contrairement à `register`) n'a pas de schéma de validation — pas un problème d'accessibilité au sens strict, mais un problème de cohérence de la gestion d'erreur | — (qualité, pas WCAG) |
| Dark mode non vérifié à l'échelle | Contraste non re-testé en mode sombre sur l'ensemble des pages dans cet audit — risque si des couleurs Tailwind littérales (marketing notamment) ne respectent pas le contraste AA une fois le fond basculé | À vérifier (potentiel AA 1.4.3) |
| Tables — attributs `<th scope>` | Non vérifié explicitement dans cet audit (à confirmer sur les tables admin les plus denses — users, payments) | À vérifier |

---

## 13. Roadmap P0 / P1 / P2 / P3

### P0 — Indispensable (bloque avant tout le reste)
1. **Corriger la mise à l'échelle du rendu CV/Lettre** (iframe srcdoc) — résout simultanément le bug CV Editor desktop, CV Preview mobile, et prépare le terrain pour le futur éditeur mobile.
2. **Rendre l'éditeur CV utilisable sur mobile** (Lettre, Personnaliser, Aperçu accessibles).
3. **Repositionner le bouton flottant du Profil** hors du flux de contenu.

*(Ces trois points sont les seuls qui cassent une fonctionnalité — tout le reste améliore un produit qui fonctionne déjà.)*

### P1 — Important (fort impact perçu, effort contenu)
1. Sortir le toggle de sidebar du flux de contenu (chevauchement tablette).
2. Aligner l'input file de "Proposer un template" sur le pattern déjà utilisé ailleurs.
3. Reformuler la bannière Billing sans nommer Stripe.
4. Remplacer les CTA ad-hoc par `Button asChild` (restaure le focus-visible).
5. Créer `Dialog` (Radix) et migrer les 2 overlays custom — corrige le focus trap en même temps que la dette technique.
6. Créer `usePipelineProgress`/`PipelineTimeline` partagés — élimine la divergence Emploi/Études déjà actée.
7. Ajouter un système de toast minimal pour les actions asynchrones sans rechargement de page.

### P2 — Amélioration (consolidation du design system)
1. Réduire le radius à 2 niveaux, le padding à 3 valeurs, les ombres à 3 niveaux (§7) — créer `StatCard`, `BackLink`, `PageHeader`, `ExportButtons`, `TemplateOption`.
2. Ajouter des tokens CSS `--success`/`--warning` (actuellement seulement Tailwind littéral dans `Badge`).
3. Ajouter `loading.tsx` sur `cv/[id]/edit`, `blog/[slug]` (les fetches les plus visibles sans état de chargement).
4. Uniformiser les 15 empty states (au moins icône + carte dédiée sur les plus visibles : paiements, mouvements de crédits).
5. Vérifier le contraste en dark mode à l'échelle du produit (audit visuel dédié, hors portée de cette passe).

### P3 — Nice-to-have
1. Command palette (Cmd+K) — pertinent seulement si la densité de contenu admin/dashboard augmente.
2. Breadcrumbs étendus à l'admin (users→detail, blog→edit).
3. Supprimer le code mort de `demo-player.tsx` (branche modale jamais invoquée).
4. Revoir l'animation `transition-[width]` de la sidebar (impact réel marginal, fréquence d'usage faible).

---

## 14. Plan d'implémentation par étapes

**Séquencement recommandé — chaque étape est livrable et testable indépendamment, aucune ne suppose la suivante déjà faite :**

| # | Étape | Contenu | Dépend de |
|---|---|---|---|
| 1 | **Fix du rendu CV/Lettre** | Calculer/appliquer le scale du srcdoc à son conteneur ; valider sur CV Builder review, CV Editor, CV Preview, mobile ET desktop | — |
| 2 | **Éditeur mobile** | Barre d'onglets Formulaire/Aperçu/Lettre/Style sous `md:` | Étape 1 (l'aperçu doit déjà bien s'afficher avant d'y donner accès sur mobile) |
| 3 | **Profil — bouton d'action** | `position: sticky` confiné à la colonne formulaire | — (indépendant, peut être fait en parallèle des étapes 1-2) |
| 4 | **Sidebar toggle** | Déplacer dans le header propre de la sidebar | — |
| 5 | **Design system — tokens** | Documenter formellement radius (2 niveaux) / spacing (3 valeurs) / shadows (3 niveaux) / motion (5 valeurs) comme référence écrite, sans encore migrer les composants existants | Étapes 1-4 (stabiliser le fonctionnel avant de standardiser le visuel) |
| 6 | **Créer `StatCard`, `BackLink`, `PageHeader`, `ExportButtons`, `TemplateOption`** | Composants `ui/` + `templates/` | Étape 5 |
| 7 | **Migrer les 7+5+3+3 occurrences dupliquées** vers les nouveaux composants | Un PR par famille de composant, pas un big-bang | Étape 6 |
| 8 | **Créer `Dialog` (Radix) et migrer les 2 overlays custom** | Corrige le focus trap en même temps | Peut démarrer en parallèle de l'étape 6 |
| 9 | **`usePipelineProgress` + `PipelineTimeline`** | Unifier generate-form/campus-france-form — le chantier le plus délicat (deux flows en prod, tester les deux univers à chaque changement) | Après stabilisation des étapes 1-2 (ne pas toucher au pipeline pendant que l'aperçu est en cours de correction) |
| 10 | **Toast/notifications** | Nouveau composant + intégration sur 3-4 actions prioritaires (code promo, sauvegarde profil, erreurs d'upload) | Étape 6 (réutilise les patterns de composant nouvellement établis) |
| 11 | **Nettoyage** | `loading.tsx` manquants, empty states, code mort (`demo-player`, `StatusCell`), bannière Stripe | En continu, au fil de l'eau |
| 12 | **Vérification finale** | Recette sur device réel (pas seulement resize navigateur) des étapes 1-3, contraste dark mode à l'échelle, `<th scope>` sur tables admin | Après toutes les étapes précédentes |

---

## Limites méthodologiques de cet audit

- Le redimensionnement de fenêtre sur le poste utilisé pour l'inspection en direct a un plancher d'environ 600px — les largeurs 320-480px n'ont pas été confirmées visuellement pixel par pixel, seulement déduites du code Tailwind (breakpoints par défaut, non redéfinis). Les bugs Critical identifiés (CV/Lettre, éditeur mobile, profil) ont en revanche été **confirmés en direct**, donc fiables indépendamment de cette limite.
- Dark mode non vérifié visuellement à l'échelle du produit — seule son infrastructure (tokens, toggle, script anti-FOUC) a été auditée par lecture de code.
- Modals `<dialog>` natifs (admin RGPD, archivage compte) et la branche modale de `demo-player.tsx` non déclenchés visuellement dans cette passe.
- Comportement clavier virtuel mobile (textarea sous clavier) non testable sans device réel.
- Cet audit ne couvre pas les pages `/admin/*` en détail visuel (auditées uniquement par lecture de code pour les patterns de duplication/tables).
