<template>
  <div class="columns-panel">
    <div
      v-for="group in visibleGroups"
      :key="group.category"
      class="col"
      :id="`cat-${group.category}`"
    >
      <div class="col-header">
        <span class="col-title">{{ group.label }}</span>
        <span class="col-meta tabular">{{ group.cards.length }} · {{ groupPrice(group) }}</span>
      </div>
      <div class="col-cards">
        <div
          v-for="card in group.cards"
          :key="card.queryName"
          class="col-card"
          :class="{ checked: checkedMap[card.queryName], commander: card.category === 'Commander' }"
          @click="$emit('toggle', card.queryName)"
        >
          <span class="col-qty tabular">{{ card.qty }}</span>
          <span class="col-name">{{ card.frName }}</span>
          <span v-if="card.price != null" class="col-price tabular">{{ formatPrice(card.price) }}</span>
        </div>
      </div>
    </div>
    <p v-if="visibleGroups.length === 0" class="empty-state">
      {{ search ? 'Aucune carte ne correspond à la recherche.' : 'Aucune carte dans cette vue.' }}
    </p>
  </div>
</template>

<script setup>
import { toRef } from 'vue'
import { useFilteredGroups } from '../composables/useFilteredGroups.js'

const props = defineProps({
  cards: Array,
  checkedMap: Object,
  filter: String,
  search: { type: String, default: '' },
  sort: { type: String, default: 'category' },
})

defineEmits(['toggle'])

const visibleGroups = useFilteredGroups({
  cards: toRef(props, 'cards'),
  checkedMap: toRef(props, 'checkedMap'),
  filter: toRef(props, 'filter'),
  search: toRef(props, 'search'),
  sort: toRef(props, 'sort'),
})

function formatPrice(price) {
  if (price === 0) return '< 0.01 €'
  return price.toFixed(2) + ' €'
}

function groupPrice(group) {
  const total = group.cards.reduce((sum, c) => sum + (c.price ?? 0) * c.qty, 0)
  return total > 0 ? total.toFixed(2) + ' €' : ''
}
</script>

<style scoped>
.columns-panel {
  display: flex;
  gap: 0;
  overflow-x: auto;
  padding-bottom: 40px;
  align-items: start;
  scrollbar-width: thin;
  scrollbar-color: var(--border) transparent;
}

.col {
  min-width: 175px;
  flex-shrink: 0;
  padding-right: 16px;
  margin-right: 16px;
  border-right: 1px solid var(--border);
}

.col:last-child {
  border-right: none;
  margin-right: 0;
  padding-right: 0;
}

.col-header {
  position: sticky;
  top: var(--header-height);
  background: var(--bg);
  padding: 6px 0 10px;
  z-index: 10;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 6px;
}

.col-title {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--text-2);
}

.col-meta {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-3);
  white-space: nowrap;
}

.col-cards {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.col-card {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background var(--transition-fast), opacity var(--transition-fast);
}

.col-card:hover { background: var(--surface-2); }
.col-card.checked { opacity: 0.38; }
.col-card.commander .col-name { color: var(--accent); font-weight: 600; }

.col-qty {
  flex-shrink: 0;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-3);
  width: 14px;
  text-align: right;
}

.col-name {
  flex: 1;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.col-price {
  flex-shrink: 0;
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-3);
}

.empty-state {
  padding: 48px 0;
  text-align: center;
  color: var(--text-3);
  font-size: 14px;
  width: 100%;
}
</style>
