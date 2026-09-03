<template>
  <div class="cmd-app">

    <!-- History overlay -->
    <Transition name="history-fade">
      <HistoryPanel
        v-if="showHistory"
        :history="history"
        @load="onLoadFromHistory"
        @clear="clearHistory"
        @close="showHistory = false"
      />
    </Transition>

    <div class="cmd-layout">

      <!-- ══ LEFT PANEL ══════════════════════════════════ -->
      <!-- Collant uniquement sur l'écran deck : sur la landing, la carte
           d'entrée fait 642px et figeait les trois quarts de l'écran pendant
           que les decks récents défilaient dessous. -->
      <div class="cmd-left" :class="{ 'cmd-left--deck': status === 'done' }">

        <!-- LANDING LEFT -->
        <template v-if="status !== 'done'">
          <div class="lp-left">

            <!-- Top bar: brand + controls -->
            <div class="lpl-topbar">
              <div class="lpl-brand">
                <div class="lpl-logo">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <rect x="1" y="1" width="14" height="14" rx="3" fill="var(--accent-fill-hover)" stroke="var(--accent)" stroke-width="1.2"/>
                    <path d="M4 6h8M4 9h5" stroke="var(--accent)" stroke-width="1.3" stroke-linecap="round"/>
                  </svg>
                </div>
                <div>
                  <div class="lpl-name">MTG Translator</div>
                  <div class="lpl-free">{{ i18n.free_badge }}</div>
                </div>
              </div>
              <div class="lpl-top-actions">
                <button class="lpl-icon-btn" :title="showHistory ? 'Fermer l\'historique' : 'Historique'" @click="showHistory = !showHistory">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.3"/>
                    <path d="M8 5v3.5l2 1.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
                <button class="lpl-icon-btn" :title="theme === 'dark' ? 'Mode clair' : 'Mode sombre'" @click="toggleTheme">
                  <svg v-if="theme === 'dark'" width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="3" stroke="currentColor" stroke-width="1.3"/>
                    <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.1 3.1l1.1 1.1M11.8 11.8l1.1 1.1M3.1 12.9l1.1-1.1M11.8 4.2l1.1-1.1" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
                  </svg>
                  <svg v-else width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M13.5 9A6.5 6.5 0 0 1 7 2.5a6.5 6.5 0 1 0 6.5 6.5z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Hero text -->
            <div class="lpl-hero">
              <h1 class="lpl-title">
                {{ i18n.hero_title_1 }}<br>
                <span class="lpl-grad">{{ i18n.hero_title_2 }}</span>
              </h1>
              <p class="lpl-sub">{{ i18n.hero_sub }}</p>
            </div>

            <!-- Un revenant sur téléphone revient au même deck : ses courses
                 se font en plusieurs fois. L'historique vivait dans le panneau
                 droit, à y=622, donc systématiquement sous le pli. -->
            <div v-if="history.length" class="lpl-resume">
              <div class="lpl-resume-label">REPRENDRE</div>
              <div class="lpl-resume-row">
                <button
                  v-for="entry in history.slice(0, 4)"
                  :key="entry.deckId"
                  class="lpl-resume-chip"
                  @click="onLoadFromHistory(entry)"
                >
                  <span class="lpl-resume-pips" aria-hidden="true">
                    <span
                      v-for="c in (entry.deckColors || [])"
                      :key="c"
                      class="lpl-resume-pip"
                      :style="MTG_COLOR_STYLES[c]"
                    />
                  </span>
                  <span class="lpl-resume-name">{{ entry.deckName }}</span>
                  <span class="lpl-resume-count">{{ entry.cardCount || '' }}</span>
                </button>
              </div>
            </div>

            <!-- Input section -->
            <div class="lpl-input-section">
              <div class="lpl-input-card" :class="{ 'is-folded': foldInputCard }">
                <div class="lpl-mode-tabs">
                  <button
                    class="lpl-mode-tab"
                    :class="{ active: inputMode === 'url' }"
                    @click="inputMode = 'url'"
                  >
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M6 4H4a2 2 0 0 0 0 4h2M10 4h2a2 2 0 0 1 0 4h-2M5 8h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                    {{ i18n.tab_url }}
                  </button>
                  <button
                    class="lpl-mode-tab"
                    :class="{ active: inputMode === 'paste' }"
                    @click="inputMode = 'paste'"
                  >
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M2 5h12M2 8.5h8M2 12h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                    {{ i18n.tab_paste }}
                  </button>
                </div>
                <div v-if="inputMode === 'url'" class="lpl-url-row">
                  <svg class="lpl-url-icon" width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.4"/>
                    <path d="M11 11l3 3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
                  </svg>
                  <input
                    class="lpl-url-input"
                    type="url"
                    placeholder="https://archidekt.com/decks/…"
                    :value="urlInput"
                    :disabled="isLoading"
                    @input="urlInput = $event.target.value"
                    @keydown.enter="onTranslate"
                  />
                </div>
                <textarea
                  v-else
                  class="lpl-paste-input"
                  :value="pasteInput"
                  :disabled="isLoading"
                  spellcheck="false"
                  autocomplete="off"
                  :placeholder="pasteTextareaPlaceholder"
                  @input="pasteInput = $event.target.value"
                  @keydown.ctrl.enter.prevent="onTranslate"
                  @keydown.meta.enter.prevent="onTranslate"
                />

                <!-- Card footer: language + translate -->
                <div class="lpl-card-footer">
                  <div class="lpl-footer-lang">
                    <span class="lpl-lang-label">Traduire en</span>
                    <LanguageSelector :model-value="language" @update:model-value="setLanguage" />
                  </div>
                  <button
                    class="lpl-translate-btn"
                    :disabled="isInputEmpty || isLoading"
                    @click="onTranslate"
                  >
                    <span v-if="isLoading" class="lpl-spinner"/>
                    <template v-else>
                      {{ i18n.btn_translate }}
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </template>
                    <span v-if="isLoading" class="lpl-loading-text">{{ i18n.btn_fetching }}</span>
                  </button>
                </div>
              </div>

              <!-- Un seul chemin par adresse : le bouton lit le presse-papier et
                   n'ouvre le champ que s'il n'y trouve rien. Deux boutons pour la
                   même intention décrivaient un mécanisme, pas un usage.
                   Jamais au chargement : Chrome afficherait une demande de
                   permission intrusive. -->
              <button v-if="canPaste && !isLoading" class="lpl-paste-btn" @click="pasteFromClipboard">
                <svg width="17" height="17" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <rect x="5" y="3" width="10" height="14" rx="2" stroke="currentColor" stroke-width="1.6"/>
                  <path d="M8 3h4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                </svg>
                <span class="lpl-paste-label">Coller un lien de deck</span>
                <svg class="lpl-paste-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>

              <button v-if="!isLoading" class="lpl-list-btn" @click="inputMode = 'paste'">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M2 4h12M2 8h8M2 12h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                Coller une liste de cartes
              </button>

              <!-- Le partage natif n'existe qu'une fois l'app posée sur l'écran
                   d'accueil, et seulement là où le navigateur le propose. On
                   invite donc à installer, avec le bénéfice comme argument,
                   plutôt que d'annoncer une fonction indisponible. -->
              <div v-if="canInstall" class="lpl-install">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M10 13V3M6.5 6.2L10 2.7l3.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M3.5 12.5v3a1.5 1.5 0 0 0 1.5 1.5h10a1.5 1.5 0 0 0 1.5-1.5v-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                <p>Ajoutez l’app à votre écran d’accueil : vos decks s’enverront depuis Archidekt en un geste.</p>
                <button @click="promptInstall">Installer</button>
              </div>

              <!-- Sans URL sous la main, le visiteur n'a rien à faire : cul-de-sac. -->
              <button v-if="!isLoading" class="lpl-example" @click="loadExample">
                {{ i18n.try_example }}
              </button>

              <!-- Keyboard hint -->
              <div v-if="inputMode === 'paste' && !isLoading" class="lpl-kbd-hint">
                <kbd>Ctrl</kbd><span>+</span><kbd>↵</kbd> pour traduire
              </div>

              <!-- Progress -->
              <ProgressBar v-if="status === 'translating'" :progress="progress" variant="translation"/>

              <!-- Banners -->
              <div v-if="unparseableLines.length && status !== 'idle'" class="lpl-banner lpl-banner-warn">
                {{ unparseableLines.length }} ligne(s) ignorée(s) : {{ unparseableLines.slice(0, 2).join(', ') }}{{ unparseableLines.length > 2 ? '…' : '' }}
              </div>
              <div v-if="status === 'error'" class="lpl-banner lpl-banner-err">{{ error }}</div>
            </div>

            <!-- Bottom bar -->
            <div class="lpl-bottom">
              <div class="lpl-platforms">
                <span>Archidekt</span>
                <span class="lpl-dot">·</span>
                <span>Moxfield</span>
                <span class="lpl-dot">·</span>
                <span>MTGTOP8</span>
              </div>
            </div>
          </div>
        </template>

        <!-- DECK LEFT -->
        <template v-else>
          <div class="dk-left">

            <!-- Il n'y a pas de liste de decks : ce bouton ramène au formulaire. -->
            <button class="dk-back" @click="resetDeck">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M9 2L3 7l6 5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Nouveau deck
            </button>

            <div class="dk-info">
              <h2 class="dk-name">{{ deckName }}</h2>
              <div class="dk-stats">
                <span class="dk-stat">{{ cards.length }} cartes</span>
                <span v-if="totalPrice > 0" class="dk-stat dk-stat-price">{{ formatPrice(totalPrice) }}</span>
                <span class="dk-stat dk-stat-owned">{{ ownedCount }} / {{ cards.length }} poss.</span>
                <span v-if="missingPrice > 0" class="dk-stat dk-stat-missing">manque {{ formatPrice(missingPrice) }}</span>
              </div>
              <!-- Changer de langue imposait auparavant de quitter le deck. -->
              <div class="dk-lang">
                <LanguageSelector :model-value="language" @update:model-value="onChangeLanguage" />
              </div>
            </div>

            <!-- Sur téléphone, tout ceci s'empilait au-dessus de la liste :
                 il fallait faire défiler cinq cents pixels d'outils avant de
                 voir une carte. Replié par défaut, déplié d'un geste. -->
            <button class="dk-more" :aria-expanded="panelOpen" @click="panelOpen = !panelOpen">
              {{ panelOpen ? 'Masquer les options' : 'Ma collection, filtres, recherche' }}
              <span class="dk-more-chevron" :class="{ open: panelOpen }" aria-hidden="true">⌄</span>
            </button>

            <div class="dk-left-body" :class="{ open: panelOpen }">

            <!-- Étape 2 du parcours, donc deuxième bloc du rail. Elle était
                 en septième position, sous la ligne de flottaison d'un 13". -->
            <div class="dk-collection">
              <div class="dk-coll-header">
                <span class="dk-coll-label">CE QUE VOUS AVEZ</span>
                <span class="dk-coll-pct">{{ ownedPct }}%</span>
              </div>
              <div class="dk-coll-stats">{{ ownedCount }} / {{ cards.length }} poss.</div>
              <div class="dk-coll-track">
                <div class="dk-coll-fill" :style="{ width: ownedPct + '%' }"/>
              </div>
              <p v-if="ownedCount === 0" class="dk-coll-hint">
                Dites-nous ce que vous avez déjà, pour ne pas le racheter.
                On s’en souviendra pour vos prochains decks.
              </p>
              <p v-else-if="manualSize > 0" class="dk-coll-hint">
                {{ totalKnown }} cartes connues, appliquées automatiquement à
                chaque nouveau deck.
                <button class="dk-coll-link" @click="onForgetCollection">Oublier</button>
              </p>
              <button
                v-if="missingCards.length"
                class="dk-point-btn"
                @click="pointing = true"
              >Vérifier mes cartes une par une</button>
              <p v-if="missingCards.length" class="dk-point-hint">
                L’app vous montre chaque carte en image, vous répondez
                « je l’ai » ou « je ne l’ai pas ». Pratique devant vos boîtes.
              </p>
              <CollectionImport @apply="applyCollection"/>
            </div>

            <div class="dk-sep"/>

            </div>
          </div>
        </template>
      </div>

      <!-- ══ RIGHT PANEL ═════════════════════════════════ -->
      <div ref="cmdRight" class="cmd-right">
        <Transition name="bg-fade">
          <div
            v-if="status === 'done' && deckBgUrl"
            class="cmd-right-bg"
            :style="{ backgroundImage: `url(${deckBgUrl})` }"
          />
        </Transition>

        <!-- LANDING RIGHT -->
        <template v-if="status !== 'done'">
          <div class="lp-right">

            <!-- Recent decks -->
            <div v-if="history.length" class="lpr-section lpr-section--history">
              <div class="lpr-section-head">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.3"/>
                  <path d="M8 5v3.5l2 1.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <h2 class="lpr-section-title">{{ i18n.recent }}</h2>
                <button class="lpr-clear" @click="clearHistory">{{ i18n.clear_all }}</button>
              </div>
              <div class="lpr-grid">
                <button
                  v-for="entry in history.slice(0, 6)"
                  :key="entry.deckId"
                  class="lpr-card"
                  @click="onLoadFromHistory(entry)"
                >
                  <div
                    v-if="getCoverForEntry(entry)"
                    class="lpr-card-art"
                    :style="{ backgroundImage: `url(${getCoverForEntry(entry)})` }"
                  />
                  <div class="lpr-card-body">
                    <div class="lpr-card-top">
                      <span class="lpr-card-badge">{{ formatDate(entry.date) }}</span>
                    </div>
                    <div class="lpr-card-bottom">
                      <div v-if="(entry.deckColors || []).length" class="lpr-card-colors">
                        <span
                          v-for="color in (entry.deckColors || [])"
                          :key="color"
                          class="lpr-color-pip"
                          :style="MTG_COLOR_STYLES[color]"
                        />
                      </div>
                      <span class="lpr-card-count">{{ entry.totalCount }} cartes</span>
                      <span class="lpr-card-name">{{ entry.deckName }}</span>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <!-- Pendant la traduction, la seule chose qui bouge à l'écran
                 était une barre de 350px en bas à gauche, tandis que 60 % de
                 la surface affichait encore le mode d'emploi. -->
            <div v-if="isLoading" class="lpr-loading">
              <div class="lpr-loading-head">
                <span class="lpr-step-num" aria-hidden="true">1</span>
                <div>
                  <div class="lpr-step-title">{{ status === 'translating' ? i18n.btn_translating : i18n.btn_fetching }}</div>
                  <div class="lpr-step-desc">
                    {{ status === 'translating'
                      ? `${progress.current} / ${progress.total} cartes`
                      : 'Récupération du deck depuis la source…' }}
                  </div>
                </div>
              </div>
              <div class="lpr-skel-list">
                <div v-for="i in 8" :key="i" class="lpr-skel" :style="{ animationDelay: i * 60 + 'ms' }"/>
              </div>
            </div>

            <!-- Comment ça marche — remplace l'ancien bloc « Capacités ».
                 Trois fonctions listées à poids égal ne disent pas dans quel
                 ordre s'en servir ; un chemin numéroté, si. C'est le fil rouge,
                 annoncé avant même d'entrer. -->
            <div v-if="!isLoading" class="lpr-section">
              <div class="lpr-section-head">
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <h2 class="lpr-section-title">{{ i18n.how_title }}</h2>
              </div>
              <ol class="lpr-steps">
                <li v-for="(step, i) in steps" :key="i" class="lpr-step">
                  <span class="lpr-step-num" aria-hidden="true">{{ i + 1 }}</span>
                  <div>
                    <div class="lpr-step-title">{{ step.title }}</div>
                    <div class="lpr-step-desc">{{ step.desc }}</div>
                  </div>
                </li>
              </ol>

              <!-- Collection persistante affichée dès l'accueil : c'est elle
                   qui fait la différence entre un utilitaire à usage unique et
                   un outil où l'on revient. -->
              <div class="lpr-foot">
              <div v-if="hasAnyCollection" class="lpr-coll">
                <div class="lpr-coll-head">
                  <span class="lpr-coll-dot" aria-hidden="true">✓</span>
                  <strong>{{ totalKnown }} cartes</strong> dans votre collection
                </div>
                <p class="lpr-coll-sub">Elle sera appliquée automatiquement à votre prochain deck.</p>
                <button class="lpr-coll-btn" @click="downloadCollection">Exporter en .csv</button>
              </div>

              <!-- Le drapeau « pas de version française » est ce qu'aucun autre
                   outil n'affiche : il ne peut pas rester un badge découvert à
                   la quarantième ligne d'un deck. -->
              <p class="lpr-nofr-pitch">
                <span aria-hidden="true">⚠</span> {{ i18n.nofr_pitch }}
              </p>
              </div>
            </div>

          </div>
        </template>

        <!-- DECK RIGHT -->
        <template v-else>
          <div class="dk-right">

            <!-- Depuis mi-2022, une part croissante des cartes n'a aucune
                 impression dans les langues autres que l'anglais. Le joueur ne
                 le découvrait qu'au moment de commander. -->
            <div v-if="noFrCount > 0 && !noFrDismissed" class="dk-nofr">
              <span class="dk-nofr-icon" aria-hidden="true">⚠</span>
              <p class="dk-nofr-text">
                <strong>{{ noFrCount }}</strong>
                <span class="dk-nofr-long">{{ noFrCount > 1 ? 'cartes de ce deck n’existent pas' : 'carte de ce deck n’existe pas' }} en {{ currentLanguageLabel }}.</span>
                <span class="dk-nofr-short">sans version {{ currentLanguageLabel.toLowerCase() }}</span>
                <span class="dk-nofr-sub">Leur nom anglais est conservé — c’est celui à donner au vendeur.</span>
              </p>
              <button class="dk-nofr-btn" @click="toggleNoFrFilter">
                {{ activeFilter === 'nofr' ? 'Afficher tout' : 'Voir lesquelles' }}
              </button>
              <button class="dk-nofr-close" aria-label="Masquer cet avertissement" @click="noFrDismissed = true">×</button>
            </div>

            <!-- Un contrôle qui pilote la liste se pose sur la liste, pas dans
                 un rail à mille pixels de là. Et avec des libellés : trois
                 icônes muettes ne disent pas ce qu'elles font. -->
            <div v-if="!pointing" class="dk-toolbar">
              <div class="dk-views" role="group" aria-label="Affichage">
                <button
                  v-for="v in LAYOUTS"
                  :key="v.value"
                  class="dk-view-btn"
                  :class="{ active: layout === v.value }"
                  :aria-pressed="layout === v.value"
                  @click="layout = v.value"
                >{{ v.label }}</button>
              </div>
            <!-- Les filtres passent devant la recherche : « À trouver » est
                   l'information la plus consultée, la recherche est ponctuelle. -->
              <div class="dk-filters">
                <button
                  v-for="tab in DK_TABS"
                  :key="tab.value"
                  class="dk-filter-btn"
                  :class="{ active: activeFilter === tab.value }"
                  @click="activeFilter = tab.value"
                >
                  <span class="dkf-label">{{ tab.label }}</span>
                  <span class="dkf-count">{{ filterCounts[tab.value] }}</span>
                </button>
              </div>

              <div class="dk-search">
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <circle cx="6" cy="6" r="4" stroke="currentColor" stroke-width="1.3"/>
                  <path d="M9.5 9.5l2.5 2.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
                </svg>
                <input
                  class="dk-search-input"
                  :value="search"
                  placeholder="Chercher une carte..."
                  @input="search = $event.target.value"
                />
                <button v-if="search" class="dk-search-clear" aria-label="Effacer la recherche" @click="search = ''">
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                    <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
                  </svg>
                </button>
              </div>
              <label class="dk-sort">
                <span class="dk-sort-label">Trier</span>
                <select class="dk-sort-select" :value="sort" @change="sort = $event.target.value">
                  <option value="category">Catégorie</option>
                  <option value="price">Prix décroissant</option>
                </select>
              </label>
            </div>

            <div v-if="pointing" class="dk-scroll">
              <PointingMode
                :cards="missingCards"
                @own="onPointOwned"
                @close="pointing = false"
              />
            </div>

            <div v-else class="dk-scroll">
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
              <VisualPanel
                v-else
                :cards="cards"
                :checked-map="checkedMap"
                :filter="activeFilter"
                :search="search"
                :sort="sort"
                @toggle="toggleCard"
              />
            </div>

            <!-- Sur téléphone il n'y a qu'une zone, pas deux : empiler le rail
                 du bureau puis le replier dans un tiroir donnait 35 % de
                 l'écran en chrome permanent et enfermait l'étape 2 dans un
                 accordéon fermé — pendant que la barre du bas réclamait de la
                 faire. Les trois étapes deviennent trois destinations, dans
                 l'arc du pouce. -->
            <nav class="mob-tabs" aria-label="Étapes">
              <button
                class="mob-tab"
                :class="{ active: !pointing && !showCardmarket }"
                @click="pointing = false"
              >
                <span class="mob-tab-icon" aria-hidden="true">📋</span>
                <span class="mob-tab-label">Liste</span>
              </button>
              <button
                class="mob-tab"
                :class="{ active: pointing }"
                :disabled="!missingCards.length"
                @click="pointing = true"
              >
                <span class="mob-tab-icon" aria-hidden="true">✋</span>
                <span class="mob-tab-label">Pointer</span>
                <span v-if="missingCards.length" class="mob-tab-badge">{{ missingCards.length }}</span>
              </button>
              <button
                class="mob-tab"
                :disabled="!missingCards.length"
                @click="exportBuyCardmarket"
              >
                <span class="mob-tab-icon" aria-hidden="true">🛒</span>
                <span class="mob-tab-label">Ma liste</span>
                <span v-if="missingPrice > 0" class="mob-tab-badge">{{ formatPrice(missingPrice) }}</span>
              </button>
            </nav>

            <!-- Le fil rouge : une seule action suivante, qui change selon
                 l'état. On ne propose pas d'acheter un deck entier à quelqu'un
                 qui n'a pas encore dit ce qu'il possédait. -->
            <div v-if="!pointing" class="dk-bar">
              <p class="dk-bar-text">
                <template v-if="missingCards.length === 0 && cards.length">
                  <strong>Vous avez déjà tout ce deck.</strong>
                </template>
                <template v-else-if="ownedCount === 0">
                  <strong>Étape 2 sur 3</strong> — dites-nous ce que vous possédez déjà.
                </template>
                <template v-else>
                  Il vous manque <strong>{{ missingCards.length }} cartes</strong>
                  <span v-if="missingPrice > 0"> · {{ formatPrice(missingPrice) }}</span>
                </template>
              </p>
              <div class="dk-bar-actions">
                <button
                  v-if="missingCards.length"
                  class="dk-bar-primary"
                  @click="exportBuyCardmarket"
                >Copier pour Cardmarket</button>
                <div class="dk-menu">
                  <button class="dk-menu-btn" aria-haspopup="true" :aria-expanded="showMenu" @click="showMenu = !showMenu">…</button>
                  <div v-if="showMenu" class="dk-menu-list">
                    <button @click="runMenu(exportAll)">Copier la liste complète</button>
                    <button @click="runMenu(exportDownload)">Exporter en .txt</button>
                    <button @click="runMenu(exportPrint)">Imprimer</button>
                    <button class="dk-menu-sort" @click="showMenu = false">
                      Trier :
                      <select :value="sort" @click.stop @change="sort = $event.target.value">
                        <option value="category">Catégorie</option>
                        <option value="price">Prix décroissant</option>
                      </select>
                    </button>
                    <button v-if="hasAnyCollection" @click="runMenu(downloadCollection)">Exporter ma collection (.csv)</button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </template>

      </div>
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
    hero_title_1: 'Ne rachetez pas', hero_title_2: 'ce que vous avez déjà.',
    hero_sub: 'Collez le lien de votre deck : on traduit les noms en français, vous cochez ce que vous possédez, et vous repartez avec la liste à acheter — prête pour Cardmarket.',
    free_badge: 'GRATUIT · SANS COMPTE', how_title: 'COMMENT ÇA MARCHE',
    step1: 'Collez le lien de votre deck', step1_desc: 'Archidekt · Moxfield · MTGTOP8 · Tappedout — ou votre liste au format texte.',
    step2: 'Cochez ce que vous possédez', step2_desc: 'Pointage rapide carte par carte, ou import de votre collection en CSV.',
    step3: 'Récupérez votre liste de courses', step3_desc: 'Uniquement ce qu’il vous manque, prêt à coller dans une Wantlist Cardmarket.',
    nofr_pitch: 'Certaines cartes n’existent pas dans votre langue. On vous le dit avant que vous les cherchiez pour rien.', try_example: 'Voir un deck d’exemple',
    tab_url: 'Lien de deck', tab_paste: 'Coller une liste',
    recent: 'Decks récents', clear_all: 'Effacer tout', cards: 'cartes', owned: 'possédées',
    today: "Aujourd'hui", yesterday: 'Hier', days_ago: n => `Il y a ${n}j`,
    mode_url: 'URL (Archidekt / MTGTOP8)', mode_paste: 'Coller une liste', mode_paste_short: 'Liste',
    paste_hint: 'Collez votre liste ci-dessous…',
    btn_translate: 'Traduire ce deck', btn_fetching: 'Récupération…', btn_translating: 'Traduction…',
  },
  de: {
    hero_title_1: 'Kauf nicht doppelt,', hero_title_2: 'was du schon hast.',
    hero_sub: 'Füge den Link deines Decks ein: Wir übersetzen die Namen, du hakst ab, was du besitzt, und bekommst die Einkaufsliste — bereit für Cardmarket.',
    free_badge: 'KOSTENLOS · OHNE KONTO', how_title: 'SO FUNKTIONIERT ES',
    step1: 'Deck-Link einfügen', step1_desc: 'Archidekt · Moxfield · MTGTOP8 · Tappedout — oder deine Liste als Text.',
    step2: 'Abhaken, was du besitzt', step2_desc: 'Karte für Karte, oder Sammlung als CSV importieren.',
    step3: 'Einkaufsliste erhalten', step3_desc: 'Nur was dir fehlt, bereit für eine Cardmarket-Wantlist.',
    nofr_pitch: 'Manche Karten gibt es in deiner Sprache nicht. Wir sagen es dir vorher.', try_example: 'Beispiel-Deck ansehen',
    tab_url: 'Deck-Link', tab_paste: 'Liste einfügen',
    recent: 'Letzte Decks', clear_all: 'Alle löschen', cards: 'Karten', owned: 'besessen',
    today: 'Heute', yesterday: 'Gestern', days_ago: n => `Vor ${n} Tagen`,
    mode_url: 'URL (Archidekt / MTGTOP8)', mode_paste: 'Liste einfügen', mode_paste_short: 'Liste',
    btn_translate: 'Deck übersetzen', btn_fetching: 'Laden...', btn_translating: 'Übersetzen...',
  },
  it: {
    hero_title_1: 'Non ricomprare', hero_title_2: 'ciò che hai già.',
    hero_sub: 'Incolla il link del tuo mazzo: traduciamo i nomi, tu spunti ciò che possiedi e ottieni la lista da comprare — pronta per Cardmarket.',
    free_badge: 'GRATUITO · SENZA ACCOUNT', how_title: 'COME FUNZIONA',
    step1: 'Incolla il link del mazzo', step1_desc: 'Archidekt · Moxfield · MTGTOP8 · Tappedout — o la tua lista in testo.',
    step2: 'Spunta ciò che possiedi', step2_desc: 'Carta per carta, o importa la collezione in CSV.',
    step3: 'Ottieni la lista della spesa', step3_desc: 'Solo ciò che manca, pronto per una Wantlist Cardmarket.',
    nofr_pitch: 'Alcune carte non esistono nella tua lingua. Te lo diciamo prima.', try_example: 'Vedi un mazzo d’esempio',
    tab_url: 'Link del mazzo', tab_paste: 'Incolla una lista',
    recent: 'Deck recenti', clear_all: 'Cancella tutto', cards: 'carte', owned: 'possedute',
    today: 'Oggi', yesterday: 'Ieri', days_ago: n => `${n} giorni fa`,
    mode_url: 'URL (Archidekt / MTGTOP8)', mode_paste: 'Incolla lista',
    btn_translate: 'Traduci il mazzo', btn_fetching: 'Caricamento...', btn_translating: 'Traduzione...',
  },
  es: {
    hero_title_1: 'No vuelvas a comprar', hero_title_2: 'lo que ya tienes.',
    hero_sub: 'Pega el enlace de tu mazo: traducimos los nombres, marcas lo que tienes y te llevas la lista de compra — lista para Cardmarket.',
    free_badge: 'GRATIS · SIN CUENTA', how_title: 'CÓMO FUNCIONA',
    step1: 'Pega el enlace de tu mazo', step1_desc: 'Archidekt · Moxfield · MTGTOP8 · Tappedout — o tu lista en texto.',
    step2: 'Marca lo que ya tienes', step2_desc: 'Carta por carta, o importa tu colección en CSV.',
    step3: 'Obtén tu lista de compra', step3_desc: 'Solo lo que falta, listo para una Wantlist de Cardmarket.',
    nofr_pitch: 'Algunas cartas no existen en tu idioma. Te lo decimos antes.', try_example: 'Ver un mazo de ejemplo',
    tab_url: 'Enlace del mazo', tab_paste: 'Pegar una lista',
    recent: 'Mazos recientes', clear_all: 'Borrar todo', cards: 'cartas', owned: 'poseídas',
    today: 'Hoy', yesterday: 'Ayer', days_ago: n => `Hace ${n} días`,
    mode_url: 'URL (Archidekt / MTGTOP8)', mode_paste: 'Pegar lista',
    btn_translate: 'Traducir el mazo', btn_fetching: 'Cargando...', btn_translating: 'Traduciendo...',
  },
  pt: {
    hero_title_1: 'Não compre de novo', hero_title_2: 'o que você já tem.',
    hero_sub: 'Cole o link do seu deck: traduzimos os nomes, você marca o que possui e leva a lista de compras — pronta para o Cardmarket.',
    free_badge: 'GRÁTIS · SEM CONTA', how_title: 'COMO FUNCIONA',
    step1: 'Cole o link do seu deck', step1_desc: 'Archidekt · Moxfield · MTGTOP8 · Tappedout — ou sua lista em texto.',
    step2: 'Marque o que você possui', step2_desc: 'Carta a carta, ou importe sua coleção em CSV.',
    step3: 'Receba sua lista de compras', step3_desc: 'Só o que falta, pronto para uma Wantlist do Cardmarket.',
    nofr_pitch: 'Algumas cartas não existem no seu idioma. Avisamos antes.', try_example: 'Ver um deck de exemplo',
    tab_url: 'Link do deck', tab_paste: 'Colar uma lista',
    recent: 'Decks recentes', clear_all: 'Limpar tudo', cards: 'cartas', owned: 'possuídas',
    today: 'Hoje', yesterday: 'Ontem', days_ago: n => `Há ${n} dias`,
    mode_url: 'URL (Archidekt / MTGTOP8)', mode_paste: 'Colar lista',
    btn_translate: 'Traduzir o deck', btn_fetching: 'Carregando...', btn_translating: 'Traduzindo...',
  },
  ja: {
    hero_title_1: 'すでに持っているカードを', hero_title_2: '二度と買わない。',
    hero_sub: 'デッキのURLを貼るだけ。カード名を翻訳し、所持済みにチェックを入れると、買うべきリストが手に入ります（Cardmarket対応）。',
    free_badge: '無料・アカウント不要', how_title: '使いかた',
    step1: 'デッキのURLを貼る', step1_desc: 'Archidekt・Moxfield・MTGTOP8・Tappedout、またはテキストのリスト。',
    step2: '持っているカードにチェック', step2_desc: '一枚ずつ、またはコレクションのCSVを読み込み。',
    step3: '買い物リストを受け取る', step3_desc: '足りないカードだけ。Cardmarketのウォントリストにそのまま貼れます。',
    nofr_pitch: '一部のカードはあなたの言語では存在しません。探す前にお知らせします。', try_example: 'サンプルデッキを見る',
    tab_url: 'デッキのURL', tab_paste: 'リストを貼る',
    recent: '最近のデッキ', clear_all: 'すべて削除', cards: 'カード', owned: '所有',
    today: '今日', yesterday: '昨日', days_ago: n => `${n}日前`,
    mode_url: 'URL (Archidekt / MTGTOP8)', mode_paste: 'リストを貼り付け',
    btn_translate: 'デッキを翻訳', btn_fetching: '取得中...', btn_translating: '翻訳中...',
  },
  ko: {
    hero_title_1: '이미 가진 카드를', hero_title_2: '다시 사지 마세요.',
    hero_sub: '덱 링크를 붙여넣으면 카드 이름을 번역하고, 보유 카드를 체크하면 살 목록이 나옵니다 — Cardmarket에 바로 사용 가능.',
    free_badge: '무료 · 계정 불필요', how_title: '이용 방법',
    step1: '덱 링크 붙여넣기', step1_desc: 'Archidekt · Moxfield · MTGTOP8 · Tappedout, 또는 텍스트 목록.',
    step2: '보유한 카드 체크', step2_desc: '한 장씩, 또는 컬렉션 CSV 가져오기.',
    step3: '구매 목록 받기', step3_desc: '부족한 카드만. Cardmarket 원트리스트에 바로 붙여넣기.',
    nofr_pitch: '일부 카드는 해당 언어로 발매되지 않았습니다. 찾기 전에 알려드립니다.', try_example: '예시 덱 보기',
    tab_url: '덱 링크', tab_paste: '목록 붙여넣기',
    recent: '최근 덱', clear_all: '모두 지우기', cards: '카드', owned: '보유',
    today: '오늘', yesterday: '어제', days_ago: n => `${n}일 전`,
    mode_url: 'URL (Archidekt / MTGTOP8)', mode_paste: '목록 붙여넣기',
    btn_translate: '덱 번역하기', btn_fetching: '불러오는 중...', btn_translating: '번역 중...',
  },
  ru: {
    hero_title_1: 'Не покупайте снова то,', hero_title_2: 'что у вас уже есть.',
    hero_sub: 'Вставьте ссылку на колоду: мы переведём названия, вы отметите свои карты и получите список покупок — готовый для Cardmarket.',
    free_badge: 'БЕСПЛАТНО · БЕЗ АККАУНТА', how_title: 'КАК ЭТО РАБОТАЕТ',
    step1: 'Вставьте ссылку на колоду', step1_desc: 'Archidekt · Moxfield · MTGTOP8 · Tappedout — или список текстом.',
    step2: 'Отметьте свои карты', step2_desc: 'По одной карте или импортом коллекции в CSV.',
    step3: 'Получите список покупок', step3_desc: 'Только недостающее, готовое для Wantlist на Cardmarket.',
    nofr_pitch: 'Некоторых карт нет на вашем языке. Мы предупредим заранее.', try_example: 'Посмотреть пример колоды',
    tab_url: 'Ссылка на колоду', tab_paste: 'Вставить список',
    recent: 'Последние деки', clear_all: 'Очистить всё', cards: 'карт', owned: 'есть',
    today: 'Сегодня', yesterday: 'Вчера', days_ago: n => `${n} дн. назад`,
    mode_url: 'URL (Archidekt / MTGTOP8)', mode_paste: 'Вставить список',
    btn_translate: 'Перевести колоду', btn_fetching: 'Загрузка...', btn_translating: 'Перевод...',
  },
}

