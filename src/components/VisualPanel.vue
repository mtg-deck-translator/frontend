<template>
  <div class="visual-layout">

    <!-- Grille principale -->
    <div class="visual-content">
      <div
        v-for="(group, i) in visibleGroups"
        :key="group.category"
        :id="`cat-${group.category}`"
        class="visual-group"
        :style="{ '--index': i }"
      >
        <div class="visual-header">
          <span class="visual-title">{{ group.label }}</span>
          <span class="visual-meta tabular">{{ group.cards.length }} cartes · {{ groupPrice(group) }}</span>
        </div>
        <div class="visual-grid">
          <div
            v-for="card in group.cards"
            :key="card.queryName"
            class="card-tile"
            :class="{ checked: checkedMap[card.queryName] }"
            @click="$emit('toggle', card.queryName)"
            @mouseenter="hoveredCard = card"
          >
            <div class="tile-img-wrap">
              <img
                v-if="card.imageUrl"
                :src="card.imageUrl"
                :alt="card.frName"
                loading="lazy"
                class="tile-img"
              />
              <div v-else class="tile-placeholder">
                <span>{{ card.frName }}</span>
              </div>
              <div class="tile-checked-overlay">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                  <path d="M4 11l5 5 9-9" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </div>
            <div class="tile-footer">
              <span class="tile-qty tabular">{{ card.qty }}×</span>
              <span class="tile-name">{{ card.frName }}</span>
              <span v-if="card.price != null" class="tile-price tabular">{{ formatPrice(card.price) }}</span>
            </div>
          </div>
        </div>
      </div>
      <p v-if="visibleGroups.length === 0" class="empty-state">
        {{ search ? 'Aucune carte ne correspond à la recherche.' : 'Aucune carte dans cette vue.' }}
      </p>
    </div>

    <!-- Panneau zoom à droite -->
    <div class="zoom-panel">
      <div v-if="hoveredCard" class="zoom-inner">
        <img
          v-if="hoveredCard.imageUrl"
          :src="hoveredCard.imageUrl"
          :alt="hoveredCard.frName"
          class="zoom-img"
        />
        <div v-else class="zoom-placeholder">
          <span>{{ hoveredCard.frName }}</span>
        </div>
        <div class="zoom-info">
          <span class="zoom-name">{{ hoveredCard.frName }}</span>
          <span v-if="hoveredCard.displayName !== hoveredCard.frName" class="zoom-en">{{ hoveredCard.displayName }}</span>
          <span v-if="hoveredCard.price != null" class="zoom-price tabular">{{ formatPrice(hoveredCard.price) }}</span>
        </div>
      </div>
      <div v-else class="zoom-empty">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <rect x="4" y="4" width="24" height="24" rx="4" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 3"/>
        </svg>
        <span>Survolez une carte</span>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, toRef } from 'vue'
import { useFilteredGroups } from '../composables/useFilteredGroups.js'

const props = defineProps({
  cards: Array,
  checkedMap: Object,
  filter: String,
  search: { type: String, default: '' },
  sort: { type: String, default: 'category' },
})

defineEmits(['toggle'])

const hoveredCard = ref(null)

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
.visual-layout {
  display: grid;
  grid-template-columns: 1fr 220px;
  gap: 24px;
  align-items: start;
}

.visual-content {
  min-width: 0;
  padding-bottom: 64px;
}

/* Zoom panel */
.zoom-panel {
  position: sticky;
  top: calc(var(--header-height) + 16px);
}

.zoom-inner {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.zoom-img {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
}

.zoom-placeholder {
  aspect-ratio: 488 / 680;
  background: var(--surface-2);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  font-size: 13px;
  color: var(--text-3);
  text-align: center;
}

.zoom-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 0 2px;
}

.zoom-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-1);
  line-height: 1.3;
}

.zoom-en {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-3);
}

.zoom-price {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--accent);
  font-weight: 600;
}

.zoom-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  aspect-ratio: 488 / 680;
  border-radius: 10px;
  border: 1.5px dashed var(--border);
  color: var(--text-3);
  font-size: 12px;
}

/* Card groups */
.visual-group {
  animation: fadeInUp 300ms ease both;
  animation-delay: calc(var(--index, 0) * 40ms);
  margin-bottom: 32px;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

.visual-header {
  position: sticky;
  top: var(--header-height);
  z-index: 10;
  background: var(--bg);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0 10px;
  margin-bottom: 10px;
}

.visual-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--text-2);
}

.visual-meta {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-3);
}

/* Card grid */
.visual-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 8px;
}

.card-tile {
  cursor: pointer;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1.5px solid var(--border);
  transition: border-color var(--transition-fast), transform var(--transition-fast), box-shadow var(--transition-fast);
}

.card-tile:hover {
  border-color: var(--border-strong);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.12);
}

.card-tile.checked {
  border-color: var(--accent);
  opacity: 0.55;
}

.tile-img-wrap {
  position: relative;
  aspect-ratio: 488 / 680;
  background: var(--surface-2);
  overflow: hidden;
}

.tile-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.tile-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 8px;
  font-size: 10px;
  color: var(--text-3);
  text-align: center;
  line-height: 1.4;
}

.tile-checked-overlay {
  position: absolute;
  inset: 0;
  background: rgba(79, 127, 255, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.card-tile.checked .tile-checked-overlay {
  opacity: 1;
}

.tile-footer {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 7px;
  background: var(--surface);
  border-top: 1px solid var(--border);
}

.tile-qty {
  flex-shrink: 0;
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-3);
}

.tile-name {
  flex: 1;
  font-size: 11px;
  font-weight: 500;
  color: var(--text-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.tile-price {
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
}

</style>
