<template>
  <div class="cat-group" :style="{ '--cat-color': catColor }" :id="`cat-${category}`">
    <div class="cat-head">
      <div class="cat-head-left">
        <svg class="cat-spark" width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
          <path d="M6 1l1.2 3.5H11l-3 2.1 1.1 3.4L6 8l-3.1 2 1.1-3.4L1 4.5h3.8z"/>
        </svg>
        <span class="cat-label">{{ categoryFr }}</span>
      </div>
      <div class="cat-head-right">
        <span class="cat-count">{{ ownedCount }}/{{ totalCount }} possédées</span>
        <button class="cat-toggle" @click="handleToggleAll">
          {{ allOwned ? 'Tout décocher' : 'Tout cocher' }}
        </button>
      </div>
    </div>
    <div class="cat-progress-track">
      <div class="cat-progress-fill" :style="{ width: pct + '%' }" />
    </div>

    <div class="cat-cards">
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
  Commander: 'Commandant', Creature: 'Créatures', Instant: 'Éphémères',
  Sorcery: 'Rituels', Artifact: 'Artefacts', Enchantment: 'Enchantements',
  Planeswalker: 'Planeswalkers', Land: 'Terrains', Other: 'Autre', Maybeboard: 'Maybeboard',
}

const CATEGORY_COLORS = {
  Commander: '#f59e0b', Creature: '#10b981', Instant: '#3b82f6',
  Sorcery: '#8b5cf6', Artifact: '#a1a1aa', Enchantment: '#f472b6',
  Planeswalker: '#a855f7', Land: '#a16207', Other: '#6b7280', Maybeboard: '#64748b',
}

const props = defineProps({
  category: String,
  cards: Array,
  checkedMap: Object,
  index: Number,
})

const emit = defineEmits(['toggle', 'set-all'])

const categoryFr = computed(() => CATEGORY_FR[props.category] || props.category)
const catColor = computed(() => CATEGORY_COLORS[props.category] || '#6b7280')
const cardKeys = computed(() => props.cards.map(c => c.queryName))
const ownedCount = computed(() => props.cards.filter(c => props.checkedMap[c.queryName]).length)
const totalCount = computed(() => props.cards.length)
const pct = computed(() => totalCount.value ? Math.round(ownedCount.value / totalCount.value * 100) : 0)
const allOwned = computed(() => ownedCount.value === totalCount.value && totalCount.value > 0)

function handleToggleAll() {
  emit('set-all', cardKeys.value, !allOwned.value)
}
</script>

<style scoped>
.cat-group {
  margin-bottom: 32px;
  animation: fadeUp 280ms ease both;
  animation-delay: calc(var(--index, 0) * 35ms);
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

.cat-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 10;
  background: #060611;
  padding: 12px 0 8px;
  margin-bottom: 2px;
}

.cat-head-left {
  display: flex;
  align-items: center;
  gap: 7px;
}

.cat-spark {
  color: var(--cat-color);
  flex-shrink: 0;
}

.cat-label {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--cat-color);
}

.cat-head-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cat-count {
  font-family: var(--font-mono);
  font-size: 11px;
  color: rgba(255, 255, 255, 0.3);
}

.cat-toggle {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.25);
  transition: color 150ms;
}

.cat-toggle:hover { color: rgba(255, 255, 255, 0.65); }

.cat-progress-track {
  height: 1px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 9999px;
  overflow: hidden;
  margin-bottom: 10px;
}

.cat-progress-fill {
  height: 100%;
  background: var(--cat-color);
  border-radius: 9999px;
  opacity: 0.6;
  transition: width 400ms ease;
}

.cat-cards {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
</style>