import CardmarketPanel from './components/CardmarketPanel.vue'
import CollectionImport from './components/CollectionImport.vue'
import PointingMode from './components/PointingMode.vue'
import LanguageSelector from './components/LanguageSelector.vue'
import ProgressBar from './components/ProgressBar.vue'
import ResultsPanel from './components/ResultsPanel.vue'
import VisualPanel from './components/VisualPanel.vue'
import HistoryPanel from './components/HistoryPanel.vue'
import ToastNotification from './components/ToastNotification.vue'

import { useDeck } from './composables/useDeck.js'
import { useLanguage } from './composables/useLanguage.js'
import { useChecklist } from './composables/useChecklist.js'
import { useHistory } from './composables/useHistory.js'
import { useTheme } from './composables/useTheme.js'
import { useExport } from './composables/useExport.js'
import { useToast } from './composables/useToast.js'
import { isSupportedUrl } from './services/deckSources.js'
import { useCollection } from './composables/useCollection.js'
import { matchDeckToCollection } from './services/collectionParser.js'
import { getCachedCards, setCachedCards } from './services/storage.js'
import { categoryLabel, orderCategories } from './constants/categories.js'

const COLOR_ORDER = ['W', 'U', 'B', 'R', 'G']
const MTG_COLOR_STYLES = {
  W: { background: '#f1f5f9', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.12)' },
  U: { background: '#3b82f6', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.25)' },
  B: { background: '#3f3f46', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.15)' },
  R: { background: '#ef4444', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.2)' },
  G: { background: '#22c55e', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.15)' },
}

