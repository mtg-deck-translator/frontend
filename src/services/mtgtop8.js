export function isMtgtop8Url(url) {
  return /mtgtop8\.com\/event/i.test(url)
}

function extractParams(url) {
  const u = new URL(url)
  const d = u.searchParams.get('d')
  const e = u.searchParams.get('e')
  if (!d || !e) throw new Error("URL MTGTOP8 invalide — format attendu : …/event?e=…&d=…")
  return { d, e }
}

export async function fetchDeck(url) {
  const { d, e } = extractParams(url)

  const [mtgoText, htmlText] = await Promise.all([
    fetch(`/api/mtgtop8/mtgo?d=${d}&e=${e}`).then(r => {
      if (!r.ok) throw new Error(`Impossible de récupérer le deck MTGTOP8 (erreur ${r.status}).`)
      return r.text()
    }),
    fetch(`/api/mtgtop8/event?e=${e}&d=${d}`).then(r => r.text()).catch(() => ''),
  ])

  const { deckName, commanderName } = parseHtmlMeta(htmlText, d)
  const cards = parseMtgoText(mtgoText, commanderName)

  if (!cards.length) throw new Error("Aucune carte trouvée dans ce deck MTGTOP8.")

  return { cards, deckId: `mtgtop8:${d}`, deckName }
}

function parseHtmlMeta(html, deckId) {
  let deckName = `Deck #${deckId}`
  let commanderName = null

  if (!html) return { deckName, commanderName }

  try {
    const doc = new DOMParser().parseFromString(html, 'text/html')

    // Commander name: look for the text "COMMANDER" then the first card link after it
    const bodyHtml = doc.body?.innerHTML || ''
    const commanderMatch = bodyHtml.match(
      /COMMANDER[\s\S]{0,600}?<a[^>]*href="\/cards\/[^"]*"[^>]*>([^<]+)<\/a>/i
    )
    if (commanderMatch) {
      commanderName = commanderMatch[1].trim()
      deckName = commanderName
    } else {
      // Fallback: try page title
      const title = doc.title
      if (title) {
        const parts = title.split(/\s*[|\-]\s*/)
        const candidate = parts.find(p => p.trim() && !/^(mtgtop8|top8|top 8 magic)$/i.test(p.trim()))
        if (candidate) deckName = candidate.trim()
      }
    }
  } catch {}

  return { deckName, commanderName }
}

function parseMtgoText(text, commanderNameFromHtml) {
  const cards = []
  const lines = text.split('\n')
  let isSideboard = false
  let currentCategory = null

  for (let line of lines) {
    line = line.trim()
    if (!line) continue

    // Section headers: "// Commander", "// Lands", etc.
    if (line.startsWith('//')) {
      const section = line.slice(2).trim().toLowerCase()
      currentCategory = section === 'commander' || section === 'commanders' ? 'Commander' : null
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
    if (!category && commanderNameFromHtml &&
        queryName.toLowerCase() === commanderNameFromHtml.toLowerCase()) {
      category = 'Commander'
    }

    cards.push({ queryName, displayName, qty, category, isSideboard })
  }

  return cards
}
