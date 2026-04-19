<template>
  <div class="glass-input" :class="{ 'paste-mode': mode === 'paste' }">

    <!-- Barre principale : toggle + input/placeholder + bouton -->
    <div class="glass-bar">

      <div class="glass-toggle" role="group">
        <button
          class="gt-btn"
          :class="{ active: mode === 'url' }"
          :aria-pressed="mode === 'url'"
          @click="$emit('update:mode', 'url')"
        >URL</button>
        <button
          class="gt-btn"
          :class="{ active: mode === 'paste' }"
          :aria-pressed="mode === 'paste'"
          @click="$emit('update:mode', 'paste')"
        >{{ labels.mode_paste_short || 'Liste' }}</button>
      </div>

      <!-- Champ URL -->
      <div v-if="mode === 'url'" class="glass-field">
        <svg class="glass-icon" width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
          <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" stroke-width="1.3"/>
          <path d="M10 10l3.5 3.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
        </svg>
        <input
          ref="urlRef"
          type="url"
          class="glass-url"
          placeholder="https://archidekt.com/decks/…"
          :value="url"
          :disabled="isLoading"
          @input="$emit('update:url', $event.target.value)"
          @keydown.enter="$emit('translate')"
        />
      </div>

      <!-- Placeholder paste mode dans la barre -->
      <div v-else class="glass-field glass-field-muted">
        <svg class="glass-icon" width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
          <path d="M2.5 4h10M2.5 7.5h7M2.5 11h5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
        </svg>
        <span class="glass-paste-hint">{{ paste ? paste.split('\n')[0] + '…' : (labels.paste_hint || 'Collez votre liste ci-dessous…') }}</span>
      </div>

      <button
        class="glass-btn"
        :disabled="isLoading || isEmpty"
        @click="$emit('translate')"
      >
        <span v-if="isLoading" class="btn-spinner" aria-hidden="true"/>
        {{ buttonLabel }}
      </button>
    </div>

    <!-- Zone textarea (paste mode) -->
    <div v-if="mode === 'paste'" class="glass-paste-area">
      <textarea
        ref="pasteRef"
        class="glass-textarea"
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

  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  mode: String,
  url: String,
  paste: String,
  status: String,
  labels: { type: Object, default: () => ({}) },
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
  if (props.status === 'fetching') return props.labels.btn_fetching || 'Récupération…'
  if (props.status === 'translating') return props.labels.btn_translating || 'Traduction…'
  return props.labels.btn_translate || 'Traduire'
})

const textareaPlaceholder = `4 Island
1x Lightning Bolt
1x Frolicking Familiar // Blow Off Steam
// Les commentaires sont ignorés
1 Sol Ring`

function handleGlobalKey(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault()
    const el = props.mode === 'url' ? urlRef.value : pasteRef.value
    el?.focus()
  }
}

onMounted(() => document.addEventListener('keydown', handleGlobalKey))
onUnmounted(() => document.removeEventListener('keydown', handleGlobalKey))

watch(() => props.mode, (mode) => {
  setTimeout(() => {
    if (mode === 'url') urlRef.value?.focus()
    else pasteRef.value?.focus()
  }, 50)
})
</script>

<style scoped>
/* ── Glassmorphism container ─────────────────────────── */
.glass-input {
  width: 100%;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 18px;
  box-shadow:
    0 2px 16px rgba(0, 0, 0, 0.07),
    inset 0 1px 0 rgba(255, 255, 255, 0.95);
  overflow: hidden;
}

[data-theme="dark"] .glass-input {
  background: rgba(255, 255, 255, 0.055);
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

/* ── Barre principale ────────────────────────────────── */
.glass-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px;
}

/* Toggle URL / Liste */
.glass-toggle {
  display: flex;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 11px;
  padding: 3px;
  gap: 2px;
  flex-shrink: 0;
}

[data-theme="dark"] .glass-toggle { background: rgba(0, 0, 0, 0.3); }

.gt-btn {
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.38);
  transition: background 0.15s, color 0.15s;
  white-space: nowrap;
}

[data-theme="dark"] .gt-btn { color: rgba(255, 255, 255, 0.35); }

.gt-btn.active {
  background: rgba(255, 255, 255, 0.9);
  color: #111;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

[data-theme="dark"] .gt-btn.active {
  background: rgba(255, 255, 255, 0.13);
  color: #fff;
  box-shadow: none;
}

.gt-btn:hover:not(.active) { color: rgba(0, 0, 0, 0.65); }
[data-theme="dark"] .gt-btn:hover:not(.active) { color: rgba(255, 255, 255, 0.6); }

/* Champ input */
.glass-field {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 10px;
  min-width: 0;
}

.glass-field-muted { opacity: 0.5; }

.glass-icon {
  color: rgba(0, 0, 0, 0.28);
  flex-shrink: 0;
}

[data-theme="dark"] .glass-icon { color: rgba(255, 255, 255, 0.3); }

.glass-url {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 15px;
  color: #171717;
  min-width: 0;
}

[data-theme="dark"] .glass-url { color: #fff; }

.glass-url::placeholder { color: rgba(0, 0, 0, 0.28); }
[data-theme="dark"] .glass-url::placeholder { color: rgba(255, 255, 255, 0.25); }
.glass-url:disabled { opacity: 0.5; cursor: not-allowed; }

.glass-paste-hint {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

[data-theme="dark"] .glass-paste-hint { color: rgba(255, 255, 255, 0.3); }

/* Bouton Traduire */
.glass-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 11px 24px;
  background: #4F46E5;
  color: #fff;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
  transition: background 0.15s, box-shadow 0.15s, transform 0.1s;
  box-shadow: 0 4px 18px rgba(79, 70, 229, 0.35);
}

.glass-btn:hover:not(:disabled) {
  background: #4338CA;
  box-shadow: 0 6px 28px rgba(79, 70, 229, 0.55);
  transform: translateY(-1px);
}

[data-theme="dark"] .glass-btn { box-shadow: 0 4px 18px rgba(79, 70, 229, 0.45); }
[data-theme="dark"] .glass-btn:hover:not(:disabled) { box-shadow: 0 6px 28px rgba(79, 70, 229, 0.6); }

.glass-btn:active:not(:disabled) { transform: scale(0.98); }

.glass-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
  box-shadow: none;
}

/* Spinner */
.btn-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.65s linear infinite;
  flex-shrink: 0;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* ── Zone textarea ───────────────────────────────────── */
.glass-paste-area {
  padding: 0 8px 8px;
}

.glass-textarea {
  width: 100%;
  min-height: 160px;
  background: rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  color: #171717;
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.65;
  padding: 14px 16px;
  outline: none;
  resize: vertical;
  transition: border-color 0.15s;
}

[data-theme="dark"] .glass-textarea {
  background: rgba(0, 0, 0, 0.2);
  border-color: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.88);
}

.glass-textarea:focus { border-color: rgba(79, 70, 229, 0.38); }
[data-theme="dark"] .glass-textarea:focus { border-color: rgba(79, 70, 229, 0.45); }

.glass-textarea::placeholder { color: rgba(0, 0, 0, 0.22); }
[data-theme="dark"] .glass-textarea::placeholder { color: rgba(255, 255, 255, 0.18); }
.glass-textarea:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
