import { ref } from 'vue'

const toasts = ref([])

export function useToast() {
  function show(message, type = 'info') {
    const id = Date.now() + Math.random()
    toasts.value.push({ id, message, type })
    setTimeout(() => {
      toasts.value = toasts.value.filter(t => t.id !== id)
    }, 2200)
  }

  return { toasts, show }
}
