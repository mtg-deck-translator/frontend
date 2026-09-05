import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { parse } from '@vue/compiler-dom'

// Vue compile les templates avec `whitespace: 'condense'` : un nœud de texte
// qui ne contient que des blancs ET un saut de ligne est purement supprimé.
// Deux éléments en ligne écrits sur deux lignes du template se retrouvent donc
// collés au rendu, et rien ne le signale — ni au build, ni au lint, ni aux
// tests. Le bandeau « pas de VF » affichait « 1carte de ce deck n'existe pas ».
//
// On compile ici avec le compilateur de Vue lui-même plutôt que de deviner la
// règle à coups d'expressions régulières : c'est lui qui décide ce qui reste.
//
// Un balayage générique de tous les <p> a été essayé et jeté : il ne voyait ni
// les branches `v-if` mutuellement exclusives ni les `display: none`, et
// sortait quatre faux positifs pour un vrai défaut. Un test qui a besoin d'une
// liste d'exceptions dès le premier jour ne protège rien.

function paragraphe(fichier, classe) {
  // Surtout pas `split('</template>')[0]` : App.vue utilise `<template v-if>`
  // en interne, donc le premier `</template>` rencontré ferme un bloc
  // conditionnel, pas le template du composant.
  const src = readFileSync(fichier, 'utf8').split(/<script[\s>]/)[0]
  let trouve = null
  const visite = n => {
    if (n.type === 1 && n.props?.some(p => p.name === 'class' && p.value?.content === classe)) trouve = n
    ;(n.children ?? []).forEach(visite)
  }
  visite(parse(src, { whitespace: 'condense' }))
  return trouve
}

describe('bandeau « pas de version française »', () => {
  it('sépare le nombre du mot qui le suit', () => {
    const p = paragraphe('src/App.vue', 'dk-nofr-text')
    expect(p, 'paragraphe .dk-nofr-text introuvable').not.toBeNull()

    const [compte, apres] = p.children
    expect(compte.tag, 'le premier enfant doit être le compteur').toBe('strong')

    // type 2 = nœud de texte. S'il a disparu, c'est que le template comptait
    // sur un simple saut de ligne — et le rendu donne « 1carte ».
    expect(apres.type, 'aucun espace après le compteur : mettre &nbsp;').toBe(2)
    expect(apres.content).toMatch(/\s/)
  })
})
