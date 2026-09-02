import { scrape, describeStatus } from './_http.js'

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

  const resp = await scrape(`${MOXFIELD_API}/v3/decks/all/${publicId}`, {
    headers: { 'Accept': 'application/json' },
    responseType: 'json',
    sourceName: 'Moxfield',
  })

  if (resp.statusCode !== 200) throw new Error(describeStatus(resp.statusCode, 'Moxfield'))

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
