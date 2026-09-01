# MTG Deck Translator — Frontend

Traduit une decklist Magic: The Gathering de l'anglais vers la langue locale du joueur,
pour commander les cartes chez un vendeur français, allemand, italien…

> « J'arrive avec mon deck anglais, je repars avec ma liste d'achats dans ma langue en 30 secondes. »

Voir [ROADMAP.md](ROADMAP.md) pour la vision produit et [brief.md](brief.md) pour le brief d'origine.

## Fonctionnalités

- **Import par URL** : Archidekt, Moxfield, MTGTOP8, Tappedout (via le backend proxy)
- **Import par copier-coller** : formats Archidekt / Moxfield / MTGO
- **Traduction** via l'API Scryfall (batch, rate-limité), fallback EN si pas d'édition locale
- Groupement par catégorie, checklist de possession, filtres, import de collection
- Export : copie, `.txt`, impression A4, panier Cardmarket
- Historique des 5 derniers decks, dark mode — le tout en `localStorage`

## Stack

Vue 3 + Vite. Aucune dépendance d'état externe : 17 composants, 9 composables, 8 services.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```

Le dev server suppose le backend sur `http://localhost:3001` (voir `VITE_BACKEND_URL`).

## Architecture

Les 4 sources de decks **ne peuvent pas être appelées depuis le navigateur** : aucune
n'autorise le CORS (Archidekt renvoie un `Access-Control-Allow-Origin: http://localhost:3000`
codé en dur, Moxfield et Tappedout sont derrière Cloudflare). D'où un backend proxy séparé.

| Repo | Rôle | Hébergement |
|---|---|---|
| `mtg-deck-translator/frontend` | cette app | Vercel |
| `mtg-deck-translator/backend` | proxy `GET /api/deck?url=` | à redéployer |

Scryfall, lui, autorise le CORS : la traduction part directement du navigateur.

### Variables d'environnement

| Variable | Rôle |
|---|---|
| `VITE_BACKEND_URL` | URL du backend proxy (défaut : `http://localhost:3001`) |

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