const DK_TABS = [
  { value: 'all', label: 'Tout' },
  { value: 'missing', label: 'À trouver' },
  { value: 'owned', label: 'Possédées' },
]

// --- State ---
const showHistory = ref(false)
const showCardmarket = ref(false)
const showMenu = ref(false)
const pointing = ref(false)
const panelOpen = ref(false)

// Le pointage écrit directement dans la checklist du deck et dans la
// collection locale : c'est le même geste que cocher une ligne.
function onPointOwned(queryName, owned = true) {
  setAllBase([queryName], owned)
  rememberOwned(queryName, owned)
}

// La vue « Colonnes » a été retirée : c'était la vue Liste amputée du nom
// anglais et du badge « pas de VF », donc celle qui masquait le différenciateur,
// et rien n'y signalait qu'une ligne était cliquable.
const LAYOUTS = [
  { value: 'list', label: 'Liste' },
  { value: 'images', label: 'Visuel' },
]

function runMenu(action) {
  showMenu.value = false
  action()
}
const activeFilter = ref('all')
const noFrDismissed = ref(false)
const urlFieldOpen = ref(false)

// Sur téléphone, la carte de saisie se replie tant que l'utilisateur n'a pas
// demandé le champ : un formulaire vide n'invite à rien, un bouton si.
const foldInputCard = computed(
  () => !urlFieldOpen.value && !urlInput.value && !pasteInput.value && inputMode.value === 'url'
)
const search = ref('')
const sort = ref('category')
// « columns » a disparu : une préférence stockée sur cette vue doit retomber
// sur la liste plutôt que sur un layout inconnu.
const storedLayout = (() => { try { return localStorage.getItem('deck-layout') } catch { return null } })()
const layout = ref(storedLayout === 'images' ? 'images' : 'list')
const cmdRight = ref(null)
watch(layout, v => localStorage.setItem('deck-layout', v))

