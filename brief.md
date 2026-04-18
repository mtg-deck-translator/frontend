# Prompt pour Claude Code — Traducteur de deck MTG (EN → FR)

Tu vas construire un petit outil web qui traduit une liste de cartes Magic: The Gathering de l'anglais vers le français. C'est un outil personnel, il doit être simple, fiable et rapide à déployer.

## Contexte

Je joue en Duel Commander / EDH et je récupère régulièrement des decklists sur Archidekt ou Moxfield en anglais. J'ai besoin d'un outil qui me donne les noms FR pour commander les cartes sur les sites de VPC français ou pour vérifier mon inventaire. Les cartes récentes (sets ≥ mi-2022) n'ont pas d'édition française — il faut le gérer proprement.

## Objectif

Créer une web app qui prend en entrée **au choix** :
1. Une URL Archidekt (ex: `https://archidekt.com/decks/5715635/balmor_peasant_commander`)
2. Une liste de cartes collée au format texte (export Archidekt / Moxfield / MTGO)

Et qui produit en sortie la liste des cartes avec leur nom français, groupées par catégorie (Commander, Créature, Éphémère, Rituel, Artefact, Enchantement, Planeswalker, Terrain), avec option d'export texte.

## Stack

- **Frontend** : Vue 3 + Vite (je connais Vue, je l'utilise déjà sur `deskadeo-helper` et `sagesdepandarie.ovh`)
- **Pas de backend** au départ — fetch direct depuis le navigateur
- **Si CORS bloque Archidekt** : créer une mini Cloud Function GCP en Python qui fait proxy (j'ai une infra GCP prête). Ne la build que si nécessaire.
- **Déploiement** : statique sur un bucket GCS, ou local en dev avec `npm run dev`

## APIs

### Archidekt
```
GET https://archidekt.com/api/decks/{deckId}/small/
```
- Extraire `deckId` de l'URL avec regex : `/decks\/(\d+)/`
- Réponse JSON : `cards[]` avec pour chaque carte `card.oracleCard.name`, `quantity`, `categories[]`
- Les catégories ont une propriété `isPrimary` — celle-là détermine le groupe d'affichage
- ⚠️ CORS possiblement bloqué : si c'est le cas, afficher un message clair demandant de passer par le copier-coller, OU build le proxy GCP mentionné plus haut

### Scryfall
```
GET https://api.scryfall.com/cards/named?exact={cardName}&lang=fr
```
- CORS OK depuis navigateur
- Rate limit : max 10 req/s, espacer de ~100ms minimum entre batches
- 200 avec `lang: "fr"` → utiliser `printed_name` (nom français)
- 404 → pas d'édition FR, fallback au nom anglais avec un flag `noFr: true`
- Cartes double-face (`"Nom A // Nom B"`) : chercher uniquement avec `Nom A`, puis reconstituer les deux faces FR en parsant la réponse (champ `card_faces[].printed_name`)

## Parsing de liste collée

Formats à supporter (regex tolérant) :
```
1x Lightning Bolt (2x2) 117 [Instant]
1 Lightning Bolt
1x Lightning Bolt
4 Island
1x Frolicking Familiar // Blow Off Steam (woe) 226 [Creature]
```

Ignorer :
- Lignes vides
- Lignes commençant par `//` (commentaires)
- Lignes commençant par `SB:` ou `Sideboard` / `Maybeboard` (mais les compter comme side si détectés)

Regex de départ (à affiner) : `/^(?:SB:\s*)?(\d+)x?\s+([^(\[\n]+?)(?:\s*[\(\[].*)?$/`

## Fonctionnalités UI (par ordre de priorité)

1. **Input mode toggle** : URL Archidekt / Coller liste — radio ou onglets
2. **Bouton "Traduire"** qui déclenche le pipeline complet
3. **Barre de progression** pendant les fetch Scryfall (`X / Y cartes traduites`)
4. **Affichage résultat** :
   - Groupé par catégorie avec compteur (ex: `Créature — 24`)
   - Nom FR en gras noir, nom EN en italique gris petit à droite
   - Cartes sans édition FR : nom EN en gris + label discret "pas de FR"
   - Commander en bleu Izzet pour se démarquer
5. **Checklist collection** ⭐ (feature importante)
   - Checkbox devant chaque carte pour marquer "je l'ai dans ma collection"
   - État persistant en localStorage, lié à l'identifiant du deck (URL Archidekt ou hash de la liste collée)
   - Feedback visuel quand coché : opacité réduite + rayé léger (pas trop marqué, il faut rester lisible)
   - Compteur global en haut : `42 / 100 cartes possédées` avec barre de progression
   - Compteur par catégorie (ex: `Créature — 18/24`)
   - Filtre rapide : boutons `Tout` / `À trouver` / `Possédées`
   - Bouton "Tout cocher / décocher" dans chaque catégorie
   - Bouton "Reset checklist" avec confirmation (pour le deck courant uniquement)
6. **Export** :
   - Bouton "Copier liste FR" → texte formaté avec catégories en commentaires, compatible réimport Archidekt
   - Bouton "Copier cartes manquantes uniquement" → utile pour shopping list
   - Bouton "Télécharger .txt"
7. **Historique local** (localStorage) des 5 derniers decks traduits avec nom + date + progression (ex: `42/100`), cliquables pour recharger

## Identifiant de deck (pour persistance checklist + historique)

- Si URL Archidekt : utiliser `archidekt:{deckId}` comme clé
- Si liste collée : calculer un hash court (ex: première 8 chars d'un SHA1 du contenu normalisé) → `pasted:{hash}`
- Ça permet à la checklist de survivre à un reload et d'être liée au bon deck

## Gestion d'erreurs

- Archidekt 404 → message clair avec suggestion de coller la liste
- Archidekt CORS → idem
- Scryfall indisponible → retry 1 fois puis afficher nom EN avec indicateur "erreur"
- Liste collée illisible → surligner les lignes qui n'ont pas pu être parsées

## Design — direction artistique

Objectif : un outil qui fait partie de l'écosystème "2026" — pense Linear, Raycast, Arc Browser, Vercel, Radix. Pas d'esthétique "AI générique" (dégradés violets, glass morphism, cartes avec grosses ombres portées, emojis partout). L'outil doit avoir l'air d'avoir été designé par un humain qui a du goût.

### Références visuelles
- **Linear** pour la densité informationnelle et les transitions
- **Raycast** pour la hiérarchie visuelle et les raccourcis
- **Arc** pour les touches de couleur et la personnalité
- **Vercel/Geist** pour la typographie et le respect du whitespace

### Typographie
- Sans-serif : **Inter** (variable font, weights 400/500/600) via Google Fonts ou fontsource
- Mono : **JetBrains Mono** ou **Geist Mono** pour les noms de cartes EN en secondaire et les compteurs
- Tailles : h1 32px, h2 20px, h3 16px, body 14px, small 12px
- `letter-spacing: -0.02em` sur les headings (tracking serré, très 2026)
- `font-feature-settings: 'ss01', 'cv11'` sur Inter pour activer les variantes modernes

### Couleurs
Deux modes (light/dark), variables CSS, switch auto via `prefers-color-scheme` + toggle manuel.

**Light mode**
- Background : `#FAFAF9` (off-white légèrement chaud, pas de blanc pur cheap)
- Surface : `#FFFFFF` pour les cards
- Border : `rgba(0, 0, 0, 0.08)` — fine et discrète
- Text primary : `#171717`
- Text secondary : `#737373`
- Text tertiary : `#A3A3A3`

**Dark mode**
- Background : `#0A0A0A` (vrai noir doux, pas `#000`)
- Surface : `#171717`
- Border : `rgba(255, 255, 255, 0.08)`
- Text primary : `#FAFAFA`
- Text secondary : `#A3A3A3`

**Accent** : UN seul accent coloré pour la personnalité. Propose **bleu Izzet tamisé** : `#4F7FFF` en light, `#6B93FF` en dark. Utilisé pour : commander, boutons primaires, checkbox cochée, progression.

**Sémantique** :
- Possédée (cochée) : opacité 0.5 + strikethrough léger sur le nom EN uniquement
- Pas de FR disponible : badge discret monospace 10px, background `rgba(0,0,0,0.04)`, text tertiary

### Composants

**Layout global**
- Max-width 1100px, centré, padding latéral généreux (32px desktop, 16px mobile)
- Header sticky fin (56px) avec titre à gauche + toggle dark mode + bouton historique à droite
- Pas de sidebar — tout en one-pager vertical, plus moderne pour cet usage

**Input zone**
- Card avec border fine (pas d'ombre) et `border-radius: 12px`
- Tabs segmentés pour URL/Coller (style iOS/Linear : background pill qui glisse)
- Textarea avec font mono, `border: none` focus, background très légèrement teinté
- Bouton "Traduire" primary : background accent, text blanc, radius 8px, hover = slight darken + `translateY(-1px)` transition 150ms

**Results zone — liste cartes**
- **Pas** de tableau, pas de bordures entre lignes : chaque carte est une row de 40px avec un hover subtil (`background: rgba(0,0,0,0.03)`)
- Structure d'une row : `[checkbox] [qty badge] [nom FR bold] [nom EN mono secondary] [···· filler ····] [badge "pas de FR" si applicable]`
- Checkbox : custom, pas celle du navigateur. Square 18px, radius 4px, transition tick qui se dessine (SVG path stroke-dasharray animé)
- Qty badge : pill monospace petite, background muted
- Quand cochée : toute la row passe opacité 0.5, nom EN rayé (pas le FR, il reste lisible)

**Catégories (headers)**
- Sticky sous le header principal quand on scroll dans une catégorie
- `"Créature"` en h3 capitalisé + `[18/24]` en mono secondary à droite avec barre de progression fine de 2px de haut en dessous (accent color)

**Filtres (Tout / À trouver / Possédées)**
- Tabs segmentés pill, même style que l'input toggle
- Compte en badge à côté de chaque label (ex: `À trouver [58]`)

**Barre de progression globale**
- Top du results block, 4px de haut, full width, background muted, fill accent avec `transition: width 400ms cubic-bezier(0.4, 0, 0.2, 1)`
- Pourcentage affiché au-dessus en mono + "42 / 100 cartes possédées" en sans-serif

**Feedback & animations**
- Durées : 150ms micro-interactions, 300ms transitions layout, 600ms apparitions
- Easing : `cubic-bezier(0.4, 0, 0.2, 1)` (ease-out standard)
- Quand les résultats apparaissent : fade-in + légère translate Y de 4px, staggered par catégorie (délai 30ms entre chacune)
- Copie dans le presse-papier : toast bottom-right qui slide + fade, auto-dismiss 2s
- Survol row : background change, pas de scale/shadow (trop 2020)

**États vides et loading**
- Loading Scryfall : skeleton rows avec shimmer subtil (pas spinner)
- État vide initial : illustration SVG minimaliste (ligne simple) + texte centré
- Erreur : toast avec couleur sémantique tamisée (pas rouge flashy)

### Détails qui font la différence

- **Raccourcis clavier** affichés : `⌘K` pour focus l'input, `⌘C` sur résultats pour copier, `/` pour filtrer. Affichés en kbd mono gris dans un panneau "?" discret en bas
- **Command palette** (bonus) : `⌘K` ouvre un menu flottant avec actions rapides (switch mode, reset, exporter)
- **Micro-détail** : sur mobile, la checkbox est agrandie à 24px pour le tap, mais garde ses proportions visuelles
- **Typo numérique** : `font-variant-numeric: tabular-nums` sur tous les compteurs pour qu'ils ne "dansent" pas quand les chiffres changent
- **Scroll shadow** : gradient subtil en haut/bas de la zone de résultats quand il y a overflow (masque le contenu qui sort)

### À éviter absolument

- Ombres portées épaisses (`box-shadow: 0 10px 40px ...`) — on est en 2026, les cartes n'ont plus besoin de léviter
- Dégradés décoratifs (violet/rose, "AI vibes")
- Border-radius > 16px partout (sauf pills/boutons segmentés)
- Icônes emoji
- Framework de composants type Vuetify, PrimeVue, Element Plus
- Animations bouncy/spring exagérées
- Font serif pour du contenu UI (OK pour un éditorial, pas ici)

### Stack CSS recommandée

- **Tailwind CSS v4** (pas Tailwind UI, juste le framework utility) : c'est devenu le standard et ça colle avec l'esprit "design tokens" de 2026. Alternative : vanilla CSS avec variables, plus simple si tu préfères
- **Radix Vue** pour les primitives accessibles (tabs, checkbox, toast) si besoin, stylés par toi
- `@fontsource/inter` et `@fontsource/jetbrains-mono` pour ne pas dépendre de Google Fonts en prod

## À ne pas faire

- Pas de framework de composants prêt-à-l'emploi type Vuetify, PrimeVue, Element Plus (trop "meta", pas ton style)
- Pas de Next.js / Nuxt (sur-dimensionné pour l'usage)
- Pas de base de données — Scryfall est la source de vérité, on ne cache rien côté serveur
- Pas d'auth, pas de comptes utilisateur
- Pas de tests unitaires au premier jet (je testerai à la main)

## Structure attendue

```
mtg-fr-translator/
├── index.html
├── package.json
├── vite.config.js
├── README.md
└── src/
    ├── main.js
    ├── App.vue
    ├── components/
    │   ├── InputForm.vue
    │   ├── DeckResults.vue
    │   ├── CardRow.vue
    │   ├── ProgressBar.vue
    │   └── HistoryList.vue
    ├── services/
    │   ├── archidekt.js   # fetchDeck(url) -> [{name, qty, category}]
    │   ├── scryfall.js    # translateBatch(names) -> Map<en, {fr, noFr}>
    │   ├── parser.js      # parsePastedList(text) -> [{name, qty, category?}]
    │   └── storage.js     # getChecked(deckId) / setChecked(deckId, map) / getHistory()
    └── assets/
        └── style.css
```

## Livrables

1. Code fonctionnel (`npm install && npm run dev` doit marcher direct)
2. `README.md` avec :
   - Description rapide
   - Install / dev / build
   - Note sur le CORS Archidekt et comment build le proxy GCP si besoin
   - Limitations connues (sets récents sans FR)
3. Un fichier `.gitignore` standard (node_modules, dist, .env)

## Méthode de travail

Procède par étapes, en testant à chaque fois :

1. `npm create vite@latest` template `vue`
2. Parser de liste collée (service + test rapide avec un exemple)
3. Service Scryfall (tester avec 3-4 cartes connues : Lightning Bolt, Sol Ring, une carte sans FR comme Balmor)
4. UI minimale : textarea + bouton + résultats
5. Ajouter le mode URL Archidekt
6. Affichage par catégorie + export
7. **Checklist collection** (checkboxes + persistence localStorage + filtres + compteurs)
8. Historique localStorage

À chaque étape, montre-moi le résultat avant de passer à la suivante. Ne pars pas en freestyle, je veux valider au fur et à mesure.

## Bonus (si temps)

- Support Moxfield (URL + API similaire)
- Détection de langue auto pour accepter aussi les listes déjà en FR (ne traduirait rien)
- Bouton "Ouvrir sur Cardmarket" qui lance une recherche pour chaque carte en FR