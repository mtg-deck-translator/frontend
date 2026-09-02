<template>
  <div class="pt" role="dialog" aria-modal="true" aria-label="Pointer ma collection">
    <div class="pt-head">
      <div>
        <div class="pt-title">Pointer ma collection</div>
        <div class="pt-sub">Les cartes les plus chères d’abord — c’est là que ne pas racheter rapporte.</div>
      </div>
      <button class="pt-close" @click="$emit('close')">Terminer</button>
    </div>

    <div v-if="current" class="pt-body">
      <img
        v-if="current.imageUrl"
        :src="current.imageUrl"
        :alt="current.frName"
        class="pt-img"
      />
      <div v-else class="pt-img pt-img--empty">Pas d’illustration</div>

      <div class="pt-info">
        <div class="pt-name">{{ current.frName }}</div>
        <div class="pt-en">{{ current.displayName }}</div>
        <div v-if="current.price != null" class="pt-price">{{ formatPrice(current.price) }}</div>
      </div>

      <div class="pt-actions">
        <button class="pt-btn pt-btn--own" @click="own">
          Je l’ai <kbd>J</kbd>
        </button>
        <button class="pt-btn" @click="skip">
          Passer <kbd>N</kbd>
        </button>
      </div>

      <button class="pt-undo" :disabled="!history.length" @click="undo">
        ← Annuler la dernière <kbd>←</kbd>
      </button>
    </div>

    <p v-else class="pt-done">
      Tout est pointé. <strong>{{ ownedHere }}</strong> carte{{ ownedHere > 1 ? 's' : '' }} ajoutée{{ ownedHere > 1 ? 's' : '' }} à votre collection.
    </p>

    <div class="pt-progress">
      <div class="pt-progress-track">
        <div class="pt-progress-fill" :style="{ width: pct + '%' }"/>
      </div>
      <span class="pt-progress-text">{{ index }} / {{ queue.length }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

// Le segment visé n'a pas de CSV : sa collection est dans des boîtes. Ce mode
// remplace le fichier par un tri physique — une carte à l'écran, deux touches.
// L'ordre est le prix décroissant : c'est là que « ne pas racheter » rapporte.
const props = defineProps({
  cards: { type: Array, required: true },
})
const emit = defineEmits(['own', 'close'])

const queue = computed(() =>
  [...props.cards].sort((a, b) => (b.price ?? -1) - (a.price ?? -1))
)

const index = ref(0)
const history = ref([])
const ownedHere = ref(0)

const current = computed(() => queue.value[index.value] ?? null)
const pct = computed(() => (queue.value.length ? Math.round((index.value / queue.value.length) * 100) : 0))

function formatPrice(p) {
  return p === 0 ? '< 0.01 €' : p.toFixed(2) + ' €'
}

function own() {
  if (!current.value) return
  emit('own', current.value.queryName)
  history.value.push({ name: current.value.queryName, owned: true })
  ownedHere.value++
  index.value++
}

function skip() {
  if (!current.value) return
  history.value.push({ name: current.value.queryName, owned: false })
  index.value++
}

function undo() {
  const last = history.value.pop()
  if (!last) return
  index.value = Math.max(0, index.value - 1)
  if (last.owned) {
    ownedHere.value--
    emit('own', last.name, false)
  }
}

function onKey(e) {
  if (e.key === 'j' || e.key === 'J') { e.preventDefault(); own() }
  else if (e.key === 'n' || e.key === 'N') { e.preventDefault(); skip() }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); undo() }
  else if (e.key === 'Escape') emit('close')
}

onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<style scoped>
.pt {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  background: var(--surface-3);
  border: 1px solid var(--border);
  border-radius: 16px;
}

.pt-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.pt-title { font-size: 15px; font-weight: 600; color: var(--text-1); }
.pt-sub { margin-top: 3px; font-size: 12.5px; color: var(--text-3); }

.pt-close {
  flex-shrink: 0;
  padding: 8px 14px;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--text-2);
  background: var(--fill-1);
  border: 1px solid var(--border);
  border-radius: 10px;
  cursor: pointer;
}

.pt-close:hover { color: var(--text-1); background: var(--fill-2); }

.pt-body { display: flex; flex-direction: column; align-items: center; gap: 16px; }

.pt-img {
  width: 100%;
  max-width: 300px;
  border-radius: 14px;
  box-shadow: var(--shadow-3);
}

.pt-img--empty {
  aspect-ratio: 5 / 7;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: var(--text-4);
  background: var(--fill-1);
  border: 1px solid var(--border-subtle);
}

.pt-info { text-align: center; }
.pt-name { font-size: 17px; font-weight: 600; color: var(--text-1); }
.pt-en { font-size: 13px; color: var(--text-3); margin-top: 2px; }
.pt-price { font-family: var(--font-mono); font-size: 13px; color: var(--accent); margin-top: 6px; }

.pt-actions { display: flex; gap: 10px; width: 100%; max-width: 300px; }

.pt-btn {
  flex: 1;
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-2);
  background: var(--fill-1);
  border: 1px solid var(--border);
  border-radius: 12px;
  cursor: pointer;
  transition: background 150ms, border-color 150ms;
}

.pt-btn:hover { background: var(--fill-2); border-color: var(--border-strong); }

.pt-btn--own {
  color: var(--text-on-accent);
  background: var(--accent);
  border-color: var(--accent);
}

.pt-btn--own:hover { background: var(--accent-hover); border-color: var(--accent-hover); }

.pt-btn kbd {
  font-family: var(--font-mono);
  font-size: 10px;
  padding: 2px 5px;
  border-radius: 4px;
  background: var(--fill-3);
  color: inherit;
  opacity: 0.75;
}

.pt-undo {
  font-size: 12px;
  color: var(--text-4);
  background: none;
  border: none;
  cursor: pointer;
}

.pt-undo:disabled { opacity: 0.4; cursor: default; }
.pt-undo:not(:disabled):hover { color: var(--text-2); }
.pt-undo kbd { font-family: var(--font-mono); font-size: 10px; }

.pt-done { margin: 0; padding: 32px 0; text-align: center; font-size: 14px; color: var(--text-2); }
.pt-done strong { color: var(--accent); }

.pt-progress { display: flex; align-items: center; gap: 12px; }
.pt-progress-track { flex: 1; height: 4px; background: var(--fill-2); border-radius: 999px; overflow: hidden; }
.pt-progress-fill { height: 100%; background: var(--accent); border-radius: 999px; transition: width 200ms; }

.pt-progress-text {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-3);
  font-variant-numeric: tabular-nums;
}

@media (min-width: 900px) {
  .pt-body { display: grid; grid-template-columns: 300px 1fr; align-items: center; gap: 24px; }
  .pt-info, .pt-actions, .pt-undo { grid-column: 2; justify-self: start; text-align: left; }
  .pt-img { grid-row: 1 / span 3; }
}
</style>
