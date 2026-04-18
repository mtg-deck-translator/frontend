const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

export function isMoxfieldUrl(url) {
  return /moxfield\.com\/decks\//i.test(url)
}

export async function fetchDeck(url) {
  let resp
  try {
    resp = await fetch(`${BACKEND}/api/deck/moxfield?url=${encodeURIComponent(url)}`)
  } catch {
    throw new Error("Impossible de contacter le backend. Vérifiez qu'il est démarré.")
  }

  const data = await resp.json()

  if (!resp.ok) {
    throw new Error(data.error || `Erreur backend (HTTP ${resp.status}).`)
  }

  return data
}
