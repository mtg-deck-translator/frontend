<template>
  <Teleport to="body">
    <Transition name="cm-panel">
      <div v-if="show" class="cm-overlay" @click.self="$emit('close')">
        <div class="cm-panel">
          <div class="cm-header">
            <div class="cm-title">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="5.5" cy="13" r="1.2" fill="currentColor"/>
                <circle cx="11.5" cy="13" r="1.2" fill="currentColor"/>
                <path d="M1 1h2.5l1.8 7h7L14 4.5H5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              {{ cards.length }} carte(s) à trouver
            </div>
            <button class="cm-close" @click="$emit('close')" aria-label="Fermer">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <div class="cm-list">
            <pre class="cm-text">{{ listText }}</pre>
          </div>

          <p class="cm-hint">
            Liste copiée dans le presse-papier. Sur Cardmarket, ouvre une Wantlist → "Add from list" et colle.
          </p>

          <div class="cm-actions">
            <button class="cm-btn cm-btn--secondary" @click="copyAgain">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="4" y="4" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.3"/>
                <path d="M2 10V3a1 1 0 0 1 1-1h7" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
              </svg>
              {{ copied ? 'Copié !' : 'Copier à nouveau' }}
            </button>
            <a
              :href="cardmarketUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="cm-btn cm-btn--primary"
              @click="$emit('close')"
            >
              Ouvrir Cardmarket
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M5 2H2a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V7" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
                <path d="M8 1h3v3M11 1L6 6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  show: Boolean,
  cards: Array,
  lang: String,
})

defineEmits(['close'])

const copied = ref(false)
const CM_LANG_MAP = { fr: 'fr', de: 'de', it: 'it', es: 'es', pt: 'pt' }

const listText = computed(() =>
  props.cards.map(c => `${c.qty} ${c.displayName}`).join('\n')
)

const cardmarketUrl = computed(() => {
  const cmLang = CM_LANG_MAP[props.lang] || 'en'
  return `https://www.cardmarket.com/${cmLang}/Magic/Wants`
})

watch(() => props.show, (val) => {
  if (val) copied.value = false
})

async function copyAgain() {
  try {
    await navigator.clipboard.writeText(listText.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {}
}
</script>

<style scoped>
.cm-overlay {
  position: fixed;
  inset: 0;
  z-index: 500;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 16px;
}

@media (min-width: 640px) {
  .cm-overlay {
    align-items: center;
  }
}

.cm-panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg, 0 24px 64px rgba(0,0,0,0.4));
  width: 100%;
  max-width: 480px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.cm-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-1);
}

.cm-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-md);
  color: var(--text-3);
  transition: background var(--transition-fast), color var(--transition-fast);
}

.cm-close:hover {
  background: var(--surface-2);
  color: var(--text-1);
}

.cm-list {
  max-height: 200px;
  overflow-y: auto;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 10px 12px;
}

.cm-text {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-2);
  white-space: pre-wrap;
  margin: 0;
  line-height: 1.7;
}

.cm-hint {
  font-size: 12px;
  color: var(--text-3);
  line-height: 1.6;
}

.cm-actions {
  display: flex;
  gap: 8px;
}

.cm-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 9px 16px;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 500;
  transition: background var(--transition-fast), color var(--transition-fast);
  flex: 1;
}

.cm-btn--secondary {
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-2);
}

.cm-btn--secondary:hover {
  background: var(--surface-2);
  color: var(--text-1);
}

.cm-btn--primary {
  background: var(--accent);
  color: white;
  text-decoration: none;
}

.cm-btn--primary:hover {
  opacity: 0.9;
}

.cm-panel-enter-active,
.cm-panel-leave-active {
  transition: opacity 200ms ease;
}

.cm-panel-enter-active .cm-panel,
.cm-panel-leave-active .cm-panel {
  transition: transform 200ms ease, opacity 200ms ease;
}

.cm-panel-enter-from,
.cm-panel-leave-to {
  opacity: 0;
}

.cm-panel-enter-from .cm-panel,
.cm-panel-leave-to .cm-panel {
  transform: translateY(16px);
  opacity: 0;
}
</style>
