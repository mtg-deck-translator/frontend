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

      <!-- Input panel — masqué quand le deck est chargé -->
      <template v-if="status !== 'done'">
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
        <div v-if="status === 'error'" class="error-banner">{{ error }}</div>
      </template>

      <!-- Barre compacte après traduction -->
      <div v-else class="translate-bar">
        <div class="translate-bar-info">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <rect x="1" y="1" width="12" height="12" rx="2" stroke="currentColor" stroke-width="1.3"/>
            <path d="M4 5h6M4 7.5h4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
          </svg>
          <span class="translate-bar-name">{{ deckName }}</span>
          <span class="translate-bar-count tabular">{{ cards.length }} cartes</span>
          <span v-if="totalPrice > 0" class="translate-bar-price tabular">· {{ formatPrice(totalPrice) }}</span>
        </div>
        <button class="translate-bar-btn" @click="resetDeck">
          Nouveau deck
        </button>
      </div>

      <!-- Layout résultats en 2 colonnes -->
      <template v-if="status === 'done'">
        <div class="results-layout">

          <!-- Sidebar navigation -->
          <ResultsSidebar
            :search="search"
            :sort="sort"
            :filter="activeFilter"
            :counts="filterCounts"
            :owned-count="ownedCount"
            :total-count="cards.length"
            :category-groups="categoryGroups"
            @update:search="search = $event"
            @update:sort="sort = $event"
            @update:filter="activeFilter = $event"
          />

          <!-- Contenu principal -->
          <div class="results-main">
            <ExportPanel
              @copy-all="exportAll"
              @copy-missing="exportMissing"
              @download="exportDownload"
              @print="exportPrint"
              @buy-cardmarket="exportBuyCardmarket"
            />
            <ResultsPanel
              :cards="cards"
              :checked-map="checkedMap"
              :filter="activeFilter"
              :search="search"
              :sort="sort"
              @toggle="toggleCard"
              @set-all="setAllCards"
            />
          </div>
        </div>
      </template>
    </main>

    <CardmarketPanel
      :show="showCardmarket"
      :cards="missingCards"
      :lang="language"
      @close="showCardmarket = false"
    />

    <ToastNotification />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

import AppHeader from './components/AppHeader.vue'
import CardmarketPanel from './components/CardmarketPanel.vue'
import InputPanel from './components/InputPanel.vue'
import ProgressBar from './components/ProgressBar.vue'
import ExportPanel from './components/ExportPanel.vue'
import ResultsPanel from './components/ResultsPanel.vue'
import ResultsSidebar from './components/ResultsSidebar.vue'
import HistoryPanel from './components/HistoryPanel.vue'
import ToastNotification from './components/ToastNotification.vue'

import { useDeck } from './composables/useDeck.js'
import { useLanguage } from './composables/useLanguage.js'
import { useChecklist } from './composables/useChecklist.js'
import { useHistory } from './composables/useHistory.js'
import { useTheme } from './composables/useTheme.js'
import { useExport } from './composables/useExport.js'
import { getCachedCards, setCachedCards } from './services/storage.js'

const CATEGORY_ORDER = ['Commander', 'Creature', 'Instant', 'Sorcery', 'Artifact', 'Enchantment', 'Planeswalker', 'Land', 'Other', 'Maybeboard']
const CATEGORY_FR = {
  Commander: 'Commandant', Creature: 'Créature', Instant: 'Éphémère',
  Sorcery: 'Rituel', Artifact: 'Artefact', Enchantment: 'Enchantement',
  Planeswalker: 'Planeswalker', Land: 'Terrain', Other: 'Autre', Maybeboard: 'Maybeboard',
}

// --- State ---
const showHistory = ref(false)
const showCardmarket = ref(false)
const activeFilter = ref('all')
const search = ref('')
const sort = ref('category')

// --- Composables ---
const { theme, toggle: toggleTheme } = useTheme()
const { language, setLanguage } = useLanguage()

const {
  inputMode, urlInput, pasteInput,
  status, error, progress, cards, deckId, deckName, unparseableLines,
  translate, reset, loadFromHistory,
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
function formatPrice(val) { return val.toFixed(2) + ' €' }

const missingCards = computed(() =>
  cards.value.filter(c => !checkedMap.value[c.queryName])
)

const filterCounts = computed(() => ({
  all: cards.value.length,
  missing: missingCards.value.length,
  owned: cards.value.filter(c => !!checkedMap.value[c.queryName]).length,
}))

const categoryGroups = computed(() => {
  const groups = {}
  for (const card of cards.value) {
    const cat = card.category || 'Other'
    if (!groups[cat]) groups[cat] = { total: 0, owned: 0 }
    groups[cat].total++
    groups[cat].owned += checkedMap.value[card.queryName] ? 1 : 0
  }
  return CATEGORY_ORDER
    .filter(cat => groups[cat])
    .map(cat => ({ category: cat, label: CATEGORY_FR[cat] || cat, ...groups[cat] }))
})

// --- Actions ---
async function onTranslate() {
  activeFilter.value = 'all'
  search.value = ''
  sort.value = 'category'
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

function resetDeck() {
  reset()
  search.value = ''
  sort.value = 'category'
  activeFilter.value = 'all'
}

function setAllCards(keys, value) { setAll(keys, value) }

function onLoadFromHistory(entry) {
  showHistory.value = false
  const cached = getCachedCards(entry.deckId)
  if (cached) {
    deckId.value = entry.deckId
    deckName.value = entry.deckName
    cards.value = cached
    status.value = 'done'
    activeFilter.value = 'all'
    return
  }
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

watch(deckId, () => { activeFilter.value = 'all' })
</script>

<style scoped>
.app { min-height: 100vh; }

.main-content {
  padding-top: 0;
  padding-bottom: 40px;
}

.section { margin: 0 0 16px; }

/* Barre compacte post-traduction */
.translate-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  margin-bottom: 20px;
}

.translate-bar-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-2);
  min-width: 0;
  overflow: hidden;
}

.translate-bar-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.translate-bar-count,
.translate-bar-price {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-3);
  white-space: nowrap;
  flex-shrink: 0;
}

.translate-bar-btn {
  flex-shrink: 0;
  padding: 6px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: 12px;
  font-weight: 500;
  color: var(--text-2);
  background: var(--surface);
  transition: background var(--transition-fast), color var(--transition-fast);
}

.translate-bar-btn:hover {
  background: var(--surface-2);
  color: var(--text-1);
}

/* Layout 2 colonnes */
.results-layout {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 0;
  align-items: start;
}

@media (max-width: 768px) {
  .results-layout { grid-template-columns: 1fr; }
}

.results-main {
  min-width: 0;
  padding-left: 24px;
}

/* Banners */
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

.history-fade-enter-active,
.history-fade-leave-active { transition: opacity 200ms ease; }
.history-fade-enter-from,
.history-fade-leave-to { opacity: 0; }
</style>
