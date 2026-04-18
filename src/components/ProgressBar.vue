<template>
  <div class="progress-wrap" :class="variant">
    <div v-if="showLabel" class="progress-label">
      <span>{{ label }}</span>
      <span class="progress-count tabular">{{ progress.current }} / {{ progress.total }}</span>
    </div>
    <div class="progress-track">
      <div class="progress-fill" :style="{ width: pct + '%' }" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  progress: { type: Object, required: true },
  variant: { type: String, default: 'translation' },
  showLabel: { type: Boolean, default: true },
})

const pct = computed(() => {
  if (!props.progress.total) return 0
  return Math.round((props.progress.current / props.progress.total) * 100)
})

const label = computed(() => {
  if (props.variant === 'ownership') return 'Cartes possédées'
  return 'Cartes traduites'
})
</script>

<style scoped>
.progress-wrap {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-2);
}

.progress-count {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
}

.progress-track {
  height: 4px;
  background: var(--border);
  border-radius: 9999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--accent);
  border-radius: 9999px;
  transition: width var(--transition-slow);
}

.ownership .progress-fill {
  background: var(--success);
}

.translation {
  padding: 12px 0;
}
</style>
