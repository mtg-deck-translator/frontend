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

      <!-- Hero section — dark, pleine largeur, avec art MTG en fond -->
      <section class="lp-hero-section">
        <div v-if="heroArtUrl" class="lp-hero-art" :style="{ backgroundImage: `url(${heroArtUrl})` }"/>
        <div class="lp-hero-inner">
          <div class="lp-badge">Magic: The Gathering</div>
          <h1 class="lp-title">{{ i18n.hero_title_1 }}<br><span class="lp-accent">{{ i18n.hero_title_2 }}</span></h1>
          <p class="lp-sub">{{ i18n.hero_sub }}</p>

          <div class="input-wrap">
            <InputPanel
              v-model:mode="inputMode"
              v-model:url="urlInput"
              v-model:paste="pasteInput"
              :status="status"
              :labels="i18n"
              @translate="onTranslate"
            />
            <ProgressBar v-if="status === 'translating'" :progress="progress" variant="translation" />
            <div v-if="unparseableLines.length && status !== 'idle'" class="warning-banner">
              {{ unparseableLines.length }} ligne(s) ignorée(s) : {{ unparseableLines.slice(0, 3).join(', ') }}{{ unparseableLines.length > 3 ? '...' : '' }}
            </div>
            <div v-if="status === 'error'" class="error-banner">{{ error }}</div>
          </div>
        </div>
      </section>

      <!-- Contenu sous le hero -->
      <div class="lp-content">

        <!-- Features -->
        <div class="lp-features">
          <div class="lp-feat">
            <div class="lf-icon">
              <svg width="20" height="20" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M6 4H4a2 2 0 0 0 0 4h2M10 4h2a2 2 0 0 1 0 4h-2M5 8h6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
              </svg>
            </div>
            <div class="lf-body">
              <span class="lf-title">{{ i18n.feat_url }}</span>
              <span class="lf-desc">{{ i18n.feat_url_desc }}</span>
            </div>
          </div>
          <div class="lp-feat">
            <div class="lf-icon">
              <svg width="20" height="20" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.4"/>
                <path d="M2 8h12M8 2c-2 2-3 4-3 6s1 4 3 6M8 2c2 2 3 4 3 6s-1 4-3 6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
              </svg>
            </div>
            <div class="lf-body">
              <span class="lf-title">{{ i18n.feat_lang }}</span>
              <span class="lf-desc">{{ i18n.feat_lang_desc }}</span>
            </div>
          </div>
          <div class="lp-feat">
            <div class="lf-icon">
              <svg width="20" height="20" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" stroke-width="1.4"/>
                <path d="M5 8l2.5 2.5L11 5.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="lf-body">
              <span class="lf-title">{{ i18n.feat_coll }}</span>
              <span class="lf-desc">{{ i18n.feat_coll_desc }}</span>
            </div>
          </div>
        </div>

        <!-- Decks récents -->
        <div v-if="history.length" class="lp-recent">
          <div class="lp-recent-hd">
            <span class="lp-recent-title">{{ i18n.recent }}</span>
            <button class="lp-recent-clear" @click="clearHistory">{{ i18n.clear_all }}</button>
          </div>
          <div class="lp-recent-grid">
            <button
              v-for="entry in history.slice(0, 6)"
              :key="entry.deckId"
              class="lp-deck-card"
              @click="onLoadFromHistory(entry)"
            >
              <div
                v-if="getCoverForEntry(entry)"
                class="ldc-art"
                :style="{ backgroundImage: `url(${getCoverForEntry(entry)})` }"
              />
              <div class="ldc-body">
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
                  <span class="ldc-count tabular">{{ entry.totalCount }} {{ i18n.cards }}</span>
                  <span v-if="entry.ownedCount > 0" class="ldc-owned tabular">{{ entry.ownedCount }} {{ i18n.owned }}</span>
                </div>
                <div class="ldc-progress-track">
                  <div
                    class="ldc-progress-fill"
                    :style="{ width: (entry.totalCount ? entry.ownedCount / entry.totalCount * 100 : 0) + '%' }"
                  />
                </div>
              </div>
            </button>
          </div>
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
import { ref, computed, watch, onMounted } from 'vue'

