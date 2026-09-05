# Symboles de mana

Les cinq fichiers `W/U/B/R/G.svg` viennent des CDN de Scryfall
(`https://svgs.scryfall.io/card-symbols/<S>.svg`), récupérés le 2026-09-05.

Ils sont **copiés ici plutôt qu'appelés à distance** pour trois raisons :

1. Scryfall demande explicitement de mettre en cache ce qu'on télécharge chez
   eux plutôt que de le rechercher à chaque affichage.
2. L'app est une PWA : elle doit rester lisible chez le vendeur, là où le
   réseau est mauvais. Cinq requêtes vers un tiers pour afficher les couleurs
   d'un deck, c'est cinq occasions de ne rien afficher du tout.
3. Ces fichiers ne changent jamais.

Ils sont précachés par `public/sw.js` (constante `SHELL`).

**Droits** : les symboles de mana sont © Wizards of the Coast. Ils sont utilisés
ici au titre de la *Wizards of the Coast Fan Content Policy*, comme le fait
Scryfall lui-même. MTG Translator n'est ni produit ni approuvé par Wizards of
the Coast.
