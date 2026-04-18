<template>
  <div class="export-panel">
    <button class="export-btn" @click="$emit('copy-all')">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <rect x="4" y="4" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.3"/>
        <path d="M2 10V3a1 1 0 0 1 1-1h7" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
      </svg>
      Copier tout
    </button>
    <button class="export-btn" @click="$emit('copy-missing')">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path d="M2 7h10M7 2v10" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
      </svg>
      Copier manquantes
    </button>
    <button class="export-btn" @click="$emit('download')">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path d="M7 2v7M4 7l3 3 3-3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M2 11h10" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
      </svg>
      Télécharger .txt
    </button>
    <button class="export-btn" @click="$emit('print')">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <rect x="2" y="5" width="10" height="7" rx="1" stroke="currentColor" stroke-width="1.3"/>
        <path d="M4 5V2.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 .5.5V5" stroke="currentColor" stroke-width="1.3"/>
        <rect x="4" y="8" width="6" height="1" rx=".5" fill="currentColor"/>
        <rect x="4" y="10" width="4" height="1" rx=".5" fill="currentColor"/>
        <circle cx="10.5" cy="7" r=".75" fill="currentColor"/>
      </svg>
      Imprimer A4
    </button>
  </div>
</template>

<script setup>
defineEmits(['copy-all', 'copy-missing', 'download', 'print'])
</script>

<style scoped>
.export-panel {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.export-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  font-size: 13px;
  font-weight: 500;
  color: var(--text-2);
  transition: background var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast);
}

.export-btn:hover {
  background: var(--surface-2);
  color: var(--text-1);
  border-color: var(--border-strong);
}
</style>
