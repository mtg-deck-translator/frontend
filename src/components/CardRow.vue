<template>
  <div
    class="cr-row"
    :class="{ checked: isChecked, commander: isCommander, 'is-last': isLast }"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
    @click="$emit('toggle', card.queryName)"
  >
    <button
      class="cr-check"
      role="checkbox"
      :aria-checked="isChecked"
      :aria-label="`${isChecked ? 'Retirer' : 'Marquer'} ${card.frName}`"
      @click.stop="$emit('toggle', card.queryName)"
      @keydown.space.prevent="$emit('toggle', card.queryName)"
    >
      <svg v-if="isChecked" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path d="M2.5 6l3 3 4-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>

    <div class="cr-qty">{{ card.qty }}</div>

    <div class="cr-names">
      <span class="cr-fr">{{ card.frName }}</span>
      <span class="cr-en">{{ card.displayName }}</span>
    </div>

    <div class="cr-right">
      <span v-if="card.noFr" class="cr-badge-en">EN</span>
      <span v-if="card.price != null" class="cr-price">{{ formatPrice(card.price) }}</span>
    </div>

  </div>
</template>

<script setup>
import { computed, onUnmounted } from 'vue'
import { useCardPreview } from '../composables/useCardPreview.js'

const props = defineProps({
  card: Object,
  isChecked: Boolean,
  isLast: { type: Boolean, default: false },
})
defineEmits(['toggle'])

function formatPrice(price) {
  if (price === 0) return '< 0.01 €'
  return price.toFixed(2) + ' €'
}

const isCommander = computed(() => props.card.category === 'Commander')

// L'aperçu n'a de sens qu'avec une vraie souris. Au tactile, le tap émule un
// mouseenter sans mouseleave : la vignette restait affichée jusqu'au tap
// suivant, et en pointer-events:none, donc impossible à refermer.
const canHover = typeof window !== 'undefined'
  && window.matchMedia?.('(hover: hover) and (pointer: fine)').matches

// La ligne ne dessine plus l'aperçu : elle dit seulement quelle carte est
// survolée. C'est le rail de gauche qui l'affiche, en grand.
const { survoler, quitter } = useCardPreview()

function onMouseEnter() { if (canHover) survoler(props.card) }
function onMouseLeave() { if (canHover) quitter(props.card) }

onUnmounted(() => quitter(props.card))
</script>

<style scoped>
.cr-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 13px 18px;
  border-left: 2px solid transparent;
  border-bottom: 1px solid var(--border-subtle);
  transition: background 150ms, border-left-color 150ms;
  cursor: default;
}

.cr-row.is-last { border-bottom: none; }

.cr-row.commander {
  padding: 17px 20px;
}

.cr-row { cursor: pointer; }

.cr-row:hover {
  background: var(--fill-1);
  border-left-color: var(--cat-color, var(--border-focus));
}

/* Checkbox */
.cr-check:hover {
  border-color: var(--border-focus);
  background: var(--fill-2);
}

.cr-check {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1.5px solid var(--border-strong);
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-1);
  transition: background 150ms, border-color 150ms;
  cursor: pointer;
}

.cr-check:hover {
  border-color: var(--border-focus);
  background: var(--fill-2);
}

/* Pastille pleine = carte possédée. Le sélecteur doit rester scopé à .checked :
   sans quoi toutes les lignes se remplissent et cocher ne se voit plus. */
.cr-row.checked .cr-check {
  background: var(--cat-color, var(--accent));
  border-color: var(--cat-color, var(--accent));
}

/* Qty badge */
.cr-qty {
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  color: var(--text-4);
  background: var(--surface-sunk);
  border: 1px solid var(--border-subtle);
  border-radius: 9px;
}

/* Names */
.cr-names {
  flex: 1;
  display: flex;
  align-items: baseline;
  gap: 10px;
  min-width: 0;
  overflow: hidden;
}

.cr-fr {
  min-width: 0;
  overflow-wrap: anywhere;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 0;
  transition: color 150ms;
}

.cr-row.checked .cr-fr { color: var(--text-1); }
.commander .cr-fr { font-size: 16px; font-weight: 700; }

.cr-en {
  font-size: 11px;
  font-style: italic;
  color: var(--text-4);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Right zone */
.cr-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  margin-left: auto;
}

.cr-price {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-4);
  white-space: nowrap;
  transition: color 150ms;
}

.cr-row:hover .cr-price { color: var(--cat-color, var(--text-3)); }

.cr-badge-en {
  font-family: var(--font-mono);
  font-size: 8px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 1px 5px;
  border-radius: 4px;
  background: var(--fill-2);
  color: var(--text-4);
  border: 1px solid var(--border);
}

/* Mesuré : la case fait 22x22 — sous le minimum WCAG 2.5.8 de 24px — et c'est
   la cible la plus répétée de l'app (81 fois sur un deck EDH). Taper le nom ne
   faisait rien : la zone active représentait 1,4 % d'une ligne de 356x95. */

/* ── Media queries, regroupées en fin de feuille ────────
   Une media query n'augmente pas la spécificité : placée avant la
   règle qu'elle doit annuler, elle perd la cascade en silence. */

@media (pointer: coarse) {
  .cr-row { cursor: pointer; }
  .cr-check { width: 28px; height: 28px; }

  /* La cible réelle déborde du dessin, sans déplacer la mise en page. */
  .cr-check::after {
    content: '';
    position: absolute;
    inset: -10px;
  }
  .cr-check { position: relative; }
}

@media (max-width: 640px) {
  /* Mesuré au navigateur : « Chambre de croissance des… » était tronqué.
     Sur une largeur de téléphone, le nom d'une carte Magic ne tient pas sur
     une ligne — il passe sur deux plutôt que d'être amputé, et le nom anglais
     descend sous lui au lieu de lui disputer la place. */
  /* 95px par ligne ne laissait que 2 lignes visibles sous l'en-tête et la
     barre d'outils. Le nom garde ses deux lignes possibles ; le nom anglais
     passe en dessous, sur une seule, tronqué s'il le faut — c'est un repère
     de vérification, pas l'information principale. */
  /* La case était contre le bord gauche, l'endroit le moins accessible pour
     un droitier, alors que c'est la cible la plus répétée de l'app. Elle passe
     à droite, côté pouce ; la quantité la suit pour rester lisible avec elle. */
  /* Objectif 56px par ligne : sur un écran de 844, chaque ligne gagnée est
     une carte de plus sous les yeux. Le nom garde le droit de passer sur deux
     lignes quand il est long — un nom tronqué ne sert à rien chez le vendeur —
     mais tout le reste est resserré. */
  .cr-row { gap: 12px; min-height: 56px; padding: 6px 14px 6px 16px; }
  .cr-check { order: 4; }
  .cr-qty { order: 3; }
  .cr-names { order: 1; }
  .cr-right { order: 2; }
  .cr-names { flex-wrap: wrap; align-items: flex-start; gap: 0; overflow: visible; }
  .cr-fr {
    flex: 1 1 100%;
    white-space: normal;
    overflow: visible;
    text-overflow: clip;
    font-size: 14px;
    font-weight: 600;
    line-height: 1.25;
  }
  .cr-en {
    flex: 1 1 100%;
    font-family: var(--font-mono);
    font-size: 10.5px;
    font-style: normal;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .cr-names { gap: 1px; }
  .cr-qty { min-width: 22px; height: 22px; font-size: 11px; }
  .cr-check { width: 26px; height: 26px; }
}
</style>
