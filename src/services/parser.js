const CARD_REGEX = /^(\d+)x?\s+(.+?)(?:\s+\([\w\d]+\)(?:\s+\d+)?(?:\s+\[.*?\])?)?$/

const SIDEBOARD_MARKERS = /^(sideboard|maybeboard|sb:|Sideboard:|Maybeboard:)/i

const CATEGORY_ORDER = ['Commander', 'Creature', 'Instant', 'Sorcery', 'Artifact', 'Enchantment', 'Planeswalker', 'Land', 'Other']

export function parsePastedList(text) {
  const lines = text.split('\n')
  const cards = []
  const unparseableLines = []
  let isSideboard = false

  for (let line of lines) {
    line = line.trim()

    if (!line) continue

    // Sideboard marker
    if (SIDEBOARD_MARKERS.test(line)) {
      isSideboard = true
      continue
    }

    // Comment line: starts with // but NOT a card quantity line
    // A card line starts with a digit, so pure // comments naturally fail the regex below
    // But we explicitly skip lines starting with // that have no leading digit
    if (line.startsWith('//') && !/^\d/.test(line)) continue

    const match = line.match(CARD_REGEX)
    if (!match) {
      unparseableLines.push(line)
      continue
    }

    const qty = parseInt(match[1], 10)
    let rawName = match[2].trim()

    // Remove trailing set/collector info that wasn't caught by regex
    // e.g. "Lightning Bolt (m10) 155 [Instant]" -> keep only "Lightning Bolt"
    rawName = rawName.replace(/\s+\([\w\d]+\).*$/, '').trim()

    let queryName, displayName

    if (rawName.includes(' // ')) {
      const parts = rawName.split(' // ')
      queryName = parts[0].trim()
      displayName = rawName
    } else {
      queryName = rawName
      displayName = rawName
    }

    cards.push({ queryName, displayName, qty, category: null, isSideboard })
  }

  return { cards, unparseableLines }
}

export { CATEGORY_ORDER }
