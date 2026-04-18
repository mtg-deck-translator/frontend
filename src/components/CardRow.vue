<template>
  <div
    class="card-row"
    :class="{ checked: isChecked, commander: isCommander }"
    @mouseenter="showPreview = true"
    @mouseleave="showPreview = false"
  >
    <button
      class="checkbox"
      role="checkbox"
      :aria-checked="isChecked"
      :aria-label="`${isChecked ? 'Retirer' : 'Marquer'} ${card.frName} comme possédée`"
      @click="$emit('toggle', card.queryName)"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path
          class="check-path"
          d="M2 6l3 3 5-5"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
          :class="{ visible: isChecked }"
        />
      </svg>
    </button>

    <span class="qty tabular">{{ card.qty }}</span>

    <span class="fr-name">{{ card.frName }}</span>

    <span class="en-name" :class="{ strikethrough: isChecked }">{{ card.displayName }}</span>

    <span v-if="card.noFr" class="no-fr-badge">EN only</span>
    <span v-if="card.error" class="error-badge" title="Erreur Scryfall">!</span>

    <!-- Image preview on hover -->
    <Teleport to="body">
      <Transition name="preview-fade">
        <div
          v-if="showPreview && card.imageUrl"
          class="card-preview"
          :style="previewStyle"
        >
          <img :src="card.imageUrl" :alt="card.frName" />
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  card: Object,
  isChecked: Boolean,
})

defineEmits(['toggle'])

const isCommander = computed(() => props.card.category === 'Commander')

const showPreview = ref(false)
const mousePos = ref({ x: 0, y: 0 })

function onMouseMove(e) {
  mousePos.value = { x: e.clientX, y: e.clientY }
}

onMounted(() => document.addEventListener('mousemove', onMouseMove))
onUnmounted(() => document.removeEventListener('mousemove', onMouseMove))

const PREVIEW_W = 220

const previewStyle = computed(() => {
  const x = mousePos.value.x
  const y = mousePos.value.y
  const vw = window.innerWidth
  const vh = window.innerHeight
  const PREVIEW_H = 308 // approx card height at 220px wide

  let left = x + 16
  let top = y - PREVIEW_H / 2

  // Flip left if too close to right edge
  if (left + PREVIEW_W > vw - 16) {
    left = x - PREVIEW_W - 16
  }
  // Clamp vertically
  if (top < 8) top = 8
  if (top + PREVIEW_H > vh - 8) top = vh - PREVIEW_H - 8

  return { left: left + 'px', top: top + 'px' }
})
</script>

<style scoped>
.card-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 0;
  border-radius: var(--radius-sm);
  transition: opacity var(--transition-fast);
  min-height: 36px;
  position: relative;
}

.card-row.checked {
  opacity: 0.45;
}

.checkbox {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: var(--radius-sm);
  border: 1.5px solid var(--border-strong);
  background: var(--surface);
  color: white;
  transition: background var(--transition-fast), border-color var(--transition-fast);
  padding: 4px;
}

.card-row.checked .checkbox {
  background: var(--accent);
  border-color: var(--accent);
}

.check-path {
  stroke-dasharray: 14;
  stroke-dashoffset: 14;
  transition: stroke-dashoffset 200ms ease;
}

.check-path.visible {
  stroke-dashoffset: 0;
}

.qty {
  flex-shrink: 0;
  font-family: var(--font-mono);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: var(--text-3);
  width: 18px;
  text-align: right;
}

.fr-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
  flex-shrink: 1;
}

.commander .fr-name {
  color: var(--accent);
}

.en-name {
  flex: 1;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.en-name.strikethrough {
  text-decoration: line-through;
}

.no-fr-badge,
.error-badge {
  flex-shrink: 0;
  font-family: var(--font-mono);
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 1px 5px;
  border-radius: var(--radius-sm);
  font-weight: 600;
}

.no-fr-badge {
  background: var(--surface-2);
  color: var(--text-3);
  border: 1px solid var(--border);
}

.error-badge {
  background: rgba(239, 68, 68, 0.1);
  color: var(--error);
  border: 1px solid rgba(239, 68, 68, 0.2);
}

@media (max-width: 640px) {
  .checkbox { padding: 7px; }
}

/* Preview — teleported to body, so not scoped */
</style>

<style>
.card-preview {
  position: fixed;
  z-index: 9000;
  pointer-events: none;
  width: 220px;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.45);
}

.card-preview img {
  display: block;
  width: 100%;
  height: auto;
}

.preview-fade-enter-active,
.preview-fade-leave-active {
  transition: opacity 120ms ease, transform 120ms ease;
}

.preview-fade-enter-from,
.preview-fade-leave-to {
  opacity: 0;
  transform: scale(0.96);
}
</style>
