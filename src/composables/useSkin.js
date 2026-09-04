import { ref, watchEffect } from 'vue'
import { getSkin, setSkin } from '../services/storage.js'

// Deux habillages complets cohabitent. Le skin est orthogonal au thème :
// « papier » et « arcane » ont chacun leur variante claire et sombre.
//
//   papier — la direction d'origine : papier chaud, serif Fraunces, orange brûlé.
//   arcane — encre froide, capitales gravées Cinzel, et la couleur qui vient
//            du deck lui-même (les cinq couleurs de mana comme système).
//
// L'absence d'attribut vaut « papier » : sans JS, ou avant l'hydratation,
// le site rend exactement comme avant.
export const SKINS = ['papier', 'arcane']

export const SKIN_LABELS = {
  papier: 'Papier',
  arcane: 'Arcane',
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
