const PREFIX = 'mtg-translator:'

export function safeGet(key, fallback = null) {
  try {
    const val = localStorage.getItem(PREFIX + key)
    return val !== null ? JSON.parse(val) : fallback
  } catch {
    return fallback
  }
}

export function safeSet(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
    return true
  } catch (e) {
    if (e.name === 'QuotaExceededError') return false
    return false
  }
}

// --- Checklist ---

export function getChecklist(deckId) {
  return safeGet(`checklist:${deckId}`, {})
}

export function setChecklist(deckId, map) {
  safeSet(`checklist:${deckId}`, map)
}

// --- History ---

const MAX_HISTORY = 5

// Langues proposées par le sélecteur — sert à purger les caches par langue.
const KNOWN_LANGS = ['fr', 'es', 'de', 'it', 'pt', 'ja', 'ko', 'ru', 'zhs', 'zht', 'en']

export function getHistory() {
  return safeGet('history', [])
}

function removeKey(key) {
  try { localStorage.removeItem(PREFIX + key) } catch {}
}

/**
 * Supprime tout ce qui se rattache à un deck sorti de l'historique.
 * Sans ça, chaque deck traduit laissait derrière lui plusieurs dizaines de Ko
 * (liste traduite, checklist, texte collé) jusqu'à saturer le quota — après quoi
 * safeSet échouait en silence et le cache cessait de fonctionner.
 */
function purgeDeck(deckId) {
  removeKey(`paste:${deckId}`)
  removeKey(`checklist:${deckId}`)
  for (const lang of KNOWN_LANGS) removeKey(`cards:${deckId}:${lang}`)
  removeKey(`cards:${deckId}`) // clé de l'ancien format, sans langue
}

export function addToHistory(entry) {
  const history = getHistory()
  const filtered = history.filter(h => h.deckId !== entry.deckId)
  const updated = [entry, ...filtered].slice(0, MAX_HISTORY)

  // Les entrées évincées emportent leurs données avec elles.
  const keptIds = new Set(updated.map(h => h.deckId))
  for (const h of history) {
    if (!keptIds.has(h.deckId)) purgeDeck(h.deckId)
  }

  safeSet('history', updated)

  // Store paste text separately if provided
  if (entry.pasteText && entry.deckId) {
    const stored = safeSet(`paste:${entry.deckId}`, entry.pasteText)
    if (!stored) {
      // Quota exceeded — save without paste text
      const withoutText = updated.map(h => h.deckId === entry.deckId ? { ...h, pasteText: undefined } : h)
      safeSet('history', withoutText)
    }
  }
}

export function getPasteText(deckId) {
  return safeGet(`paste:${deckId}`, null)
}

export function clearHistory() {
  getHistory().forEach(h => purgeDeck(h.deckId))
  safeSet('history', [])
}

// --- Translated cards cache ---
//
// La clé inclut la langue. Sans elle, traduire un deck en français puis basculer
// en allemand et le recharger depuis l'historique renvoyait la version française,
// sans aucune indication.

export function getCachedCards(deckId, lang) {
  return safeGet(`cards:${deckId}:${lang}`, null)
}

export function setCachedCards(deckId, lang, cards) {
  safeSet(`cards:${deckId}:${lang}`, cards)
}

// --- Theme ---

export function getTheme() {
  return safeGet('theme', 'system')
}

export function setTheme(value) {
  safeSet('theme', value)
}

// --- Simple djb2 hash for paste text ---

export function hashString(str) {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i)
    hash = hash & hash
  }
  return Math.abs(hash).toString(16).slice(0, 8)
}
