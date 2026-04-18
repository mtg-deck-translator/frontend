<template>
  <button class="print-btn" title="Imprimer la liste en A4" @click="print">
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="2" y="5" width="10" height="7" rx="1" stroke="currentColor" stroke-width="1.3"/>
      <path d="M4 5V2.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 .5.5V5" stroke="currentColor" stroke-width="1.3"/>
      <rect x="4" y="8" width="6" height="1" rx=".5" fill="currentColor"/>
      <rect x="4" y="10" width="4" height="1" rx=".5" fill="currentColor"/>
      <circle cx="10.5" cy="7" r=".75" fill="currentColor"/>
    </svg>
    Imprimer
  </button>
</template>

<script setup>
function print() {
  window.print()
}
</script>

<style scoped>
.print-btn {
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

.print-btn:hover {
  background: var(--surface-2);
  color: var(--text-1);
  border-color: var(--border-strong);
}
</style>
