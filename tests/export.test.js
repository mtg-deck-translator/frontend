import { describe, it, expect } from 'vitest'
import { formatCards } from '../src/composables/useExport.js'

const card = (frName, category, qty = 1) => ({ frName, category, qty })

describe('formatCards', () => {
  // Même cause racine que le bug d'affichage : la liste exportée était amputée
  // des catégories inconnues, sans que rien ne le signale.
  it('exporte les cartes des catégories personnalisées', () => {
    const out = formatCards([
      card('Île', 'Land'),
      card('Rampe', 'Ramp'),
      card('Retrait', 'Removal'),
    ])
    expect(out).toContain('1 Rampe')
    expect(out).toContain('1 Retrait')
  })

  it("n'oublie aucune carte, quelle que soit sa catégorie", () => {
    const cards = [
      card('A', 'Creature', 2), card('B', 'Buff', 3),
      card('C', 'Maybeboard'), card('D', 'Sideboard'), card('E', null),
    ]
    const total = cards.reduce((n, c) => n + c.qty, 0)
    const exported = formatCards(cards)
      .split('\n')
      .filter(l => l && !l.startsWith('//'))
      .reduce((n, l) => n + parseInt(l, 10), 0)
    expect(exported).toBe(total)
  })

  it('groupe sous un en-tête traduit', () => {
    expect(formatCards([card('Île', 'Land', 4)])).toBe('// Terrain\n4 Île')
  })

  it("garde le nom d'origine en en-tête d'une catégorie personnalisée", () => {
    expect(formatCards([card('Rampe', 'Ramp')])).toBe('// Ramp\n1 Rampe')
  })

  it('respecte l’ordre : types connus, puis personnalisées, puis zones annexes', () => {
    const out = formatCards([
      card('m', 'Maybeboard'), card('r', 'Ramp'), card('c', 'Creature'),
    ])
    expect(out.split('\n').filter(l => l.startsWith('//')))
      .toEqual(['// Créature', '// Ramp', '// Maybeboard'])
  })

  it('range les cartes sans catégorie sous « Autre »', () => {
    expect(formatCards([card('x', null)])).toContain('// Autre')
  })

  it('rend une chaîne vide pour une liste vide', () => {
    expect(formatCards([])).toBe('')
  })
})
