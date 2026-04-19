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

    <!-- Pre-translation: input centré, spacieux -->
    <div v-if="status !== 'done'" class="input-page">
      <div class="input-wrap">
        <InputPanel
          v-model:mode="inputMode"
          v-model:url="urlInput"
          v-model:paste="pasteInput"
          :status="status"
          @translate="onTranslate"
        />
        <ProgressBar v-if="status === 'translating'" :progress="progress" variant="translation" />
        <div v-if="unparseableLines.length && status !== 'idle'" class="warning-banner">
          {{ unparseableLines.length }} ligne(s) ignorée(s) : {{ unparseableLines.slice(0, 3).join(', ') }}{{ unparseableLines.length > 3 ? '...' : '' }}
        </div>
        <div v-if="status === 'error'" class="error-banner">{{ error }}</div>
      </div>
    </div>

    <!-- Post-translation: app shell full-width -->
    <div v-else class="deck-layout">

      <!-- Sidebar gauche -->
      <aside class="deck-sidebar">

        <!-- En-tête deck -->
        <div class="sidebar-header">
          <div class="sh-title-row">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <rect x="1" y="1" width="12" height="12" rx="2" stroke="currentColor" stroke-width="1.3"/>
              <path d="M4 5h6M4 7.5h4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
            </svg>
            <span class="sh-name">{{ deckName }}</span>
          </div>
          <div class="sh-meta">
            <span class="sh-stat tabular">{{ cards.length }} cartes</span>
            <span v-if="totalPrice > 0" class="sh-stat tabular">· {{ formatPrice(totalPrice) }}</span>
          </div>
          <div class="sh-controls">
            <div class="layout-toggle">
              <button :class="['lt-btn', { active: layout === 'list' }]" @click="layout = 'list'" title="Vue liste">
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M2 4h10M2 7h10M2 10h10" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
                </svg>
              </button>
              <button :class="['lt-btn', { active: layout === 'columns' }]" @click="layout = 'columns'" title="Vue colonnes">
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <rect x="1" y="2" width="3" height="10" rx="1" stroke="currentColor" stroke-width="1.3"/>
                  <rect x="5.5" y="2" width="3" height="10" rx="1" stroke="currentColor" stroke-width="1.3"/>
                  <rect x="10" y="2" width="3" height="10" rx="1" stroke="currentColor" stroke-width="1.3"/>
                </svg>
              </button>
              <button :class="['lt-btn', { active: layout === 'images' }]" @click="layout = 'images'" title="Vue images">
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.3"/>
                  <rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.3"/>
                  <rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.3"/>
                  <rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.3"/>
                </svg>
              </button>
            </div>
            <button class="new-deck-btn" @click="resetDeck">Nouveau deck</button>
          </div>
        </div>

        <div class="sidebar-sep" />

        <!-- Contrôles (search / filter / sort / ownership / TOC) -->
        <ResultsSidebar
          :search="search"
          :sort="sort"
          :filter="activeFilter"
          :counts="filterCounts"
          :owned-count="ownedCount"
          :total-count="cards.length"
          :category-groups="categoryGroups"
          :layout="layout"
          @update:search="search = $event"
          @update:sort="sort = $event"
          @update:filter="activeFilter = $event"
        />
      </aside>

      <!-- Contenu principal -->
      <main class="deck-main">
        <ExportPanel
          @copy-all="exportAll"
          @copy-missing="exportMissing"
          @download="exportDownload"
          @print="exportPrint"
          @buy-cardmarket="exportBuyCardmarket"
        />
        <ResultsPanel
          v-if="layout === 'list'"
          :cards="cards"
          :checked-map="checkedMap"
          :filter="activeFilter"
          :search="search"
          :sort="sort"
          @toggle="toggleCard"
          @set-all="setAllCards"
        />
        <ColumnsPanel
          v-else-if="layout === 'columns'"
          :cards="cards"
          :checked-map="checkedMap"
          :filter="activeFilter"
          :search="search"
          :sort="sort"
          @toggle="toggleCard"
        />
        <VisualPanel
          v-else
          :cards="cards"
          :checked-map="checkedMap"
          :filter="activeFilter"
          :search="search"
          :sort="sort"
          @toggle="toggleCard"
        />
      </main>
    </div>

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
import ColumnsPanel from './components/ColumnsPanel.vue'
import InputPanel from './components/InputPanel.vue'
import ProgressBar from './components/ProgressBar.vue'
import ExportPanel from './components/ExportPanel.vue'
import ResultsPanel from './components/ResultsPanel.vue'
import ResultsSidebar from './components/ResultsSidebar.vue'
import VisualPanel from './components/VisualPanel.vue'
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
const layout = ref(localStorage.getItem('deck-layout') || 'list')
watch(layout, v => localStorage.setItem('deck-layout', v))

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

