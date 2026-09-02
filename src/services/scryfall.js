const BASE = 'https://api.scryfall.com'

// Scryfall demande 50 à 100 ms entre deux requêtes. On reste au-dessus.
// Pour de la résolution de noms en masse, leur recommandation est de passer aux
// fichiers bulk data — piste à évaluer si le volume augmente.
const DELAY_MS = 150

// Un 429 ou un 5xx est temporaire : on réessaie. Les autres statuts ne le sont pas.
const MAX_RETRIES = 3
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504])

function delay(ms) {
  return new Promise(r => setTimeout(r, ms))
}

/**
 * Échec d'appel à Scryfall, par opposition à « la carte n'existe pas ».
 * La distinction compte : confondre les deux faisait passer un deck entièrement
 * non traduit pour un succès, sans le moindre avertissement.
 */
export class ScryfallError extends Error {
  constructor(message, { status = null } = {}) {
    super(message)
    this.name = 'ScryfallError'
    this.status = status
  }
}

function backoffDelay(attempt, retryAfterHeader) {
  const retryAfter = Number(retryAfterHeader)
  if (Number.isFinite(retryAfter) && retryAfter > 0) return Math.min(retryAfter * 1000, 10000)
  // 500 ms, 1 s, 2 s — avec un peu de jitter pour ne pas rafaler en cadence.
  return 500 * 2 ** attempt + Math.random() * 200
}

/**
 * fetch vers Scryfall, avec réessai sur les erreurs temporaires.
 * Lève une ScryfallError si l'appel échoue durablement — ne renvoie jamais
 * une réponse en erreur à l'appelant.
 */
async function scryfallFetch(url, init) {
  let lastStatus = null

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    let resp
    try {
      resp = await fetch(url, init)
    } catch {
      // Panne réseau : on réessaie, puis on abandonne franchement.
      if (attempt === MAX_RETRIES) {
        throw new ScryfallError('Impossible de joindre Scryfall. Vérifiez votre connexion.')
      }
      await delay(backoffDelay(attempt))
      continue
    }

    if (resp.ok) return resp

    lastStatus = resp.status
    if (!RETRYABLE_STATUS.has(resp.status) || attempt === MAX_RETRIES) break
    await delay(backoffDelay(attempt, resp.headers.get('retry-after')))
  }

  if (lastStatus === 429) {
    throw new ScryfallError('Scryfall limite temporairement les requêtes. Réessayez dans un instant.', { status: 429 })
  }
  throw new ScryfallError(`Scryfall a renvoyé une erreur (HTTP ${lastStatus}).`, { status: lastStatus })
}

