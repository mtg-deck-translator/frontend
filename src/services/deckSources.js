const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

export function isArchidektUrl(url)  { return /archidekt\.com\/decks\//i.test(url) }
export function isMtgtop8Url(url)    { return /mtgtop8\.com\/event/i.test(url) }
export function isMoxfieldUrl(url)   { return /moxfield\.com\/decks\//i.test(url) }
export function isTappedoutUrl(url)  { return /tappedout\.net\/mtg-decks\//i.test(url) }

export function isSupportedUrl(url) {
  return isArchidektUrl(url) || isMtgtop8Url(url) || isMoxfieldUrl(url) || isTappedoutUrl(url)
}

export async function fetchDeckFromBackend(url) {
  let resp
  try {
    resp = await fetch(`${BACKEND}/api/deck?url=${encodeURIComponent(url)}`)
  } catch {
    throw new Error("Impossible de contacter le backend. Vérifiez votre connexion.")
  }

  const data = await resp.json()
  if (!resp.ok) throw new Error(data.error || `Erreur backend (HTTP ${resp.status}).`)
  return data
}