const LANDING_I18N = {
  fr: {
    hero_title_1: 'Traduisez vos decks', hero_title_2: 'dans votre langue',
    hero_sub: 'Importez un deck depuis Archidekt, Moxfield, MTGTOP8 ou Tappedout — ou collez votre liste. Noms traduits en quelques secondes via Scryfall.',
    feat_url: 'Import URL', feat_url_desc: 'Collez une URL Archidekt, Moxfield, MTGTOP8 ou Tappedout et obtenez la liste traduite instantanément.',
    feat_lang: '15 langues', feat_lang_desc: 'Français, Allemand, Espagnol, Italien, Portugais, Japonais, Coréen, Russe et plus encore.',
    feat_coll: 'Suivi de collection', feat_coll_desc: 'Importez votre CSV Manabox, DragonShield ou Moxfield pour voir quelles cartes vous possédez déjà.',
    recent: 'Decks récents', clear_all: 'Effacer tout', cards: 'cartes', owned: 'possédées',
    today: "Aujourd'hui", yesterday: 'Hier', days_ago: n => `Il y a ${n}j`,
    mode_url: 'URL (Archidekt / MTGTOP8)', mode_paste: 'Coller une liste',
    btn_translate: 'Traduire', btn_fetching: 'Récupération...', btn_translating: 'Traduction...',
  },
  de: {
    hero_title_1: 'Übersetze deine Decks', hero_title_2: 'in deine Sprache',
    hero_sub: 'Importiere ein Deck von Archidekt, Moxfield, MTGTOP8 oder Tappedout — oder füge deine Liste ein. Namen werden in Sekunden via Scryfall übersetzt.',
    feat_url: 'URL-Import', feat_url_desc: 'Füge eine Archidekt-, Moxfield-, MTGTOP8- oder Tappedout-URL ein und erhalte sofort die übersetzte Liste.',
    feat_lang: '15 Sprachen', feat_lang_desc: 'Französisch, Deutsch, Spanisch, Italienisch, Portugiesisch, Japanisch, Koreanisch, Russisch und mehr.',
    feat_coll: 'Sammlungs-Tracking', feat_coll_desc: 'Importiere dein Manabox-, DragonShield- oder Moxfield-CSV und sieh welche Karten du bereits besitzt.',
    recent: 'Letzte Decks', clear_all: 'Alle löschen', cards: 'Karten', owned: 'besessen',
    today: 'Heute', yesterday: 'Gestern', days_ago: n => `Vor ${n} Tagen`,
    mode_url: 'URL (Archidekt / MTGTOP8)', mode_paste: 'Liste einfügen',
    btn_translate: 'Übersetzen', btn_fetching: 'Laden...', btn_translating: 'Übersetzen...',
  },
  it: {
    hero_title_1: 'Traduci i tuoi deck', hero_title_2: 'nella tua lingua',
    hero_sub: 'Importa un deck da Archidekt, Moxfield, MTGTOP8 o Tappedout — oppure incolla la tua lista. Nomi tradotti in pochi secondi tramite Scryfall.',
    feat_url: 'Import URL', feat_url_desc: 'Incolla un URL Archidekt, Moxfield, MTGTOP8 o Tappedout e ottieni istantaneamente la lista tradotta.',
    feat_lang: '15 lingue', feat_lang_desc: 'Francese, Tedesco, Spagnolo, Italiano, Portoghese, Giapponese, Coreano, Russo e altro.',
    feat_coll: 'Traccia collezione', feat_coll_desc: 'Importa il tuo CSV Manabox, DragonShield o Moxfield per vedere quali carte possiedi già.',
    recent: 'Deck recenti', clear_all: 'Cancella tutto', cards: 'carte', owned: 'possedute',
    today: 'Oggi', yesterday: 'Ieri', days_ago: n => `${n} giorni fa`,
    mode_url: 'URL (Archidekt / MTGTOP8)', mode_paste: 'Incolla lista',
    btn_translate: 'Traduci', btn_fetching: 'Caricamento...', btn_translating: 'Traduzione...',
  },
  es: {
    hero_title_1: 'Traduce tus mazos', hero_title_2: 'a tu idioma',
    hero_sub: 'Importa un mazo desde Archidekt, Moxfield, MTGTOP8 o Tappedout — o pega tu lista. Nombres traducidos en segundos con Scryfall.',
    feat_url: 'Import URL', feat_url_desc: 'Pega una URL de Archidekt, Moxfield, MTGTOP8 o Tappedout y obtén la lista traducida al instante.',
    feat_lang: '15 idiomas', feat_lang_desc: 'Francés, Alemán, Español, Italiano, Portugués, Japonés, Coreano, Ruso y más.',
    feat_coll: 'Seguimiento de colección', feat_coll_desc: 'Importa tu CSV de Manabox, DragonShield o Moxfield para ver qué cartas ya posees.',
    recent: 'Mazos recientes', clear_all: 'Borrar todo', cards: 'cartas', owned: 'poseídas',
    today: 'Hoy', yesterday: 'Ayer', days_ago: n => `Hace ${n} días`,
    mode_url: 'URL (Archidekt / MTGTOP8)', mode_paste: 'Pegar lista',
    btn_translate: 'Traducir', btn_fetching: 'Cargando...', btn_translating: 'Traduciendo...',
  },
  pt: {
    hero_title_1: 'Traduza seus decks', hero_title_2: 'no seu idioma',
    hero_sub: 'Importe um deck do Archidekt, Moxfield, MTGTOP8 ou Tappedout — ou cole sua lista. Nomes traduzidos em segundos via Scryfall.',
    feat_url: 'Import URL', feat_url_desc: 'Cole uma URL do Archidekt, Moxfield, MTGTOP8 ou Tappedout e obtenha a lista traduzida instantaneamente.',
    feat_lang: '15 idiomas', feat_lang_desc: 'Francês, Alemão, Espanhol, Italiano, Português, Japonês, Coreano, Russo e mais.',
    feat_coll: 'Rastrear coleção', feat_coll_desc: 'Importe seu CSV do Manabox, DragonShield ou Moxfield para ver quais cartas você já possui.',
    recent: 'Decks recentes', clear_all: 'Limpar tudo', cards: 'cartas', owned: 'possuídas',
    today: 'Hoje', yesterday: 'Ontem', days_ago: n => `Há ${n} dias`,
    mode_url: 'URL (Archidekt / MTGTOP8)', mode_paste: 'Colar lista',
    btn_translate: 'Traduzir', btn_fetching: 'Carregando...', btn_translating: 'Traduzindo...',
  },
  ja: {
    hero_title_1: 'デッキを翻訳する', hero_title_2: 'あなたの言語で',
    hero_sub: 'Archidekt、Moxfield、MTGTOP8、TappedoutのURLを貼り付けるか、リストを直接入力。Scryfallで数秒で翻訳。',
    feat_url: 'URLインポート', feat_url_desc: 'Archidekt、Moxfield、MTGTOP8、TappedoutのURLを貼り付けると即座に翻訳済みリストを取得。',
    feat_lang: '15言語', feat_lang_desc: 'フランス語、ドイツ語、スペイン語、イタリア語、ポルトガル語、日本語、韓国語、ロシア語など。',
    feat_coll: 'コレクション管理', feat_coll_desc: 'Manabox、DragonShield、MoxfieldのCSVをインポートして所持カードを確認。',
    recent: '最近のデッキ', clear_all: 'すべて削除', cards: 'カード', owned: '所有',
    today: '今日', yesterday: '昨日', days_ago: n => `${n}日前`,
    mode_url: 'URL (Archidekt / MTGTOP8)', mode_paste: 'リストを貼り付け',
    btn_translate: '翻訳', btn_fetching: '取得中...', btn_translating: '翻訳中...',
  },
  ko: {
    hero_title_1: '덱을 번역하세요', hero_title_2: '당신의 언어로',
    hero_sub: 'Archidekt, Moxfield, MTGTOP8 또는 Tappedout에서 덱을 가져오거나 목록을 붙여넣으세요. Scryfall로 몇 초 만에 번역됩니다.',
    feat_url: 'URL 가져오기', feat_url_desc: 'Archidekt, Moxfield, MTGTOP8 또는 Tappedout URL을 붙여넣으면 즉시 번역된 목록을 얻을 수 있습니다.',
    feat_lang: '15개 언어', feat_lang_desc: '프랑스어, 독일어, 스페인어, 이탈리아어, 포르투갈어, 일본어, 한국어, 러시아어 등.',
    feat_coll: '컬렉션 추적', feat_coll_desc: 'Manabox, DragonShield 또는 Moxfield CSV를 가져와 이미 보유한 카드를 확인하세요.',
    recent: '최근 덱', clear_all: '모두 지우기', cards: '카드', owned: '보유',
    today: '오늘', yesterday: '어제', days_ago: n => `${n}일 전`,
    mode_url: 'URL (Archidekt / MTGTOP8)', mode_paste: '목록 붙여넣기',
    btn_translate: '번역', btn_fetching: '불러오는 중...', btn_translating: '번역 중...',
  },
  ru: {
    hero_title_1: 'Переводите свои деки', hero_title_2: 'на ваш язык',
    hero_sub: 'Импортируйте дек с Archidekt, Moxfield, MTGTOP8 или Tappedout — или вставьте список. Названия переведены за секунды через Scryfall.',
    feat_url: 'Импорт URL', feat_url_desc: 'Вставьте URL Archidekt, Moxfield, MTGTOP8 или Tappedout и мгновенно получите переведённый список.',
    feat_lang: '15 языков', feat_lang_desc: 'Французский, Немецкий, Испанский, Итальянский, Португальский, Японский, Корейский, Русский и другие.',
    feat_coll: 'Отслеживание коллекции', feat_coll_desc: 'Импортируйте CSV из Manabox, DragonShield или Moxfield чтобы видеть уже имеющиеся карты.',
    recent: 'Последние деки', clear_all: 'Очистить всё', cards: 'карт', owned: 'есть',
    today: 'Сегодня', yesterday: 'Вчера', days_ago: n => `${n} дн. назад`,
    mode_url: 'URL (Archidekt / MTGTOP8)', mode_paste: 'Вставить список',
    btn_translate: 'Перевести', btn_fetching: 'Загрузка...', btn_translating: 'Перевод...',
  },
}

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

