import { ref, computed } from 'vue'
import { normalizeName, parseCollectionCSV } from '../services/collectionParser.js'

const STORAGE_KEY = 'mtg-collection-v1'
// Collection construite au fil de l'eau, en cochant les cartes.
//
// C'est le pari du produit. L'import CSV ne sert que ceux qui utilisent déjà
// Manabox, DragonShield ou Moxfield — c'est-à-dire les gens qu'une autre app
// sert déjà mieux. Le joueur visé, lui, a sa collection dans des boîtes et
// aucun fichier à importer.
//
// Ici, chaque carte cochée dans n'importe quel deck alimente une collection
// locale. Au deuxième deck, une partie de la checklist est déjà pré-cochée
// sans que l'utilisateur ait rien fait de plus. C'est ce qui transforme un
// utilitaire à usage unique en outil où l'on revient — sans compte, sans
// serveur, sans rien à numériser à l'avance.
const MANUAL_KEY = 'mtg-collection-manual-v1'

function loadStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const { entries, name } = JSON.parse(raw)
    return { map: new Map(entries), name }
  } catch {
    return null
  }
}

// Map<nom normalisé, nom d'origine> : la clé sert au rapprochement, la valeur
// à l'export. Ne stocker que la clé normalisée rendrait la collection
// exportable en « lorien revealed » plutôt qu'en « Lórien Revealed ».
function loadManual() {
  try {
    const raw = localStorage.getItem(MANUAL_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return new Map(Array.isArray(parsed) && typeof parsed[0] === 'string'
      ? parsed.map(k => [k, k])   // ancien format : liste de clés
      : parsed)
  } catch {
    return new Map()
  }
}

const init = loadStored()
const _map = ref(init?.map ?? null)
const _name = ref(init?.name ?? '')
const _manual = ref(loadManual())

function persistManual() {
  try {
    localStorage.setItem(MANUAL_KEY, JSON.stringify([..._manual.value]))
  } catch {}
}

/** Export au format Manabox : lisible par les autres outils, pas de verrou. */
function toCSV(manual, csvMap) {
  const rows = [['Name', 'Quantity']]
  const seen = new Set()
  for (const [key, name] of manual) {
    rows.push([name, csvMap?.get(key) ?? 1])
    seen.add(key)
  }
  for (const [key, qty] of (csvMap ?? [])) {
    if (!seen.has(key)) rows.push([key, qty])
  }
  return rows
    .map(r => r.map(v => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : v)).join(','))
    .join('\n')
}

export function useCollection() {
  const csvSize = computed(() => _map.value?.size ?? 0)
  const manualSize = computed(() => _manual.value.size)
  const collectionName = _name
  const collectionSize = computed(() => csvSize.value)
  const hasCollection = computed(() => csvSize.value > 0)
  const hasAnyCollection = computed(() => csvSize.value > 0 || manualSize.value > 0)
  const totalKnown = computed(() => mergedMap()?.size ?? 0)

  function setCollection(map, filename) {
    _map.value = map
    _name.value = filename
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ entries: [...map], name: filename }))
    } catch {}
  }

  /** Lit un CSV et remplace la pile importée. Partagé par les deux endroits
      qui proposent un import — le rail de l'écran deck et l'accueil — pour
      qu'ils ne divergent pas sur la gestion d'erreur ou le nom retenu. */
  async function importFromFile(file) {
    const text = await file.text()
    const map = parseCollectionCSV(text)
    setCollection(map, file.name.replace(/\.csv$/i, ''))
    return map.size
  }

  function clearCollection() {
    _map.value = null
    _name.value = ''
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
  }

  function clearManual() {
    _manual.value = new Map()
    persistManual()
  }

  /** Mémorise (ou oublie) une carte cochée à la main. */
  function rememberOwned(cardName, owned) {
    const key = normalizeName(cardName)
    if (!key) return
    const next = new Map(_manual.value)
    if (owned) next.set(key, cardName)
    else next.delete(key)
    _manual.value = next
    persistManual()
  }

  /** CSV et pointage manuel fusionnés — c'est ce que voit le rapprochement. */
  function mergedMap() {
    if (!_map.value && _manual.value.size === 0) return null
    const merged = new Map(_map.value ?? [])
    for (const key of _manual.value.keys()) {
      if (!merged.has(key)) merged.set(key, 1)
    }
    return merged
  }

  return {
    hasCollection, hasAnyCollection, collectionName, collectionSize,
    csvSize, manualSize, totalKnown,
    setCollection, importFromFile, clearCollection, clearManual, rememberOwned,
    getMap: mergedMap,
    exportCSV: () => toCSV(_manual.value, _map.value),
  }
}
