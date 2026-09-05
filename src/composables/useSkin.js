import { ref, watchEffect } from 'vue'
import { getSkin, setSkin } from '../services/storage.js'

// Trois habillages complets cohabitent. Le skin est orthogonal au thème :
// chacun a sa variante claire et sa variante sombre.
//
//   papier  — la direction d'origine : papier chaud, serif Fraunces, orange brûlé.
//   arcane  — encre froide, capitales gravées Cinzel, et la couleur qui vient
//             du deck lui-même (les cinq couleurs de mana comme système).
//   atelier — le bon de commande imprimé : papier crème, encre pleine, un
//             surligneur pour ce qui reste à trouver. Le seul des trois qui
//             naisse en clair ; son mode sombre est un négatif d'épreuve.
//
// L'absence d'attribut vaut « papier » : sans JS, ou avant l'hydratation,
// le site rend exactement comme avant.
export const SKINS = ['papier', 'arcane', 'atelier']

export const SKIN_LABELS = {
  papier: 'Papier',
  arcane: 'Arcane',
  atelier: 'Atelier',
}

export function useSkin() {
  const skin = ref(SKINS.includes(getSkin()) ? getSkin() : 'papier')

  watchEffect(() => {
    const el = document.documentElement
    if (skin.value === 'papier') el.removeAttribute('data-skin')
    else el.setAttribute('data-skin', skin.value)
    setSkin(skin.value)
  })

  function toggle() {
    const i = SKINS.indexOf(skin.value)
    skin.value = SKINS[(i + 1) % SKINS.length]
  }

  return { skin, toggle, SKIN_LABELS }
}
