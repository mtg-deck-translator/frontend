<template>
  <div
    class="cr-row"
    :class="{ checked: isChecked, commander: isCommander }"
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
      <svg v-if="isChecked" width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
        <path d="M2 5l2.5 2.5 3.5-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>

    <span class="cr-qty">{{ card.qty }}x</span>

    <div class="cr-names">
      <span class="cr-fr">{{ card.frName }}</span>
      <span class="cr-sep">•</span>
      <span class="cr-en">{{ card.displayName }}</span>
    </div>

    <div class="cr-right">
      <span v-if="card.price != null" class="cr-price">{{ formatPrice(card.price) }}</span>
      <a
        v-if="!card.error"
        :href="cardmarketUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="cr-cm"
        title="Cardmarket"
        @click.stop
      >
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
          <path d="M5 2H2a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V7" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
          <path d="M8 1h3v3M11 1L6 6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </a>
    </div>

    <span v-if="card.noFr" class="cr-badge-en">EN</span>
    <span v-if="card.error" class="cr-badge-err">!</span>

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

const props = defineProps({ card: Object, isChecked: Boolean })
defineEmits(['toggle'])

function formatPrice(price) {
  if (price === 0) return '< 0.01 €'
  return price.toFixed(2) + ' €'
}

const cardmarketUrl = computed(() => {
  const name = encodeURIComponent(props.card.displayName)
  return `https://www.cardmarket.com/en/Magic/Products/Singles?searchString=${name}`
})

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
  gap: 10px;
  padding: 9px 14px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-left: 2px solid transparent;
  transition: background 150ms, border-left-color 150ms;
  cursor: default;
}

.cr-row:hover {
  background: rgba(255, 255, 255, 0.055);
  border-left-color: var(--cat-color, rgba(255, 255, 255, 0.2));
}

.cr-row.checked {
  opacity: 0.38;
}

/* Circular checkbox */
.cr-check {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
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
  font-family: var(--font-mono);
  font-size: 11px;
  background: rgba(255, 255, 255, 0.07);
  border-radius: 5px;
  padding: 2px 7px;
  color: rgba(255, 255, 255, 0.45);
}

/* Names */
.cr-names {
  flex: 1;
  display: flex;
  align-items: baseline;
  gap: 7px;
  min-width: 0;
  overflow: hidden;
}

.cr-fr {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
  flex-shrink: 0;
}

.commander .cr-fr { color: #fbbf24; }

.cr-sep {
  color: rgba(255, 255, 255, 0.15);
  font-size: 12px;
  flex-shrink: 0;
}

.cr-en {
  font-size: 12px;
  font-style: italic;
  color: rgba(255, 255, 255, 0.3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Right zone */
.cr-right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  margin-left: auto;
}

.cr-price {
  font-family: var(--font-mono);
  font-size: 12px;
  color: rgba(255, 255, 255, 0.35);
  white-space: nowrap;
}

.cr-cm {
  color: rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  opacity: 0;
  transition: opacity 150ms, color 150ms;
}

.cr-row:hover .cr-cm { opacity: 1; }
.cr-cm:hover { color: rgba(255, 255, 255, 0.6); }

/* Badges */
.cr-badge-en,
.cr-badge-err {
  flex-shrink: 0;
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 1px 5px;
  border-radius: 4px;
}

.cr-badge-en {
  background: rgba(255, 255, 255, 0.07);
  color: rgba(255, 255, 255, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.cr-badge-err {
  background: rgba(239, 68, 68, 0.12);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.2);
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
