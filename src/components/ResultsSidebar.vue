<template>
  <aside class="results-sidebar">

    <!-- Search -->
    <div class="search-wrap">
      <svg class="search-icon" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <circle cx="6" cy="6" r="4" stroke="currentColor" stroke-width="1.3"/>
        <path d="M9.5 9.5l2.5 2.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
      </svg>
      <input
        class="search-input"
        :value="search"
        placeholder="Rechercher..."
        @input="$emit('update:search', $event.target.value)"
      />
      <button v-if="search" class="search-clear" @click="$emit('update:search', '')" aria-label="Effacer">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
        </svg>
      </button>
    </div>

    <!-- Filter tabs -->
    <div class="filter-group">
      <button
        v-for="tab in FILTER_TABS"
        :key="tab.value"
        class="filter-btn"
        :class="{ active: filter === tab.value }"
        @click="$emit('update:filter', tab.value)"
      >
        {{ tab.label }}
        <span class="filter-count tabular">{{ counts[tab.value] }}</span>
      </button>
    </div>

    <!-- Sort -->
    <div class="sort-group">
      <button
        class="sort-btn"
        :class="{ active: sort === 'category' }"
        @click="$emit('update:sort', 'category')"
      >Par type</button>
      <button
        class="sort-btn"
        :class="{ active: sort === 'price' }"
        @click="$emit('update:sort', 'price')"
      >Par prix</button>
    </div>

    <!-- Ownership -->
    <div class="ownership-wrap">
      <div class="ownership-bar-track">
        <div class="ownership-bar-fill" :style="{ width: ownedPct + '%' }" />
      </div>
      <span class="ownership-label tabular">{{ ownedCount }}/{{ totalCount }} possédées</span>
    </div>

    <div class="divider" />

    <!-- Category TOC -->
    <nav class="cat-nav" aria-label="Aller à la catégorie">
      <button
        v-for="group in categoryGroups"
        :key="group.category"
        class="cat-link"
        @click="scrollToCategory(group.category)"
      >
        <span class="cat-name">{{ group.label }}</span>
        <span class="cat-progress tabular">{{ group.owned }}/{{ group.total }}</span>
      </button>
    </nav>

  </aside>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  search: String,
  sort: String,
  filter: String,
  counts: Object,
  ownedCount: Number,
  totalCount: Number,
  categoryGroups: Array,
})

defineEmits(['update:search', 'update:sort', 'update:filter'])

const FILTER_TABS = [
  { value: 'all', label: 'Tout' },
  { value: 'missing', label: 'À trouver' },
  { value: 'owned', label: 'Possédées' },
]

const ownedPct = computed(() =>
  props.totalCount ? Math.round(props.ownedCount / props.totalCount * 100) : 0
)

function scrollToCategory(category) {
  const el = document.getElementById(`cat-${category}`)
  if (!el) return
  const headerH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-height')) || 56
  const top = el.getBoundingClientRect().top + window.scrollY - headerH - 8
  window.scrollTo({ top, behavior: 'smooth' })
}
</script>

<style scoped>
.results-sidebar {
  position: sticky;
  top: calc(var(--header-height) + 16px);
  max-height: calc(100vh - var(--header-height) - 32px);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 24px;
}

/* Search */
.search-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 0 10px;
  height: 36px;
  transition: border-color var(--transition-fast);
}

.search-wrap:focus-within {
  border-color: var(--accent);
}

.search-icon { color: var(--text-3); flex-shrink: 0; }

.search-input {
  flex: 1;
  background: transparent;
  font-size: 13px;
  color: var(--text-1);
  min-width: 0;
}

.search-input::placeholder { color: var(--text-3); }

.search-clear {
  flex-shrink: 0;
  color: var(--text-3);
  display: flex;
  align-items: center;
  transition: color var(--transition-fast);
}

.search-clear:hover { color: var(--text-1); }

/* Filter */
.filter-group {
  display: flex;
  flex-direction: column;
  gap: 1px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  overflow: hidden;
  padding: 3px;
  gap: 2px;
}

.filter-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  border-radius: calc(var(--radius-md) - 2px);
  font-size: 12px;
  font-weight: 500;
  color: var(--text-2);
  transition: background var(--transition-fast), color var(--transition-fast);
}

.filter-btn:hover { background: var(--surface-2); color: var(--text-1); }
.filter-btn.active { background: var(--surface-2); color: var(--text-1); }
.filter-btn.active .filter-count { color: var(--accent); }

.filter-count {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-3);
}

/* Sort */
.sort-group {
  display: flex;
  gap: 4px;
}

.sort-btn {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: 11px;
  font-weight: 500;
  color: var(--text-3);
  background: var(--surface);
  transition: all var(--transition-fast);
  text-align: center;
}

.sort-btn:hover { color: var(--text-1); border-color: var(--border-strong); }
.sort-btn.active { background: var(--accent-subtle); color: var(--accent); border-color: var(--accent); }

/* Ownership */
.ownership-wrap {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.ownership-bar-track {
  height: 4px;
  background: var(--border);
  border-radius: 9999px;
  overflow: hidden;
}

.ownership-bar-fill {
  height: 100%;
  background: var(--success, #22c55e);
  border-radius: 9999px;
  transition: width var(--transition-slow, 400ms ease);
}

.ownership-label {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-3);
}

.divider {
  height: 1px;
  background: var(--border);
  margin: 4px 0;
}

/* Category TOC */
.cat-nav {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.cat-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 8px;
  border-radius: var(--radius-md);
  font-size: 12px;
  color: var(--text-2);
  text-align: left;
  transition: background var(--transition-fast), color var(--transition-fast);
  cursor: pointer;
}

.cat-link:hover {
  background: var(--surface-2);
  color: var(--text-1);
}

.cat-name {
  font-weight: 500;
}

.cat-progress {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-3);
}
</style>
