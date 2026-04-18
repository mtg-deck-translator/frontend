<template>
  <div class="results-panel">
    <CategoryGroup
      v-for="(group, i) in visibleGroups"
      :key="group.category"
      :category="group.category"
      :cards="group.cards"
      :checked-map="checkedMap"
      :index="i"
      @toggle="$emit('toggle', $event)"
      @set-all="$emit('set-all', $event[0], $event[1])"
    />

    <p v-if="visibleGroups.length === 0" class="empty-state">
      {{ search ? 'Aucune carte ne correspond à la recherche.' : 'Aucune carte dans cette vue.' }}
    </p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import CategoryGroup from './CategoryGroup.vue'

const CATEGORY_ORDER = ['Commander', 'Creature', 'Instant', 'Sorcery', 'Artifact', 'Enchantment', 'Planeswalker', 'Land', 'Other', 'Maybeboard']

const props = defineProps({
  cards: Array,
  checkedMap: Object,
  filter: String,
  search: { type: String, default: '' },
  sort: { type: String, default: 'category' },
})

defineEmits(['toggle', 'set-all'])

const filteredCards = computed(() => {
  let list = props.cards

  if (props.filter === 'missing') list = list.filter(c => !props.checkedMap[c.queryName])
  else if (props.filter === 'owned') list = list.filter(c => !!props.checkedMap[c.queryName])

  if (props.search) {
    const q = props.search.toLowerCase()
    list = list.filter(c =>
      c.frName?.toLowerCase().includes(q) ||
      c.displayName?.toLowerCase().includes(q)
    )
  }

  return list
})

const visibleGroups = computed(() => {
  const groups = {}
  for (const card of filteredCards.value) {
    const cat = card.category || 'Other'
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(card)
  }

  return CATEGORY_ORDER
    .filter(cat => groups[cat]?.length)
    .map(cat => {
      const cards = groups[cat].slice()
      if (props.sort === 'price') {
        cards.sort((a, b) => (b.price ?? -1) - (a.price ?? -1))
      } else {
        cards.sort((a, b) => a.frName.localeCompare(b.frName, 'fr'))
      }
      return { category: cat, cards }
    })
})
</script>

<style scoped>
.results-panel {
  padding-bottom: 64px;
}

.empty-state {
  padding: 48px 0;
  text-align: center;
  color: var(--text-3);
  font-size: 14px;
}
</style>
