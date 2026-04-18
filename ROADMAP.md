# MTG Deck Translator — Product Roadmap

## Vision

> **"J'arrive avec mon deck anglais, je repars avec ma liste d'achats dans ma langue en 30 secondes."**

Aucun outil ne propose aujourd'hui ce flow complet en une seule page. On construit ça.

---

## Segments utilisateurs

| Segment | Besoin clé |
|---|---|
| Joueur casual | Savoir comment s'appelle la carte chez son vendeur local |
| Grinder de tournois | Deck liste conforme aux règles de langue du pays |
| Acheteur | Liste de courses Cardmarket prête à l'emploi |
| TO / arbitre | Vérifier les noms légaux d'un deck soumis |

---

## Roadmap

### ✅ v1 — Socle (fait)
- Import Archidekt (URL) + liste collée
- Import MTGTOP8 (URL)
- Traduction EN → FR via Scryfall (batch, rate-limited)
- Groupement par catégorie, tri alphabétique
- Checklist possession (localStorage)
- Filtres Tout / À trouver / Possédées
- Export : copier tout, copier manquantes, télécharger .txt, imprimer A4
- Historique 5 derniers decks (cache localStorage)
- Dark mode
- Preview image au survol
- Maybeboard

---

### 🔴 v1.1 — Multi-sources (priorité immédiate)

#### Import Moxfield
- Détecter les URLs `moxfield.com/decks/...`
- API : `https://api2.moxfield.com/v3/decks/all/{deckId}`
- Parser les cartes, mainboard + maybeboard + commandant
- Récupérer le nom du deck

#### Import Tappedout
- URL : `tappedout.net/mtg-decks/...`
- Export text via `?fmt=txt` (pas d'API publique)
- Passer au parser de liste collée existant

#### Import Manastack / Deckstats
- À évaluer selon la demande

---

### 🟠 v1.2 — Multi-langues

- Sélecteur de langue : 🇫🇷 FR / 🇩🇪 DE / 🇮🇹 IT / 🇪🇸 ES / 🇵🇹 PT / 🇯🇵 JA / 🇷🇺 RU
- Scryfall supporte tous ces codes nativement (`lang=de`, `lang=it`, etc.)
- Changer de langue re-traduit le deck instantanément (si données déjà cachées)
- Persister le choix de langue (localStorage)

---

### 🟠 v1.3 — Prix & Cardmarket

- Afficher le prix Cardmarket moyen par carte (API Cardmarket ou scraping)
- Total du deck (possédé / manquant)
- **Bouton "Acheter les manquantes sur Cardmarket"**
  - URL : `https://www.cardmarket.com/{lang}/Magic/Wants/CreateWantsFromText`
  - Payload : liste des cartes manquantes en nom local
  - Affiliation : ~3-5% de commission sur les achats générés
- Adapter la devise selon la langue (€ pour EU, etc.)

---

### 🟡 v2.0 — Comptes & Sync

- Authentification légère (email magic link ou OAuth Google)
- Sync de la collection cross-device
- Historique illimité (vs 5 en local)
- **Freemium** :
  - Gratuit : 3 langues, 5 decks, export basique
  - Pro (3€/mois) : toutes langues, illimité, prix live, export Cardmarket 1 clic

---

### 🟡 v2.1 — Galerie publique

- Chaque deck traduit peut être partagé via un lien court
- Galerie indexée par format / commandant / langue
- SEO : "Tasigur duel commander allemand" → trafic organique
- Display ads ou affiliation sur les pages publiques

---

### 🔵 v3.0 — B2B & Outils TO

- Widget embarquable (`<iframe>` / JS snippet) pour blogs, Discord bots
- Mode "Deck légal" : vérification format, copies, bannissements
- API publique pour les boutiques et organisateurs de tournoi
- Forfait TO pour valider des decks soumis en masse

---

## Modèle de revenus

```
Gratuit       → 3 langues, 5 decks historique, export basique
Pro (3€/mois) → toutes langues, illimité, prix live, sync cloud
Affiliation   → ~3% sur chaque achat Cardmarket généré via le bouton
B2B           → forfait boutique / TO (pricing à définir)
```

L'affiliation Cardmarket est le levier principal à court terme : pas de friction, pas de compte requis, revenus dès le premier clic converti.

---

## Stack technique actuelle

| Couche | Choix |
|---|---|
| Frontend | Vue 3 + Vite |
| Traduction | Scryfall API (batch `/cards/collection` + `/cards/search`) |
| Sources | Archidekt API, MTGTOP8 MTGO export |
| Persistance | localStorage (checklist, historique, cache cartes, thème) |
| Proxy | Vite dev server (CORS Archidekt + MTGTOP8) |

---

## Prochaine étape : Moxfield

Moxfield est le site de decks N°1 mondial. API publique, bien documentée.

- Endpoint : `https://api2.moxfield.com/v3/decks/all/{deckId}`
- Extraction du deckId depuis l'URL : `moxfield.com/decks/{deckId}`
- Structure de réponse : `deck.name`, `deck.commanders`, `deck.mainboard`, `deck.maybeboard`
- Chaque carte : `{ card: { name }, quantity, ... }`
- Même proxy Vite que les autres sources
