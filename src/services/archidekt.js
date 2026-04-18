export function extractDeckId(url) {
  const match = url.match(/decks\/(\d+)/)
  return match ? match[1] : null
}

function getApiUrl(deckId) {
  // In dev, Vite proxies /api/archidekt → https://archidekt.com/api (bypasses CORS)
  if (import.meta.env.DEV) {
    return `/api/archidekt/decks/${deckId}/`
  }
  return `https://archidekt.com/api/decks/${deckId}/`
}

export async function fetchDeck(url) {
  const deckId = extractDeckId(url)
  if (!deckId) {
    throw { type: 'INVALID_URL', message: "URL Archidekt invalide. Format attendu : https://archidekt.com/decks/XXXXXX/..." }
  }

  let resp
  try {
    resp = await fetch(getApiUrl(deckId))
  } catch {
    throw { type: 'NETWORK', message: "Impossible de contacter Archidekt. Vérifiez votre connexion ou collez la liste manuellement." }
  }

  if (resp.status === 404) {
    throw { type: 'NOT_FOUND', message: "Deck introuvable. Vérifiez que le lien est correct et que le deck est public." }
  }

  if (!resp.ok) {
    throw { type: 'HTTP_ERROR', message: `Erreur Archidekt (HTTP ${resp.status}). Réessayez ou utilisez le mode collage.` }
  }

  let data
  try {
    data = await resp.json()
  } catch {
    throw { type: 'PARSE_ERROR', message: "Réponse Archidekt invalide. Réessayez ou utilisez le mode collage." }
  }

  const deckName = data.name || 'Deck sans nom'

  const cards = (data.cards || []).map(c => {
    const oracleCard = c.card?.oracleCard || {}
    const rawName = oracleCard.name || 'Unknown'

    let queryName, displayName
    if (rawName.includes(' // ')) {
      queryName = rawName.split(' // ')[0].trim()
      displayName = rawName
    } else {
      queryName = rawName
      displayName = rawName
    }

    // categories is an array of strings, e.g. ["Creature"] or ["Maybeboard", "Sorcery"]
    const categories = c.categories || []
    const isMaybe = categories[0] === 'Maybeboard'
    // For maybeboard cards, the actual card type is in categories[1]
    const category = isMaybe ? 'Maybeboard' : (categories[0] || null)

    return {
      queryName,
      displayName,
      qty: c.quantity || 1,
      category,
      isSideboard: isMaybe,
    }
  })

  return { deckId: `archidekt:${deckId}`, deckName, cards }
}
