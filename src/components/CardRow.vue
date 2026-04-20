<template>
  <div
    class="cr-row"
    :class="{ checked: isChecked, commander: isCommander, 'is-last': isLast }"
    @mouseenter="showPreview = true"
    @mouseleave="showPreview = false"
  >
    <button
      class="cr-check"
      role="checkbox"
      :aria-checked="isChecked"
      :aria-label="`${isChecked ? 'Retirer' : 'Marquer'} ${card.frName}`"
      @click="$emit('toggle', card.queryName)"
    >
      <svg v-if="isChecked" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path d="M2.5 6l3 3 4-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>

    <div class="cr-qty">{{ card.qty }}</div>

    <div class="cr-names">
      <span class="cr-fr">{{ card.frName }}</span>
      <span class="cr-en">{{ card.displayName }}</span>
    </div>

    <div class="cr-right">
      <span v-if="card.noFr" class="cr-badge-en">EN</span>
      <span v-if="card.price != null" class="cr-price">{{ formatPrice(card.price) }}</span>
    </div>

    <Teleport to="body">
      <Transition name="preview-fade">
        <div v-if="showPreview && card.imageUrl" class="card-preview" :style="previewStyle">
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
  isLast: { type: Boolean, default: false },
})
defineEmits(['toggle'])

function formatPrice(price) {
  if (price === 0) return '< 0.01 €'
  return price.toFixed(2) + ' €'
}

const isCommander = computed(() => props.card.category === 'Commander')
const showPreview = ref(false)
const mousePos = ref({ x: 0, y: 0 })

function onMouseMove(e) { mousePos.value = { x: e.clientX, y: e.clientY } }
onMounted(() => document.addEventListener('mousemove', onMouseMove))
onUnmounted(() => document.removeEventListener('mousemove', onMouseMove))

const PREVIEW_W = 220
const previewStyle = computed(() => {
  const { x, y } = mousePos.value
  const vw = window.innerWidth
  const vh = window.innerHeight
  const PREVIEW_H = 308
  let left = x + 16
  let top = y - PREVIEW_H / 2
  if (left + PREVIEW_W > vw - 16) left = x - PREVIEW_W - 16
  if (top < 8) top = 8
  if (top + PREVIEW_H > vh - 8) top = vh - PREVIEW_H - 8
  return { left: left + 'px', top: top + 'px' }
})
</script>

<style scoped>
.cr-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 13px 18px;
  border-left: 2px solid transparent;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  transition: background 150ms, border-left-color 150ms;
  cursor: default;
}

.cr-row.is-last { border-bottom: none; }

.cr-row.commander {
  padding: 17px 20px;
}

.cr-row:hover {
  background: rgba(255, 255, 255, 0.04);
  border-left-color: var(--cat-color, rgba(255, 255, 255, 0.2));
}

/* Checkbox */
.cr-check {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1.5px solid rgba(255, 255, 255, 0.18);
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  transition: background 150ms, border-color 150ms;
  cursor: pointer;
}

.cr-row.checked .cr-check {
  background: var(--cat-color, #10b981);
  border-color: var(--cat-color, #10b981);
}

/* Qty badge */
.cr-qty {
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.35);
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 9px;
}

/* Names */
.cr-names {
  flex: 1;
  display: flex;
  align-items: baseline;
  gap: 10px;
  min-width: 0;
  overflow: hidden;
}

.cr-fr {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.35);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 0;
  transition: color 150ms;
}

.cr-row.checked .cr-fr { color: #fff; }
.commander .cr-fr { font-size: 16px; font-weight: 700; }

.cr-en {
  font-size: 11px;
  font-style: italic;
  color: rgba(255, 255, 255, 0.18);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Right zone */
.cr-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  margin-left: auto;
}

.cr-price {
  font-family: var(--font-mono);
  font-size: 11px;
  color: rgba(255, 255, 255, 0.22);
  white-space: nowrap;
  transition: color 150ms;
}

.cr-row:hover .cr-price { color: var(--cat-color, rgba(255, 255, 255, 0.5)); }

.cr-badge-en {
  font-family: var(--font-mono);
  font-size: 8px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 1px 5px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
</style>

<style>
.card-preview {
  position: fixed;
  z-index: 9000;
  pointer-events: none;
  width: 220px;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.7);
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
