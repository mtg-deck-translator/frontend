<template>
  <div class="filter-tabs" role="tablist" aria-label="Filtrer les cartes">
    <button
      v-for="tab in tabs"
      :key="tab.value"
      class="tab-btn"
      :class="{ active: modelValue === tab.value }"
      role="tab"
      :aria-selected="modelValue === tab.value"
      @click="$emit('update:modelValue', tab.value)"
    >
      {{ tab.label }}
      <span class="tab-count tabular">{{ counts[tab.value] }}</span>
    </button>
  </div>
</template>

<script setup>
defineProps({
  modelValue: String,
  counts: Object,
})

defineEmits(['update:modelValue'])

const tabs = [
  { value: 'all', label: 'Tout' },
  { value: 'missing', label: 'À trouver' },
  { value: 'owned', label: 'Possédées' },
]
</script>

<style scoped>
.filter-tabs {
  display: flex;
  gap: 2px;
  background: var(--surface-2);
  border-radius: var(--radius-lg);
  padding: 3px;
  width: fit-content;
  margin-bottom: 16px;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: calc(var(--radius-lg) - 2px);
  font-size: 13px;
  font-weight: 500;
  color: var(--text-2);
  transition: background var(--transition-fast), color var(--transition-fast);
}

.tab-btn.active {
  background: var(--surface);
  color: var(--text-1);
  box-shadow: var(--shadow-sm);
}

.tab-count {
  font-variant-numeric: tabular-nums;
  font-size: 11px;
  color: var(--text-3);
  font-family: var(--font-mono);
}

.tab-btn.active .tab-count {
  color: var(--accent);
}
</style>
