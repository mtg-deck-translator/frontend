import { ref, computed, watch } from 'vue'
import { getChecklist, setChecklist } from '../services/storage.js'

export function useChecklist(deckId) {
  const checkedMap = ref({})

  watch(deckId, (id) => {
    checkedMap.value = id ? (getChecklist(id) ?? {}) : {}
  }, { immediate: true })

  function toggle(cardKey) {
    checkedMap.value = { ...checkedMap.value, [cardKey]: !checkedMap.value[cardKey] }
    if (deckId.value) setChecklist(deckId.value, checkedMap.value)
  }

  function setAll(cardKeys, value) {
    const update = { ...checkedMap.value }
    cardKeys.forEach(k => { update[k] = value })
    checkedMap.value = update
    if (deckId.value) setChecklist(deckId.value, checkedMap.value)
  }

  function reset() {
    checkedMap.value = {}
    if (deckId.value) setChecklist(deckId.value, {})
  }

  const ownedCount = computed(() => Object.values(checkedMap.value).filter(Boolean).length)

  return { checkedMap, toggle, setAll, reset, ownedCount }
}
