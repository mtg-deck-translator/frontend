import { describe, it, expect, beforeEach, vi } from 'vitest'

// useCollection lit localStorage au chargement du module : on le simule avant
// d'importer, et on ré-importe à neuf pour chaque cas.
function stubStorage(initial = {}) {
  const store = new Map(Object.entries(initial))
  globalThis.localStorage = {
    getItem: k => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: k => store.delete(k),
  }
  return store
}

async function freshCollection(initial) {
  stubStorage(initial)
  vi.resetModules()
  const { useCollection } = await import('../src/composables/useCollection.js')
  return useCollection()
}

const MANUAL = 'mtg-collection-manual-v1'

describe('collection construite en cochant', () => {
  beforeEach(() => vi.resetModules())

  it('retient une carte cochée et l’oublie quand on décoche', async () => {
    const c = await freshCollection()
    c.rememberOwned('Lightning Bolt', true)
    expect(c.getMap().has('lightning bolt')).toBe(true)
    c.rememberOwned('Lightning Bolt', false)
    expect(c.getMap()).toBeNull()
  })

  it('rapproche malgré les accents', async () => {
    const c = await freshCollection()
    c.rememberOwned('Lórien Revealed', true)
    expect(c.getMap().has('lorien revealed')).toBe(true)
  })

  it('survit à un rechargement', async () => {
    const c1 = await freshCollection()
    c1.rememberOwned('Sol Ring', true)
    const saved = globalThis.localStorage.getItem(MANUAL)

    const c2 = await freshCollection({ [MANUAL]: saved })
    expect(c2.getMap().has('sol ring')).toBe(true)
    expect(c2.manualSize.value).toBe(1)
  })

  it('relit l’ancien format, une simple liste de clés', async () => {
    const c = await freshCollection({ [MANUAL]: JSON.stringify(['sol ring']) })
    expect(c.getMap().has('sol ring')).toBe(true)
  })

  it('fusionne le CSV et le pointage sans écraser les quantités du CSV', async () => {
    const c = await freshCollection()
    c.setCollection(new Map([['island', 12]]), 'ma-collec')
    c.rememberOwned('Island', true)
    c.rememberOwned('Forest', true)
    const merged = c.getMap()
    expect(merged.get('island')).toBe(12)
    expect(merged.get('forest')).toBe(1)
  })

  it('rend null tant que rien n’est connu', async () => {
    const c = await freshCollection()
    expect(c.getMap()).toBeNull()
    expect(c.hasAnyCollection.value).toBe(false)
  })

  it('oublie le pointage sans toucher au CSV importé', async () => {
    const c = await freshCollection()
    c.setCollection(new Map([['island', 4]]), 'x')
    c.rememberOwned('Forest', true)
    c.clearManual()
    expect(c.getMap().has('island')).toBe(true)
    expect(c.getMap().has('forest')).toBe(false)
  })
})

describe('export CSV', () => {
  it('exporte le nom d’origine, pas la clé normalisée', async () => {
    const c = await freshCollection()
    c.rememberOwned('Lórien Revealed', true)
    expect(c.exportCSV()).toBe('Name,Quantity\nLórien Revealed,1')
  })

  it('échappe les noms contenant une virgule', async () => {
    const c = await freshCollection()
    c.rememberOwned('Ach! Hans, Run!', true)
    expect(c.exportCSV()).toContain('"Ach! Hans, Run!"')
  })

  it('reprend la quantité du CSV quand la carte y figure', async () => {
    const c = await freshCollection()
    c.setCollection(new Map([['island', 12]]), 'x')
    c.rememberOwned('Island', true)
    expect(c.exportCSV()).toContain('Island,12')
  })

  it('produit un en-tête relisible par parseCollectionCSV', async () => {
    const c = await freshCollection()
    c.rememberOwned('Sol Ring', true)
    const { parseCollectionCSV } = await import('../src/services/collectionParser.js')
    expect(parseCollectionCSV(c.exportCSV()).get('sol ring')).toBe(1)
  })
})
