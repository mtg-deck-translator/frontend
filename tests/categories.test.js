import { describe, it, expect } from 'vitest'
import {
  orderCategories, categoryLabel, categoryColor, isKnownCategory, CATEGORY_ORDER,
} from '../src/constants/categories.js'

describe('orderCategories', () => {
  // Le bug d'origine : 63 cartes sur 100 disparaissaient d'un deck Archidekt
  // parce que ses catégories personnalisées n'étaient pas dans la liste connue.
  it("ne perd aucune catégorie, même inconnue", () => {
    const entrantes = ['Buff', 'Land', 'Engines', 'Removal', 'Ramp', 'Commander']
    const sortantes = orderCategories(entrantes)
    expect(sortantes).toHaveLength(entrantes.length)
    expect(new Set(sortantes)).toEqual(new Set(entrantes))
  })

  it('place les types connus en premier, dans l’ordre de la decklist', () => {
    expect(orderCategories(['Land', 'Creature', 'Commander']))
      .toEqual(['Commander', 'Creature', 'Land'])
  })

  it('intercale les catégories personnalisées entre types et zones annexes', () => {
    expect(orderCategories(['Maybeboard', 'Ramp', 'Land', 'Sideboard', 'Creature', 'Other', 'Buff']))
      .toEqual(['Creature', 'Buff', 'Ramp', 'Land', 'Other', 'Sideboard', 'Maybeboard'])
  })

  // Mesuré sur un Commander Archidekt réel : la liste s'ouvrait sur
  // « Commandant » puis dix-sept terrains à 0,20 €, et le premier écran entier
  // partait en terrains de base — que personne n'achète. Le deck lui-même,
  // rangé dans les catégories de l'utilisateur, arrivait après.
  it('repousse les terrains après les catégories personnalisées', () => {
    expect(orderCategories(['Land', 'Ramp', 'Commander', 'Removal']))
      .toEqual(['Commander', 'Ramp', 'Removal', 'Land'])
  })

  it('trie les catégories personnalisées par ordre alphabétique', () => {
    expect(orderCategories(['Zephyr', 'Artefacts perso', 'Ébène']))
      .toEqual(['Artefacts perso', 'Ébène', 'Zephyr'])
  })

  it('dédoublonne les entrées répétées', () => {
    expect(orderCategories(['Land', 'Land', 'Ramp', 'Ramp'])).toEqual(['Ramp', 'Land'])
  })

  it('accepte un Set aussi bien qu’un tableau', () => {
    expect(orderCategories(new Set(['Land', 'Commander']))).toEqual(['Commander', 'Land'])
  })

  it('rend un tableau vide pour une entrée vide', () => {
    expect(orderCategories([])).toEqual([])
  })

  it('garde Sideboard et Maybeboard en toute fin', () => {
    const out = orderCategories(['Sideboard', 'Creature', 'Maybeboard', 'Other'])
    expect(out.slice(-3)).toEqual(['Other', 'Sideboard', 'Maybeboard'])
  })
})

describe('categoryLabel', () => {
  it('traduit les catégories connues', () => {
    expect(categoryLabel('Creature')).toBe('Créature')
    expect(categoryLabel('Sideboard')).toBe('Réserve')
  })

  it('accorde au pluriel quand on le demande', () => {
    expect(categoryLabel('Creature', { plural: true })).toBe('Créatures')
    expect(categoryLabel('Land', { plural: true })).toBe('Terrains')
  })

  it("rend le nom d'origine d'une catégorie personnalisée, non traduisible", () => {
    expect(categoryLabel('Ramp')).toBe('Ramp')
    expect(categoryLabel('Ramp', { plural: true })).toBe('Ramp')
  })
})

describe('categoryColor', () => {
  it('donne une couleur de repli aux catégories inconnues', () => {
    expect(categoryColor('Ramp')).toBe(categoryColor('Removal'))
    expect(categoryColor('Creature')).not.toBe(categoryColor('Ramp'))
  })
})

describe('isKnownCategory', () => {
  it('distingue les catégories du domaine des catégories utilisateur', () => {
    expect(isKnownCategory('Commander')).toBe(true)
    expect(isKnownCategory('Buff')).toBe(false)
  })

  it('inclut Sideboard, que les scrapers produisent', () => {
    expect(CATEGORY_ORDER).toContain('Sideboard')
  })
})
