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

    <!-- Pre-translation: landing page -->
    <div v-if="status !== 'done'" class="input-page">

      <!-- Hero -->
      <div class="lp-hero">
        <div class="lp-badge">Magic: The Gathering</div>
        <h1 class="lp-title">Traduisez vos decks<br><span class="lp-accent">dans votre langue</span></h1>
        <p class="lp-sub">Importez un deck depuis Archidekt, Moxfield, MTGTOP8 ou Tappedout — ou collez votre liste. Noms traduits en quelques secondes via Scryfall.</p>
      </div>

      <!-- Input -->
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

      <!-- Features -->
      <div class="lp-features">
        <div class="lp-feat">
          <div class="lf-icon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M6 4H4a2 2 0 0 0 0 4h2M10 4h2a2 2 0 0 1 0 4h-2M5 8h6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="lf-body">
            <span class="lf-title">Import URL</span>
            <span class="lf-desc">Archidekt · Moxfield · MTGTOP8 · Tappedout</span>
          </div>
        </div>
        <div class="lp-feat">
          <div class="lf-icon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.4"/>
              <path d="M2 8h12M8 2c-2 2-3 4-3 6s1 4 3 6M8 2c2 2 3 4 3 6s-1 4-3 6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="lf-body">
            <span class="lf-title">15 langues</span>
            <span class="lf-desc">FR · DE · ES · IT · PT · JA · KO · RU · ZH…</span>
          </div>
        </div>
        <div class="lp-feat">
          <div class="lf-icon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" stroke-width="1.4"/>
              <path d="M5 8l2.5 2.5L11 5.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="lf-body">
            <span class="lf-title">Suivi de collection</span>
            <span class="lf-desc">Cochez vos cartes · Import CSV Manabox</span>
          </div>
        </div>
      </div>

      <!-- Decks récents -->
      <div v-if="history.length" class="lp-recent">
        <div class="lp-recent-hd">
          <span class="lp-recent-title">Decks récents</span>
          <button class="lp-recent-clear" @click="clearHistory">Effacer tout</button>
        </div>
        <div class="lp-recent-grid">
          <button
            v-for="entry in history.slice(0, 6)"
            :key="entry.deckId"
            class="lp-deck-card"
            @click="onLoadFromHistory(entry)"
          >
            <div class="ldc-top">
              <svg v-if="entry.inputMode === 'url'" width="12" height="12" viewBox="0 0 12 12" fill="none" class="ldc-src-icon">
                <path d="M5 3H3a2 2 0 0 0 0 4h2M7 3h2a2 2 0 0 1 0 4H7M4 6h4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
              </svg>
              <svg v-else width="12" height="12" viewBox="0 0 12 12" fill="none" class="ldc-src-icon">
                <path d="M2 4h8M2 7h6M2 10h4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
              </svg>
              <span class="ldc-date">{{ formatDate(entry.date) }}</span>
            </div>
            <span class="ldc-name">{{ entry.deckName }}</span>
            <div class="ldc-footer">
              <span class="ldc-count tabular">{{ entry.totalCount }} cartes</span>
              <span v-if="entry.ownedCount > 0" class="ldc-owned tabular">{{ entry.ownedCount }} possédées</span>
            </div>
            <div class="ldc-progress-track">
              <div
                class="ldc-progress-fill"
                :style="{ width: (entry.totalCount ? entry.ownedCount / entry.totalCount * 100 : 0) + '%' }"
              />
            </div>
          </button>
        </div>
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

        <div class="sidebar-sep" />

        <!-- Import collection -->
        <CollectionImport @apply="applyCollection" />
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
import CollectionImport from './components/CollectionImport.vue'
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
import { useCollection } from './composables/useCollection.js'
import { matchDeckToCollection } from './services/collectionParser.js'
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
const { getMap: getCollectionMap } = useCollection()

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

function formatDate(iso) {
  const d = new Date(iso)
  const diffDays = Math.floor((Date.now() - d) / 86400000)
  if (diffDays === 0) return "Aujourd'hui"
  if (diffDays === 1) return "Hier"
  if (diffDays < 7) return `Il y a ${diffDays}j`
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function applyCollection() {
  const map = getCollectionMap()
  if (!map) return
  const owned = matchDeckToCollection(cards.value, map)
  setAll([...owned], true)
}

watch(deckId, () => { activeFilter.value = 'all' })
</script>

<style scoped>
.app { min-height: 100vh; }

/* ── Landing page ──────────────────────────────────────── */
.input-page {
  min-height: calc(100vh - var(--header-height));
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 64px 24px 80px;
  gap: 36px;
}

/* Hero */
.lp-hero {
  text-align: center;
  max-width: 560px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}

.lp-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  background: var(--accent-subtle);
  color: var(--accent);
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.lp-title {
  font-size: clamp(28px, 5vw, 42px);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.12;
  color: var(--text-1);
}

.lp-accent { color: var(--accent); }

.lp-sub {
  font-size: 15px;
  color: var(--text-2);
  line-height: 1.65;
  max-width: 480px;
}

/* Input */
.input-wrap {
  width: 100%;
  max-width: 580px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Features */
.lp-features {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
  max-width: 680px;
}

.lp-feat {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  min-width: 200px;
  flex: 1;
  max-width: 240px;
}

.lf-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  background: var(--surface-2);
  color: var(--accent);
  flex-shrink: 0;
}

.lf-body {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.lf-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-1);
}

.lf-desc {
  font-size: 11px;
  color: var(--text-3);
  font-family: var(--font-mono);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Recent history */
.lp-recent {
  width: 100%;
  max-width: 680px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.lp-recent-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.lp-recent-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-1);
  letter-spacing: -0.01em;
}

.lp-recent-clear {
  font-size: 12px;
  color: var(--text-3);
  transition: color var(--transition-fast);
}
.lp-recent-clear:hover { color: var(--error); }

.lp-recent-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 8px;
}

/* Deck card */
.lp-deck-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-align: left;
  padding: 12px 14px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  overflow: hidden;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast), transform var(--transition-fast);
}

.lp-deck-card:hover {
  border-color: var(--accent);
  box-shadow: 0 4px 16px rgba(79, 127, 255, 0.12);
  transform: translateY(-2px);
}

.ldc-top {
  display: flex;
  align-items: center;
  gap: 5px;
}

.ldc-src-icon { color: var(--text-3); flex-shrink: 0; }

.ldc-date {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-3);
}

.ldc-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: -0.01em;
}

.ldc-footer {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ldc-count {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-3);
}

.ldc-owned {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--success);
}

.ldc-progress-track {
  height: 2px;
  background: var(--border);
  border-radius: 9999px;
  overflow: hidden;
}

.ldc-progress-fill {
  height: 100%;
  background: var(--accent);
  border-radius: 9999px;
  transition: width 600ms ease;
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
