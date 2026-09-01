function extractDeckId(url) {
  const match = url.match(/decks\/(\d+)/)
  if (!match) throw new Error("URL Archidekt invalide — format attendu : archidekt.com/decks/XXXXXX/...")
  return match[1]
}

export async function fetchArchidektDeck(url) {
  const deckId = extractDeckId(url)

  let resp
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    resp = await fetch(`https://archidekt.com/api/decks/${deckId}/`, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'MTGTranslator/1.0' },
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout))
  } catch (err) {
    const msg = err.name === 'AbortError' ? 'Délai dépassé (15s)' : err.message
    throw new Error(`Impossible de contacter Archidekt : ${msg}`)
  }

  if (resp.status === 404) throw new Error('Deck Archidekt introuvable. Vérifiez que le lien est correct et que le deck est public.')
  if (!resp.ok) throw new Error(`Erreur Archidekt (HTTP ${resp.status}).`)

  const data = await resp.json()
  const deckName = data.name || 'Deck sans nom'

  const cards = (data.cards || []).map(c => {
    const rawName = c.card?.oracleCard?.name || 'Unknown'
    let queryName, displayName
    if (rawName.includes(' // ')) {
      queryName = rawName.split(' // ')[0].trim()
      displayName = rawName
    } else {
      queryName = rawName
      displayName = rawName
    }
    const categories = c.categories || []
    const isMaybe = categories[0] === 'Maybeboard'
    const category = isMaybe ? 'Maybeboard' : (categories[0] || null)
    return { queryName, displayName, qty: c.quantity || 1, category, isSideboard: isMaybe }
  })

  return { deckId: `archidekt:${deckId}`, deckName, cards }
}
