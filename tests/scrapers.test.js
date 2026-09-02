import { describe, it, expect } from 'vitest'
import { parseMtgoText, parseHtmlMeta } from '../api/_lib/mtgtop8.js'
import { parseTappedoutText } from '../api/_lib/tappedout.js'

describe('parseMtgoText (MTGTOP8)', () => {
  it('lit une decklist simple', () => {
    expect(parseMtgoText('4 Lightning Bolt\n20 Mountain')).toEqual([
      { queryName: 'Lightning Bolt', displayName: 'Lightning Bolt', qty: 4, category: null, isSideboard: false },
      { queryName: 'Mountain', displayName: 'Mountain', qty: 20, category: null, isSideboard: false },
    ])
  })

  it('marque la section // Commander', () => {
    const [c] = parseMtgoText('// Commander\n1 Krenko, Mob Boss')
    expect(c.category).toBe('Commander')
  })

  it('bascule sur Sideboard', () => {
    const cards = parseMtgoText('4 Bolt\nSideboard\n2 Pyroblast')
    expect(cards.map(c => c.isSideboard)).toEqual([false, true])
  })

  it('repère le commandant par son nom quand la section manque', () => {
    const [c] = parseMtgoText('1 Krenko, Mob Boss', 'krenko, mob boss')
    expect(c.category).toBe('Commander')
  })

  it('interroge la face avant d’une recto-verso', () => {
    const [c] = parseMtgoText('1 Fire // Ice')
    expect(c.queryName).toBe('Fire')
    expect(c.displayName).toBe('Fire // Ice')
  })

  it('ignore les lignes non conformes', () => {
    expect(parseMtgoText('n’importe quoi\n\n1 Island')).toHaveLength(1)
  })
})

describe('parseHtmlMeta (MTGTOP8)', () => {
  it('rend un nom de repli sans HTML', () => {
    expect(parseHtmlMeta('', '123')).toEqual({ deckName: 'Deck #123', commanderName: null })
  })

  it('extrait le nom du deck depuis le titre', () => {
    const { deckName } = parseHtmlMeta('<title>Madness - MTGTOP8</title>', '1')
    expect(deckName).toBe('Madness')
  })

  it('lit le commandant quand un lien /cards/ suit le libellé', () => {
    const html = '<div>COMMANDER</div><a href="/cards/krenko">Krenko, Mob Boss</a>'
    expect(parseHtmlMeta(html, '1').commanderName).toBe('Krenko, Mob Boss')
  })

  // Bug connu, consigné plutôt que masqué : sur une vraie page MTGTOP8 le premier
  // « COMMANDER » est une entrée de menu suivie d'un lien /format?f=…, et non
  // d'un lien /cards/. La regex ne trouve donc rien et aucune carte n'est marquée
  // Commander. Le nom du deck n'est juste que grâce au repli sur <title>.
  it('échoue à lire le commandant quand un menu précède la fiche (bug ouvert)', () => {
    const html = `<a href="/format?f=PREM">COMMANDER</a>${'x'.repeat(700)}<a href="/cards/krenko">Krenko</a>`
    expect(parseHtmlMeta(html, '1').commanderName).toBeNull()
  })
})

describe('parseTappedoutText', () => {
  it('lit une decklist simple', () => {
    const cards = parseTappedoutText('4 Lightning Bolt\n20x Mountain')
    expect(cards.map(c => [c.qty, c.queryName])).toEqual([[4, 'Lightning Bolt'], [20, 'Mountain']])
  })

  it('classe une ligne SB: en réserve', () => {
    const [c] = parseTappedoutText('SB: 2 Pyroblast')
    expect(c.category).toBe('Sideboard')
  })

  it('bascule en réserve après l’en-tête Sideboard', () => {
    const cards = parseTappedoutText('4 Bolt\nSideboard\n2 Pyroblast')
    expect(cards.map(c => c.category)).toEqual([null, 'Sideboard'])
  })

  it('revient au deck principal après Maindeck', () => {
    const cards = parseTappedoutText('Sideboard\n1 A\nMaindeck\n1 B')
    expect(cards.map(c => c.category)).toEqual(['Sideboard', null])
  })

  it('interroge la face avant d’une recto-verso', () => {
    const [c] = parseTappedoutText('1 Fire // Ice')
    expect(c.queryName).toBe('Fire')
    expect(c.displayName).toBe('Fire // Ice')
  })

  it('écarte les quantités nulles', () => {
    expect(parseTappedoutText('0 Island')).toHaveLength(0)
  })
})