// --- Composables ---
const { theme, toggle: toggleTheme } = useTheme()
const { language, setLanguage, LANGUAGES } = useLanguage()
const i18n = computed(() => LANDING_I18N[language.value] || LANDING_I18N.fr)

const steps = computed(() => [
  { title: i18n.value.step1, desc: i18n.value.step1_desc },
  { title: i18n.value.step2, desc: i18n.value.step2_desc },
  { title: i18n.value.step3, desc: i18n.value.step3_desc },
])

// Deck public et stable, choisi pour être petit et complet (commandant,
// terrains, sorts) : il montre le parcours entier sans faire attendre.
// Point d'entrée entrant. Sans lui, l'app n'a aucun lien profond : rien à
// partager, rien à épingler, et la cible de partage du manifeste n'aurait nulle
// part où déposer ce qu'elle reçoit. Sur téléphone, coller une URL demandait de
// passer par une autre application et le presse-papier — sept gestes.
function readIncomingShare() {
  let params
  try { params = new URLSearchParams(location.search) } catch { return false }

  // Android envoie tantôt `url`, tantôt `text` (le lien noyé dans du texte).
  const raw = params.get('url') || params.get('deck') || params.get('text') || ''
  if (!raw) return false

  const link = (raw.match(/https?:\/\/[^\s]+/) || [])[0]
  if (link && isSupportedUrl(link)) {
    inputMode.value = 'url'
    urlInput.value = link
  } else if (raw.includes('\n')) {
    // Une liste collée depuis une autre app, pas un lien.
    inputMode.value = 'paste'
    pasteInput.value = raw
  } else {
    return false
  }

  // L'URL de partage ne doit pas rester dans la barre d'adresse : rechargée,
  // elle relancerait une traduction que l'utilisateur n'a pas demandée.
  // window.history explicitement : `history` est ici la ref des decks récents,
  // et `history.replaceState` levait une exception avalée par le catch.
  try { window.history.replaceState({}, '', window.location.pathname) } catch {}
  return true
}

onMounted(() => { if (readIncomingShare()) onTranslate() })

const EXAMPLE_DECK_URL = 'https://archidekt.com/decks/7031486/buffs_by_hans'

// beforeinstallprompt n'est émis que si l'installation est réellement
// possible : pas déjà installée, critères du navigateur remplis. C'est donc
// lui, et non une détection de plateforme, qui décide d'afficher l'invitation.
const installEvent = ref(null)
const canInstall = computed(() => !!installEvent.value)

onMounted(() => {
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault()
    installEvent.value = e
  })
  window.addEventListener('appinstalled', () => { installEvent.value = null })
})

async function promptInstall() {
  const e = installEvent.value
  if (!e) return
  installEvent.value = null
  try { await e.prompt() } catch {}
}

const canPaste = typeof navigator !== 'undefined' && !!navigator.clipboard?.readText

async function pasteFromClipboard() {
  let text
  try {
    text = (await navigator.clipboard.readText()).trim()
  } catch {
    show('Autorisez l’accès au presse-papier, ou collez à la main.', 'error')
    return
  }
  if (!text) { show('Le presse-papier est vide.', 'info'); return }

  const link = (text.match(/https?:\/\/[^\s]+/) || [])[0]
  if (link && isSupportedUrl(link)) {
    inputMode.value = 'url'
    urlInput.value = link
  } else if (text.includes('\n')) {
    inputMode.value = 'paste'
    pasteInput.value = text
  } else {
    inputMode.value = 'url'
    urlFieldOpen.value = true
    show('Rien à coller : saisissez l’adresse du deck.', 'info')
    return
  }
  onTranslate()
}

function loadExample() {
  inputMode.value = 'url'
  urlInput.value = EXAMPLE_DECK_URL
  onTranslate()
}

const pasteTextareaPlaceholder = `4 Island\n1x Lightning Bolt\n1x Frolicking Familiar // Blow Off Steam\n// Les commentaires sont ignorés\n1 Sol Ring`

const {
  inputMode, urlInput, pasteInput,
  status, error, progress, cards, deckId, deckName, unparseableLines,
  translate, reset, loadFromHistory,
} = useDeck()

const { checkedMap, toggle: toggleBase, setAll: setAllBase, ownedCount } = useChecklist(deckId)

// Toute carte cochée, dans n'importe quel deck, alimente la collection locale.
function toggleCard(queryName) {
  toggleBase(queryName)
  rememberOwned(queryName, !!checkedMap.value[queryName])
}

function setAll(keys, value) {
  setAllBase(keys, value)
  for (const k of keys) rememberOwned(k, value)
}
const { history, add: addToHistory, clear: clearHistory, getEntryPasteText } = useHistory()
const { copyAll, copyMissing, downloadTxt } = useExport(cards, checkedMap)
const { show } = useToast()
const {
  getMap: getCollectionMap, rememberOwned, hasAnyCollection, totalKnown,
  manualSize, csvSize, clearManual, exportCSV,
} = useCollection()

