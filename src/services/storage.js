const PREFIX = 'mtg-translator:'

function safeGet(key, fallback = null) {
  try {
    const val = localStorage.getItem(PREFIX + key)
    return val !== null ? JSON.parse(val) : fallback
  } catch {
    return fallback
  }
}

function safeSet(key, value) {
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

export function getHistory() {
  return safeGet('history', [])
}

export function addToHistory(entry) {
  const history = getHistory()
  const filtered = history.filter(h => h.deckId !== entry.deckId)
  const updated = [entry, ...filtered].slice(0, MAX_HISTORY)
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
  const history = getHistory()
  history.forEach(h => {
    try { localStorage.removeItem(PREFIX + `paste:${h.deckId}`) } catch {}
    try { localStorage.removeItem(PREFIX + `checklist:${h.deckId}`) } catch {}
  })
  safeSet('history', [])
}

// --- Translated cards cache ---

export function getCachedCards(deckId) {
  return safeGet(`cards:${deckId}`, null)
}

export function setCachedCards(deckId, cards) {
  safeSet(`cards:${deckId}`, cards)
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
