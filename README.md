# Générateur de CV adapté à une offre

Application Next.js personnelle : collez l'URL d'une offre d'emploi (ou son texte),
choisissez vos critères, et téléchargez un CV Word (.docx) **adapté automatiquement
à l'offre** — avec exactement le design de votre CV (dégradé bleu → violet → bordeaux,
logo IMIE, briques de compétences, liens cliquables, une seule page).

## Fonctionnement

1. **Extraction** — le texte de l'annonce est récupéré depuis l'URL (ou collé directement
   si le site bloque les robots : Indeed, LinkedIn, Welcome to the Jungle…).
2. **Adaptation** — l'API Claude reçoit votre CV de base (`lib/cv-data.js`) et l'offre,
   puis réordonne les compétences, reformule les puces d'expérience avec les mots-clés
   de l'annonce, et réécrit le titre + le profil. **Rien n'est inventé** : le prompt
   interdit strictement d'ajouter des technos, chiffres ou responsabilités.
3. **Génération** — le fichier .docx est construit avec le template (`lib/docx-template.js`)
   et téléchargé automatiquement, nommé selon le poste détecté.

## Installation

```bash
npm install
cp .env.local.example .env.local   # puis mettre votre clé API Anthropic
npm run dev                         # http://localhost:3000
```

Clé API : https://console.anthropic.com/settings/keys

## Personnalisation

| Quoi | Où |
|---|---|
| Vos données (coordonnées, expériences, formations, compétences) | `lib/cv-data.js` |
| Le design du document Word (couleurs, tailles, mise en page) | `lib/docx-template.js` |
| Les règles d'adaptation données à l'IA | `lib/tailor.js` (constante `system`) |
| Le modèle Claude utilisé | `lib/tailor.js` (constante `MODEL`) |
| Dégradé, logo, photo | `assets/*.png` (remplacez `photo.png` par votre photo) |

## Notes

- **Variantes** : le sélecteur « Expérience principale » bascule entre Tama et
  Bridgeness (mêmes dates, l'une remplace l'autre).
- **Sites qui bloquent** : beaucoup de job boards refusent les requêtes automatiques.
  Dans ce cas, copiez-collez simplement le texte de l'annonce dans le champ prévu —
  le résultat est identique.
- **Coût** : chaque génération = 1 appel API Claude (~quelques centimes).
- **Déploiement** : fonctionne sur Vercel tel quel (`outputFileTracingIncludes`
  embarque les assets). Ajoutez `ANTHROPIC_API_KEY` dans les variables d'environnement.
