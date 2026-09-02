import { computed } from 'vue'
import { categoryLabel, orderCategories } from '../constants/categories.js'

export function useFilteredGroups({ cards, checkedMap, filter, search, sort }) {
  return computed(() => {
    let list = cards.value

    if (filter.value === 'missing') list = list.filter(c => !checkedMap.value[c.queryName])
    else if (filter.value === 'owned') list = list.filter(c => !!checkedMap.value[c.queryName])
    else if (filter.value === 'nofr') list = list.filter(c => c.noFr && !c.error)

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

    // orderCategories ne perd aucune catégorie : les personnalisées (Archidekt)
    // sont réordonnées, jamais écartées.
    return orderCategories(Object.keys(groups))
      .map(cat => {
        const sorted = groups[cat].slice()
        if (sort.value === 'price') {
          sorted.sort((a, b) => (b.price ?? -1) - (a.price ?? -1))
        } else {
          sorted.sort((a, b) => a.frName.localeCompare(b.frName, 'fr'))
        }
        return { category: cat, label: categoryLabel(cat, { plural: true }), cards: sorted }
      })
  })
}
