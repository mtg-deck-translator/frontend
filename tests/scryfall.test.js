import { describe, it, expect } from 'vitest'
import {
  normalizeCardName, deriveCategoryFromTypeLine, getCardTypeLine,
  getCardImage, getFrenchName, mergeLocalizedCard,
} from '../src/services/scryfall.js'

describe('normalizeCardName', () => {
  it('rend « Lorien » et « Lórien » équivalents', () => {
    expect(normalizeCardName('Lórien Revealed')).toBe(normalizeCardName('Lorien Revealed'))
  })

  it('ignore la casse', () => {
    expect(normalizeCardName('ISLAND')).toBe('island')
  })
})

describe('deriveCategoryFromTypeLine', () => {
  it.each([
    ['Basic Land — Island', 'Land'],
    ['Legendary Creature — Elf Druid', 'Creature'],
    ['Instant', 'Instant'],
    ['Sorcery — Arcane', 'Sorcery'],
    ['Artifact — Equipment', 'Artifact'],
    ['Enchantment — Aura', 'Enchantment'],
    ['Legendary Planeswalker — Jace', 'Planeswalker'],
    ['Tribal Instant — Elf', 'Instant'],
  ])('classe « %s » en %s', (typeLine, expected) => {
    expect(deriveCategoryFromTypeLine(typeLine)).toBe(expected)
  })

  it('retombe sur « Other » sans ligne de type', () => {
    expect(deriveCategoryFromTypeLine('')).toBe('Other')
    expect(deriveCategoryFromTypeLine(undefined)).toBe('Other')
  })

  it('privilégie Land sur Creature pour une créature-terrain', () => {
    // Comportement actuel, consigné : « Land Creature » est classé en Terrain.
    expect(deriveCategoryFromTypeLine('Land Creature — Dryad')).toBe('Land')
  })
})

describe('getCardTypeLine', () => {
  it('prend la face avant d’une recto-verso', () => {
    expect(getCardTypeLine({ card_faces: [{ type_line: 'Creature' }, { type_line: 'Land' }] })).toBe('Creature')
  })

  it('retombe sur le type_line racine', () => {
    expect(getCardTypeLine({ type_line: 'Instant' })).toBe('Instant')
  })

  it('rend une chaîne vide si rien n’est exploitable', () => {
    expect(getCardTypeLine({})).toBe('')
  })
})

describe('getCardImage', () => {
  it('préfère l’image de la carte', () => {
    expect(getCardImage({ image_uris: { normal: 'a' } })).toBe('a')
  })

  it('retombe sur la face avant', () => {
    expect(getCardImage({ card_faces: [{ image_uris: { normal: 'b' } }] })).toBe('b')
  })

  it('rend null quand il n’y a pas d’image', () => {
    expect(getCardImage({})).toBeNull()
  })
})

describe('getFrenchName', () => {
  it('assemble les deux faces traduites', () => {
    expect(getFrenchName({
      card_faces: [{ printed_name: 'Feu' }, { printed_name: 'Glace' }],
    })).toBe('Feu // Glace')
  })

  it('retombe sur le nom anglais d’une face non traduite', () => {
    expect(getFrenchName({
      card_faces: [{ printed_name: 'Feu' }, { name: 'Ice' }],
    })).toBe('Feu // Ice')
  })

  it('rend le nom traduit d’une carte simple', () => {
    expect(getFrenchName({ printed_name: 'Île', name: 'Island' })).toBe('Île')
  })

  it('rend le nom anglais faute de traduction', () => {
    expect(getFrenchName({ name: 'Island' })).toBe('Island')
  })
})

describe('mergeLocalizedCard', () => {
  const withLocal = { oracle_id: 'x', name: 'Vampiric Tutor', printed_name: 'Tuteur vampirique' }
  const withoutLocal = { oracle_id: 'x', name: 'Vampiric Tutor', printed_name: null }

  it('retient une impression réellement traduite', () => {
    const m = new Map()
    mergeLocalizedCard(m, withoutLocal)
    mergeLocalizedCard(m, withLocal)
    expect(m.get('x').printed_name).toBe('Tuteur vampirique')
  })

  it('ne remplace pas une traduction par une non-traduction', () => {
    const m = new Map()
    mergeLocalizedCard(m, withLocal)
    mergeLocalizedCard(m, withoutLocal)
    expect(m.get('x').printed_name).toBe('Tuteur vampirique')
  })

  it('accepte la première impression rencontrée', () => {
    const m = new Map()
    mergeLocalizedCard(m, withoutLocal)
    expect(m.get('x')).toBe(withoutLocal)
  })
})
