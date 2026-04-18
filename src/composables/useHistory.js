import { ref } from 'vue'
import { getHistory, addToHistory as storageAdd, clearHistory as storageClear, getPasteText } from '../services/storage.js'

export function useHistory() {
  const history = ref(getHistory())

  function add(entry) {
    storageAdd(entry)
    history.value = getHistory()
  }

  function clear() {
    storageClear()
    history.value = []
  }

  function getEntryPasteText(deckId) {
    return getPasteText(deckId)
  }

  return { history, add, clear, getEntryPasteText }
}
