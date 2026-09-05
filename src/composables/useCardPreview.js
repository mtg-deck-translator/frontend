import { ref } from 'vue'

// La carte survolée dans la liste, partagée entre CardRow et App.
//
// CardRow est à trois niveaux sous App (App → ResultsPanel → CategoryGroup →
// CardRow) : faire remonter un survol par des `emit` successifs coûterait un
// relais dans chaque composant intermédiaire, pour une information qui
// n'intéresse ni l'un ni l'autre. Un ref de module — le même parti que
// useCollection — les relie directement.
//
// L'aperçu vivait auparavant dans un `<Teleport to="body">` posé par chaque
// ligne, en `position: fixed`, calé sur le curseur puis sur la ligne. Il
// s'affiche désormais en grand dans le rail de gauche, qui est de toute façon
// à moitié vide : c'est le seul endroit de l'écran où une image de carte tient
// à taille lisible sans recouvrir la liste qu'on est en train de lire.
const carteSurvolee = ref(null)

export function useCardPreview() {
  return {
    carteSurvolee,
    survoler(carte) { carteSurvolee.value = carte },
    quitter(carte) {
      // Comparaison sur l'identité : quand le pointeur passe d'une ligne à la
      // suivante, le `mouseenter` de la nouvelle arrive avant le `mouseleave`
      // de l'ancienne. Sans cette garde, l'ancienne effacerait la nouvelle et
      // l'aperçu clignoterait à chaque ligne traversée.
      if (carteSurvolee.value === carte) carteSurvolee.value = null
    },
  }
}