// --- Computed ---
const totalPrice = computed(() =>
  cards.value.reduce((sum, c) => sum + (c.price ?? 0) * c.qty, 0)
)
function formatPrice(val) { return val.toFixed(2) + ' €' }

const ownedPct = computed(() =>
  cards.value.length ? Math.round(ownedCount.value / cards.value.length * 100) : 0
)

const isLoading = computed(() => status.value === 'fetching' || status.value === 'translating')

const deckBgUrl = computed(() => {
  if (status.value !== 'done') return null
  const commander = cards.value.find(c => c.category === 'Commander')
  const card = commander || cards.value[0]
  return card?.imageUrl ? card.imageUrl.replace('/normal/', '/art_crop/') : null
})
const isInputEmpty = computed(() =>
  inputMode.value === 'url' ? !urlInput.value?.trim() : !pasteInput.value?.trim()
)

const missingCards = computed(() =>
  cards.value.filter(c => !checkedMap.value[c.queryName])
)

// Cartes sans impression dans la langue cible. On exclut celles que Scryfall
// n'a pas reconnues (error) : leur absence de traduction n'est pas une
// information sur la carte, mais sur notre résolution.
// La seule somme qui décide d'un achat : le prix de ce qui manque, et non
// celui du deck entier — ce dernier était le seul affiché.
const missingPrice = computed(
  () => missingCards.value.reduce((sum, c) => sum + (c.price ?? 0) * (c.qty || 1), 0)
)

// Retraduire sur place, sans repasser par le formulaire.
async function onChangeLanguage(code) {
  setLanguage(code)
  if (status.value === 'done') await onTranslate()
}

const noFrCount = computed(() => cards.value.filter(c => c.noFr && !c.error).length)
const currentLanguageLabel = computed(
  () => LANGUAGES.find(l => l.code === language.value)?.label || language.value
)

function toggleNoFrFilter() {
  activeFilter.value = activeFilter.value === 'nofr' ? 'all' : 'nofr'
}

const filterCounts = computed(() => ({
  all: cards.value.length,
  missing: missingCards.value.length,
  owned: cards.value.filter(c => !!checkedMap.value[c.queryName]).length,
}))


// --- Actions ---
async function onTranslate() {
  activeFilter.value = 'all'
  search.value = ''
  sort.value = 'category'
  // Pas de resetChecklist() ici : deckId vaut encore l'ancien deck, on effaçait
  // donc sa checklist en localStorage. useChecklist observe déjà deckId et
  // recharge la bonne liste quand il change — et retraduire le même deck
  // conserve désormais ce qui était coché.
  const extra = await translate(language.value)

  if (status.value === 'done') {
    autoApplyCollection()
    setCachedCards(deckId.value, language.value, cards.value)
    const coverCard = cards.value.find(c => c.category === 'Commander') || cards.value[0]
    const deckColors = COLOR_ORDER.filter(c =>
      cards.value.some(card => (card.colorIdentity || []).includes(c))
    )
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
      deckColors,
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
  // Le cache est indexé par langue : changer de langue force une retraduction.
  const cached = getCachedCards(entry.deckId, language.value)
  if (cached) {
    deckId.value = entry.deckId
    deckName.value = entry.deckName
    cards.value = cached
    status.value = 'done'
    activeFilter.value = 'all'
    autoApplyCollection()
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
function exportDownload() { downloadTxt(deckName.value) }
function exportPrint() { window.print() }

async function exportBuyCardmarket() {
  if (missingCards.value.length === 0) {
    show('Rien à acheter : toutes les cartes sont cochées.', 'info')
    return
  }
  // displayName porte le nom ANGLAIS de la source : c'est celui que Cardmarket
  // indexe. Ne jamais envoyer frName ici.
  const text = missingCards.value.map(c => `${c.qty} ${c.displayName}`).join('\n')
  try {
    await navigator.clipboard.writeText(text)
    show(`${missingCards.value.length} cartes copiées`, 'success')
  } catch {
    show('Échec de la copie', 'error')
  }
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
  let url = entry.coverImageUrl
  if (!url) {
    const cached = getCachedCards(entry.deckId, language.value)
    if (!cached?.length) return null
    const commander = cached.find(c => c.category === 'Commander')
    url = (commander || cached[0])?.imageUrl || null
  }
  return url ? url.replace('/normal/', '/art_crop/') : null
}

// Format Manabox, lisible ailleurs : un outil communautaire ne retient pas
// les données de ses utilisateurs en otage.
function downloadCollection() {
  const blob = new Blob([exportCSV()], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'ma-collection-mtg.csv'
  a.click()
  URL.revokeObjectURL(url)
  show('Collection exportée', 'success')
}

function onForgetCollection() {
  clearManual()
  show('Cartes pointées oubliées', 'info')
}

function applyCollection() {
  const map = getCollectionMap()
  if (!map) return 0
  const owned = matchDeckToCollection(cards.value, map)
  // setAllBase, pas setAll : ces cartes viennent déjà de la collection, les
  // y réinjecter ne ferait que dupliquer le travail.
  setAllBase([...owned], true)
  return owned.size
}

// Appliqué sans rien demander : l'utilisateur a déjà dit ce qu'il possède,
// le lui redemander à chaque deck n'a aucun sens. C'est ce qui fait qu'au
// deuxième deck la checklist est déjà en partie remplie.
function autoApplyCollection() {
  if (!hasAnyCollection.value) return
  const n = applyCollection()
  if (n > 0) show(`${n} carte${n > 1 ? 's' : ''} déjà dans votre collection`, 'success')
}

watch(deckId, () => { activeFilter.value = 'all'; noFrDismissed.value = false; pointing.value = false })
</script>

<style scoped>
/* ══ App shell ══════════════════════════════════════════ */
/* Mobile d'abord : la page scrolle normalement.
   L'ancienne version posait height:100vh + overflow:hidden ici, et la media
   query 640px passait les enfants en height:auto — le contenu débordait donc
   d'un conteneur qui ne scrolle pas. Sur téléphone, le bouton « Traduire »
   se retrouvait sous la ligne de flottaison, hors d'atteinte, et une fois un
   deck chargé la liste de cartes était inaccessible : l'app était inutilisable.
   100dvh et non 100vh : sur iOS, 100vh compte la barre d'URL rétractable. */
.cmd-app {
  min-height: 100dvh;
  background: var(--bg-app);
  color: var(--text-1);
  display: flex;
  flex-direction: column;
}



.cmd-layout {
  display: flex;
  flex: 1;
  min-height: 0;
}



/* ══ Left panel ═════════════════════════════════════════ */
.cmd-left {
  width: 400px;
  flex-shrink: 0;
  height: 100%;
  overflow-y: auto;
  background: var(--bg-app);
  border-right: 1px solid var(--border-subtle);
  scrollbar-width: thin;
  scrollbar-color: var(--border) transparent;
}

/* ══ Right panel ════════════════════════════════════════ */
.cmd-right {
  flex: 1;
  height: 100%;
  overflow-y: auto;
  background: radial-gradient(ellipse 65% 55% at 75% 8%, var(--canvas-glow) 0%, transparent 70%), var(--bg-canvas);
  position: relative;
  scrollbar-width: thin;
  scrollbar-color: var(--border) transparent;
}

/* ══ LANDING LEFT ════════════════════════════════════════ */
.lp-left {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px 24px 20px;
  gap: 0;
}

/* Top bar */
.lpl-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 36px;
  flex-shrink: 0;
}

.lpl-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.lpl-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: var(--accent-fill);
  border: 1px solid var(--accent-border);
  border-radius: 10px;
}

.lpl-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-1);
  letter-spacing: -0.02em;
}


.lpl-top-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.lpl-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  color: var(--text-4);
  transition: background 150ms, color 150ms;
}

.lpl-icon-btn:hover {
  background: var(--fill-2);
  color: var(--text-3);
}

/* Hero */
.lpl-hero {
  margin-bottom: 28px;
  flex-shrink: 0;
}

.lpl-title {
  font-size: clamp(26px, 3.5vw, 36px);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.04em;
  color: var(--text-1);
  margin: 0 0 12px;
}

.lpl-grad {
  color: var(--accent);
  -webkit-text-fill-color: currentColor;
  background: none;
  color: var(--text-4);
}

.lpl-sub {
  font-size: 13px;
  color: var(--text-4);
  line-height: 1.65;
}

/* Input section */
.lpl-input-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
}

/* Card footer */
.lpl-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px 12px;
  border-top: 1px solid var(--border-subtle);
  gap: 10px;
  margin-top: 2px;
}

.lpl-footer-lang {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.lpl-lang-label {
  font-size: 12px;
  color: var(--text-4);
  white-space: nowrap;
  flex-shrink: 0;
}

/* LanguageSelector overrides inside dark card footer */
.lpl-card-footer :deep(.lang-btn) {
  color: var(--text-3);
  padding: 4px 8px;
  border-radius: 8px;
}

.lpl-card-footer :deep(.lang-btn:hover) {
  background: var(--fill-2);
  color: var(--text-1);
}

.lpl-card-footer :deep(.lang-dropdown) {
  background: var(--surface-menu);
  border-color: var(--border);
  box-shadow: 0 8px 32px var(--shadow-tint-3);
}

.lpl-card-footer :deep(.lang-option) { color: var(--text-3); }
.lpl-card-footer :deep(.lang-option:hover) { background: var(--fill-2); color: var(--text-1); }
.lpl-card-footer :deep(.lang-option.active) { color: var(--accent); }

/* Translate button — compact pill inside card footer */
.lpl-translate-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 10px 18px;
  background: var(--btn-primary-bg);
  color: var(--text-inverse);
  border-radius: 12px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: -0.01em;
  flex-shrink: 0;
  white-space: nowrap;
  transition: background 150ms, box-shadow 150ms, transform 100ms;
  box-shadow: 0 2px 16px var(--btn-primary-glow);
}

.lpl-translate-btn:hover:not(:disabled) {
  background: var(--btn-primary-bg-hover);
  box-shadow: 0 4px 22px var(--btn-primary-glow-hover);
  transform: translateY(-1px);
}

.lpl-translate-btn:active:not(:disabled) { transform: scale(0.97); }

.lpl-translate-btn:disabled {
  background: var(--fill-3);
  color: var(--text-4);
  box-shadow: none;
  cursor: not-allowed;
}

.lpl-spinner {
  width: 13px;
  height: 13px;
  border: 2px solid var(--border-strong);
  border-top-color: var(--bg-app);
  border-radius: 50%;
  animation: spin 0.65s linear infinite;
  flex-shrink: 0;
}

.lpl-loading-text { font-size: 12px; }

@keyframes spin { to { transform: rotate(360deg); } }

/* Keyboard hint */
.lpl-kbd-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--text-4);
  padding: 0 4px;
}

.lpl-kbd-hint kbd {
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  border-radius: 5px;
  border: 1px solid var(--border);
  background: var(--fill-1);
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-4);
  letter-spacing: 0;
}

.lpl-kbd-hint span { color: var(--text-4); }

