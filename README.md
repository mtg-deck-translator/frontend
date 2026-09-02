# MTG Deck Translator — Frontend

Traduit une decklist Magic: The Gathering de l'anglais vers la langue locale du joueur,
pour commander les cartes chez un vendeur français, allemand, italien…

> « J'arrive avec mon deck anglais, je repars avec ma liste d'achats dans ma langue en 30 secondes. »

Voir [ROADMAP.md](ROADMAP.md) pour la vision produit et [brief.md](brief.md) pour le brief d'origine.

## Fonctionnalités

- **Import par URL** : Archidekt, Moxfield, MTGTOP8 (via les fonctions serverless `api/`)
- **Import par copier-coller** : formats Archidekt / Moxfield / MTGO
- **Traduction** via l'API Scryfall (batch, rate-limité), fallback EN si pas d'édition locale
- Groupement par catégorie, checklist de possession, filtres, import de collection
- Export : copie, `.txt`, impression A4, panier Cardmarket
- Historique des 5 derniers decks, dark mode — le tout en `localStorage`

## Stack

Vue 3 + Vite. Aucune dépendance d'état externe : 17 composants, 9 composables, 8 services.

```bash
npm install
npx vercel dev   # front + fonctions api/ sur le même port
npm run build
```

⚠️ `npm run dev` (Vite seul) ne sert **pas** le dossier `api/` : les imports par URL
échoueront en 404. Utiliser `vercel dev` pour un environnement complet.

## Architecture

Les sources de decks **ne peuvent pas être appelées depuis le navigateur** : aucune
n'autorise le CORS (Archidekt renvoie un `Access-Control-Allow-Origin: http://localhost:3000`
codé en dur, Moxfield et Tappedout sont derrière Cloudflare). Il faut donc un proxy serveur.

Ce proxy vit dans **ce repo**, en fonctions serverless Vercel :

```
api/deck.js      GET /api/deck?url=…   → détecte la source et dispatche
api/health.js    GET /api/health
api/_lib/        les 4 scrapers (préfixe _ = ignoré comme route par Vercel)
```

Le front les appelle en **chemin relatif** : même origine, donc pas de CORS ni d'URL à
synchroniser entre deux hébergeurs. Scryfall, lui, autorise le CORS : la traduction part
directement du navigateur — c'est pourquoi le collage de liste marche même si `api/` casse.

Moxfield et MTGTOP8 exigent `got-scraping` (empreinte TLS navigateur) ; un `fetch` nu se
prend un 403 Cloudflare.

> **Historique** : le proxy était un service Node/Hono séparé
> ([repo `backend`](https://github.com/mtg-deck-translator/backend)) hébergé sur Railway.
> Le trial Railway ayant expiré, il a été migré ici en septembre 2026. Le repo `backend`
> est conservé en archive mais n'est plus déployé.

### Variables d'environnement

**Aucune.** Le front appelle `/api` en chemin relatif, en dur.

`VITE_BACKEND_URL` n'existe plus : elle était encore définie dans Vercel avec l'URL du
service Railway éteint, ce qui aurait laissé le front taper dans le vide malgré les
fonctions `api/` déployées. Elle peut être supprimée des Environment Variables du projet.

### Limitation connue

**Tappedout est bloqué par Cloudflare** (403 même avec `got-scraping`). Le code est en
place mais la source ne répond pas. Problème préexistant, sans lien avec l'hébergement.

## ⚠️ Compte GitHub

Ce projet vit sur un **compte GitHub dédié**, `mtgdecktranslator`, et non sur le compte
principal. L'accès passe par l'alias SSH `github-mtg` défini dans `~/.ssh/config` :

```
Host github-mtg
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_mtg
    IdentitiesOnly yes
```

Les remotes sont donc en `git@github-mtg:mtg-deck-translator/*.git`, pas en `git@github.com:`.

## Configuration Vercel

`vercel.json` ne peut pas être commenté : le schéma Vercel rejette toute clé
inconnue dans une entrée `headers`, y compris `comment` — une tentative de
commentaire y a déjà fait échouer un build. Les raisons sont donc ici.

- **`/assets/(.*)` en `max-age=31536000, immutable`** — Vite met un hash de
  contenu dans le nom de chaque fichier : un changement produit un nouveau nom.
  Ils sont donc cachables définitivement. Par défaut Vercel servait
  `max-age=0, must-revalidate`, et le navigateur revalidait 53 fichiers à
  chaque visite.
- **`/` en `max-age=0`** — l'index doit rester frais, c'est lui qui pointe vers
  les assets hashés.
- **CSP** — `img-src` autorise `cards.scryfall.io` (les images de cartes) et
  `connect-src` `api.scryfall.com`. Toute nouvelle source d'images ou d'API
  devra être ajoutée ici, sinon elle sera bloquée silencieusement.
- **`regions: ["cdg1"]`** — les fonctions tournaient par défaut à Washington
  alors que le CDN sert depuis Paris, soit environ 250 ms de plancher sur
  `/api/*` pour un public français.
