import { ref, computed } from 'vue'

const STORAGE_KEY = 'mtg-collection-v1'

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

const init = loadStored()
const _map = ref(init?.map ?? null)
const _name = ref(init?.name ?? '')

export function useCollection() {
  const hasCollection = computed(() => !!_map.value && _map.value.size > 0)
  const collectionName = _name
  const collectionSize = computed(() => _map.value?.size ?? 0)

  function setCollection(map, filename) {
    _map.value = map
    _name.value = filename
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ entries: [...map], name: filename }))
    } catch {}
  }

  function clearCollection() {
    _map.value = null
    _name.value = ''
    localStorage.removeItem(STORAGE_KEY)
  }

  function getMap() {
    return _map.value
  }

  return { hasCollection, collectionName, collectionSize, setCollection, clearCollection, getMap }
}
