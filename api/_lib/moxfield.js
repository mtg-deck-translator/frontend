import { gotScraping } from 'got-scraping'

const MOXFIELD_API = 'https://api2.moxfield.com'

function extractPublicId(url) {
  // Accept full URL or bare ID
  const match = url.match(/moxfield\.com\/decks\/([^/?#]+)/i)
  return match ? match[1] : url
}

function extractBoard(board, category, isSideboard = false) {
  return Object.values(board?.cards || {}).map(entry => {
    const name = entry.card?.name || 'Unknown'
    let queryName, displayName
    if (name.includes(' // ')) {
      queryName = name.split(' // ')[0].trim()
      displayName = name
    } else {
      queryName = name
      displayName = name
    }
    return { queryName, displayName, qty: entry.quantity || 1, category, isSideboard }
  })
}

export async function fetchMoxfieldDeck(urlOrId) {
  const publicId = extractPublicId(urlOrId)

  let resp
  try {
    resp = await gotScraping({
      url: `${MOXFIELD_API}/v3/decks/all/${publicId}`,
      headers: { 'Accept': 'application/json' },
      responseType: 'json',
    })
  } catch (err) {
    throw new Error(`Impossible de contacter Moxfield : ${err.message}`)
  }

  if (resp.statusCode === 404) throw new Error('Deck Moxfield introuvable.')
  if (resp.statusCode === 401 || resp.statusCode === 403) throw new Error('Ce deck Moxfield est privé.')
  if (resp.statusCode !== 200) throw new Error(`Erreur Moxfield (HTTP ${resp.statusCode}).`)

  const deck = resp.body
  const commanderNames = new Set()

  const commanders = extractBoard(deck.boards?.commanders, 'Commander').map(c => {
    commanderNames.add(c.queryName)
    return c
  })

  const mainboard = extractBoard(deck.boards?.mainboard, null)
    .filter(c => !commanderNames.has(c.queryName))

  const maybeboard = extractBoard(deck.boards?.maybeboard, 'Maybeboard', true)

  const cards = [...commanders, ...mainboard, ...maybeboard]

  if (!cards.length) throw new Error('Aucune carte trouvée dans ce deck Moxfield.')

  return {
    deckId: `moxfield:${publicId}`,
    deckName: deck.name || 'Deck sans nom',
    cards,
  }
}
