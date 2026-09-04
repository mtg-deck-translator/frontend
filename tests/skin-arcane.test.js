import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

// Le skin « arcane » est un second habillage complet posé par-dessus le
// premier. Sa seule règle de survie : ne jamais s'appliquer quand il n'est pas
// activé. Une seule règle oubliée sans son préfixe et c'est la direction
// « papier » qui se met à changer toute seule, sans que rien ne le signale.
//
// Ce fichier ne teste pas l'esthétique — il teste les deux mécaniques qui
// l'ont déjà fait dérailler ailleurs dans ce projet : la portée et la cascade.

const CSS = readFileSync('src/assets/skin-arcane.css', 'utf8')

// Retire les commentaires : ils contiennent des accolades et des exemples de
// sélecteurs qui fausseraient tout découpage naïf.
const STRIPPED = CSS.replace(/\/\*[\s\S]*?\*\//g, '')

/** Les sélecteurs de chaque bloc de déclarations, media queries comprises. */
function selectors(css) {
  const out = []
  const re = /([^{}]+)\{/g
  let m
  while ((m = re.exec(css)) !== null) {
    const sel = m[1].trim()
    if (!sel || sel.startsWith('@')) continue
    out.push(sel.replace(/\s+/g, ' '))
  }
  return out
}

describe('skin arcane — portée', () => {
  it('ne contient aucune règle hors de data-skin="arcane"', () => {
    const fuites = selectors(STRIPPED).filter(s => !s.includes('data-skin="arcane"'))
    expect(fuites).toEqual([])
  })

  it('utilise le préfixe complet html[...]:root sur les règles structurelles', () => {
    // `<style scoped>` ajoute un [data-v-…] à chaque sélecteur de composant,
    // soit une classe de spécificité de plus. Un simple [data-skin="arcane"]
    // (0,1,0) perdrait contre .foo[data-v-…] (0,2,0) ; le préfixe complet
    // pèse (0,2,1) et passe devant sans un seul !important.
    const structurelles = selectors(STRIPPED).filter(s => !/^:root\[data-skin/.test(s))
    const faibles = structurelles.filter(s => !s.includes('html[data-skin="arcane"]:root'))
    expect(faibles).toEqual([])
  })

  it("n'emploie aucun !important", () => {
    expect(STRIPPED).not.toMatch(/!important/)
  })
})

describe('skin arcane — cascade', () => {
  it('regroupe les media queries en fin de feuille', () => {
    // Une media query n'augmente pas la spécificité. Placée avant la règle
    // qu'elle doit annuler, elle perd la cascade en silence — ce piège a déjà
    // coûté trois correctifs sur ce projet.
    const premiereMedia = STRIPPED.indexOf('@media')
    expect(premiereMedia).toBeGreaterThan(-1)

    // Tout ce qui suit la première @media doit lui appartenir : on compte les
    // accolades pour trouver où le bloc se referme, et il ne doit plus rien
    // rester derrière que du blanc.
    const apres = STRIPPED.slice(premiereMedia)
    let profondeur = 0
    let fin = -1
    for (let i = apres.indexOf('{'); i < apres.length; i++) {
      if (apres[i] === '{') profondeur++
      else if (apres[i] === '}' && --profondeur === 0) { fin = i + 1; break }
    }
    expect(fin, 'bloc @media non refermé').toBeGreaterThan(0)
    expect(apres.slice(fin).trim(), 'des règles suivent la dernière @media').toBe('')
  })
})

describe('skin arcane — jetons', () => {
  it('définit les cinq couleurs de mana dans les deux thèmes', () => {
    const mana = ['--mana-w', '--mana-u', '--mana-b', '--mana-r', '--mana-g']
    const sombre = STRIPPED.slice(
      STRIPPED.indexOf(':root[data-skin="arcane"] {'),
      STRIPPED.indexOf(':root[data-skin="arcane"][data-theme="light"]')
    )
    const clair = STRIPPED.slice(STRIPPED.indexOf(':root[data-skin="arcane"][data-theme="light"]'))
    for (const t of mana) {
      expect(sombre, `${t} manque en sombre`).toContain(`${t}:`)
      expect(clair, `${t} manque en clair`).toContain(`${t}:`)
    }
  })

  it('prévoit un repli pour --deck-chroma quand aucun deck n\'est chargé', () => {
    // App.vue ne pose --deck-chroma qu'une fois un deck ouvert. Sans repli,
    // le rail supérieur, la marque et les jauges seraient transparents sur
    // toute la page d'accueil.
    expect(STRIPPED).toMatch(/--deck-chroma:\s*linear-gradient/)
  })
})
