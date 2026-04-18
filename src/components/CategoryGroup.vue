<template>
  <div class="category-group" :style="{ '--index': index }">
    <div class="category-header">
      <div class="header-top">
        <h2 class="category-title">{{ categoryFr }}</h2>
        <div class="header-right">
          <span class="category-count tabular">{{ ownedCount }}/{{ totalCount }}</span>
          <button
            class="toggle-all-btn"
            :title="allOwned ? 'Tout décocher' : 'Tout cocher'"
            @click="handleToggleAll"
          >
            {{ allOwned ? 'Décocher tout' : 'Cocher tout' }}
          </button>
        </div>
      </div>
      <div class="category-progress-track">
        <div class="category-progress-fill" :style="{ width: pct + '%' }" />
      </div>
    </div>

    <div class="cards-list">
      <CardRow
        v-for="card in cards"
        :key="card.queryName"
        :card="card"
        :is-checked="!!checkedMap[card.queryName]"
        @toggle="$emit('toggle', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import CardRow from './CardRow.vue'

const CATEGORY_FR = {
  Commander: 'Commandant',
  Creature: 'Créature',
  Instant: 'Éphémère',
  Sorcery: 'Rituel',
  Artifact: 'Artefact',
  Enchantment: 'Enchantement',
  Planeswalker: 'Planeswalker',
  Land: 'Terrain',
  Other: 'Autre',
  Maybeboard: 'Maybeboard',
}

const props = defineProps({
  category: String,
  cards: Array,
  checkedMap: Object,
  index: Number,
})

const emit = defineEmits(['toggle', 'set-all'])

const categoryFr = computed(() => CATEGORY_FR[props.category] || props.category)

const cardKeys = computed(() => props.cards.map(c => c.queryName))

const ownedCount = computed(() =>
  props.cards.filter(c => props.checkedMap[c.queryName]).length
)

const totalCount = computed(() => props.cards.length)

const pct = computed(() => totalCount.value ? Math.round(ownedCount.value / totalCount.value * 100) : 0)

const allOwned = computed(() => ownedCount.value === totalCount.value && totalCount.value > 0)

function handleToggleAll() {
  emit('set-all', cardKeys.value, !allOwned.value)
}
</script>

<style scoped>
.category-group {
  animation: fadeInUp 300ms ease both;
  animation-delay: calc(var(--index, 0) * 40ms);
  margin-bottom: 24px;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

.category-header {
  position: sticky;
  top: var(--header-height);
  z-index: 10;
  background: var(--bg);
  padding: 8px 0 4px;
  margin-bottom: 4px;
}

.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.category-title {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--text-2);
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 0.06em;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.category-count {
  font-family: var(--font-mono);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: var(--text-3);
}

.toggle-all-btn {
  font-size: 11px;
  color: var(--text-3);
  transition: color var(--transition-fast);
}

.toggle-all-btn:hover {
  color: var(--accent);
}

.category-progress-track {
  height: 2px;
  background: var(--border);
  border-radius: 9999px;
  overflow: hidden;
}

.category-progress-fill {
  height: 100%;
  background: var(--success);
  border-radius: 9999px;
  transition: width var(--transition-slow);
}

.cards-list {
  padding: 2px 0;
}
</style>
