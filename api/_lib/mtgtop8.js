import { scrape, describeStatus } from './_http.js'

function extractParams(url) {
  const u = new URL(url)
  const d = u.searchParams.get('d')
  const e = u.searchParams.get('e')
  if (!d || !e) throw new Error("URL MTGTOP8 invalide — format attendu : …/event?e=…&d=…")
  return { d, e }
}

export async function fetchMtgtop8Deck(url) {
  const { d, e } = extractParams(url)

  // La liste de cartes est indispensable ; la page HTML ne sert qu'aux métadonnées
  // (nom du deck, commandant). Son échec ne doit pas faire échouer l'import.
  const [mtgoResp, htmlResp] = await Promise.all([
    scrape(`https://www.mtgtop8.com/mtgo?d=${d}&e=${e}`, { responseType: 'text', sourceName: 'MTGTOP8' }),
    scrape(`https://www.mtgtop8.com/event?e=${e}&d=${d}`, { responseType: 'text', sourceName: 'MTGTOP8' })
      .catch(() => ({ statusCode: 0, body: '' })),
  ])

  if (mtgoResp.statusCode !== 200) throw new Error(describeStatus(mtgoResp.statusCode, 'MTGTOP8'))

  const { deckName, commanderName } = parseHtmlMeta(htmlResp.body || '', d)
  const cards = parseMtgoText(mtgoResp.body, commanderName)

  if (!cards.length) throw new Error("Aucune carte trouvée dans ce deck MTGTOP8.")

  return { deckId: `mtgtop8:${d}`, deckName, cards }
}

export function parseHtmlMeta(html, deckId) {
  let deckName = `Deck #${deckId}`
  let commanderName = null
  if (!html) return { deckName, commanderName }

  const commanderMatch = html.match(/COMMANDER[\s\S]{0,600}?<a[^>]*href="\/cards\/[^"]*"[^>]*>([^<]+)<\/a>/i)
  if (commanderMatch) {
    commanderName = commanderMatch[1].trim()
    deckName = commanderName
  } else {
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i)
    if (titleMatch) {
      const parts = titleMatch[1].split(/\s*[|\-]\s*/)
      const candidate = parts.find(p => p.trim() && !/^(mtgtop8|top8|top 8 magic)$/i.test(p.trim()))
      if (candidate) deckName = candidate.trim()
    }
  }
  return { deckName, commanderName }
}

export function parseMtgoText(text, commanderName) {
  const cards = []
  const lines = text.split('\n')
  let isSideboard = false
  let currentCategory = null

  for (let line of lines) {
    line = line.trim()
    if (!line) continue
    if (line.startsWith('//')) {
      const section = line.slice(2).trim().toLowerCase()
      currentCategory = (section === 'commander' || section === 'commanders') ? 'Commander' : null
      continue
    }
    if (/^sideboard$/i.test(line)) { isSideboard = true; continue }

    const match = line.match(/^(\d+)\s+(.+)$/)
    if (!match) continue

    const qty = parseInt(match[1], 10)
    let rawName = match[2].trim()
    let queryName, displayName
    if (rawName.includes(' // ')) {
      queryName = rawName.split(' // ')[0].trim()
      displayName = rawName
    } else {
      queryName = rawName
      displayName = rawName
    }

    let category = currentCategory
    if (!category && commanderName && queryName.toLowerCase() === commanderName.toLowerCase()) {
      category = 'Commander'
    }
    cards.push({ queryName, displayName, qty, category, isSideboard })
  }
  return cards
}