/* ── Page input ────────────────────────────────────────── */
.input-page {
  min-height: calc(100vh - var(--header-height));
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 72px 24px 60px;
}

.input-wrap {
  width: 100%;
  max-width: 580px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ── Deck layout: sidebar + main ────────────────────── */
.deck-layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  min-height: calc(100vh - var(--header-height));
}

/* ── Sidebar ──────────────────────────────────────────── */
.deck-sidebar {
  position: sticky;
  top: var(--header-height);
  height: calc(100vh - var(--header-height));
  overflow-y: auto;
  background: var(--surface);
  border-right: 1px solid var(--border);
  padding: 20px 16px 40px;
  display: flex;
  flex-direction: column;
  gap: 0;
  scrollbar-width: thin;
  scrollbar-color: var(--border) transparent;
}

.sidebar-header {
  padding-bottom: 16px;
  flex-shrink: 0;
}

.sh-title-row {
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--text-3);
  margin-bottom: 4px;
}

.sh-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: -0.01em;
}

.sh-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-left: 20px;
  margin-bottom: 12px;
}

.sh-stat {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-3);
}

.sh-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Layout toggle */
.layout-toggle {
  display: flex;
  background: var(--surface-2);
  border-radius: var(--radius-md);
  padding: 2px;
  gap: 1px;
}

.lt-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 26px;
  border-radius: calc(var(--radius-md) - 2px);
  color: var(--text-3);
  transition: all var(--transition-fast);
}

.lt-btn:hover { color: var(--text-1); }

.lt-btn.active {
  background: var(--surface);
  color: var(--text-1);
  box-shadow: 0 1px 3px rgba(0,0,0,0.12);
}

/* Nouveau deck */
.new-deck-btn {
  font-size: 12px;
  color: var(--text-3);
  padding: 5px 10px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  background: transparent;
  white-space: nowrap;
  transition: all var(--transition-fast);
}

.new-deck-btn:hover {
  color: var(--text-1);
  border-color: var(--border-strong);
  background: var(--surface-2);
}

.sidebar-sep {
  height: 1px;
  background: var(--border);
  margin: 0 0 20px;
  flex-shrink: 0;
}

/* ── Main content ────────────────────────────────────── */
.deck-main {
  padding: 24px 32px 64px;
  min-width: 0;
}

/* ── Banners ─────────────────────────────────────────── */
.warning-banner {
  padding: 10px 14px;
  border-radius: var(--radius-md);
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.2);
  color: var(--warning);
  font-size: 13px;
}

.error-banner {
  padding: 12px 16px;
  border-radius: var(--radius-md);
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: var(--error);
  font-size: 13px;
  line-height: 1.7;
}

/* ── Transitions ─────────────────────────────────────── */
.history-fade-enter-active,
.history-fade-leave-active { transition: opacity 200ms ease; }
.history-fade-enter-from,
.history-fade-leave-to { opacity: 0; }

/* ── Responsive ──────────────────────────────────────── */
@media (max-width: 900px) {
  .deck-layout { grid-template-columns: 220px 1fr; }
}

@media (max-width: 700px) {
  .deck-layout { grid-template-columns: 1fr; }
  .deck-sidebar {
    position: static;
    height: auto;
    border-right: none;
    border-bottom: 1px solid var(--border);
  }
  .deck-main { padding: 16px; }
}
</style>
