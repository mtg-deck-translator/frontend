const BASE = 'https://api.scryfall.com'
const DELAY_MS = 150

function delay(ms) {
  return new Promise(r => setTimeout(r, ms))
}

function normalizeCardName(name) {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

function deriveCategoryFromTypeLine(typeLine) {
  if (!typeLine) return 'Other'
  if (typeLine.includes('Land')) return 'Land'
  if (typeLine.includes('Creature')) return 'Creature'
  if (typeLine.includes('Planeswalker')) return 'Planeswalker'
  if (typeLine.includes('Instant')) return 'Instant'
  if (typeLine.includes('Sorcery')) return 'Sorcery'
  if (typeLine.includes('Artifact')) return 'Artifact'
  if (typeLine.includes('Enchantment')) return 'Enchantment'
  return 'Other'
}

function getCardTypeLine(card) {
  return card.card_faces?.[0]?.type_line || card.type_line || ''
}

function getCardImage(card) {
  return card.image_uris?.normal
    || card.card_faces?.[0]?.image_uris?.normal
    || null
}

function getFrenchName(card) {
  if (card.card_faces?.length >= 2) {
    const f0 = card.card_faces[0].printed_name || card.card_faces[0].name
    const f1 = card.card_faces[1].printed_name || card.card_faces[1].name
    return `${f0} // ${f1}`
  }
  return card.printed_name || card.name
}

// Step 1: Fetch English card data in batches via /cards/collection
// Returns: { byName: Map<queryName, cardObj>, notFound: Set<queryName> }
async function fetchCollection(queryNames) {
  const byName = new Map()
  const notFound = new Set()
  const BATCH = 75

  for (let i = 0; i < queryNames.length; i += BATCH) {
    const batch = queryNames.slice(i, i + BATCH)
    const resp = await fetch(`${BASE}/cards/collection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ identifiers: batch.map(name => ({ name })) }),
    })

    if (!resp.ok) {
      batch.forEach(n => notFound.add(n))
    } else {
      const data = await resp.json()
      // Build a normalized lookup so "Lorien Revealed" matches "Lórien Revealed"
      const normalizedBatch = new Map(batch.map(n => [normalizeCardName(n), n]))
      for (const card of (data.data || [])) {
        const oracleName = card.name.split(' // ')[0]
        const originalName = normalizedBatch.get(normalizeCardName(oracleName))
        if (originalName) byName.set(originalName, card)
      }
      for (const nf of (data.not_found || [])) {
        const name = nf.name || nf.id
        if (name) notFound.add(name)
      }
    }

    if (i + BATCH < queryNames.length) await delay(DELAY_MS)
  }

  return { byName, notFound }
}

// Step 2: Fetch translated versions by oracle IDs in batches via /cards/search
// Returns: Map<oracleId, translatedCardObj>
async function fetchTranslated(oracleIds, lang) {
  const frenchMap = new Map()
  const BATCH = 20 // Scryfall limits OR-query complexity to ~20 terms

  for (let i = 0; i < oracleIds.length; i += BATCH) {
    const batch = oracleIds.slice(i, i + BATCH)
    const q = '(' + batch.map(id => `oracleid:${id}`).join(' or ') + `) lang:${lang}`
    const url = `${BASE}/cards/search?q=${encodeURIComponent(q)}&unique=prints`

    const resp = await fetch(url, { headers: { 'Accept': 'application/json' } })

    if (resp.ok) {
      const data = await resp.json()
      for (const card of (data.data || [])) {
        const existing = frenchMap.get(card.oracle_id)
        const hasLocalName = card.printed_name && card.printed_name !== card.name
        const existingHasLocalName = existing?.printed_name && existing.printed_name !== existing.name
        // Prefer cards with a truly localized printed_name over English-named prints
        if (!existing || (!existingHasLocalName && hasLocalName)) {
          frenchMap.set(card.oracle_id, card)
        }
      }
      // Handle pagination (shouldn't happen with unique=cards + <=30 IDs)
      if (data.has_more && data.next_page) {
        await delay(DELAY_MS)
        const r2 = await fetch(data.next_page, { headers: { 'Accept': 'application/json' } })
        if (r2.ok) {
          const d2 = await r2.json()
          for (const card of (d2.data || [])) {
            if (!frenchMap.has(card.oracle_id)) frenchMap.set(card.oracle_id, card)
          }
        }
      }
    }
    // If resp not ok (404 = no French found for any in batch), just continue

    if (i + BATCH < oracleIds.length) await delay(DELAY_MS)
  }

  return frenchMap
}

export async function translateBatch(cards, onProgress, lang = 'fr') {
  const total = cards.length

  // Deduplicate query names for API efficiency
  const uniqueQueryNames = [...new Set(cards.map(c => c.queryName))]

  onProgress(0, total)

  // Step 1: Batch-fetch English data (1–2 API requests for a full deck)
  let byName, notFound
  try {
    ;({ byName, notFound } = await fetchCollection(uniqueQueryNames))
  } catch {
    byName = new Map()
    notFound = new Set(uniqueQueryNames)
  }

  onProgress(Math.round(total * 0.2), total)

  // Step 2: Collect oracle IDs from found cards
  const oracleIds = [...byName.values()]
    .map(c => c.oracle_id)
    .filter(Boolean)

  // Step 3: Batch-fetch French versions (2–4 API requests for a full deck)
  let frenchMap = new Map()
  if (oracleIds.length > 0) {
    try {
      frenchMap = await fetchTranslated(oracleIds, lang)
    } catch {
      frenchMap = new Map()
    }
  }

  onProgress(Math.round(total * 0.9), total)

  // Step 4: Build final results
  const results = cards.map(card => {
    const enCard = byName.get(card.queryName)
    const oracleId = enCard?.oracle_id
    const frCard = oracleId ? frenchMap.get(oracleId) : null

    let frName, imageUrl, noFr, error, category

    if (!enCard) {
      // Card not found at all in Scryfall
      frName = card.displayName
      imageUrl = null
      noFr = true
      error = true
      category = card.category || 'Other'
    } else if (frCard) {
      // French printing found
      frName = getFrenchName(frCard)
      imageUrl = getCardImage(frCard)
      noFr = false
      error = false
      category = card.category || deriveCategoryFromTypeLine(getCardTypeLine(enCard))
    } else {
      // No French printing — use English name
      frName = enCard.name
      imageUrl = getCardImage(enCard)
      noFr = true
      error = false
      category = card.category || deriveCategoryFromTypeLine(getCardTypeLine(enCard))
    }

    return { ...card, frName, noFr, error, category, imageUrl }
  })

  onProgress(total, total)

  return results
}
