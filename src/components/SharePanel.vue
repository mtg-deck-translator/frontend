<template>
  <Teleport to="body">
    <Transition name="cm-panel">
      <div v-if="show" class="cm-overlay" @click.self="$emit('close')">
        <div class="cm-panel">
          <div class="cm-header">
            <div class="cm-title">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="12" cy="3" r="1.8" stroke="currentColor" stroke-width="1.4"/>
                <circle cx="12" cy="13" r="1.8" stroke="currentColor" stroke-width="1.4"/>
                <circle cx="4" cy="8" r="1.8" stroke="currentColor" stroke-width="1.4"/>
                <path d="M5.7 7.1l4.6-2.8M5.7 8.9l4.6 2.8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
              </svg>
              Partager ce deck
            </div>
            <button class="cm-close" @click="$emit('close')" aria-label="Fermer">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <div v-if="loading" class="share-loading">
            Génération du lien...
          </div>

          <template v-else-if="shareUrl">
            <div class="share-url-row">
              <input class="share-url-input" :value="shareUrl" readonly @click="$event.target.select()" />
              <button class="share-copy-btn" @click="copyUrl">
                {{ copied ? '✓' : 'Copier' }}
              </button>
            </div>
            <p class="cm-hint">
              Toute personne avec ce lien peut voir le deck traduit. Le lien reste valide tant que le backend tourne.
            </p>
          </template>

          <div v-else-if="error" class="share-error">{{ error }}</div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  show: Boolean,
  deckName: String,
  cards: Array,
  lang: String,
})

defineEmits(['close'])

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

const loading = ref(false)
const shareUrl = ref(null)
const error = ref(null)
const copied = ref(false)

watch(() => props.show, async (val) => {
  if (!val) return
  shareUrl.value = null
  error.value = null
  copied.value = false
  loading.value = true

  try {
    const resp = await fetch(`${BACKEND}/api/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deckName: props.deckName,
        cards: props.cards,
        lang: props.lang,
      }),
    })
    const data = await resp.json()
    if (!resp.ok) throw new Error(data.error || 'Erreur serveur')
    shareUrl.value = `${window.location.origin}/?deck=${data.id}`
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
})

async function copyUrl() {
  try {
    await navigator.clipboard.writeText(shareUrl.value)
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
  .cm-overlay { align-items: center; }
}

.cm-panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: 0 24px 64px rgba(0,0,0,0.4);
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

.share-loading {
  font-size: 13px;
  color: var(--text-3);
  text-align: center;
  padding: 12px 0;
}

.share-url-row {
  display: flex;
  gap: 8px;
}

.share-url-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg);
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-1);
  min-width: 0;
}

.share-copy-btn {
  flex-shrink: 0;
  padding: 8px 16px;
  background: var(--accent);
  color: white;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 500;
  transition: opacity var(--transition-fast);
}

.share-copy-btn:hover { opacity: 0.9; }

.cm-hint {
  font-size: 12px;
  color: var(--text-3);
  line-height: 1.6;
}

.share-error {
  font-size: 13px;
  color: var(--error);
}

.cm-panel-enter-active, .cm-panel-leave-active { transition: opacity 200ms ease; }
.cm-panel-enter-from, .cm-panel-leave-to { opacity: 0; }
</style>
