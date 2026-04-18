<template>
  <div class="app">
    <AppHeader
      :theme="theme"
      :history-open="showHistory"
      @toggle-theme="toggleTheme"
      @toggle-history="showHistory = !showHistory"
    />

    <Transition name="history-fade">
      <HistoryPanel
        v-if="showHistory"
        :history="history"
        @load="onLoadFromHistory"
        @clear="clearHistory"
        @close="showHistory = false"
      />
    </Transition>

    <main class="container main-content">
      <InputPanel
        v-model:mode="inputMode"
        v-model:url="urlInput"
        v-model:paste="pasteInput"
        :status="status"
        @translate="onTranslate"
      />

      <div v-if="status === 'translating'" class="section">
        <ProgressBar :progress="progress" variant="translation" />
      </div>

      <div v-if="unparseableLines.length && status !== 'idle'" class="warning-banner">
        {{ unparseableLines.length }} ligne(s) ignorée(s) : {{ unparseableLines.slice(0, 3).join(', ') }}{{ unparseableLines.length > 3 ? '...' : '' }}
      </div>

      <div v-if="status === 'error'" class="error-banner">
        <template v-if="errorMeta?.type === 'MOXFIELD_BLOCKED'">
          Moxfield protège son API via Cloudflare — accès direct impossible.
          <br>
          <strong>Solution :</strong> ouvrez votre deck sur Moxfield →
          <a :href="errorMeta.deckUrl" target="_blank" rel="noopener" class="error-link">ouvrir le deck</a>
          → bouton <strong>Export</strong> → <strong>MTGO</strong> → copiez le texte → utilisez "Coller une liste".
        </template>
        <template v-else>{{ error }}</template>
      </div>

      <template v-if="status === 'done'">
        <div class="deck-header">
          <h1 class="deck-name">{{ deckName }}</h1>
          <span class="deck-total tabular">{{ cards.length }} cartes</span>
        </div>

        <div class="ownership-summary">
          <ProgressBar
            :progress="{ current: ownedCount, total: cards.length }"
            variant="ownership"
          />
        </div>

        <div class="results-toolbar">
          <FilterTabs
            v-model="activeFilter"
            :counts="filterCounts"
          />
          <ExportPanel
            @copy-all="exportAll"
            @copy-missing="exportMissing"
            @download="exportDownload"
            @print="exportPrint"
          />
        </div>

        <ResultsPanel
          :cards="cards"
          :checked-map="checkedMap"
          :filter="activeFilter"
          @toggle="toggleCard"
          @set-all="setAllCards"
        />
      </template>
    </main>

    <ToastNotification />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

import AppHeader from './components/AppHeader.vue'
import InputPanel from './components/InputPanel.vue'
import ProgressBar from './components/ProgressBar.vue'
import FilterTabs from './components/FilterTabs.vue'
import ExportPanel from './components/ExportPanel.vue'
import ResultsPanel from './components/ResultsPanel.vue'
import HistoryPanel from './components/HistoryPanel.vue'
import ToastNotification from './components/ToastNotification.vue'

import { useDeck } from './composables/useDeck.js'
import { useChecklist } from './composables/useChecklist.js'
import { useHistory } from './composables/useHistory.js'
import { useTheme } from './composables/useTheme.js'
import { useExport } from './composables/useExport.js'
import { getCachedCards, setCachedCards } from './services/storage.js'

// --- State ---
const showHistory = ref(false)
const activeFilter = ref('all')

// --- Composables ---
const { theme, toggle: toggleTheme } = useTheme()

const {
  inputMode, urlInput, pasteInput,
  status, error, errorMeta, progress, cards, deckId, deckName, unparseableLines,
  translate, loadFromHistory,
} = useDeck()

const { checkedMap, toggle: toggleCard, setAll, reset: resetChecklist, ownedCount } = useChecklist(deckId)

const { history, add: addToHistory, clear: clearHistory, getEntryPasteText } = useHistory()

const { copyAll, copyMissing, downloadTxt } = useExport(cards, checkedMap)

// --- Computed ---
const filterCounts = computed(() => {
  const missing = cards.value.filter(c => !checkedMap.value[c.queryName]).length
  const owned   = cards.value.filter(c => !!checkedMap.value[c.queryName]).length
  return { all: cards.value.length, missing, owned }
})

// --- Actions ---
async function onTranslate() {
  activeFilter.value = 'all'
  resetChecklist()
  const extra = await translate()

  if (status.value === 'done') {
    setCachedCards(deckId.value, cards.value)
    addToHistory({
      deckId: deckId.value,
      deckName: deckName.value,
      date: new Date().toISOString(),
      ownedCount: 0,
      totalCount: cards.value.length,
      inputMode: inputMode.value,
      url: inputMode.value === 'url' ? urlInput.value : undefined,
      pasteText: inputMode.value === 'paste' ? extra?.pasteText : undefined,
    })
  }
}

function setAllCards(keys, value) {
  setAll(keys, value)
}

function onLoadFromHistory(entry) {
  showHistory.value = false

  const cached = getCachedCards(entry.deckId)
  if (cached) {
    // Restaurer depuis le cache — pas d'appels API
    deckId.value = entry.deckId
    deckName.value = entry.deckName
    cards.value = cached
    status.value = 'done'
    activeFilter.value = 'all'
    return
  }

  // Pas de cache — relancer la traduction
  if (entry.inputMode === 'url') {
    loadFromHistory(entry)
  } else {
    const pasteText = getEntryPasteText(entry.deckId)
    loadFromHistory({ ...entry, pasteText: pasteText || '' })
  }
  onTranslate()
}

function exportAll() { copyAll() }
function exportMissing() { copyMissing() }
function exportDownload() { downloadTxt(deckName.value) }
function exportPrint() { window.print() }

// Reset filter when deck changes
watch(deckId, () => { activeFilter.value = 'all' })
</script>

<style scoped>
.app {
  min-height: 100vh;
}

.main-content {
  padding-top: 0;
  padding-bottom: 40px;
}

.section {
  margin: 0 0 16px;
}

.deck-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 12px;
  padding-top: 4px;
}

.deck-name {
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.03em;
  color: var(--text-1);
}

.deck-total {
  font-family: var(--font-mono);
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  color: var(--text-3);
}

.ownership-summary {
  margin-bottom: 20px;
}

.results-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 4px;
}

.warning-banner {
  padding: 10px 14px;
  border-radius: var(--radius-md);
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.2);
  color: var(--warning);
  font-size: 13px;
  margin-bottom: 16px;
}

.error-banner {
  padding: 12px 16px;
  border-radius: var(--radius-md);
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: var(--error);
  font-size: 13px;
  line-height: 1.7;
  margin-bottom: 16px;
}

.error-link {
  color: var(--error);
  text-decoration: underline;
  font-weight: 500;
}

.history-fade-enter-active,
.history-fade-leave-active {
  transition: opacity 200ms ease;
}

.history-fade-enter-from,
.history-fade-leave-to {
  opacity: 0;
}
</style>
