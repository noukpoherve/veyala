-- Data migration: insert the seed blog catalog if missing.
-- Source of truth at generation time: lib/blog/posts.ts (SEED_BLOG_POSTS).
--
-- Safety:
-- - Touches only "BlogPost" (no packs, users, templates, payments).
-- - INSERT ... ON CONFLICT (slug) DO NOTHING: never overwrites an existing article.
-- - Other blog rows with different slugs are left untouched.
-- - Transactional via prisma migrate deploy.

INSERT INTO "BlogPost" (
  "id",
  "slug",
  "title",
  "description",
  "excerpt",
  "category",
  "tags",
  "keywords",
  "focusKeyword",
  "status",
  "featured",
  "accent",
  "authorName",
  "authorRole",
  "body",
  "faq",
  "bodyMarkdown",
  "readingTimeMin",
  "publishedAt",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid()::text,
  $seed$passer-filtres-ats-mots-cles-cv$seed$,
  $seed$Comment passer les filtres ATS : mots-clés CV et score de matching$seed$,
  $seed$Guide complet pour optimiser votre CV ATS : mots-clés de l'offre d'emploi, format compatible, score de matching et erreurs qui font rejeter votre candidature avant un recruteur.$seed$,
  $seed$80 % des CV sont filtrés par un ATS avant d'être lus. Voici comment formuler vos expériences pour maximiser votre score de matching.$seed$,
  $seed$ATS$seed$::"BlogCategory",
  ARRAY[$seed$ATS$seed$, $seed$mots-clés CV$seed$, $seed$recrutement$seed$, $seed$candidature$seed$]::TEXT[],
  ARRAY[$seed$ATS$seed$, $seed$filtre ATS$seed$, $seed$CV ATS$seed$, $seed$mots-clés CV$seed$, $seed$optimiser CV ATS$seed$, $seed$score matching CV$seed$, $seed$candidature emploi$seed$, $seed$logiciel recrutement$seed$, $seed$CV compatible ATS$seed$, $seed$passer filtre ATS$seed$]::TEXT[],
  $seed$ATS$seed$,
  'PUBLISHED'::"BlogPostStatus",
  TRUE,
  $seed$#2563EB$seed$,
  $seed$Équipe Veyala$seed$,
  $seed$Experts CV, ATS & candidature$seed$,
  $seed$[{"type":"p","text":"Un Applicant Tracking System (ATS) est le logiciel que la plupart des entreprises utilisent pour réceptionner, parser et classer les candidatures. Si votre CV n'est pas lisible par la machine — ou s'il ne contient pas les mots-clés de l'offre — il peut être écarté avant qu'un recruteur ne le voie."},{"type":"callout","title":"En bref","text":"Un CV ATS-friendly combine un format simple (Word ou PDF texte), des intitulés de postes alignés sur l'offre, et les compétences exactes demandées dans la fiche de poste — sans keyword stuffing."},{"type":"h2","text":"Comment fonctionne un filtre ATS ?"},{"type":"p","text":"L'ATS extrait le texte de votre fichier, identifie sections (expérience, formation, compétences), puis calcule un score de matching entre votre profil et l'offre d'emploi. Les candidats sous un seuil défini sont souvent exclus automatiquement."},{"type":"ol","items":["Parsing : extraction du texte (tableaux, colonnes et images nuisent souvent au parsing).","Normalisation : le système standardise titres, dates et compétences.","Matching : comparaison aux mots-clés et critères de l'offre (hard skills, outils, diplômes).","Classement : score + filtres (années d'expérience, localisation, langues)."]},{"type":"h2","text":"Les mots-clés CV qui font vraiment la différence"},{"type":"p","text":"Les meilleurs mots-clés ne sont pas génériques (« dynamique », « motivé ») : ce sont les termes techniques et métier repris dans l'annonce. Exemple : si l'offre demande « React », « TypeScript » et « CI/CD », ces termes doivent apparaître naturellement dans vos expériences pertinentes."},{"type":"ul","items":["Reprendre les intitulés exacts des compétences (ex. « gestion de projet Agile » vs seulement « Agile »).","Inclure outils, frameworks et certifications cités dans l'offre.","Aligner le titre du poste visé (ou un titre proche) avec celui de l'annonce.","Éviter les acronymes seuls si l'offre utilise la forme développée — ou mettre les deux."]},{"type":"h2","text":"Format CV compatible ATS : ce qu'il faut éviter"},{"type":"ul","items":["CV en image, scan ou PDF non sélectionnable","Colonnes multiples, tableaux complexes, encadrés décoratifs","Icônes à la place du texte pour les compétences","En-têtes / pieds de page contenant des infos critiques (certains ATS les ignorent)","Polices fantaisie et barres de compétences graphiques non textuelles"]},{"type":"h2","text":"Méthode en 4 étapes pour adapter votre CV à chaque offre"},{"type":"ol","items":["Surlignez dans l'offre les compétences obligatoires et souhaitées.","Mappez chaque exigence à une preuve concrète dans votre parcours.","Reformulez vos puces d'expérience avec les verbes et termes de l'annonce.","Vérifiez le format (DOCX/PDF texte) et la cohérence des dates."]},{"type":"quote","text":"Un bon CV ATS n'est pas un CV « bourré » de mots-clés : c'est un CV lisible par la machine et convaincant pour l'humain qui le lira ensuite."},{"type":"h2","text":"Comment Veyala optimise votre score ATS"},{"type":"p","text":"Veyala analyse l'offre d'emploi et reformule votre profil pour intégrer les mots-clés pertinents, tout en gardant un format export Word & PDF compatible ATS. En quelques secondes, vous obtenez un CV sur mesure pour cette candidature précise."},{"type":"cta","text":"Collez une offre et générez un CV optimisé ATS en 30 secondes.","href":"/register","label":"Générer mon CV ATS"}]$seed$::jsonb,
  $seed$[{"question":"Qu'est-ce qu'un ATS en recrutement ?","answer":"Un ATS (Applicant Tracking System) est un logiciel de suivi des candidatures utilisé par les entreprises pour recevoir, filtrer et classer les CV avant le tri humain."},{"question":"Le PDF est-il compatible ATS ?","answer":"Oui, si le PDF contient du texte sélectionnable. Évitez les PDF scannés ou purement graphiques. Le format Word (.docx) reste souvent le plus sûr pour le parsing."},{"question":"Faut-il un CV différent pour chaque offre ?","answer":"Oui, idéalement. Adapter les mots-clés et les expériences mises en avant augmente fortement votre score de matching et vos chances d'entretien."}]$seed$::jsonb,
  $seed$Un Applicant Tracking System (ATS) est le logiciel que la plupart des entreprises utilisent pour réceptionner, parser et classer les candidatures. Si votre CV n'est pas lisible par la machine — ou s'il ne contient pas les mots-clés de l'offre — il peut être écarté avant qu'un recruteur ne le voie.

!!! En bref
Un CV ATS-friendly combine un format simple (Word ou PDF texte), des intitulés de postes alignés sur l'offre, et les compétences exactes demandées dans la fiche de poste — sans keyword stuffing.

## Comment fonctionne un filtre ATS ?

L'ATS extrait le texte de votre fichier, identifie sections (expérience, formation, compétences), puis calcule un score de matching entre votre profil et l'offre d'emploi. Les candidats sous un seuil défini sont souvent exclus automatiquement.

1. Parsing : extraction du texte (tableaux, colonnes et images nuisent souvent au parsing).
2. Normalisation : le système standardise titres, dates et compétences.
3. Matching : comparaison aux mots-clés et critères de l'offre (hard skills, outils, diplômes).
4. Classement : score + filtres (années d'expérience, localisation, langues).

## Les mots-clés CV qui font vraiment la différence

Les meilleurs mots-clés ne sont pas génériques (« dynamique », « motivé ») : ce sont les termes techniques et métier repris dans l'annonce. Exemple : si l'offre demande « React », « TypeScript » et « CI/CD », ces termes doivent apparaître naturellement dans vos expériences pertinentes.

- Reprendre les intitulés exacts des compétences (ex. « gestion de projet Agile » vs seulement « Agile »).
- Inclure outils, frameworks et certifications cités dans l'offre.
- Aligner le titre du poste visé (ou un titre proche) avec celui de l'annonce.
- Éviter les acronymes seuls si l'offre utilise la forme développée — ou mettre les deux.

## Format CV compatible ATS : ce qu'il faut éviter

- CV en image, scan ou PDF non sélectionnable
- Colonnes multiples, tableaux complexes, encadrés décoratifs
- Icônes à la place du texte pour les compétences
- En-têtes / pieds de page contenant des infos critiques (certains ATS les ignorent)
- Polices fantaisie et barres de compétences graphiques non textuelles

## Méthode en 4 étapes pour adapter votre CV à chaque offre

1. Surlignez dans l'offre les compétences obligatoires et souhaitées.
2. Mappez chaque exigence à une preuve concrète dans votre parcours.
3. Reformulez vos puces d'expérience avec les verbes et termes de l'annonce.
4. Vérifiez le format (DOCX/PDF texte) et la cohérence des dates.

> Un bon CV ATS n'est pas un CV « bourré » de mots-clés : c'est un CV lisible par la machine et convaincant pour l'humain qui le lira ensuite.

## Comment Veyala optimise votre score ATS

Veyala analyse l'offre d'emploi et reformule votre profil pour intégrer les mots-clés pertinents, tout en gardant un format export Word & PDF compatible ATS. En quelques secondes, vous obtenez un CV sur mesure pour cette candidature précise.

@@cta|/register|Générer mon CV ATS
Collez une offre et générez un CV optimisé ATS en 30 secondes.
@@$seed$,
  9,
  $seed$2026-06-12T00:00:00.000Z$seed$::timestamp,
  $seed$2026-06-12T00:00:00.000Z$seed$::timestamp,
  $seed$2026-07-20T00:00:00.000Z$seed$::timestamp
)
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "BlogPost" (
  "id",
  "slug",
  "title",
  "description",
  "excerpt",
  "category",
  "tags",
  "keywords",
  "focusKeyword",
  "status",
  "featured",
  "accent",
  "authorName",
  "authorRole",
  "body",
  "faq",
  "bodyMarkdown",
  "readingTimeMin",
  "publishedAt",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid()::text,
  $seed$adapter-cv-offre-emploi$seed$,
  $seed$Adapter son CV à une offre d'emploi : méthode concrète (exemples)$seed$,
  $seed$Comment adapter votre CV à chaque offre d'emploi : analyse de la fiche de poste, reformulation des expériences, compétences ciblées et checklist avant d'envoyer votre candidature.$seed$,
  $seed$Un CV générique perd face à un CV ciblé. Voici une méthode simple pour matcher chaque offre sans tout réécrire à la main.$seed$,
  $seed$CV$seed$::"BlogCategory",
  ARRAY[$seed$CV$seed$, $seed$offre d'emploi$seed$, $seed$candidature$seed$, $seed$personnalisation$seed$]::TEXT[],
  ARRAY[$seed$adapter CV offre emploi$seed$, $seed$CV personnalisé$seed$, $seed$CV ciblé$seed$, $seed$fiche de poste$seed$, $seed$candidature emploi$seed$, $seed$reformuler expériences CV$seed$, $seed$CV sur mesure$seed$, $seed$répondre à une offre$seed$, $seed$matching CV offre$seed$]::TEXT[],
  $seed$adapter CV offre emploi$seed$,
  'PUBLISHED'::"BlogPostStatus",
  TRUE,
  $seed$#1D4ED8$seed$,
  $seed$Équipe Veyala$seed$,
  $seed$Experts CV, ATS & candidature$seed$,
  $seed$[{"type":"p","text":"Envoyer le même CV à 50 offres est la stratégie la plus courante… et la moins efficace. Les recruteurs (et les ATS) cherchent la preuve que vous comprenez le poste. Adapter son CV, ce n'est pas mentir : c'est hiérarchiser et reformuler."},{"type":"h2","text":"1. Décoder la fiche de poste"},{"type":"p","text":"Séparez clairement ce qui est indispensable (must-have) de ce qui est un plus (nice-to-have). Notez les verbes d'action, les outils nommés, le niveau d'expérience et le contexte (startup, grand groupe, remote, etc.)."},{"type":"ul","items":["Missions principales vs tâches secondaires","Compétences techniques et soft skills explicites","Indicateurs de succès (chiffres, résultats, KPIs)","Mots répétés dans l'annonce = priorité haute"]},{"type":"h2","text":"2. Réécrire le pitch / accroche du CV"},{"type":"p","text":"Votre accroche doit répondre à l'offre en 2–3 lignes : qui vous êtes pour ce poste, votre valeur principale, et un résultat concret. Remplacez « profil polyvalent » par une promesse liée au besoin."},{"type":"h2","text":"3. Sélectionner et reformuler les expériences"},{"type":"p","text":"Gardez 3 à 5 expériences max sur un CV ciblé. Pour chaque puce, utilisez le schéma : action + contexte + résultat. Intégrez le vocabulaire de l'offre sans forcer."},{"type":"callout","title":"Exemple","text":"Avant : « Gestion de projets marketing ». Après (offre growth) : « Piloté 4 campagnes acquisition B2B (SEO, LinkedIn Ads) : +38 % de leads qualifiés en 6 mois »."},{"type":"h2","text":"4. Compétences : ordre stratégique"},{"type":"p","text":"Placez en premier les compétences présentes dans l'annonce. Retirez ou reléguez celles qui diluent le message. Un CV lisible en 6 secondes gagne face à une liste encyclopédique."},{"type":"h2","text":"Checklist avant envoi"},{"type":"ol","items":["Le titre ou l'accroche évoque le poste visé","Au moins 70 % des must-have apparaissent clairement","Chaque expérience clé a un résultat mesurable","Orthographe, dates et export ATS vérifiés","Lettre de motivation cohérente avec le même angle"]},{"type":"cta","text":"Collez l'offre : Veyala adapte automatiquement votre CV et votre lettre.","href":"/register","label":"Adapter mon CV maintenant"}]$seed$::jsonb,
  $seed$[{"question":"Combien de temps pour adapter un CV à une offre ?","answer":"Manuellement : 30 à 90 minutes. Avec un outil comme Veyala, l'adaptation ciblée (CV + lettre) peut prendre moins d'une minute."},{"question":"Faut-il inventer des compétences pour matcher l'offre ?","answer":"Non. Adaptez uniquement ce que vous pouvez défendre en entretien. Le matching se fait par reformulation et priorisation, pas par invention."}]$seed$::jsonb,
  $seed$Envoyer le même CV à 50 offres est la stratégie la plus courante… et la moins efficace. Les recruteurs (et les ATS) cherchent la preuve que vous comprenez le poste. Adapter son CV, ce n'est pas mentir : c'est hiérarchiser et reformuler.

## 1. Décoder la fiche de poste

Séparez clairement ce qui est indispensable (must-have) de ce qui est un plus (nice-to-have). Notez les verbes d'action, les outils nommés, le niveau d'expérience et le contexte (startup, grand groupe, remote, etc.).

- Missions principales vs tâches secondaires
- Compétences techniques et soft skills explicites
- Indicateurs de succès (chiffres, résultats, KPIs)
- Mots répétés dans l'annonce = priorité haute

## 2. Réécrire le pitch / accroche du CV

Votre accroche doit répondre à l'offre en 2–3 lignes : qui vous êtes pour ce poste, votre valeur principale, et un résultat concret. Remplacez « profil polyvalent » par une promesse liée au besoin.

## 3. Sélectionner et reformuler les expériences

Gardez 3 à 5 expériences max sur un CV ciblé. Pour chaque puce, utilisez le schéma : action + contexte + résultat. Intégrez le vocabulaire de l'offre sans forcer.

!!! Exemple
Avant : « Gestion de projets marketing ». Après (offre growth) : « Piloté 4 campagnes acquisition B2B (SEO, LinkedIn Ads) : +38 % de leads qualifiés en 6 mois ».

## 4. Compétences : ordre stratégique

Placez en premier les compétences présentes dans l'annonce. Retirez ou reléguez celles qui diluent le message. Un CV lisible en 6 secondes gagne face à une liste encyclopédique.

## Checklist avant envoi

1. Le titre ou l'accroche évoque le poste visé
2. Au moins 70 % des must-have apparaissent clairement
3. Chaque expérience clé a un résultat mesurable
4. Orthographe, dates et export ATS vérifiés
5. Lettre de motivation cohérente avec le même angle

@@cta|/register|Adapter mon CV maintenant
Collez l'offre : Veyala adapte automatiquement votre CV et votre lettre.
@@$seed$,
  8,
  $seed$2026-06-18T00:00:00.000Z$seed$::timestamp,
  $seed$2026-06-18T00:00:00.000Z$seed$::timestamp,
  $seed$2026-07-18T00:00:00.000Z$seed$::timestamp
)
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "BlogPost" (
  "id",
  "slug",
  "title",
  "description",
  "excerpt",
  "category",
  "tags",
  "keywords",
  "focusKeyword",
  "status",
  "featured",
  "accent",
  "authorName",
  "authorRole",
  "body",
  "faq",
  "bodyMarkdown",
  "readingTimeMin",
  "publishedAt",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid()::text,
  $seed$lettre-motivation-structure-efficace$seed$,
  $seed$Lettre de motivation : structure efficace qui convertit en 2026$seed$,
  $seed$Structure d'une lettre de motivation percutante : accroche, preuves, motivation entreprise, conclusion CTA. Exemples et erreurs à éviter pour décrocher un entretien.$seed$,
  $seed$Une lettre utile n'est pas un résumé du CV. Voici la structure en 4 blocs qui fonctionne encore auprès des recruteurs.$seed$,
  $seed$LETTRE$seed$::"BlogCategory",
  ARRAY[$seed$lettre de motivation$seed$, $seed$candidature$seed$, $seed$entretien$seed$]::TEXT[],
  ARRAY[$seed$lettre de motivation$seed$, $seed$structure lettre motivation$seed$, $seed$exemple lettre motivation$seed$, $seed$écrire lettre motivation$seed$, $seed$lettre motivation emploi$seed$, $seed$candidature$seed$, $seed$décrocher entretien$seed$, $seed$lettre motivation efficace$seed$]::TEXT[],
  $seed$lettre de motivation$seed$,
  'PUBLISHED'::"BlogPostStatus",
  TRUE,
  $seed$#0284C7$seed$,
  $seed$Équipe Veyala$seed$,
  $seed$Experts CV, ATS & candidature$seed$,
  $seed$[{"type":"p","text":"La lettre de motivation reste demandée pour de nombreuses candidatures en France — entreprises, administrations, écoles. Son rôle : montrer pourquoi vous et pourquoi eux, pas répéter le CV ligne à ligne."},{"type":"h2","text":"La structure en 4 blocs"},{"type":"h3","text":"1. Accroche (pourquoi ce poste, maintenant)"},{"type":"p","text":"Ouvrez sur le besoin de l'entreprise ou une réalisation liée au poste. Évitez « Je me permets de vous contacter… »."},{"type":"h3","text":"2. Preuves (2–3 arguments issus de votre parcours)"},{"type":"p","text":"Sélectionnez des expériences qui répondent aux missions de l'offre. Chiffres, responsabilités, impact."},{"type":"h3","text":"3. Motivation entreprise (pourquoi eux)"},{"type":"p","text":"Citez un projet, une valeur, un marché ou une actualité concrète. Montrez que vous avez lu l'annonce et l'entreprise."},{"type":"h3","text":"4. Conclusion + appel à l'action"},{"type":"p","text":"Proposez un échange. Restez court, confiant, sans formules creuses."},{"type":"h2","text":"Longueur et ton"},{"type":"ul","items":["Ideal : 250–400 mots (une page max)","Ton professionnel, actif, précis","Même vocabulaire métier que l'offre (sans copier-coller)","Cohérence totale avec le CV joint"]},{"type":"h2","text":"Erreurs qui tuent une lettre"},{"type":"ul","items":["Lettre générique recyclée pour 20 entreprises","Orthographe et prénom du recruteur approximatifs","Focus sur ce que vous voulez gagner, pas sur ce que vous apportez","Trop long, trop vague, trop humble ou trop arrogant"]},{"type":"cta","text":"Générez une lettre alignée sur votre CV et sur l'offre en quelques secondes.","href":"/register","label":"Créer ma lettre de motivation"}]$seed$::jsonb,
  $seed$[{"question":"La lettre de motivation est-elle encore utile ?","answer":"Oui, surtout en France et pour les postes en tension qualitative (cadres, stages sélectifs, écoles). Elle différencie deux CV techniques proches."},{"question":"Faut-il une lettre si l'ATS ne la lit pas ?","answer":"Souvent le recruteur la lit après le filtre CV. Une lettre ciblée reste un avantage dès que votre dossier passe l'ATS."}]$seed$::jsonb,
  $seed$La lettre de motivation reste demandée pour de nombreuses candidatures en France — entreprises, administrations, écoles. Son rôle : montrer pourquoi vous et pourquoi eux, pas répéter le CV ligne à ligne.

## La structure en 4 blocs

### 1. Accroche (pourquoi ce poste, maintenant)

Ouvrez sur le besoin de l'entreprise ou une réalisation liée au poste. Évitez « Je me permets de vous contacter… ».

### 2. Preuves (2–3 arguments issus de votre parcours)

Sélectionnez des expériences qui répondent aux missions de l'offre. Chiffres, responsabilités, impact.

### 3. Motivation entreprise (pourquoi eux)

Citez un projet, une valeur, un marché ou une actualité concrète. Montrez que vous avez lu l'annonce et l'entreprise.

### 4. Conclusion + appel à l'action

Proposez un échange. Restez court, confiant, sans formules creuses.

## Longueur et ton

- Ideal : 250–400 mots (une page max)
- Ton professionnel, actif, précis
- Même vocabulaire métier que l'offre (sans copier-coller)
- Cohérence totale avec le CV joint

## Erreurs qui tuent une lettre

- Lettre générique recyclée pour 20 entreprises
- Orthographe et prénom du recruteur approximatifs
- Focus sur ce que vous voulez gagner, pas sur ce que vous apportez
- Trop long, trop vague, trop humble ou trop arrogant

@@cta|/register|Créer ma lettre de motivation
Générez une lettre alignée sur votre CV et sur l'offre en quelques secondes.
@@$seed$,
  7,
  $seed$2026-06-25T00:00:00.000Z$seed$::timestamp,
  $seed$2026-06-25T00:00:00.000Z$seed$::timestamp,
  $seed$2026-07-15T00:00:00.000Z$seed$::timestamp
)
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "BlogPost" (
  "id",
  "slug",
  "title",
  "description",
  "excerpt",
  "category",
  "tags",
  "keywords",
  "focusKeyword",
  "status",
  "featured",
  "accent",
  "authorName",
  "authorRole",
  "body",
  "faq",
  "bodyMarkdown",
  "readingTimeMin",
  "publishedAt",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid()::text,
  $seed$erreurs-cv-qui-font-rejeter$seed$,
  $seed$12 erreurs CV qui font rejeter votre candidature (et comment les corriger)$seed$,
  $seed$Les erreurs CV les plus fréquentes : mise en page non ATS, fautes, expériences vagues, photo, longueur. Checklist pour un CV professionnel qui passe le tri.$seed$,
  $seed$Avant de blâmer le marché de l'emploi, vérifiez ces 12 points qui font sortir un CV du process en quelques secondes.$seed$,
  $seed$CV$seed$::"BlogCategory",
  ARRAY[$seed$CV$seed$, $seed$erreurs$seed$, $seed$recrutement$seed$, $seed$conseils$seed$]::TEXT[],
  ARRAY[$seed$erreurs CV$seed$, $seed$CV rejeté$seed$, $seed$fautes CV$seed$, $seed$CV professionnel$seed$, $seed$améliorer CV$seed$, $seed$conseils CV$seed$, $seed$mise en page CV$seed$, $seed$CV trop long$seed$, $seed$candidature refusée$seed$]::TEXT[],
  $seed$erreurs CV$seed$,
  'PUBLISHED'::"BlogPostStatus",
  FALSE,
  $seed$#0369A1$seed$,
  $seed$Équipe Veyala$seed$,
  $seed$Experts CV, ATS & candidature$seed$,
  $seed$[{"type":"p","text":"Un recruteur passe en moyenne moins de 10 secondes sur un CV au premier passage. Les erreurs ci-dessous sont des signaux d'alerte immédiats — pour l'humain comme pour l'ATS."},{"type":"ol","items":["CV générique non adapté à l'offre","Fautes d'orthographe et incohérences de dates","Expériences sans résultats mesurables","Mise en page à colonnes illisibles par ATS","Titre de CV vague (« À la recherche d'un emploi »)","Coordonnées incomplètes ou email non professionnel","Trop de jargon interne incompréhensible hors de votre boîte","Liste de compétences sans preuve d'usage","Longueur excessive (3+ pages sans seniorité justifiée)","Photo ou éléments graphiques qui cassent le parsing","Trous non expliqués et intitulés trompeurs","Mauvais format d'export (image, .pages, .odt fragile)"]},{"type":"h2","text":"Priorité absolue : clarté + preuves"},{"type":"p","text":"Corrigez d'abord le fond : chaque ligne doit répondre à « et alors ? ». Puis le format : un document propre, exporté en Word ou PDF texte, avec les mots-clés de l'offre."},{"type":"callout","title":"Astuce Veyala","text":"Générez une version ciblée par offre : vous réduisez automatiquement le risque de CV générique et de mismatch ATS."},{"type":"cta","text":"Corrigez structure, mots-clés et formulation avec une génération guidée par l'offre.","href":"/register","label":"Optimiser mon CV"}]$seed$::jsonb,
  $seed$[]$seed$::jsonb,
  $seed$Un recruteur passe en moyenne moins de 10 secondes sur un CV au premier passage. Les erreurs ci-dessous sont des signaux d'alerte immédiats — pour l'humain comme pour l'ATS.

1. CV générique non adapté à l'offre
2. Fautes d'orthographe et incohérences de dates
3. Expériences sans résultats mesurables
4. Mise en page à colonnes illisibles par ATS
5. Titre de CV vague (« À la recherche d'un emploi »)
6. Coordonnées incomplètes ou email non professionnel
7. Trop de jargon interne incompréhensible hors de votre boîte
8. Liste de compétences sans preuve d'usage
9. Longueur excessive (3+ pages sans seniorité justifiée)
10. Photo ou éléments graphiques qui cassent le parsing
11. Trous non expliqués et intitulés trompeurs
12. Mauvais format d'export (image, .pages, .odt fragile)

## Priorité absolue : clarté + preuves

Corrigez d'abord le fond : chaque ligne doit répondre à « et alors ? ». Puis le format : un document propre, exporté en Word ou PDF texte, avec les mots-clés de l'offre.

!!! Astuce Veyala
Générez une version ciblée par offre : vous réduisez automatiquement le risque de CV générique et de mismatch ATS.

@@cta|/register|Optimiser mon CV
Corrigez structure, mots-clés et formulation avec une génération guidée par l'offre.
@@$seed$,
  6,
  $seed$2026-07-02T00:00:00.000Z$seed$::timestamp,
  $seed$2026-07-02T00:00:00.000Z$seed$::timestamp,
  $seed$2026-07-22T00:00:00.000Z$seed$::timestamp
)
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "BlogPost" (
  "id",
  "slug",
  "title",
  "description",
  "excerpt",
  "category",
  "tags",
  "keywords",
  "focusKeyword",
  "status",
  "featured",
  "accent",
  "authorName",
  "authorRole",
  "body",
  "faq",
  "bodyMarkdown",
  "readingTimeMin",
  "publishedAt",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid()::text,
  $seed$cv-ia-avantages-limites-bonnes-pratiques$seed$,
  $seed$CV généré par IA : avantages, limites et bonnes pratiques$seed$,
  $seed$Utiliser l'IA pour rédiger un CV : gains de temps, personnalisation ATS, risques d'hallucination et règles d'éthique. Comment Veyala reformule sans inventer votre parcours.$seed$,
  $seed$L'IA accélère la rédaction de CV — à condition de rester maître des faits. Voici le bon usage pour candidater plus vite, sans se tirer une balle dans le pied.$seed$,
  $seed$IA$seed$::"BlogCategory",
  ARRAY[$seed$IA$seed$, $seed$CV$seed$, $seed$ATS$seed$, $seed$productivité$seed$]::TEXT[],
  ARRAY[$seed$CV IA$seed$, $seed$générateur CV IA$seed$, $seed$rédiger CV intelligence artificielle$seed$, $seed$CV ChatGPT$seed$, $seed$optimiser CV IA$seed$, $seed$candidature IA$seed$, $seed$Veyala$seed$, $seed$CV automatique$seed$, $seed$lettre motivation IA$seed$]::TEXT[],
  $seed$CV IA$seed$,
  'PUBLISHED'::"BlogPostStatus",
  FALSE,
  $seed$#4F46E5$seed$,
  $seed$Équipe Veyala$seed$,
  $seed$Experts CV, ATS & candidature$seed$,
  $seed$[{"type":"p","text":"Les générateurs de CV par IA explosent parce que le vrai goulot d'étranglement n'est plus « avoir un CV », c'est « avoir le bon CV pour cette offre ». Bien utilisée, l'IA devient un accélérateur de matching."},{"type":"h2","text":"Ce que l'IA fait très bien"},{"type":"ul","items":["Reformuler des expériences avec le vocabulaire de l'offre","Proposer une structure claire et ATS-friendly","Générer une lettre cohérente avec le CV","Gagner du temps sur les candidatures multiples"]},{"type":"h2","text":"Les limites à connaître"},{"type":"ul","items":["Risque d'ajouter des compétences non maîtrisées si le prompt est flou","Ton trop générique si l'outil ne lit pas l'offre","Incohérences factuelles si la source profil est incomplète","Relecture humaine indispensable avant envoi"]},{"type":"h2","text":"Bonnes pratiques"},{"type":"ol","items":["Partir d'un profil véridique (dates, postes, résultats).","Toujours coller l'offre d'emploi pour un ciblage réel.","Vérifier chaque affirmation défendable en entretien.","Exporter un format compatible ATS (Word / PDF texte).","Itérer : 1 offre = 1 version ciblée."]},{"type":"quote","text":"Chez Veyala, l'IA reformule exclusivement vos informations : elle n'invente pas un parcours. Vous restez responsable du contenu envoyé.","cite":"Équipe produit Veyala"},{"type":"cta","text":"Importez votre profil, collez une offre, exportez CV + lettre.","href":"/register","label":"Essayer Veyala"}]$seed$::jsonb,
  $seed$[{"question":"Un recruteur détecte-t-il un CV écrit par IA ?","answer":"Ce qui compte, c'est la précision et la crédibilité. Un texte IA générique se repère ; un texte factuel, ciblé et relu passe comme n'importe quelle bonne rédaction."},{"question":"ChatGPT suffit-il pour un CV ATS ?","answer":"Un chat généraliste aide à rédiger, mais un outil spécialisé qui parse l'offre et exporte un format ATS (comme Veyala) réduit les allers-retours et les erreurs de matching."}]$seed$::jsonb,
  $seed$Les générateurs de CV par IA explosent parce que le vrai goulot d'étranglement n'est plus « avoir un CV », c'est « avoir le bon CV pour cette offre ». Bien utilisée, l'IA devient un accélérateur de matching.

## Ce que l'IA fait très bien

- Reformuler des expériences avec le vocabulaire de l'offre
- Proposer une structure claire et ATS-friendly
- Générer une lettre cohérente avec le CV
- Gagner du temps sur les candidatures multiples

## Les limites à connaître

- Risque d'ajouter des compétences non maîtrisées si le prompt est flou
- Ton trop générique si l'outil ne lit pas l'offre
- Incohérences factuelles si la source profil est incomplète
- Relecture humaine indispensable avant envoi

## Bonnes pratiques

1. Partir d'un profil véridique (dates, postes, résultats).
2. Toujours coller l'offre d'emploi pour un ciblage réel.
3. Vérifier chaque affirmation défendable en entretien.
4. Exporter un format compatible ATS (Word / PDF texte).
5. Itérer : 1 offre = 1 version ciblée.

> Chez Veyala, l'IA reformule exclusivement vos informations : elle n'invente pas un parcours. Vous restez responsable du contenu envoyé.
> — Équipe produit Veyala

@@cta|/register|Essayer Veyala
Importez votre profil, collez une offre, exportez CV + lettre.
@@$seed$,
  8,
  $seed$2026-07-08T00:00:00.000Z$seed$::timestamp,
  $seed$2026-07-08T00:00:00.000Z$seed$::timestamp,
  $seed$2026-07-25T00:00:00.000Z$seed$::timestamp
)
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "BlogPost" (
  "id",
  "slug",
  "title",
  "description",
  "excerpt",
  "category",
  "tags",
  "keywords",
  "focusKeyword",
  "status",
  "featured",
  "accent",
  "authorName",
  "authorRole",
  "body",
  "faq",
  "bodyMarkdown",
  "readingTimeMin",
  "publishedAt",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid()::text,
  $seed$cv-etudiant-stage-alternance-campus-france$seed$,
  $seed$CV étudiant : stage, alternance, Parcoursup et Campus France$seed$,
  $seed$Réussir son CV étudiant pour stage, alternance, Parcoursup ou Campus France : projets, soft skills, formations et lettre de motivation adaptée aux dossiers scolaires.$seed$,
  $seed$Peu d'expérience pro ? Votre CV étudiant peut quand même convaincre — si vous valorisez projets, associations et résultats académiques.$seed$,
  $seed$ETUDES$seed$::"BlogCategory",
  ARRAY[$seed$étudiant$seed$, $seed$stage$seed$, $seed$Campus France$seed$, $seed$Parcoursup$seed$]::TEXT[],
  ARRAY[$seed$CV étudiant$seed$, $seed$CV stage$seed$, $seed$CV alternance$seed$, $seed$Campus France CV$seed$, $seed$Parcoursup$seed$, $seed$lettre motivation étudiant$seed$, $seed$candidature stage$seed$, $seed$CV première expérience$seed$, $seed$dossier candidature formation$seed$]::TEXT[],
  $seed$CV étudiant$seed$,
  'PUBLISHED'::"BlogPostStatus",
  FALSE,
  $seed$#0EA5E9$seed$,
  $seed$Équipe Veyala$seed$,
  $seed$Experts CV, ATS & candidature$seed$,
  $seed$[{"type":"p","text":"Pour un stage, une alternance ou un dossier Campus France / formation sélective, le jury ne cherche pas 10 ans d'expérience : il cherche du potentiel, de la cohérence et des preuves d'engagement."},{"type":"h2","text":"Ce qui compte sur un CV étudiant"},{"type":"ul","items":["Projets académiques avec livrable et rôle clair","Associations, jobs étudiants, bénévolat (responsabilités)","Compétences outils (Excel, Python, Figma, langues…)","Résultats : classement, prix, KPIs d'un projet, volume géré"]},{"type":"h2","text":"Stage & alternance : cibler l'entreprise"},{"type":"p","text":"Même logique que pour un emploi : adaptez le CV à l'offre. Mettez en avant les cours et projets proches des missions. Ajoutez une lettre courte qui explique votre motivation pour ce métier / cette boîte."},{"type":"h2","text":"Campus France & dossiers formation"},{"type":"p","text":"Les dossiers études valorisent la cohérence du projet pédagogique. Votre CV et votre lettre doivent raconter la même histoire : pourquoi cette formation, pourquoi maintenant, quelles preuves de capacité de travail."},{"type":"callout","title":"Veyala Étudiants","text":"Collez une fiche de formation ou une offre de stage : Veyala génère un CV et une lettre adaptés au contexte études ou emploi."},{"type":"cta","text":"Préparez un dossier clair pour stage, alternance ou formation.","href":"/register","label":"Créer mon CV étudiant"}]$seed$::jsonb,
  $seed$[]$seed$::jsonb,
  $seed$Pour un stage, une alternance ou un dossier Campus France / formation sélective, le jury ne cherche pas 10 ans d'expérience : il cherche du potentiel, de la cohérence et des preuves d'engagement.

## Ce qui compte sur un CV étudiant

- Projets académiques avec livrable et rôle clair
- Associations, jobs étudiants, bénévolat (responsabilités)
- Compétences outils (Excel, Python, Figma, langues…)
- Résultats : classement, prix, KPIs d'un projet, volume géré

## Stage & alternance : cibler l'entreprise

Même logique que pour un emploi : adaptez le CV à l'offre. Mettez en avant les cours et projets proches des missions. Ajoutez une lettre courte qui explique votre motivation pour ce métier / cette boîte.

## Campus France & dossiers formation

Les dossiers études valorisent la cohérence du projet pédagogique. Votre CV et votre lettre doivent raconter la même histoire : pourquoi cette formation, pourquoi maintenant, quelles preuves de capacité de travail.

!!! Veyala Étudiants
Collez une fiche de formation ou une offre de stage : Veyala génère un CV et une lettre adaptés au contexte études ou emploi.

@@cta|/register|Créer mon CV étudiant
Préparez un dossier clair pour stage, alternance ou formation.
@@$seed$,
  7,
  $seed$2026-07-14T00:00:00.000Z$seed$::timestamp,
  $seed$2026-07-14T00:00:00.000Z$seed$::timestamp,
  $seed$2026-07-28T00:00:00.000Z$seed$::timestamp
)
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "BlogPost" (
  "id",
  "slug",
  "title",
  "description",
  "excerpt",
  "category",
  "tags",
  "keywords",
  "focusKeyword",
  "status",
  "featured",
  "accent",
  "authorName",
  "authorRole",
  "body",
  "faq",
  "bodyMarkdown",
  "readingTimeMin",
  "publishedAt",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid()::text,
  $seed$mots-cles-cv-par-metier$seed$,
  $seed$Mots-clés CV par métier : exemples pour matcher les offres$seed$,
  $seed$Exemples de mots-clés CV par métier (marketing, tech, finance, RH, commercial) pour améliorer votre matching ATS et parler le langage des recruteurs.$seed$,
  $seed$Les bons mots-clés sont ceux de votre fiche de poste. Voici des exemples par famille de métiers pour démarrer votre adaptation.$seed$,
  $seed$ATS$seed$::"BlogCategory",
  ARRAY[$seed$mots-clés$seed$, $seed$ATS$seed$, $seed$métiers$seed$, $seed$CV$seed$]::TEXT[],
  ARRAY[$seed$mots-clés CV$seed$, $seed$mots clés métier$seed$, $seed$CV marketing$seed$, $seed$CV développeur$seed$, $seed$CV commercial$seed$, $seed$CV finance$seed$, $seed$compétences CV$seed$, $seed$matching offre emploi$seed$, $seed$lexique recrutement$seed$]::TEXT[],
  $seed$mots-clés CV$seed$,
  'PUBLISHED'::"BlogPostStatus",
  FALSE,
  $seed$#2563EB$seed$,
  $seed$Équipe Veyala$seed$,
  $seed$Experts CV, ATS & candidature$seed$,
  $seed$[{"type":"p","text":"Cette liste n'est pas à copier telle quelle : elle illustre le niveau de précision attendu. Toujours partir de l'offre réelle."},{"type":"h2","text":"Tech / développement"},{"type":"p","text":"Exemples : TypeScript, React, Node.js, API REST, tests unitaires, CI/CD, Docker, Agile/Scrum, revue de code, performance, accessibilité."},{"type":"h2","text":"Marketing / growth"},{"type":"p","text":"Exemples : SEO, SEA, CRM, automation, taux de conversion, funnel, content marketing, A/B testing, analytics, lead generation."},{"type":"h2","text":"Commercial / sales"},{"type":"p","text":"Exemples : prospection, closing, CRM (Salesforce, HubSpot), pipeline, quota, account management, négociation, cycle de vente B2B."},{"type":"h2","text":"Finance / contrôle de gestion"},{"type":"p","text":"Exemples : reporting, budget, forecast, IFRS, Excel avancé, Power BI, analyse d'écarts, clôture comptable, trésorerie."},{"type":"h2","text":"RH / recrutement"},{"type":"p","text":"Exemples : sourcing, ATS, entretien structuré, marque employeur, onboarding, GPEC, droit social, relations sociales."},{"type":"callout","title":"Règle d'or","text":"Si un terme est dans l'offre et vrai pour vous, il doit apparaître dans votre CV — idéalement près d'une preuve d'usage."},{"type":"cta","text":"Extrainez automatiquement les mots-clés de n'importe quelle offre.","href":"/register","label":"Matcher mon CV à une offre"}]$seed$::jsonb,
  $seed$[]$seed$::jsonb,
  $seed$Cette liste n'est pas à copier telle quelle : elle illustre le niveau de précision attendu. Toujours partir de l'offre réelle.

## Tech / développement

Exemples : TypeScript, React, Node.js, API REST, tests unitaires, CI/CD, Docker, Agile/Scrum, revue de code, performance, accessibilité.

## Marketing / growth

Exemples : SEO, SEA, CRM, automation, taux de conversion, funnel, content marketing, A/B testing, analytics, lead generation.

## Commercial / sales

Exemples : prospection, closing, CRM (Salesforce, HubSpot), pipeline, quota, account management, négociation, cycle de vente B2B.

## Finance / contrôle de gestion

Exemples : reporting, budget, forecast, IFRS, Excel avancé, Power BI, analyse d'écarts, clôture comptable, trésorerie.

## RH / recrutement

Exemples : sourcing, ATS, entretien structuré, marque employeur, onboarding, GPEC, droit social, relations sociales.

!!! Règle d'or
Si un terme est dans l'offre et vrai pour vous, il doit apparaître dans votre CV — idéalement près d'une preuve d'usage.

@@cta|/register|Matcher mon CV à une offre
Extrainez automatiquement les mots-clés de n'importe quelle offre.
@@$seed$,
  6,
  $seed$2026-07-20T00:00:00.000Z$seed$::timestamp,
  $seed$2026-07-20T00:00:00.000Z$seed$::timestamp,
  $seed$2026-07-29T00:00:00.000Z$seed$::timestamp
)
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "BlogPost" (
  "id",
  "slug",
  "title",
  "description",
  "excerpt",
  "category",
  "tags",
  "keywords",
  "focusKeyword",
  "status",
  "featured",
  "accent",
  "authorName",
  "authorRole",
  "body",
  "faq",
  "bodyMarkdown",
  "readingTimeMin",
  "publishedAt",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid()::text,
  $seed$job-hunting-strategie-candidatures$seed$,
  $seed$Stratégie job hunting : candidater mieux (pas seulement plus)$seed$,
  $seed$Stratégie de recherche d'emploi efficace : ciblage des offres, CV ATS par candidature, suivi, networking LinkedIn et préparation aux entretiens.$seed$,
  $seed$Postuler en masse fatigue. Une stratégie job hunting mise sur la qualité du matching CV–offre et un suivi rigoureux.$seed$,
  $seed$EMPLOI$seed$::"BlogCategory",
  ARRAY[$seed$emploi$seed$, $seed$job hunting$seed$, $seed$recrutement$seed$, $seed$LinkedIn$seed$]::TEXT[],
  ARRAY[$seed$job hunting$seed$, $seed$recherche emploi$seed$, $seed$stratégie candidature$seed$, $seed$trouver un job$seed$, $seed$candidature efficace$seed$, $seed$LinkedIn emploi$seed$, $seed$entretien embauche$seed$, $seed$marché de l'emploi$seed$, $seed$CV et lettre$seed$]::TEXT[],
  $seed$job hunting$seed$,
  'PUBLISHED'::"BlogPostStatus",
  FALSE,
  $seed$#1E40AF$seed$,
  $seed$Équipe Veyala$seed$,
  $seed$Experts CV, ATS & candidature$seed$,
  $seed$[{"type":"p","text":"Le volume de candidatures compte — mais le taux de réponse dépend surtout de la pertinence. Voici un cadre simple pour chercher un emploi sans s'épuiser."},{"type":"h2","text":"1. Définir 2–3 cibles nettes"},{"type":"p","text":"Métier, niveau, type d'entreprise, remote/hybride. Trop large = CV dilué et message confus."},{"type":"h2","text":"2. Qualifier chaque offre avant de postuler"},{"type":"ul","items":["Match ≥ 60–70 % des must-have","Salaire / localisation acceptables","Annonce claire (pas de red flags extrêmes)"]},{"type":"h2","text":"3. Un dossier par candidature"},{"type":"p","text":"CV adapté + lettre courte + profil LinkedIn cohérent. Stockez version et date dans un tableau de suivi."},{"type":"h2","text":"4. Activer le réseau (sans spam)"},{"type":"p","text":"Message LinkedIn personnalisé, demande d'avis sur le rôle, pas de « je cherche un job » générique."},{"type":"h2","text":"5. Mesurer et itérer"},{"type":"p","text":"Si 20 candidatures ciblées = 0 réponse, le problème est le matching ou le positionnement — pas seulement « le marché »."},{"type":"cta","text":"Accélérez chaque candidature avec un CV + lettre générés à partir de l'offre.","href":"/register","label":"Candidater plus vite avec Veyala"}]$seed$::jsonb,
  $seed$[]$seed$::jsonb,
  $seed$Le volume de candidatures compte — mais le taux de réponse dépend surtout de la pertinence. Voici un cadre simple pour chercher un emploi sans s'épuiser.

## 1. Définir 2–3 cibles nettes

Métier, niveau, type d'entreprise, remote/hybride. Trop large = CV dilué et message confus.

## 2. Qualifier chaque offre avant de postuler

- Match ≥ 60–70 % des must-have
- Salaire / localisation acceptables
- Annonce claire (pas de red flags extrêmes)

## 3. Un dossier par candidature

CV adapté + lettre courte + profil LinkedIn cohérent. Stockez version et date dans un tableau de suivi.

## 4. Activer le réseau (sans spam)

Message LinkedIn personnalisé, demande d'avis sur le rôle, pas de « je cherche un job » générique.

## 5. Mesurer et itérer

Si 20 candidatures ciblées = 0 réponse, le problème est le matching ou le positionnement — pas seulement « le marché ».

@@cta|/register|Candidater plus vite avec Veyala
Accélérez chaque candidature avec un CV + lettre générés à partir de l'offre.
@@$seed$,
  7,
  $seed$2026-07-24T00:00:00.000Z$seed$::timestamp,
  $seed$2026-07-24T00:00:00.000Z$seed$::timestamp,
  $seed$2026-07-30T00:00:00.000Z$seed$::timestamp
)
ON CONFLICT ("slug") DO NOTHING;
