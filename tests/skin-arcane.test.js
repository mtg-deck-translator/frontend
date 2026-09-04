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

    // Après la première @media, il ne doit plus rien rester au niveau racine
    // que d'autres @media : on referme chaque bloc en comptant les accolades
    // et on vérifie que ce qui les sépare est vide.
    let reste = STRIPPED.slice(premiereMedia)
    while (reste.trim()) {
      expect(reste.trimStart(), 'une règle hors @media suit une media query').toMatch(/^@media/)
      const debut = reste.indexOf('{')
      let profondeur = 0
      let fin = -1
      for (let i = debut; i < reste.length; i++) {
        if (reste[i] === '{') profondeur++
        else if (reste[i] === '}' && --profondeur === 0) { fin = i + 1; break }
      }
      expect(fin, 'bloc @media non refermé').toBeGreaterThan(0)
      reste = reste.slice(fin)
    }
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

  it('prévoit un repli monochrome pour --deck-chroma', () => {
    // App.vue ne pose --deck-chroma qu'une fois un deck ouvert. Sans repli,
    // le rail supérieur serait transparent sur toute la page d'accueil.
    // Et ce repli doit rester monochrome : un arc-en-ciel permanent en haut
    // d'écran fait pacotille, la couleur ne doit apparaître que quand elle
    // dit quelque chose — les couleurs du deck ouvert.
    expect(STRIPPED).toMatch(/--deck-chroma:\s*var\(--accent\)/)
    expect(STRIPPED).not.toMatch(/--deck-chroma:\s*linear-gradient/)
  })
})
