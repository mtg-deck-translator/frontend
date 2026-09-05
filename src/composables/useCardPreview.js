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

// L'effacement est différé de quelques dizaines de millisecondes.
//
// En passant d'une ligne à la suivante, le navigateur émet le `mouseleave` de
// l'ancienne AVANT le `mouseenter` de la nouvelle. Effacer tout de suite fait
// donc disparaître puis réapparaître l'aperçu entre deux lignes voisines : le
// fondu rejoue à chaque ligne traversée, et parcourir une liste devient un
// clignotement. Le délai est annulé dès qu'une autre ligne prend le relais,
// donc il ne se voit que lorsqu'on quitte vraiment la liste.
let effacement = null
const DELAI = 90

export function useCardPreview() {
  return {
    carteSurvolee,
    survoler(carte) {
      clearTimeout(effacement)
      carteSurvolee.value = carte
    },
    quitter(carte) {
      clearTimeout(effacement)
      effacement = setTimeout(() => {
        // Une autre ligne a pu prendre la main entre-temps : on ne referme que
        // si c'est bien la carte qu'on quittait qui est encore affichée.
        if (carteSurvolee.value === carte) carteSurvolee.value = null
      }, DELAI)
    },
  }
}
