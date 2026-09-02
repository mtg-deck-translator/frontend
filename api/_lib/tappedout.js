import { scrape, describeStatus } from './_http.js'

export async function fetchTappedoutDeck(url) {
  const match = url.match(/tappedout\.net\/mtg-decks\/([^/?#]+)/)
  if (!match) throw new Error('URL Tappedout invalide.')

  const slug = match[1]
  const txtUrl = `https://tappedout.net/mtg-decks/${slug}/?fmt=txt`

  const resp = await scrape(txtUrl, { responseType: 'text', sourceName: 'Tappedout' })

  if (resp.statusCode !== 200) throw new Error(describeStatus(resp.statusCode, 'Tappedout'))

  const cards = parseTappedoutText(resp.body)
  if (!cards.length) throw new Error('Aucune carte trouvée dans ce deck Tappedout.')

  const deckName = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  return { deckId: `tappedout:${slug}`, deckName, cards }
}

export function parseTappedoutText(text) {
  const cards = []
  let isSideboard = false

  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (!line) continue
    if (/^sideboard/i.test(line)) { isSideboard = true; continue }
    if (/^maindeck/i.test(line) || /^commander/i.test(line)) { isSideboard = false; continue }

    // SB: 1 Card Name  OR  1x Card Name  OR  1 Card Name
    const sb = line.match(/^SB:\s*(\d+)x?\s+(.+)$/i)
    const main = line.match(/^(\d+)x?\s+(.+)$/)
    const m = sb || main
    if (!m) continue

    const qty = parseInt(m[1])
    const name = m[2].trim().split(' // ')[0].trim() // take front face for query
    const displayName = m[2].trim()

    if (qty > 0 && name) {
      cards.push({
        qty,
        queryName: name,
        displayName,
        category: (sb || isSideboard) ? 'Sideboard' : null,
      })
    }
  }

  return cards
}
