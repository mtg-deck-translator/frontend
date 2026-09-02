import { describe, it, expect } from 'vitest'
import { parseCollectionCSV, matchDeckToCollection, normalizeName } from '../src/services/collectionParser.js'

describe('normalizeName', () => {
  it('ignore accents, casse et espaces multiples', () => {
    expect(normalizeName('  Lórien   REVEALED ')).toBe('lorien revealed')
  })

  it('rend identiques deux graphies de la même carte', () => {
    expect(normalizeName('Æther Vial')).toBe(normalizeName('æther vial'))
  })
})

describe('parseCollectionCSV — formats reconnus', () => {
  it('lit un export Manabox (Name / Quantity)', () => {
    const c = parseCollectionCSV('Name,Set code,Quantity\nLightning Bolt,m10,4\nIsland,lea,12')
    expect(c.get('lightning bolt')).toBe(4)
    expect(c.get('island')).toBe(12)
  })

  it('lit un export DragonShield (Card Name / Count)', () => {
    const c = parseCollectionCSV('Card Name,Count\nBrainstorm,3')
    expect(c.get('brainstorm')).toBe(3)
  })

  it('additionne les lignes répétées d’une même carte', () => {
    const c = parseCollectionCSV('Name,Quantity\nIsland,2\nIsland,3')
    expect(c.get('island')).toBe(5)
  })

  it('retombe sur 1 exemplaire quand aucune colonne de quantité n’existe', () => {
    expect(parseCollectionCSV('Name\nIsland').get('island')).toBe(1)
  })

  it('ignore une colonne de quantité de liste d’échange', () => {
    const c = parseCollectionCSV('Name,Tradelist Count,Count\nIsland,9,2')
    expect(c.get('island')).toBe(2)
  })

  it('indexe une carte recto-verso sous son nom complet et sa face avant', () => {
    const c = parseCollectionCSV('Name,Quantity\nFire // Ice,1')
    expect(c.get('fire // ice')).toBe(1)
    expect(c.get('fire')).toBe(1)
  })
})

describe('parseCollectionCSV — champs entre guillemets', () => {
  it('préserve une virgule à l’intérieur d’un champ', () => {
    const c = parseCollectionCSV('Name,Quantity\n"Ach! Hans, Run!",1')
    expect(c.get('ach! hans, run!')).toBe(1)
  })

  it('restitue un guillemet échappé en doublant', () => {
    const c = parseCollectionCSV('Name,Quantity\n"Say ""Hello""",1')
    expect([...c.keys()]).toContain('say "hello"')
  })
})

describe('parseCollectionCSV — entrées refusées', () => {
  it('refuse un fichier sans colonne de nom', () => {
    expect(() => parseCollectionCSV('Foo,Bar\n1,2')).toThrow(/Name/)
  })

  it('refuse un fichier réduit à son en-tête', () => {
    expect(() => parseCollectionCSV('Name,Quantity')).toThrow(/vide ou invalide/)
  })

  it('refuse un fichier dont toutes les lignes sont vides de nom', () => {
    expect(() => parseCollectionCSV('Name,Quantity\n,4')).toThrow(/Aucune carte/)
  })

  it('tolère les fins de ligne Windows', () => {
    expect(parseCollectionCSV('Name,Quantity\r\nIsland,2\r\n').get('island')).toBe(2)
  })
})

describe('matchDeckToCollection', () => {
  const collection = parseCollectionCSV('Name,Quantity\nLórien Revealed,2\nFire // Ice,1')

  it('reconnaît une carte malgré les accents', () => {
    const owned = matchDeckToCollection([{ queryName: 'Lorien Revealed', displayName: 'Lorien Revealed' }], collection)
    expect(owned.has('Lorien Revealed')).toBe(true)
  })

  it('reconnaît une recto-verso par son nom complet', () => {
    const owned = matchDeckToCollection([{ queryName: 'Fire', displayName: 'Fire // Ice' }], collection)
    expect(owned.has('Fire')).toBe(true)
  })

  it('ne retient pas une carte absente de la collection', () => {
    const owned = matchDeckToCollection([{ queryName: 'Black Lotus', displayName: 'Black Lotus' }], collection)
    expect(owned.size).toBe(0)
  })
})
