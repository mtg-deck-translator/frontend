<template>
  <header class="app-header">
    <div class="container header-inner">
      <div class="brand">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <rect x="2" y="2" width="16" height="16" rx="3" stroke="var(--accent)" stroke-width="1.5"/>
          <path d="M6 8h8M6 12h5" stroke="var(--accent)" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <span class="brand-name">MTG Translator</span>
      </div>

      <nav class="header-actions">
        <LanguageSelector
          :model-value="language"
          @update:model-value="$emit('update:language', $event)"
        />
        <button
          class="icon-btn"
          :title="historyOpen ? 'Fermer l\'historique' : 'Historique'"
          style="margin-left: 4px;"
          :aria-pressed="historyOpen"
          @click="$emit('toggle-history')"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <circle cx="9" cy="9" r="7" stroke="currentColor" stroke-width="1.5"/>
            <path d="M9 5.5V9.5l2.5 1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>

        <button
          class="icon-btn"
          :title="isDark ? 'Mode clair' : 'Mode sombre'"
          @click="$emit('toggle-theme')"
        >
          <svg v-if="isDark" width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <circle cx="9" cy="9" r="3.5" stroke="currentColor" stroke-width="1.5"/>
            <path d="M9 1v2M9 15v2M1 9h2M15 9h2M3.22 3.22l1.41 1.41M13.36 13.36l1.41 1.41M3.22 14.78l1.41-1.41M13.36 4.64l1.41-1.41" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <svg v-else width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M15.5 10.5A7 7 0 0 1 7.5 2.5a7 7 0 1 0 8 8z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
          </svg>
        </button>
      </nav>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import LanguageSelector from './LanguageSelector.vue'

const props = defineProps({
  theme: String,
  historyOpen: Boolean,
  language: String,
})

defineEmits(['toggle-theme', 'toggle-history', 'update:language'])

const isDark = computed(() => props.theme === 'dark')
</script>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  height: var(--header-height);
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  backdrop-filter: blur(8px);
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
}

.brand-name {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--text-1);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  color: var(--text-2);
  transition: background var(--transition-fast), color var(--transition-fast);
}

.icon-btn:hover {
  background: var(--surface-2);
  color: var(--text-1);
}

.icon-btn[aria-pressed="true"] {
  background: var(--accent-subtle);
  color: var(--accent);
}
</style>
