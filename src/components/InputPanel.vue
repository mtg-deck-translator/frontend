<template>
  <section class="input-panel">
    <div class="mode-toggle" role="group" aria-label="Mode de saisie">
      <button
        class="mode-btn"
        :class="{ active: mode === 'url' }"
        :aria-pressed="mode === 'url'"
        @click="$emit('update:mode', 'url')"
      >
        URL (Archidekt / MTGTOP8)
      </button>
      <button
        class="mode-btn"
        :class="{ active: mode === 'paste' }"
        :aria-pressed="mode === 'paste'"
        @click="$emit('update:mode', 'paste')"
      >
        Coller une liste
      </button>
    </div>

    <div class="input-area">
      <input
        v-if="mode === 'url'"
        ref="urlRef"
        type="url"
        class="text-input"
        placeholder="archidekt.com/decks/… · moxfield.com/decks/… · mtgtop8.com/event?e=…&d=…"
        :value="url"
        :disabled="isLoading"
        @input="$emit('update:url', $event.target.value)"
        @keydown.enter="$emit('translate')"
      />

      <textarea
        v-else
        ref="pasteRef"
        class="text-input textarea"
        :value="paste"
        :disabled="isLoading"
        spellcheck="false"
        autocomplete="off"
        :placeholder="textareaPlaceholder"
        @input="$emit('update:paste', $event.target.value)"
        @keydown.ctrl.enter.prevent="$emit('translate')"
        @keydown.meta.enter.prevent="$emit('translate')"
      />
    </div>

    <div class="actions">
      <button
        class="translate-btn"
        :disabled="isLoading || isEmpty"
        @click="$emit('translate')"
      >
        <span v-if="status === 'fetching'" class="btn-spinner" aria-hidden="true"/>
        <span v-else-if="status === 'translating'" class="btn-spinner" aria-hidden="true"/>
        {{ buttonLabel }}
      </button>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  mode: String,
  url: String,
  paste: String,
  status: String,
})

defineEmits(['update:mode', 'update:url', 'update:paste', 'translate'])

const urlRef = ref(null)
const pasteRef = ref(null)

const isLoading = computed(() => props.status === 'fetching' || props.status === 'translating')

const isEmpty = computed(() => {
  if (props.mode === 'url') return !props.url?.trim()
  return !props.paste?.trim()
})

const buttonLabel = computed(() => {
  if (props.status === 'fetching') return 'Récupération...'
  if (props.status === 'translating') return 'Traduction...'
  return 'Traduire'
})

const textareaPlaceholder = `4 Island
1x Lightning Bolt
1x Frolicking Familiar // Blow Off Steam (woe) 226
// Les commentaires sont ignorés
1 Sol Ring`

// Ctrl/Cmd+K focuses the active input
function handleGlobalKey(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault()
    const el = props.mode === 'url' ? urlRef.value : pasteRef.value
    el?.focus()
  }
}

onMounted(() => document.addEventListener('keydown', handleGlobalKey))
onUnmounted(() => document.removeEventListener('keydown', handleGlobalKey))

// Auto-focus when switching modes
watch(() => props.mode, (mode) => {
  setTimeout(() => {
    if (mode === 'url') urlRef.value?.focus()
    else pasteRef.value?.focus()
  }, 50)
})
</script>

<style scoped>
.input-panel {
  padding: 32px 0 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mode-toggle {
  display: flex;
  gap: 2px;
  background: var(--surface-2);
  border-radius: var(--radius-lg);
  padding: 3px;
  width: fit-content;
}

.mode-btn {
  padding: 6px 14px;
  border-radius: calc(var(--radius-lg) - 2px);
  font-size: 13px;
  font-weight: 500;
  color: var(--text-2);
  transition: background var(--transition-fast), color var(--transition-fast);
}

.mode-btn.active {
  background: var(--surface);
  color: var(--text-1);
  box-shadow: var(--shadow-sm);
}

.text-input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  font-size: 14px;
  color: var(--text-1);
  outline: none;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.text-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-subtle);
}

.text-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.textarea {
  min-height: 160px;
  resize: vertical;
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.6;
}

.actions {
  display: flex;
  justify-content: flex-end;
}

.translate-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 20px;
  background: var(--accent);
  color: white;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 500;
  letter-spacing: -0.01em;
  transition: opacity var(--transition-fast), transform var(--transition-fast);
}

.translate-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.translate-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.translate-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