/* Banners */
.lpl-banner {
  padding: 9px 14px;
  border-radius: 10px;
  font-size: 12px;
  line-height: 1.5;
  border: 1px solid;
}
.lpl-banner-warn { background: var(--accent-fill); border-color: var(--accent-border); color: var(--accent-hover); }
.lpl-banner-err  { background: var(--danger-fill);  border-color: var(--danger-border);  color: var(--danger); }

/* Inlined input card */
.lpl-input-card {
  background: var(--surface-2);
  border: 1px solid var(--border-subtle);
  border-radius: 24px;
  padding: 8px;
  backdrop-filter: blur(24px);
}

.lpl-mode-tabs {
  display: flex;
  padding: 4px;
  background: var(--surface-sunk);
  border-radius: 16px;
  margin-bottom: 6px;
  gap: 2px;
}

.lpl-mode-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 12px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-3);
  transition: background 150ms, color 150ms, box-shadow 150ms;
}

.lpl-mode-tab.active {
  background: var(--fill-3);
  color: var(--text-1);
  box-shadow: 0 2px 10px var(--shadow-tint-2);
}

.lpl-mode-tab:hover:not(.active) { color: var(--text-2); }

.lpl-url-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 16px 16px;
}

.lpl-url-icon {
  color: var(--text-3);
  flex-shrink: 0;
  transition: color 150ms;
}

.lpl-url-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 15px;
  color: var(--text-2);
  min-width: 0;
}

.lpl-url-input:not(:placeholder-shown) ~ .lpl-url-icon,
.lpl-url-row:focus-within .lpl-url-icon { color: var(--accent); }

.lpl-url-input::placeholder { color: var(--text-4); }
.lpl-url-input:disabled { opacity: 0.5; cursor: not-allowed; }

.lpl-paste-input {
  display: block;
  width: 100%;
  min-height: 130px;
  background: transparent;
  border: none;
  color: var(--text-2);
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.65;
  padding: 12px 16px 14px;
  outline: none;
  resize: vertical;
  box-sizing: border-box;
}

.lpl-paste-input::placeholder { color: var(--text-4); }
.lpl-paste-input:disabled { opacity: 0.5; cursor: not-allowed; }

/* Bottom bar */
.lpl-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 20px;
  margin-top: auto;
  border-top: 1px solid var(--border-subtle);
  flex-shrink: 0;
}

.lpl-platforms {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: var(--text-4);
}

.lpl-dot { color: var(--text-4); }

/* ══ LANDING RIGHT ═══════════════════════════════════════ */
.lp-right {
  padding: 28px 32px 48px;
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.lpr-section-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  color: var(--text-4);
}

.lpr-section-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-1);
  letter-spacing: -0.02em;
  flex: 1;
}

.lpr-clear {
  font-size: 11px;
  color: var(--text-4);
  transition: color 150ms;
}
.lpr-clear:hover { color: var(--danger); }

/* Recent deck cards */
.lpr-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  max-width: 560px;
}

.lpr-card {
  position: relative;
  aspect-ratio: 5 / 7;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  text-align: left;
  background: var(--surface-3);
  border: 1px solid var(--border);
  transition: transform 500ms, border-color 300ms, box-shadow 300ms;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px var(--shadow-tint-3);
}

.lpr-card:hover {
  transform: translateY(-12px);
  border-color: var(--border-focus);
  box-shadow: 0 24px 48px var(--accent-glow), 0 8px 24px var(--shadow-tint-3);
}

.lpr-card-art {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center center;
  opacity: 0.75;
  transition: opacity 400ms, transform 700ms;
}

.lpr-card:hover .lpr-card-art { opacity: 0.85; transform: scale(1.07); }

.lpr-card-body {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 16px;
  background: linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.1) 35%, rgba(0,0,0,0.88) 100%); /* voile sur l’illustration : sombre dans les deux thèmes */
}

.lpr-card-top {}

.lpr-card-badge {
  display: inline-block;
  padding: 3px 9px;
  border-radius: 9999px;
  background: var(--fill-4);
  backdrop-filter: blur(8px);
  border: 1px solid var(--border-focus);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-1);
}

.lpr-card-bottom {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.lpr-card-colors {
  display: flex;
  gap: 4px;
  margin-bottom: 6px;
}

.lpr-color-pip {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  flex-shrink: 0;
  display: block;
}

.lpr-card-count {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-on-scrim-muted);
}

/* Posé sur le voile sombre de l'illustration : la couleur ne suit pas le
   thème, sinon le texte devient noir sur noir en mode clair. */
.lpr-card-name {
  font-size: 17px;
  font-weight: 700;
  color: var(--text-on-scrim);
  letter-spacing: -0.03em;
  line-height: 1.2;
  transition: color 200ms;
}

.lpr-card:hover .lpr-card-name { color: var(--accent-hover); }

/* Feature cards */




/* Amber variant */

/* Blue variant */

/* Green variant */


.lpr-feat:hover .lpr-feat-icon { transform: scale(1.08); }



/* ══ DECK LEFT ═══════════════════════════════════════════ */
.dk-left {
  display: flex;
  flex-direction: column;
  padding: 20px 20px 32px;
  gap: 0;
  min-height: 100%;
}

.dk-back {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-4);
  margin-bottom: 20px;
  transition: color 150ms;
}
.dk-back:hover { color: var(--text-3); }

.dk-info { margin-bottom: 16px; }

.dk-name {
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.04em;
  color: var(--text-1);
  line-height: 1.2;
  margin-bottom: 8px;
}

.dk-stats {
  display: flex;
  align-items: center;
  gap: 6px;
}

.dk-stat {
  font-family: var(--font-mono);
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 6px;
  background: var(--fill-2);
  border: 1px solid var(--border);
  color: var(--text-3);
}

.dk-stat-price {
  color: var(--accent);
  background: var(--accent-fill);
  border-color: var(--accent-border);
}

/* Layout toggle */



/* Action buttons 2×2 */





/* Separator */
.dk-sep {
  height: 1px;
  background: var(--fill-2);
  margin: 16px 0;
  flex-shrink: 0;
}

/* Search */
.dk-search {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--fill-1);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0 12px;
  height: 36px;
  color: var(--text-4);
  transition: border-color 150ms;
  margin-bottom: 10px;
}
.dk-search:focus-within { border-color: var(--border-strong); }

.dk-search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 13px;
  color: var(--text-2);
  min-width: 0;
}

.dk-search-input::placeholder { color: var(--text-4); }

.dk-search-clear {
  display: flex;
  align-items: center;
  color: var(--text-4);
  transition: color 150ms;
}
.dk-search-clear:hover { color: var(--text-3); }

/* Filter tabs */
.dk-filters {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  margin-bottom: 4px;
}

.dk-filter-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 6px;
  border-radius: 10px;
  background: var(--fill-1);
  border: 1px solid var(--border-subtle);
  transition: background 150ms, border-color 150ms;
}

.dk-filter-btn.active {
  background: var(--fill-3);
  border-color: var(--border-strong);
}

.dkf-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-4);
}

.dkf-count {
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 700;
  color: var(--text-4);
}

.dk-filter-btn.active .dkf-label { color: var(--text-2); }
.dk-filter-btn.active .dkf-count { color: var(--accent); }

/* Collection */
.dk-collection { display: flex; flex-direction: column; gap: 8px; }

.dk-coll-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dk-coll-label {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-4);
}

.dk-coll-pct {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 700;
  color: var(--accent);
}

.dk-coll-stats {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.04em;
  color: var(--text-1);
}

.dk-coll-track {
  height: 4px;
  background: var(--fill-2);
  border-radius: 9999px;
  overflow: hidden;
}

.dk-coll-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), var(--accent-hover));
  border-radius: 9999px;
  transition: width 400ms ease;
}

/* TOC */






/* ══ DECK RIGHT ═════════════════════════════════════════ */
.dk-right {
  padding: 24px 32px 64px;
  position: relative;
  z-index: 1;
}

/* Background art */
/* left:400px reprenait la largeur de la sidebar : à 320px (tablette) il
   restait une bande de 80px décalée, et sous 640px le fond partait hors écran.
   En absolute dans .cmd-right, il suit son conteneur sans rien savoir de lui. */
.cmd-right-bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center center;
  opacity: var(--deck-bg-opacity);
  filter: blur(60px) saturate(0.6);
  pointer-events: none;
  z-index: 0;
}

.bg-fade-enter-active,
.bg-fade-leave-active { transition: opacity 600ms ease; }
.bg-fade-enter-from,
.bg-fade-leave-to { opacity: 0; }

/* ── Transitions ─────────────────────────────────────── */
.history-fade-enter-active,
.history-fade-leave-active { transition: opacity 200ms ease; }
.history-fade-enter-from,
.history-fade-leave-to { opacity: 0; }

/* ── Écran deck : barre d'outils, fil rouge ───────────── */
.dk-right { display: flex; flex-direction: column; }
.dk-scroll { flex: 1; min-height: 0; }

.dk-lang { margin-top: 10px; }

/* Le disclosure n'existe que sur téléphone : sur grand écran le rail a la
   place d'afficher tout, et un pli en plus serait un clic pour rien. */
.dk-more { display: none; }
.dk-stat-owned { display: none; }



/* Encoche et barre gestuelle : sans ça, la barre du bas passe dessous. */
@supports (padding: env(safe-area-inset-bottom)) {
  .dk-bar { margin-bottom: env(safe-area-inset-bottom); }
  .cmd-app { padding-left: env(safe-area-inset-left); padding-right: env(safe-area-inset-right); }
}

/* ── Accueil mobile ───────────────────────────────────── */
.lpl-list-btn {
  display: none;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 48px;
  padding: 0 18px;
  font-size: 13.5px;
  font-weight: 500;
  color: var(--text-2);
  background: var(--fill-1);
  border: 1px solid var(--border);
  border-radius: 12px;
  cursor: pointer;
}

.lpl-install {
  display: none;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: var(--warning-fill);
  border: 1px solid var(--accent-border);
  border-radius: 12px;
  color: var(--accent);
}

.lpl-install p {
  flex: 1;
  margin: 0;
  font-size: 12px;
  line-height: 1.45;
  color: var(--text-2);
}

.lpl-install > button {
  flex: none;
  min-height: 36px;
  padding: 0 13px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--accent-hover);
  background: var(--accent-fill-hover);
  border: 1px solid var(--accent-border-hov);
  border-radius: 9px;
  cursor: pointer;
}

.lpl-paste-label { flex: 1; text-align: left; }
.lpl-paste-arrow { display: none; }

/* ── Barre d'onglets mobile ───────────────────────────── */
.mob-tabs { display: none; }

.dk-stat-missing { display: none; }



.dk-point-btn {
  width: 100%;
  margin-top: 10px;
  padding: 9px 12px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-on-accent);
  background: var(--accent);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background 150ms;
}

.dk-point-btn:hover { background: var(--accent-hover); }

.dk-point-hint {
  margin: 6px 0 0;
  font-size: 11.5px;
  line-height: 1.45;
  color: var(--text-4);
}

