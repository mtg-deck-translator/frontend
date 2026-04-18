import { ref, watchEffect } from 'vue'
import { getTheme, setTheme } from '../services/storage.js'

export function useTheme() {
  const theme = ref(getTheme())

  watchEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark = theme.value === 'dark' || (theme.value === 'system' && prefersDark)
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
    setTheme(theme.value)
  })

  function toggle() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  return { theme, toggle }
}
