<template>
  <div class="lang-selector" ref="root">
    <button class="lang-btn" @click="open = !open" :title="current.label">
      <span class="flag">{{ current.flag }}</span>
      <span class="code">{{ current.code.toUpperCase() }}</span>
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
        <path d="M2 3.5l3 3 3-3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>

    <Transition name="dropdown">
      <ul v-if="open" class="lang-dropdown">
        <li
          v-for="lang in LANGUAGES"
          :key="lang.code"
          class="lang-option"
          :class="{ active: lang.code === modelValue }"
          @click="select(lang.code)"
        >
          <span class="flag">{{ lang.flag }}</span>
          <span class="label">{{ lang.label }}</span>
        </li>
      </ul>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { LANGUAGES } from '../composables/useLanguage.js'

const props = defineProps({ modelValue: String })
const emit = defineEmits(['update:modelValue'])

const open = ref(false)
const root = ref(null)

const current = computed(() => LANGUAGES.find(l => l.code === props.modelValue) || LANGUAGES[0])

function select(code) {
  emit('update:modelValue', code)
  open.value = false
}

function onClickOutside(e) {
  if (root.value && !root.value.contains(e.target)) open.value = false
}

onMounted(() => document.addEventListener('mousedown', onClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', onClickOutside))
</script>

<style scoped>
.lang-selector {
  position: relative;
}

.lang-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 10px;
  border-radius: var(--radius-md);
  color: var(--text-2);
  font-size: 12px;
  font-weight: 500;
  transition: background var(--transition-fast), color var(--transition-fast);
}

.lang-btn:hover {
  background: var(--surface-2);
  color: var(--text-1);
}

.flag { font-size: 16px; line-height: 1; }
.code { font-family: var(--font-mono); font-size: 11px; }

.lang-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  list-style: none;
  padding: 4px;
  min-width: 160px;
  z-index: 300;
}

.lang-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: var(--radius-md);
  font-size: 13px;
  cursor: pointer;
  color: var(--text-2);
  transition: background var(--transition-fast), color var(--transition-fast);
}

.lang-option:hover { background: var(--surface-2); color: var(--text-1); }
.lang-option.active { color: var(--accent); font-weight: 500; }

.dropdown-enter-active, .dropdown-leave-active { transition: opacity 120ms ease, transform 120ms ease; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
