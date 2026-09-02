import { describe, it, expect } from 'vitest'
import { parsePastedList } from '../src/services/parser.js'

const names = r => r.cards.map(c => c.queryName)

describe('parsePastedList — formats de quantité', () => {
  it('accepte « 4 Island » et « 4x Island »', () => {
    expect(parsePastedList('4 Island\n4x Island').cards).toEqual([
      { queryName: 'Island', displayName: 'Island', qty: 4, category: null, isSideboard: false },
      { queryName: 'Island', displayName: 'Island', qty: 4, category: null, isSideboard: false },
    ])
  })

  it('lit les quantités à plusieurs chiffres', () => {
    expect(parsePastedList('12 Forest').cards[0].qty).toBe(12)
  })

  it('tolère les espaces autour de la ligne', () => {
    expect(names(parsePastedList('   2   Lightning Bolt   '))).toEqual(['Lightning Bolt'])
  })
})

describe('parsePastedList — métadonnées d’édition', () => {
  it('retire le code d’édition', () => {
    expect(names(parsePastedList('1 Lightning Bolt (m10)'))).toEqual(['Lightning Bolt'])
  })

  it('retire édition, numéro de collection et type', () => {
    expect(names(parsePastedList('1 Lightning Bolt (m10) 155 [Instant]'))).toEqual(['Lightning Bolt'])
  })

  it('ne casse pas un nom contenant des parenthèses en milieu de ligne', () => {
    expect(names(parsePastedList('1 Erase (Not the Urza’s Legacy One)'))).toHaveLength(1)
  })
})

describe('parsePastedList — cartes à deux noms', () => {
  it('interroge Scryfall sur la face avant, mais affiche le nom complet', () => {
    const [card] = parsePastedList('1 Fire // Ice').cards
    expect(card.queryName).toBe('Fire')
    expect(card.displayName).toBe('Fire // Ice')
  })
})

describe('parsePastedList — sideboard', () => {
  it.each(['Sideboard', 'sideboard', 'SB:', 'Maybeboard'])('bascule sur « %s »', marker => {
    const { cards } = parsePastedList(`1 Island\n${marker}\n1 Forest`)
    expect(cards.map(c => c.isSideboard)).toEqual([false, true])
  })

  it('reste dans le sideboard une fois basculé', () => {
    const { cards } = parsePastedList('1 A\nSideboard\n1 B\n1 C')
    expect(cards.map(c => c.isSideboard)).toEqual([false, true, true])
  })
})

describe('parsePastedList — lignes ignorées et invalides', () => {
  it('ignore les lignes vides', () => {
    expect(parsePastedList('\n\n1 Island\n\n').cards).toHaveLength(1)
  })

  it('ignore les commentaires', () => {
    const r = parsePastedList('// Créatures\n1 Island')
    expect(r.cards).toHaveLength(1)
    expect(r.unparseableLines).toEqual([])
  })

  it('collecte les lignes non reconnues au lieu de les perdre', () => {
    const r = parsePastedList('Ceci n’est pas une carte\n1 Island')
    expect(r.unparseableLines).toEqual(['Ceci n’est pas une carte'])
    expect(r.cards).toHaveLength(1)
  })

  it('rend un résultat vide sur une entrée vide', () => {
    expect(parsePastedList('')).toEqual({ cards: [], unparseableLines: [] })
  })

  it('accepte une quantité nulle telle quelle, sans la filtrer', () => {
    // Comportement actuel, consigné pour qu'un changement soit délibéré.
    expect(parsePastedList('0 Island').cards[0].qty).toBe(0)
  })
})
