import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { SKINS, SKIN_LABELS } from '../src/composables/useSkin.js'

// Mêmes garde-fous que tests/skin-arcane.test.js, pour la même raison : un
// habillage additionnel n'a qu'une règle de survie, ne jamais s'appliquer
// quand il n'est pas activé. Une seule règle oubliée sans son préfixe et ce
// sont les deux autres directions qui se mettent à changer toutes seules,
// sans que rien ne le signale.
//
// Ce fichier ne teste pas l'esthétique — il teste la portée, la cascade, et
// les deux ou trois partis pris du skin qu'on perdrait sans s'en apercevoir.

const CSS = readFileSync('src/assets/skin-atelier.css', 'utf8')

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

describe('skin atelier — portée', () => {
  it('ne contient aucune règle hors de data-skin="atelier"', () => {
    const fuites = selectors(STRIPPED).filter(s => !s.includes('data-skin="atelier"'))
    expect(fuites).toEqual([])
  })

  it('utilise le préfixe complet html[...]:root sur les règles structurelles', () => {
    // `<style scoped>` ajoute un [data-v-…] à chaque sélecteur de composant,
    // soit une classe de spécificité de plus. Un simple [data-skin="atelier"]
    // (0,1,0) perdrait contre .foo[data-v-…] (0,2,0) ; le préfixe complet
    // pèse (0,2,1) et passe devant sans un seul !important.
    const structurelles = selectors(STRIPPED).filter(s => !/^:root\[data-skin/.test(s))
    const faibles = structurelles.filter(s => !s.includes('html[data-skin="atelier"]:root'))
    expect(faibles).toEqual([])
  })

  it("n'emploie aucun !important", () => {
    expect(STRIPPED).not.toMatch(/!important/)
  })
})

describe('skin atelier — cascade', () => {
  it('regroupe les media queries en fin de feuille', () => {
    // Une media query n'augmente pas la spécificité. Placée avant la règle
    // qu'elle doit annuler, elle perd la cascade en silence — ce piège a déjà
    // coûté trois correctifs sur ce projet.
    const premiereMedia = STRIPPED.indexOf('@media')
    expect(premiereMedia).toBeGreaterThan(-1)

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

// Les deux blocs de jetons. Attention à l'ordre : contrairement aux deux
// autres skins, « atelier » naît en CLAIR — le bloc nu est la variante claire
// et c'est [data-theme="dark"] qui est l'override.
const I_CLAIR = STRIPPED.indexOf(':root[data-skin="atelier"] {')
const I_SOMBRE = STRIPPED.indexOf(':root[data-skin="atelier"][data-theme="dark"]')
const CLAIR = STRIPPED.slice(I_CLAIR, I_SOMBRE)
const SOMBRE = STRIPPED.slice(I_SOMBRE, STRIPPED.indexOf('@media'))

describe('skin atelier — jetons', () => {
  it('déclare le bloc clair avant le bloc sombre', () => {
    // Si le sombre passait devant, il perdrait la cascade à spécificité
    // supérieure… non : il gagnerait toujours. Ce qu'on protège ici, c'est
    // l'intention — le mode natif du skin est le clair, et le fichier doit
    // se lire dans cet ordre.
    expect(I_CLAIR).toBeGreaterThan(-1)
    expect(I_SOMBRE).toBeGreaterThan(I_CLAIR)
  })

  it('définit les cinq couleurs de mana dans les deux thèmes', () => {
    for (const t of ['--mana-w', '--mana-u', '--mana-b', '--mana-r', '--mana-g']) {
      expect(CLAIR, `${t} manque en clair`).toContain(`${t}:`)
      expect(SOMBRE, `${t} manque en sombre`).toContain(`${t}:`)
    }
  })

  it('définit ses quatre jetons propres dans les deux thèmes', () => {
    for (const t of ['--paper', '--ink', '--marker', '--marker-ink']) {
      expect(CLAIR, `${t} manque en clair`).toContain(`${t}:`)
      expect(SOMBRE, `${t} manque en sombre`).toContain(`${t}:`)
    }
  })

  it('garde le surligneur identique dans les deux thèmes', () => {
    // Règle 2 du skin : un feutre ne s'inverse pas. C'est le seul objet qui
    // survit au passage en négatif, et c'est ce qui en fait un feutre plutôt
    // qu'une couleur d'accent de plus.
    const valeur = (css, t) => css.match(new RegExp(`${t}:\\s*([^;]+);`))[1].trim()
    expect(valeur(SOMBRE, '--marker')).toBe(valeur(CLAIR, '--marker'))
    // Et le texte posé dessus reste sombre en négatif : `--ink` y devient
    // crème, et du crème sur du chartreuse tombe à 1,5:1.
    expect(valeur(SOMBRE, '--marker-ink')).toBe(valeur(CLAIR, '--marker-ink'))
  })

  it('inverse encre et papier entre les deux thèmes', () => {
    const val = (css, t) => css.match(new RegExp(`${t}:\\s*([^;]+);`))[1].trim().toLowerCase()
    // Le papier clair doit être plus clair que l'encre claire, et l'inverse
    // en sombre. Comparaison sur la somme des composantes hex, suffisante ici.
    const lum = hex => parseInt(hex.slice(1, 3), 16) + parseInt(hex.slice(3, 5), 16) + parseInt(hex.slice(5, 7), 16)
    expect(lum(val(CLAIR, '--paper'))).toBeGreaterThan(lum(val(CLAIR, '--ink')))
    expect(lum(val(SOMBRE, '--paper'))).toBeLessThan(lum(val(SOMBRE, '--ink')))
  })
})

describe('skin atelier — partis pris', () => {
  it("n'emploie aucun flou", () => {
    // Règle 3 : l'élévation est une ombre portée dure. Pas un seul `blur()`
    // ni un quatrième terme non nul dans une box-shadow. C'est ce qui le
    // sépare de « papier » (ombre douce) et d'« arcane » (lueur).
    expect(STRIPPED).not.toMatch(/blur\(/)
    for (const m of STRIPPED.matchAll(/--shadow-\d:\s*([^;]+);/g)) {
      expect(m[1], `ombre floutée : ${m[1]}`).toMatch(/^\d+px \d+px 0 /)
    }
  })

  it("n'arrondit rien", () => {
    for (const m of STRIPPED.matchAll(/--radius-\w+:\s*([^;]+);/g)) {
      expect(m[1].trim()).toBe('0px')
    }
  })

  it('neutralise les jetons hérités des autres skins', () => {
    // --notch (encoche d'arcane) et --canvas-glow (halo de la coquille) sont
    // consommés par des règles qui ne sont pas dans ce fichier.
    expect(CLAIR).toMatch(/--notch:\s*0px/)
    expect(CLAIR).toMatch(/--canvas-glow:\s*transparent/)
  })
})

describe('sélecteur d’habillage', () => {
  it('expose les trois skins avec un libellé chacun', () => {
    expect(SKINS).toEqual(['papier', 'arcane', 'atelier'])
    for (const s of SKINS) expect(SKIN_LABELS[s], `libellé manquant pour ${s}`).toBeTruthy()
  })
})