.dk-coll-link {
  padding: 0;
  font-size: 12px;
  color: var(--text-4);
  background: none;
  border: none;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
}

.dk-coll-link:hover { color: var(--danger); }

.dk-coll-hint {
  margin: 8px 0 0;
  font-size: 12px;
  line-height: 1.45;
  color: var(--text-3);
}

.dk-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.dk-views {
  display: flex;
  gap: 2px;
  padding: 3px;
  background: var(--fill-1);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
}

.dk-view-btn {
  padding: 6px 14px;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--text-3);
  background: none;
  border: none;
  border-radius: 7px;
  cursor: pointer;
  transition: background 150ms, color 150ms;
}

.dk-view-btn:hover { color: var(--text-2); background: var(--fill-2); }
.dk-view-btn.active { color: var(--text-1); background: var(--fill-3); }

.dk-sort { display: flex; align-items: center; gap: 8px; }

.dk-sort-label {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-3);
}

.dk-sort-select {
  padding: 6px 10px;
  font-size: 12.5px;
  color: var(--text-2);
  background: var(--fill-1);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  cursor: pointer;
}

/* Barre du fil rouge : collée en bas du panneau, toujours visible. */
.dk-bar {
  position: sticky;
  bottom: 0;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: 16px;
  padding: 14px 16px;
  background: var(--surface-3);
  border: 1px solid var(--border);
  border-radius: 14px;
  box-shadow: var(--shadow-2);
}

.dk-bar-text { margin: 0; font-size: 13.5px; color: var(--text-2); }
.dk-bar-text strong { color: var(--text-1); font-weight: 600; }
.dk-bar-actions { display: flex; align-items: center; gap: 8px; }

.dk-bar-primary {
  padding: 9px 18px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-on-accent);
  background: var(--accent);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background 150ms;
}

.dk-bar-primary:hover { background: var(--accent-hover); }

.dk-menu { position: relative; }

.dk-menu-btn {
  width: 36px;
  height: 36px;
  font-size: 16px;
  line-height: 1;
  color: var(--text-3);
  background: var(--fill-1);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  cursor: pointer;
}

.dk-menu-btn:hover { color: var(--text-1); background: var(--fill-2); }

.dk-menu-list {
  position: absolute;
  right: 0;
  bottom: calc(100% + 6px);
  min-width: 200px;
  padding: 6px;
  background: var(--surface-menu);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: var(--shadow-3);
  display: flex;
  flex-direction: column;
}

.dk-menu-list button {
  padding: 9px 12px;
  text-align: left;
  font-size: 13px;
  color: var(--text-2);
  background: none;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.dk-menu-sort { display: none; }
.dk-menu-sort select {
  margin-left: 6px;
  padding: 4px 6px;
  font-size: 12.5px;
  color: var(--text-1);
  background: var(--fill-1);
  border: 1px solid var(--border);
  border-radius: 6px;
}



.dk-menu-list button:hover { color: var(--text-1); background: var(--fill-2); }



/* ── Composition de la page d'accueil sur grand écran ──
   Le rail collait tout en haut et laissait 800px de vide dessous, pendant que
   le panneau droit alignait trois étapes dans le même vide. La page n'était
   pas composée : elle était empilée. */


/* ── Landing : badge gratuit, étapes, exemple ─────────── */
/* Raccourci mobile uniquement : sur grand écran le champ est visible et
   Ctrl+V fait le travail, le bouton doublonnait avec la carte de saisie
   juste au-dessus. */
.lpl-paste-btn {
  display: none;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  min-height: 48px;
  margin-top: 10px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-2);
  background: var(--fill-1);
  border: 1px solid var(--border);
  border-radius: 12px;
  cursor: pointer;
  transition: background 150ms, border-color 150ms;
}

.lpl-paste-btn:hover { color: var(--text-1); background: var(--fill-2); border-color: var(--border-strong); }

/* Bandeau de reprise : mobile uniquement, le panneau droit fait le travail
   sur grand écran. */
.lpl-resume { display: none; }



.lpl-free {
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--text-3);
  margin-top: 2px;
}

.lpl-example {
  align-self: flex-start;
  margin-top: 10px;
  padding: 4px 0;
  font-size: 12px;
  color: var(--text-3);
  background: none;
  border: none;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  transition: color 150ms, border-color 150ms;
}

.lpl-example:hover { color: var(--accent); border-color: var(--accent-border); }

.lpr-steps {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.lpr-step {
  display: flex;
  gap: 14px;
  padding: 14px 16px;
  background: var(--surface-1);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
}

.lpr-step-num {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  color: var(--accent);
  background: var(--accent-fill);
  border: 1px solid var(--accent-border);
  border-radius: 50%;
}

.lpr-step-title { font-size: 14px; font-weight: 600; color: var(--text-1); }
.lpr-step-desc { font-size: 12.5px; color: var(--text-3); margin-top: 3px; line-height: 1.5; }

.lpr-loading { padding: 8px 0 24px; }
.lpr-loading-head { display: flex; gap: 14px; align-items: flex-start; margin-bottom: 20px; }
.lpr-skel-list { display: flex; flex-direction: column; gap: 10px; }

.lpr-skel {
  height: 34px;
  border-radius: 8px;
  background: linear-gradient(90deg, var(--fill-1) 25%, var(--fill-2) 50%, var(--fill-1) 75%);
  background-size: 200% 100%;
  animation: skel 1.4s ease-in-out infinite;
}

@keyframes skel {
  from { background-position: 200% 0; }
  to { background-position: -200% 0; }
}

.lpr-coll {
  margin-top: 18px;
  padding: 14px 16px;
  background: var(--success-fill);
  border: 1px solid var(--success-border);
  border-radius: 12px;
}

.lpr-coll-head { font-size: 13.5px; color: var(--text-2); }
.lpr-coll-head strong { color: var(--text-1); font-weight: 600; }
.lpr-coll-dot { color: var(--success); margin-right: 6px; }
.lpr-coll-sub { margin: 4px 0 10px; font-size: 12.5px; color: var(--text-3); }

.lpr-coll-btn {
  padding: 5px 12px;
  font-size: 12px;
  color: var(--text-2);
  background: var(--fill-1);
  border: 1px solid var(--border);
  border-radius: 8px;
  cursor: pointer;
}

.lpr-coll-btn:hover { color: var(--text-1); background: var(--fill-2); }

.lpr-nofr-pitch {
  margin: 18px 0 0;
  padding: 12px 14px;
  font-size: 12.5px;
  line-height: 1.5;
  color: var(--text-2);
  background: var(--warning-fill);
  border: 1px solid var(--accent-border);
  border-radius: 12px;
}

.lpr-nofr-pitch span { color: var(--accent); }

/* ── Bandeau « pas de version française » ─────────────── */
.dk-nofr {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  margin-bottom: 16px;
  background: var(--warning-fill);
  border: 1px solid var(--accent-border);
  border-radius: 12px;
}

.dk-nofr-icon { color: var(--accent); font-size: 14px; line-height: 1.5; }

.dk-nofr-text {
  flex: 1;
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--text-2);
}

.dk-nofr-text strong { color: var(--accent); font-weight: 700; }
.dk-nofr-short { display: none; }
.dk-nofr-sub { display: block; color: var(--text-3); font-size: 12px; }

.dk-nofr-btn {
  flex-shrink: 0;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--accent);
  background: var(--accent-fill);
  border: 1px solid var(--accent-border);
  border-radius: 8px;
  cursor: pointer;
  transition: background 150ms, border-color 150ms;
}

.dk-nofr-btn:hover {
  background: var(--accent-fill-hover);
  border-color: var(--accent-border-hov);
}

