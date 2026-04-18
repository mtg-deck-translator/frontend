<template>
  <div class="history-overlay" @click.self="$emit('close')">
    <div class="history-panel">
      <div class="panel-header">
        <h2 class="panel-title">Historique</h2>
        <div class="header-actions">
          <button v-if="history.length" class="clear-btn" @click="$emit('clear')">Effacer</button>
          <button class="close-btn" aria-label="Fermer l'historique" @click="$emit('close')">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      <div v-if="!history.length" class="empty-history">
        Aucun deck traduit récemment.
      </div>

      <ul v-else class="history-list">
        <li
          v-for="entry in history"
          :key="entry.deckId"
          class="history-entry"
          role="button"
          tabindex="0"
          @click="$emit('load', entry)"
          @keydown.enter="$emit('load', entry)"
        >
          <div class="entry-main">
            <span class="entry-name">{{ entry.deckName }}</span>
            <span class="entry-stats tabular">{{ liveOwnedCount(entry.deckId) }}/{{ entry.totalCount }}</span>
          </div>
          <div class="entry-meta">
            <span class="entry-mode">{{ entry.inputMode === 'url' ? 'URL' : 'Collé' }}</span>
            <span class="entry-date">{{ formatDate(entry.date) }}</span>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { getChecklist } from '../services/storage.js'

defineProps({
  history: Array,
})

defineEmits(['load', 'close', 'clear'])

function liveOwnedCount(deckId) {
  return Object.values(getChecklist(deckId) || {}).filter(Boolean).length
}

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now - d
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffDays === 0) return "Aujourd'hui"
  if (diffDays === 1) return 'Hier'
  if (diffDays < 7) return `Il y a ${diffDays} jours`
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}
</script>

<style scoped>
.history-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  padding: 16px;
}

.history-panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  width: 320px;
  max-height: calc(100vh - 32px);
  overflow-y: auto;
  margin-top: 8px;
  animation: slideIn 200ms ease;
}

@keyframes slideIn {
  from { opacity: 0; transform: translateX(12px); }
  to   { opacity: 1; transform: translateX(0); }
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 12px;
  border-bottom: 1px solid var(--border);
}

.panel-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-1);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.clear-btn {
  font-size: 12px;
  color: var(--text-3);
  transition: color var(--transition-fast);
}

.clear-btn:hover {
  color: var(--error);
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  color: var(--text-2);
  transition: background var(--transition-fast);
}

.close-btn:hover {
  background: var(--surface-2);
}

.empty-history {
  padding: 32px 16px;
  text-align: center;
  font-size: 13px;
  color: var(--text-3);
}

.history-list {
  list-style: none;
  padding: 8px;
}

.history-entry {
  padding: 10px 12px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.history-entry:hover {
  background: var(--surface-2);
}

.entry-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 2px;
}

.entry-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.entry-stats {
  font-family: var(--font-mono);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: var(--accent);
  flex-shrink: 0;
}

.entry-meta {
  display: flex;
  gap: 8px;
}

.entry-mode,
.entry-date {
  font-size: 11px;
  color: var(--text-3);
}
</style>