export function normalizeCardName(name) {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

export function deriveCategoryFromTypeLine(typeLine) {
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

export function getCardTypeLine(card) {
  return card.card_faces?.[0]?.type_line || card.type_line || ''
}

export function getCardImage(card) {
  return card.image_uris?.normal
    || card.card_faces?.[0]?.image_uris?.normal
    || null
}

export function getFrenchName(card) {
  if (card.card_faces?.length >= 2) {
    const f0 = card.card_faces[0].printed_name || card.card_faces[0].name
    const f1 = card.card_faces[1].printed_name || card.card_faces[1].name
    return `${f0} // ${f1}`
  }
  return card.printed_name || card.name
}

// Step 1: Fetch English card data in batches via /cards/collection
// Returns: { byName: Map<queryName, cardObj>, notFound: Set<queryName> }
async function fetchCollection(queryNames, onStep) {
  const byName = new Map()
  const notFound = new Set()
  const BATCH = 75
  const steps = Math.ceil(queryNames.length / BATCH)

  for (let i = 0; i < queryNames.length; i += BATCH) {
    const batch = queryNames.slice(i, i + BATCH)

    // scryfallFetch lève en cas d'échec durable. Marquer le lot « introuvable »
    // comme avant reviendrait à présenter un deck non traduit comme un succès.
    const resp = await scryfallFetch(`${BASE}/cards/collection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ identifiers: batch.map(name => ({ name })) }),
    })

    const data = await resp.json()
    // Build a normalized lookup so "Lorien Revealed" matches "Lórien Revealed"
    const normalizedBatch = new Map(batch.map(n => [normalizeCardName(n), n]))
    for (const card of (data.data || [])) {
      const oracleName = card.name.split(' // ')[0]
      const originalName = normalizedBatch.get(normalizeCardName(oracleName))
      if (originalName) byName.set(originalName, card)
    }
    // Seul Scryfall décide qu'une carte n'existe pas.
    for (const nf of (data.not_found || [])) {
      const name = nf.name || nf.id
      if (name) notFound.add(name)
    }

    onStep?.((i / BATCH + 1) / steps)
    if (i + BATCH < queryNames.length) await delay(DELAY_MS)
  }

  return { byName, notFound }
}

export function mergeLocalizedCard(map, card) {
  const existing = map.get(card.oracle_id)
  const hasLocalName = card.printed_name && card.printed_name !== card.name
  const existingHasLocalName = existing?.printed_name && existing.printed_name !== existing.name
  if (!existing || (!existingHasLocalName && hasLocalName)) {
    map.set(card.oracle_id, card)
  }
}

// Step 2: Fetch translated versions by oracle IDs in batches via /cards/search
// Phase 1: unique=cards (1 result per oracle ID, no pagination risk from basic lands)
// Phase 2: unique=prints retry for any card still missing a localized printed_name
// Returns: Map<oracleId, translatedCardObj>
async function fetchTranslated(oracleIds, lang, onStep) {
  const translatedMap = new Map()
  const BATCH = 20 // Scryfall limits OR-query complexity to ~20 terms
  const steps = Math.ceil(oracleIds.length / BATCH)

  // Phase 1: unique=cards — fast, no pagination, 1 result per oracle ID
  for (let i = 0; i < oracleIds.length; i += BATCH) {
    const batch = oracleIds.slice(i, i + BATCH)
    const q = '(' + batch.map(id => `oracleid:${id}`).join(' or ') + `) lang:${lang}`
    const url = `${BASE}/cards/search?q=${encodeURIComponent(q)}&unique=cards`

    const resp = await scryfallFetch(url, { headers: { 'Accept': 'application/json' } })
    const data = await resp.json()
    for (const card of (data.data || [])) mergeLocalizedCard(translatedMap, card)

    onStep?.((i / BATCH + 1) / steps)
    if (i + BATCH < oracleIds.length) await delay(DELAY_MS)
  }

  // Phase 2: for cards with no localized printed_name, retry with unique=prints
  // This catches cards like Vampiric Tutor where unique=cards picks a print with null printed_name
  const needsBetterPrint = oracleIds.filter(id => {
    const c = translatedMap.get(id)
    return c && (!c.printed_name || c.printed_name === c.name)
  })

  if (needsBetterPrint.length > 0) {
    const BATCH2 = 20
    for (let i = 0; i < needsBetterPrint.length; i += BATCH2) {
      const batch = needsBetterPrint.slice(i, i + BATCH2)
      const q = '(' + batch.map(id => `oracleid:${id}`).join(' or ') + `) lang:${lang}`
      const url = `${BASE}/cards/search?q=${encodeURIComponent(q)}&unique=prints`

      const resp = await scryfallFetch(url, { headers: { 'Accept': 'application/json' } })
      const data = await resp.json()
      for (const card of (data.data || [])) mergeLocalizedCard(translatedMap, card)
      if (data.has_more && data.next_page) {
        await delay(DELAY_MS)
        const r2 = await scryfallFetch(data.next_page, { headers: { 'Accept': 'application/json' } })
        const d2 = await r2.json()
        for (const card of (d2.data || [])) mergeLocalizedCard(translatedMap, card)
      }

      if (i + BATCH2 < needsBetterPrint.length) await delay(DELAY_MS)
    }
  }

  return translatedMap
}

export async function translateBatch(cards, onProgress, lang = 'fr') {
  const total = cards.length

  // Deduplicate query names for API efficiency
  const uniqueQueryNames = [...new Set(cards.map(c => c.queryName))]

  // Progression réelle : la barre avançait auparavant par paliers 0 / 20 / 90 / 100.
  // Les deux phases sont pondérées à hauteur de ce qu'elles coûtent vraiment.
  const report = fraction => onProgress(Math.round(total * Math.min(fraction, 1)), total)
  report(0)

  // Étape 1 — données anglaises par lots (1 à 2 requêtes pour un deck complet).
  // Un échec durable remonte : mieux vaut une erreur franche qu'un deck vide
  // présenté comme traduit.
  const { byName, notFound } = await fetchCollection(uniqueQueryNames, f => report(f * 0.45))

  // Étape 2 — identifiants oracle des cartes trouvées
  const oracleIds = [...byName.values()]
    .map(c => c.oracle_id)
    .filter(Boolean)

  // Étape 3 — versions traduites (2 à 4 requêtes pour un deck complet)
  let frenchMap = new Map()
  if (oracleIds.length > 0) {
    frenchMap = await fetchTranslated(oracleIds, lang, f => report(0.45 + f * 0.5))
  }

  report(0.95)

  // Step 4: Build final results
  const results = cards.map(card => {
    const enCard = byName.get(card.queryName)
    const oracleId = enCard?.oracle_id
    const frCard = oracleId ? frenchMap.get(oracleId) : null

    let frName, imageUrl, noFr, error, category

    if (!enCard) {
      // Scryfall ne connaît pas cette carte : nom de la source, tel quel.
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

    const price = enCard?.prices?.eur ? parseFloat(enCard.prices.eur) : null
    const colorIdentity = enCard?.color_identity || []
    return { ...card, frName, noFr, error, category, imageUrl, price, colorIdentity }
  })

  onProgress(total, total)

  return results
}