.dk-nofr-close {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  font-size: 16px;
  line-height: 1;
  color: var(--text-4);
  background: none;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.dk-nofr-close:hover { color: var(--text-2); background: var(--fill-2); }



/* ── Responsive ──────────────────────────────────────── */








/* Les cibles tactiles descendaient jusqu'à 11px. Le minimum AA de WCAG 2.2
   (2.5.8) est 24px ; 44px est la recommandation confortable. */



/* ── Media queries, regroupées en fin de feuille ────────
   Une media query n'augmente pas la spécificité : placée avant la
   règle qu'elle doit annuler, elle perd la cascade en silence. */

/* ── Media queries, regroupées en fin de feuille ────────
   Une media query n'augmente pas la spécificité : placée avant la
   règle qu'elle doit annuler, elle perd la cascade en silence. */

/* ── Media queries, regroupées en fin de feuille ────────
   Une media query n'augmente pas la spécificité : placée avant la
   règle qu'elle doit annuler, elle perd la cascade en silence.
   TOUT nouveau bloc @media va ICI, jamais au milieu du fichier. */

@media (min-width: 900px) {
  .lp-left {
    justify-content: center;
    padding: 40px 40px 32px;
  }

  /* .lpl-input-section portait flex:1 et absorbait tout l'espace : le
     centrage du parent ne pouvait pas s'appliquer, d'où le vide sous la
     carte. Le pied de colonne descend seul. */
  .lpl-input-section { flex: 0 0 auto; }
  .lp-left > :last-child { margin-top: auto; }

  /* « Traduire en » devient redondant maintenant que le bouton dit
     « Traduire ce deck », et son libellé poussait le sélecteur de langue
     sous le bouton. */
  .lpl-lang-label { display: none; }
  .lpl-footer-lang { flex: 0 0 auto; }

  .lpl-hero { margin-bottom: 8px; }
  .lpl-title { font-size: clamp(30px, 2.6vw, 42px); }

  /* Borner le contenu à 720px créait DEUX vides au lieu d'un sur un écran
     large. On se sert de la largeur au lieu de la fuir : les étapes passent
     côte à côte, la collection et l'avertissement partagent une ligne, et les
     decks récents remplissent la grille. */
  /* min-height : sans elle le bloc s'arrête à la hauteur de son contenu, et
     justify-content:center n'a rien à répartir — d'où les 400px de vide en
     bas plutôt qu'une page composée. */
  .lp-right {
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-height: 100%;
    gap: 28px;
    padding: 40px 44px;
  }

  .lpr-grid { grid-template-columns: repeat(auto-fill, minmax(180px, 210px)); }

  .lpr-steps {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  .lpr-step { flex-direction: column; gap: 10px; }

  .lpr-foot {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    align-items: stretch;
  }

  .lpr-coll, .lpr-nofr-pitch { margin: 0; }
}

@media (max-width: 640px) {
  /* Le presse-papier devient l'action principale, et la carte de saisie se
     replie derrière elle : un champ vide n'invite à rien. */
  .lpl-input-section { display: flex; flex-direction: column; gap: 10px; }
  .lpl-paste-btn {
    display: flex;
    order: -2;
    min-height: 60px;
    padding: 0 18px;
    font-size: 15.5px;
    font-weight: 600;
    color: var(--text-on-accent);
    background: var(--accent);
    border-color: var(--accent);
    border-radius: 16px;
    margin-top: 0;
  }
  .lpl-paste-btn:hover { background: var(--accent-hover); border-color: var(--accent-hover); color: var(--text-on-accent); }
  .lpl-paste-arrow { display: block; }

  .lpl-list-btn { order: -1; display: flex; }
  .lpl-install { display: flex; }
  .lpl-example { align-self: center; }

  .lpl-input-card.is-folded { display: none; }
  .lpl-mode-tabs { display: none; }
}

@media (min-width: 641px) {
  .cmd-app {
    height: 100dvh;
    overflow: hidden;
  }
}

@media (min-width: 641px) {
  .cmd-layout { overflow: hidden; }
}

@media (max-width: 640px) {
  /* Mesuré au navigateur : 561px d'en-tête avant la première carte sur un
     écran de 844. Tout ce bloc sert à ramener ça sous 200px — sur téléphone,
     la liste est le contenu, le reste est de la navigation. */
  .cmd-left--deck {
    position: sticky;
    top: 0;
    z-index: 5;
    padding: 10px 16px 10px;
    background: var(--bg-app);
    border-bottom: 1px solid var(--border-subtle);
  }

  /* L'en-tête faisait 161px pour trois informations. Le retour et le nom
     partagent une ligne, et le prix total disparaît : celui qui compte —
     ce qui manque — vit dans l'onglet « Ma liste ». */
  .dk-left { gap: 0; }
  .dk-back { margin-bottom: 2px; font-size: 11.5px; }
  .dk-info { margin-bottom: 0; }
  .dk-name { font-size: 15.5px; line-height: 1.25; }
  .dk-stats { gap: 5px; margin-top: 3px; }
  .dk-stat { padding: 1px 6px; font-size: 10px; }
  .dk-stat-price { display: none; }

  /* Le sélecteur de langue ne sert pas à chaque instant : il rejoint le pli. */
  .dk-lang { display: none; }
  .dk-left-body.open .dk-lang { display: block; margin: 12px 0 0; }

  /* Le rail déplié occupait 900px : on lui donne sa propre zone de défilement
     plutôt que de repousser la liste hors de l'écran. */
  .dk-left-body.open {
    max-height: 60vh;
    overflow-y: auto;
    margin-top: 10px;
  }

  .dk-coll-stats { font-size: 15px; }
  .dk-coll-header { margin-bottom: 2px; }
  .dk-filters { gap: 6px; }
  .dk-filter-btn { padding: 8px 6px; }
  .dkf-count { font-size: 12px; }

  /* Le panneau droit reprend la main sur la hauteur restante. */
  .dk-right { padding: 14px 16px 0; }

  /* La barre du bas est collée : sans cette réserve, elle recouvre la
     dernière ligne de la liste. */
  .dk-scroll { padding-bottom: 96px; }

  .dk-toolbar { gap: 8px; margin-bottom: 10px; }
  .dk-sort-label { display: none; }
  .dk-view-btn { padding: 7px 12px; }

  /* Trois lignes de texte et un bouton pleine largeur pour un avertissement,
     c'était un tiers de l'écran. */
  .dk-nofr { padding: 10px 12px; gap: 8px; align-items: center; }
  .dk-nofr-sub, .dk-nofr-long { display: none; }
  .dk-nofr-short { display: inline; }
  .dk-nofr-text { font-size: 12.5px; }
  .dk-nofr-btn { width: auto; padding: 6px 10px; font-size: 11.5px; }

  .dk-more {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    min-height: 44px;
    margin-top: 12px;
    padding: 10px 14px;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-2);
    background: var(--fill-1);
    border: 1px solid var(--border-subtle);
    border-radius: 10px;
    cursor: pointer;
  }

  .dk-more-chevron { transition: transform 200ms; }
  .dk-more-chevron.open { transform: rotate(180deg); }

  .dk-left-body { display: none; }
  .dk-left-body.open { display: block; }

  /* Le taux de possession migre dans l'en-tête : replié, c'est la seule
     information de progression encore visible. */
  .dk-stat-owned { display: inline; }

  .dk-sep { margin: 12px 0; }
}

@media (max-width: 640px) {
  .mob-tabs {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 40;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    background: var(--surface-3);
    border-top: 1px solid var(--border);
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }

  .mob-tab {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    min-height: 56px;
    padding: 6px 4px;
    font-size: 11px;
    color: var(--text-3);
    background: none;
    border: none;
    cursor: pointer;
  }

  .mob-tab.active { color: var(--accent); }
  .mob-tab:disabled { opacity: 0.4; cursor: default; }
  .mob-tab-icon { font-size: 17px; line-height: 1; }
  .mob-tab-label { font-weight: 500; }

  .mob-tab-badge {
    font-family: var(--font-mono);
    font-size: 9.5px;
    color: var(--text-4);
  }

  .mob-tab.active .mob-tab-badge { color: var(--accent); }

  /* Le rail disparaît : son contenu vit désormais dans les onglets et le
     menu. Seul l'en-tête reste, ramené à l'essentiel. */
  .dk-more, .dk-left-body { display: none !important; }
  .dk-stat-missing { display: inline; }

  /* La barre du fil rouge se pose au-dessus des onglets. */
  .dk-bar { position: static; margin-bottom: 12px; }
  .dk-scroll { padding-bottom: 24px; }
  .dk-right { padding-bottom: calc(72px + env(safe-area-inset-bottom, 0px)); }

  /* Une seule vue de lecture : le besoin « je reconnais l'illustration » est
     servi, en mieux, par le mode Pointer en plein écran. */
  .dk-views { display: none; }

  /* Les contrôles descendent de l'ancien rail dans la barre d'outils, mais
     empilés ils repoussaient la liste à 2 lignes visibles. Filtres et
     recherche sur une ligne chacun, tri rangé dans le menu. */
  .dk-toolbar { flex-direction: column; align-items: stretch; gap: 8px; margin-bottom: 8px; }
  /* Une grille de trois figeait la largeur et interdisait d'en ajouter.
     En pastilles défilantes, l'actif se lit d'un coup d'œil et la barre
     accepte autant de filtres qu'on veut. */
  .dk-filters {
    display: flex;
    gap: 7px;
    overflow-x: auto;
    scroll-snap-type: x proximity;
    padding-bottom: 2px;
  }
  .dk-filter-btn {
    flex: 0 0 auto;
    scroll-snap-align: start;
    flex-direction: row;
    align-items: center;
    gap: 6px;
    min-height: 34px;
    padding: 0 13px;
    border-radius: 999px;
    white-space: nowrap;
  }
  .dk-filter-btn.active { background: var(--accent-fill-hover); border-color: var(--accent-border-hov); }
  .dk-filter-btn.active .dkf-label { color: var(--accent-hover); }
  .dkf-label { font-size: 12.5px; }
  .dkf-count { font-size: 11px; }
  .dk-sort { display: none; }
  .dk-search { min-height: 40px; }
}

@media (max-width: 640px) { .dk-menu-sort { display: block; } }

@media (max-width: 640px) {
  .dk-bar { flex-direction: column; align-items: stretch; }
  .dk-bar-actions { justify-content: space-between; }
  .dk-bar-primary { flex: 1; }
}

@media (max-width: 640px) {
  .lpl-resume { display: block; margin: 4px 0 16px; }

  /* Le bandeau « REPRENDRE » ci-dessus reprend déjà l'historique, en pastilles.
     La grille de grandes cartes faisait doublon : une seule colonne sous 480px
     avec un aspect-ratio 5/7 donnait des cartes de 326x456 sur un écran de 844,
     et une page de 2091px pour deux decks. */
  .lpr-section--history { display: none; }

  .lpl-resume-label {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.12em;
    color: var(--text-3);
    margin-bottom: 8px;
  }

  .lpl-resume-row {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    scroll-snap-type: x proximity;
    padding-bottom: 4px;
  }

  .lpl-resume-pips { display: flex; gap: -2px; }
  .lpl-resume-pip { width: 9px; height: 9px; border-radius: 50%; display: block; }

  .lpl-resume-chip {
    flex: 0 0 auto;
    scroll-snap-align: start;
    max-width: 190px;
    min-height: 44px;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    font-size: 12.5px;
    color: var(--text-2);
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 999px;
    white-space: nowrap;
    cursor: pointer;
  }

  .lpl-resume-name { overflow: hidden; text-overflow: ellipsis; }
  .lpl-resume-count { font-family: var(--font-mono); font-size: 11px; color: var(--text-4); }
}

@media (max-width: 640px) {
  /* Version compacte : trois lignes plus un bouton pleine largeur
     occupaient un tiers de l'écran pour un avertissement. */
  /* 78px parce que le texte passait sur deux lignes. Il tient sur une seule
     si on le raccourcit : le détail vit dans le filtre qu'il propose. */
  .dk-nofr { flex-wrap: nowrap; align-items: center; gap: 8px; padding: 8px 12px; }
  .dk-nofr-text { font-size: 12px; line-height: 1.35; }
  .dk-nofr-sub, .dk-nofr-long { display: none; }
  .dk-nofr-short { display: inline; }
  .dk-nofr-text { font-size: 12.5px; }
  .dk-nofr-btn { width: auto; padding: 6px 10px; font-size: 11.5px; white-space: nowrap; }
  .dk-nofr-close { width: 28px; height: 28px; }

  /* La barre du fil rouge tenait sur deux lignes de texte. */
  .dk-bar { padding: 10px 12px; gap: 10px; margin-top: 12px; }
  .dk-bar-text { font-size: 12.5px; }
  .dk-bar-primary { padding: 11px 14px; font-size: 12.5px; }
}

@media (max-width: 1024px) {
  .cmd-left { width: 360px; }
}

@media (max-width: 900px) {
  .cmd-left { width: 300px; }
  .lpr-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 640px) {
  .cmd-layout { flex-direction: column; }
  .cmd-left {
    width: 100%;
    height: auto;
    border-right: none;
    border-bottom: 1px solid var(--border-subtle);
  }
  .cmd-right { height: auto; overflow-y: visible; }
  .lp-left, .dk-left { height: auto; }

  /* Le pied de la carte d'input est un space-between avec un bouton en
     flex-shrink:0 : sous 480px il poussait le sélecteur de langue hors cadre. */
  .lpl-card-footer { flex-wrap: wrap; gap: 12px; }
  .lpl-translate-btn { width: 100%; justify-content: center; }

  /* Quatre actions de deck sur une seule colonne : à deux, les libellés
     « Copier tout » et « Exporter .txt » étaient tronqués. */
  .dk-actions { grid-template-columns: 1fr; }

  /* Un nom de deck long débordait, faute de point de césure. */
  .dk-name { overflow-wrap: anywhere; }
}

@media (max-width: 480px) {
  .lpr-grid { grid-template-columns: 1fr; }
}

@media (pointer: coarse) {
  .dk-action-btn, .dk-filter-btn, .lpl-mode-tab, .dk-menu-list button, .dk-bar-primary {
    min-height: 48px;
  }
  .dk-search-clear, .lpl-icon-btn, .dk-menu-btn, .dk-nofr-close { min-width: 48px; min-height: 48px; }
  .dk-search { min-height: 48px; }
}
</style>
