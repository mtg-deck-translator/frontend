<template>
  <div class="lang-selector" ref="root">
    <button class="lang-btn" @click="basculer" :title="current.label">
      <span class="flag">{{ current.flag }}</span>
      <span class="code">{{ current.code.toUpperCase() }}</span>
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
        <path d="M2 3.5l3 3 3-3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>

    <Transition name="dropdown">
      <ul
        v-if="open"
        class="lang-dropdown"
        :class="`vers-le-${placement}`"
        :style="{ maxHeight: hauteurMax }"
      >
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
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { LANGUAGES } from '../composables/useLanguage.js'

const props = defineProps({ modelValue: String })
const emit = defineEmits(['update:modelValue'])

const open = ref(false)
const root = ref(null)

// La place disponible dépend d'où se trouve le bouton : dans le pied de la
// carte d'entrée il est déjà bas dans l'écran, et huit langues font 280px.
// Un plafond en `vh` ne suffit pas — il ignore la position du bouton — donc
// on mesure à l'ouverture.
const placement = ref('bas')
const hauteurMax = ref('')

const MARGE = 12
const HAUTEUR_MINI = 140

function placer() {
  const btn = root.value?.querySelector('.lang-btn')
  if (!btn) return
  const r = btn.getBoundingClientRect()
  const dessous = window.innerHeight - r.bottom - MARGE
  const dessus = r.top - MARGE
  // On ne bascule vers le haut que si le bas est vraiment trop court ET que
  // le haut offre plus de place : un menu qui saute d'un côté à l'autre pour
  // quelques pixels déroute plus qu'un menu qui défile.
  const versLeHaut = dessous < HAUTEUR_MINI && dessus > dessous
  placement.value = versLeHaut ? 'haut' : 'bas'
  hauteurMax.value = Math.max(HAUTEUR_MINI, versLeHaut ? dessus : dessous) + 'px'
}

async function basculer() {
  open.value = !open.value
  if (!open.value) return
  await nextTick()
  placer()
}

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
  /* Ancré à GAUCHE, pas à droite. Le bouton est en bas à gauche de son
     conteneur dans les deux usages — pied de la carte d'entrée, et rail de
     l'écran deck. Aligné à droite, le panneau de 160px poussait vers la
     gauche : il sortait de la carte, puis de l'écran. */
  left: 0;
  right: auto;
  /* `--surface-menu` existe précisément pour les menus déroulants et est
     défini par les trois habillages ; `--surface` est un jeton de première
     génération. Et `--shadow-md` n'a jamais été rebranché sur la palette
     actuelle (style.css l.522) : il servait encore l'ombre douce d'origine,
     que ni « arcane » ni « atelier » ne pilotent — un flou sur un skin qui
     s'interdit tout flou. */
  background: var(--surface-menu);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-2);
  list-style: none;
  padding: 4px;
  min-width: 160px;
  /* Repli si le calcul JS n'a pas encore eu lieu : le style en ligne posé par
     `placer()` prend le relais dès le tick suivant. */
  max-height: min(300px, 55vh);
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: var(--border) transparent;
  z-index: 300;
}

.lang-dropdown.vers-le-haut {
  top: auto;
  bottom: calc(100% + 6px);
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
