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
        <span class="cat-count">{{ ownedCount }}/{{ totalCount }}</span>
        <button class="cat-toggle" @click="handleToggleAll">
          {{ allOwned ? 'Décocher' : 'Tout cocher' }}
        </button>
      </div>
    </div>

    <div class="cat-cards">
      <CardRow
        v-for="(card, idx) in cards"
        :key="card.queryName"
        :card="card"
        :is-checked="!!checkedMap[card.queryName]"
        :is-last="idx === cards.length - 1"
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
const allOwned = computed(() => ownedCount.value === totalCount.value && totalCount.value > 0)

function handleToggleAll() {
  emit('set-all', cardKeys.value, !allOwned.value)
}
</script>

<style scoped>
.cat-group {
  margin-bottom: 28px;
  animation: fadeUp 280ms ease both;
  animation-delay: calc(var(--index, 0) * 35ms);
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Section header */
.cat-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
  margin-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
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
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--cat-color);
}

.cat-head-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.cat-count {
  font-family: var(--font-mono);
  font-size: 10px;
  color: rgba(255, 255, 255, 0.2);
}

.cat-toggle {
  font-size: 10px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.18);
  letter-spacing: 0.02em;
  transition: color 150ms;
}

.cat-toggle:hover { color: rgba(255, 255, 255, 0.55); }

/* Cards container — glassmorphism card */
.cat-cards {
  background: rgba(24, 24, 27, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 20px;
  overflow: hidden;
  backdrop-filter: blur(20px);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.25);
}
</style>
