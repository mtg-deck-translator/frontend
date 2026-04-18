<template>
  <div class="app">
    <AppHeader
      :theme="theme"
      :history-open="showHistory"
      v-model:language="language"
      @toggle-theme="toggleTheme"
      @toggle-history="showHistory = !showHistory"
      @update:language="setLanguage"
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
        {{ error }}
      </div>

      <template v-if="status === 'done'">
        <div class="deck-header">
          <h1 class="deck-name">{{ deckName }}</h1>
          <span class="deck-total tabular">{{ cards.length }} cartes</span>
          <span v-if="totalPrice > 0" class="deck-price tabular">
            {{ formatPrice(missingPrice) }} manquantes · {{ formatPrice(totalPrice) }} total
          </span>
          <button class="share-btn" title="Partager ce deck" @click="showShare = true">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
              <circle cx="11.5" cy="2.5" r="1.8" stroke="currentColor" stroke-width="1.3"/>
              <circle cx="11.5" cy="12.5" r="1.8" stroke="currentColor" stroke-width="1.3"/>
              <circle cx="3.5" cy="7.5" r="1.8" stroke="currentColor" stroke-width="1.3"/>
              <path d="M5.2 6.6l4.6-2.8M5.2 8.4l4.6 2.8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
            </svg>
            Partager
          </button>
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
            @buy-cardmarket="exportBuyCardmarket"
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

    <CardmarketPanel
      :show="showCardmarket"
      :cards="missingCards"
      :lang="language"
      @close="showCardmarket = false"
    />

    <SharePanel
      :show="showShare"
      :deck-name="deckName"
      :cards="cards"
      :lang="language"
      @close="showShare = false"
    />

    <ToastNotification />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'

import AppHeader from './components/AppHeader.vue'
import CardmarketPanel from './components/CardmarketPanel.vue'
import SharePanel from './components/SharePanel.vue'
import InputPanel from './components/InputPanel.vue'
import ProgressBar from './components/ProgressBar.vue'
import FilterTabs from './components/FilterTabs.vue'
import ExportPanel from './components/ExportPanel.vue'
import ResultsPanel from './components/ResultsPanel.vue'
import HistoryPanel from './components/HistoryPanel.vue'
import ToastNotification from './components/ToastNotification.vue'

import { useDeck } from './composables/useDeck.js'
import { useLanguage } from './composables/useLanguage.js'
import { useChecklist } from './composables/useChecklist.js'
import { useHistory } from './composables/useHistory.js'
import { useTheme } from './composables/useTheme.js'
import { useExport } from './composables/useExport.js'
import { getCachedCards, setCachedCards } from './services/storage.js'

// --- State ---
const showHistory = ref(false)
const showCardmarket = ref(false)
const showShare = ref(false)
const activeFilter = ref('all')

// --- Composables ---
const { theme, toggle: toggleTheme } = useTheme()
const { language, setLanguage } = useLanguage()

const {
  inputMode, urlInput, pasteInput,
  status, error, errorMeta, progress, cards, deckId, deckName, unparseableLines,
  translate, loadFromHistory,
} = useDeck()

const { checkedMap, toggle: toggleCard, setAll, reset: resetChecklist, ownedCount } = useChecklist(deckId)

const { history, add: addToHistory, clear: clearHistory, getEntryPasteText } = useHistory()

const { copyAll, copyMissing, downloadTxt } = useExport(cards, checkedMap)

// --- Computed ---
const totalPrice = computed(() =>
  cards.value.reduce((sum, c) => sum + (c.price ?? 0) * c.qty, 0)
)
const missingPrice = computed(() =>
  cards.value.filter(c => !checkedMap.value[c.queryName])
    .reduce((sum, c) => sum + (c.price ?? 0) * c.qty, 0)
)
function formatPrice(val) {
  return val.toFixed(2) + ' €'
}

const missingCards = computed(() =>
  cards.value.filter(c => !checkedMap.value[c.queryName])
)

const filterCounts = computed(() => ({
  all: cards.value.length,
  missing: missingCards.value.length,
  owned: cards.value.filter(c => !!checkedMap.value[c.queryName]).length,
}))

// --- Actions ---
async function onTranslate() {
  activeFilter.value = 'all'
  resetChecklist()
  const extra = await translate(language.value)

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
async function exportBuyCardmarket() {
  if (missingCards.value.length === 0) return
  const text = missingCards.value.map(c => `${c.qty} ${c.displayName}`).join('\n')
  try { await navigator.clipboard.writeText(text) } catch {}
  showCardmarket.value = true
}

// Reset filter when deck changes
watch(deckId, () => { activeFilter.value = 'all' })

// Load shared deck from ?deck=ID on startup
const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'
onMounted(async () => {
  const id = new URLSearchParams(window.location.search).get('deck')
  if (!id) return
  try {
    const resp = await fetch(`${BACKEND}/api/share/${id}`)
    if (!resp.ok) return
    const data = await resp.json()
    deckName.value = data.deckName
    cards.value = data.cards
    status.value = 'done'
    activeFilter.value = 'all'
    if (data.lang) setLanguage(data.lang)
    window.history.replaceState({}, '', window.location.pathname)
  } catch {}
})
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

.deck-price {
  font-family: var(--font-mono);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: var(--text-3);
}

.share-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: 12px;
  font-weight: 500;
  color: var(--text-2);
  background: var(--surface);
  transition: background var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast);
  margin-left: auto;
}

.share-btn:hover {
  background: var(--surface-2);
  color: var(--text-1);
  border-color: var(--border-strong);
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
