<template>
  <div class="results-panel">
    <CategoryGroup
      v-for="(group, i) in visibleGroups"
      :key="group.category"
      :category="group.category"
      :cards="group.cards"
      :checked-map="checkedMap"
      :index="i"
      @toggle="$emit('toggle', $event)"
      @set-all="(keys, val) => $emit('set-all', keys, val)"
    />

    <p v-if="visibleGroups.length === 0" class="empty-state">
      {{ emptyMessage }}
    </p>
  </div>
</template>

<script setup>
import { computed, toRef } from 'vue'
import CategoryGroup from './CategoryGroup.vue'
import { useFilteredGroups } from '../composables/useFilteredGroups.js'

const props = defineProps({
  cards: Array,
  checkedMap: Object,
  filter: String,
  search: { type: String, default: '' },
  sort: { type: String, default: 'category' },
})

defineEmits(['toggle', 'set-all'])

const visibleGroups = useFilteredGroups({
  cards: toRef(props, 'cards'),
  checkedMap: toRef(props, 'checkedMap'),
  filter: toRef(props, 'filter'),
  search: toRef(props, 'search'),
  sort: toRef(props, 'sort'),
})

// « Aucune carte dans cette vue » est vrai et inutile : il faut dire pourquoi
// c'est vide, et ce qu'on peut y faire.
const emptyMessage = computed(() => {
  if (props.search) return 'Aucune carte ne correspond à la recherche.'
  if (props.filter === 'owned') return 'Vous n’avez encore coché aucune carte de ce deck.'
  if (props.filter === 'missing') return 'Rien à acheter : vous avez le deck complet.'
  if (props.filter === 'nofr') return 'Toutes les cartes de ce deck existent dans votre langue.'
  return 'Aucune carte à afficher.'
})
</script>

<style scoped>
.results-panel {
  padding-bottom: 64px;
}

.empty-state {
  padding: 48px 0;
  text-align: center;
  color: var(--text-3);
  font-size: 14px;
}
</style>
