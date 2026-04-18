import { ref } from 'vue'
import { parsePastedList } from '../services/parser.js'
import { translateBatch } from '../services/scryfall.js'
import { fetchDeck as fetchArchidektDeck } from '../services/archidekt.js'
import { isMtgtop8Url, fetchDeck as fetchMtgtop8Deck } from '../services/mtgtop8.js'
import { isMoxfieldUrl, fetchDeck as fetchMoxfieldDeck } from '../services/moxfield.js'
import { hashString } from '../services/storage.js'

export function useDeck() {
  const inputMode = ref('url')
  const urlInput = ref('')
  const pasteInput = ref('')

  const status = ref('idle')
  const error = ref(null)
  const errorMeta = ref(null)
  const progress = ref({ current: 0, total: 0 })
  const cards = ref([])
  const deckId = ref(null)
  const deckName = ref('')
  const unparseableLines = ref([])

  async function translate() {
    status.value = 'fetching'
    error.value = null
    errorMeta.value = null
    cards.value = []
    unparseableLines.value = []
    progress.value = { current: 0, total: 0 }

    let rawCards = []
    let resolvedDeckId = null
    let resolvedDeckName = ''
    let pasteText = null

    try {
      if (inputMode.value === 'url') {
        const trimmedUrl = urlInput.value.trim()
        let fetcher
        if (isMtgtop8Url(trimmedUrl)) fetcher = fetchMtgtop8Deck
        else if (isMoxfieldUrl(trimmedUrl)) fetcher = fetchMoxfieldDeck
        else fetcher = fetchArchidektDeck
        const result = await fetcher(trimmedUrl)
        rawCards = result.cards
        resolvedDeckId = result.deckId
        resolvedDeckName = result.deckName
      } else {
        pasteText = pasteInput.value.trim()
        const result = parsePastedList(pasteText)
        rawCards = result.cards
        unparseableLines.value = result.unparseableLines
        const hash = hashString(pasteText)
        resolvedDeckId = `pasted:${hash}`
        resolvedDeckName = 'Liste collée'
      }
    } catch (err) {
      status.value = 'error'
      error.value = err?.message || "Une erreur est survenue. Réessayez."
      errorMeta.value = err?.type ? { type: err.type, deckUrl: err.deckUrl } : null
      return
    }

    if (rawCards.length === 0) {
      status.value = 'error'
      error.value = "Aucune carte trouvée. Vérifiez le format de votre liste."
      return
    }

    deckId.value = resolvedDeckId
    deckName.value = resolvedDeckName

    status.value = 'translating'
    progress.value = { current: 0, total: rawCards.length }

    try {
      const translated = await translateBatch(rawCards, (current, total) => {
        progress.value = { current, total }
      })
      cards.value = translated
      status.value = 'done'
    } catch (err) {
      status.value = 'error'
      error.value = "Erreur lors de la traduction via Scryfall. Réessayez."
    }

    return { pasteText }
  }

  function reset() {
    status.value = 'idle'
    error.value = null
    progress.value = { current: 0, total: 0 }
    cards.value = []
    deckId.value = null
    deckName.value = ''
    unparseableLines.value = []
  }

  function loadFromHistory(entry) {
    if (entry.inputMode === 'url') {
      inputMode.value = 'url'
      urlInput.value = entry.url || ''
    } else {
      inputMode.value = 'paste'
      pasteInput.value = entry.pasteText || ''
    }
  }

  return {
    inputMode, urlInput, pasteInput,
    status, error, errorMeta, progress, cards, deckId, deckName, unparseableLines,
    translate, reset, loadFromHistory,
  }
}
