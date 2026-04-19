import { computed } from 'vue'

const CATEGORY_ORDER = ['Commander', 'Creature', 'Instant', 'Sorcery', 'Artifact', 'Enchantment', 'Planeswalker', 'Land', 'Other', 'Maybeboard']
const CATEGORY_FR = {
  Commander: 'Commandant', Creature: 'Créature', Instant: 'Éphémère',
  Sorcery: 'Rituel', Artifact: 'Artefact', Enchantment: 'Enchantement',
  Planeswalker: 'Planeswalker', Land: 'Terrain', Other: 'Autre', Maybeboard: 'Maybeboard',
}

export function useFilteredGroups({ cards, checkedMap, filter, search, sort }) {
  return computed(() => {
    let list = cards.value

    if (filter.value === 'missing') list = list.filter(c => !checkedMap.value[c.queryName])
    else if (filter.value === 'owned') list = list.filter(c => !!checkedMap.value[c.queryName])

    if (search.value) {
      const q = search.value.toLowerCase()
      list = list.filter(c =>
        c.frName?.toLowerCase().includes(q) ||
        c.displayName?.toLowerCase().includes(q)
      )
    }

    const groups = {}
    for (const card of list) {
      const cat = card.category || 'Other'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(card)
    }

    return CATEGORY_ORDER
      .filter(cat => groups[cat]?.length)
      .map(cat => {
        const sorted = groups[cat].slice()
        if (sort.value === 'price') {
          sorted.sort((a, b) => (b.price ?? -1) - (a.price ?? -1))
        } else {
          sorted.sort((a, b) => a.frName.localeCompare(b.frName, 'fr'))
        }
        return { category: cat, label: CATEGORY_FR[cat] || cat, cards: sorted }
      })
  })
}