// --- Hero art ---
const heroArtUrl = ref(null)
onMounted(async () => {
  try {
    const r = await fetch('https://api.scryfall.com/cards/random?q=is:commander+order:edhrec+rarity:m')
    if (r.ok) {
      const d = await r.json()
      heroArtUrl.value = d.image_uris?.art_crop ?? d.card_faces?.[0]?.image_uris?.art_crop ?? null
    }
  } catch {}
})

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
const i18n = computed(() => LANDING_I18N[language.value] || LANDING_I18N.fr)

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
    const coverCard = cards.value.find(c => c.category === 'Commander') || cards.value[0]
    addToHistory({
      deckId: deckId.value,
      deckName: deckName.value,
      date: new Date().toISOString(),
      ownedCount: 0,
      totalCount: cards.value.length,
      inputMode: inputMode.value,
      url: inputMode.value === 'url' ? urlInput.value : undefined,
      pasteText: inputMode.value === 'paste' ? extra?.pasteText : undefined,
      coverImageUrl: coverCard?.imageUrl || null,
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
  if (diffDays === 0) return i18n.value.today
  if (diffDays === 1) return i18n.value.yesterday
  if (diffDays < 7) return i18n.value.days_ago(diffDays)
  const localeMap = { fr: 'fr-FR', de: 'de-DE', es: 'es-ES', it: 'it-IT', pt: 'pt-PT', ja: 'ja-JP', ko: 'ko-KR', ru: 'ru-RU' }
  return d.toLocaleDateString(localeMap[language.value] || 'en-US', { day: 'numeric', month: 'short' })
}

function getCoverForEntry(entry) {
  if (entry.coverImageUrl) return entry.coverImageUrl
  const cached = getCachedCards(entry.deckId)
  if (!cached?.length) return null
  const commander = cached.find(c => c.category === 'Commander')
  return (commander || cached[0])?.imageUrl || null
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
  align-items: stretch;
}

/* ── Hero section — sombre, pleine largeur ────────────── */
.lp-hero-section {
  position: relative;
  width: 100%;
  min-height: 62vh;
  background: linear-gradient(160deg, #0c1628 0%, #182a44 55%, #0e2038 100%);
  display: flex;
  justify-content: center;
  overflow: hidden;
}

.lp-hero-art {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center 30%;
  opacity: 0.3;
  filter: saturate(0.45) brightness(0.55);
}

/* gradient en bas pour fondre l'art dans le reste de la page */
.lp-hero-section::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 120px;
  background: linear-gradient(to bottom, transparent, var(--bg));
  z-index: 1;
}

.lp-hero-inner {
  position: relative;
  z-index: 2;
  max-width: 680px;
  width: 100%;
  padding: 80px 24px 72px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
}

.lp-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 14px;
  background: rgba(79, 127, 255, 0.18);
  border: 1px solid rgba(79, 127, 255, 0.3);
  color: rgba(180, 210, 255, 0.92);
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.lp-title {
  font-size: clamp(30px, 5vw, 48px);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.1;
  color: #fff;
}

.lp-accent { color: #7aadff; }

.lp-sub {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.7;
  max-width: 480px;
}

/* Input wrap — sur fond sombre */
.input-wrap {
  width: 100%;
  max-width: 620px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 8px;
}

/* ── Contenu sous le hero ─────────────────────────────── */
.lp-content {
  width: 100%;
  max-width: 800px;
  align-self: center;
  padding: 52px 24px 80px;
  display: flex;
  flex-direction: column;
  gap: 48px;
}

/* ── Feature cards ────────────────────────────────────── */
.lp-features {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.lp-feat {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 22px 20px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.lp-feat:hover {
  border-color: var(--accent);
  box-shadow: 0 4px 20px rgba(79, 127, 255, 0.1);
}

.lf-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  background: var(--accent-subtle);
  color: var(--accent);
  flex-shrink: 0;
}

.lf-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.lf-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-1);
  letter-spacing: -0.01em;
}

.lf-desc {
  font-size: 13px;
  color: var(--text-2);
  line-height: 1.55;
}

/* ── Recent history ───────────────────────────────────── */
.lp-recent {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.lp-recent-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.lp-recent-title {
  font-size: 14px;
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
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 10px;
}

/* Deck card */
.lp-deck-card {
  position: relative;
  display: flex;
  flex-direction: column;
  text-align: left;
  padding: 14px 16px;
  min-height: 130px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  overflow: hidden;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast), transform var(--transition-fast);
}

.lp-deck-card:hover {
  border-color: var(--accent);
  box-shadow: 0 4px 20px rgba(79, 127, 255, 0.14);
  transform: translateY(-2px);
}

/* Background art */
.ldc-art {
  position: absolute;
  inset: 0;
  z-index: 0;
  background-size: cover;
  background-position: center 20%;
  opacity: 0.13;
  filter: saturate(0.65) brightness(1.05);
  transition: opacity 300ms ease;
}

.lp-deck-card:hover .ldc-art {
  opacity: 0.26;
}

/* Content above art */
.ldc-body {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
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
  font-size: 14px;
  font-weight: 600;
  color: var(--text-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: -0.02em;
  flex: 1;
}

.ldc-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: auto;
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
