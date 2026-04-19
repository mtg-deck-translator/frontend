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
      @set-all="$emit('set-all', $event[0], $event[1])"
    />

    <p v-if="visibleGroups.length === 0" class="empty-state">
      {{ search ? 'Aucune carte ne correspond à la recherche.' : 'Aucune carte dans cette vue.' }}
    </p>
  </div>
</template>

<script setup>
import { toRef } from 'vue'
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
