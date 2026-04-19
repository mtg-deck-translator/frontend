function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, ''))
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim().replace(/^"|"$/g, ''))
  return result
}

export function normalizeName(name) {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()
}

// Supports: Manabox, DragonShield, Moxfield, generic CSV with a Name column
export function parseCollectionCSV(text) {
  const lines = text.replace(/\r/g, '').split('\n').filter(l => l.trim())
  if (lines.length < 2) throw new Error('Fichier vide ou invalide.')

  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase())

  const nameCol = headers.findIndex(h =>
    h === 'name' || h === 'card name' || h === 'card_name' || h === 'cardname'
  )
  if (nameCol === -1) {
    throw new Error('Colonne "Name" introuvable. Formats supportés : Manabox, DragonShield, Moxfield.')
  }

  let qtyCol = headers.findIndex(h =>
    h === 'count' || h === 'quantity' || h === 'qty' || h === 'amount'
  )
  if (qtyCol === -1) {
    qtyCol = headers.findIndex(h =>
      h.includes('count') && !h.includes('trade') && !h.includes('tradelist')
    )
  }

  const collection = new Map()

  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i])
    if (row.length <= nameCol) continue
    const rawName = row[nameCol]
    if (!rawName) continue

    const qty = qtyCol !== -1 ? (parseInt(row[qtyCol]) || 1) : 1

    const namesToIndex = [rawName]
    if (rawName.includes('//')) {
      namesToIndex.push(rawName.split('//')[0].trim())
    }

    for (const n of namesToIndex) {
      const key = normalizeName(n)
      collection.set(key, (collection.get(key) || 0) + qty)
    }
  }

  if (collection.size === 0) throw new Error('Aucune carte trouvée dans le fichier.')
  return collection
}

export function matchDeckToCollection(deckCards, collection) {
  const owned = new Set()
  for (const card of deckCards) {
    const queryNorm = normalizeName(card.queryName)
    const displayNorm = card.displayName ? normalizeName(card.displayName) : null
    const qty = collection.get(queryNorm) ?? collection.get(displayNorm) ?? 0
    if (qty > 0) owned.add(card.queryName)
  }
  return owned
}
