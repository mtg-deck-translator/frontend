<template>
  <div class="collection-import">

    <!-- Collection chargée -->
    <div v-if="hasCollection" class="col-loaded">
      <div class="cl-info">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M2 6l3 3 5-5" stroke="var(--success)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="cl-name" :title="collectionName">{{ collectionName }}</span>
        <span class="cl-count tabular">{{ collectionSize }}</span>
      </div>
      <div class="cl-actions">
        <button class="cl-apply" @click="$emit('apply')" title="Cocher toutes les cartes possédées">
          Appliquer
        </button>
        <button class="cl-clear" @click="clearCollection" title="Supprimer la collection">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
            <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Pas encore importé -->
    <div v-else class="col-empty">
      <button class="import-btn" @click="fileInput.click()">
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M7 10V3M4 6l3-3 3 3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M2 11h10" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
        </svg>
        Importer collection CSV
      </button>
      <p class="import-hint">Manabox · DragonShield · Moxfield</p>
    </div>

    <p v-if="parseError" class="import-error">{{ parseError }}</p>

    <input
      ref="fileInput"
      type="file"
      accept=".csv,.txt"
      class="hidden-input"
      @change="onFile"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useCollection } from '../composables/useCollection.js'
import { parseCollectionCSV } from '../services/collectionParser.js'

defineEmits(['apply'])

const { hasCollection, collectionName, collectionSize, setCollection, clearCollection } = useCollection()

const fileInput = ref(null)
const parseError = ref('')

async function onFile(e) {
  const file = e.target.files?.[0]
  if (!file) return
  parseError.value = ''

  try {
    const text = await file.text()
    const map = parseCollectionCSV(text)
    setCollection(map, file.name.replace(/\.csv$/i, ''))
  } catch (err) {
    parseError.value = err.message
  } finally {
    e.target.value = ''
  }
}
</script>

<style scoped>
.collection-import {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.hidden-input { display: none; }

/* Collection chargée */
.col-loaded {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 7px 10px;
  background: rgba(34, 197, 94, 0.06);
  border: 1px solid rgba(34, 197, 94, 0.2);
  border-radius: var(--radius-md);
}

.cl-info {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  overflow: hidden;
}

.cl-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cl-count {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-3);
  flex-shrink: 0;
}

.cl-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.cl-apply {
  font-size: 11px;
  font-weight: 500;
  color: var(--success);
  padding: 3px 8px;
  border-radius: var(--radius-sm);
  border: 1px solid rgba(34, 197, 94, 0.3);
  transition: background var(--transition-fast);
}

.cl-apply:hover {
  background: rgba(34, 197, 94, 0.1);
}

.cl-clear {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: var(--radius-sm);
  color: var(--text-3);
  transition: color var(--transition-fast), background var(--transition-fast);
}

.cl-clear:hover {
  color: var(--text-1);
  background: var(--surface-2);
}

/* Import button */
.col-empty {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.import-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 7px 10px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-2);
  border: 1px dashed var(--border-strong);
  border-radius: var(--radius-md);
  background: transparent;
  transition: color var(--transition-fast), border-color var(--transition-fast), background var(--transition-fast);
}

.import-btn:hover {
  color: var(--accent);
  border-color: var(--accent);
  background: var(--accent-subtle);
}

.import-hint {
  font-size: 10px;
  color: var(--text-3);
  padding-left: 2px;
  font-family: var(--font-mono);
}

.import-error {
  font-size: 11px;
  color: var(--error);
  line-height: 1.4;
}
</style>
