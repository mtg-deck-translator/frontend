import { ref } from 'vue'
import { safeGet, safeSet } from '../services/storage.js'

export const LANGUAGES = [
  { code: 'fr', label: 'Français',    flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch',     flag: '🇩🇪' },
  { code: 'it', label: 'Italiano',    flag: '🇮🇹' },
  { code: 'es', label: 'Español',     flag: '🇪🇸' },
  { code: 'pt', label: 'Português',   flag: '🇵🇹' },
  { code: 'ja', label: '日本語',       flag: '🇯🇵' },
  { code: 'ko', label: '한국어',       flag: '🇰🇷' },
  { code: 'ru', label: 'Русский',     flag: '🇷🇺' },
]

export function useLanguage() {
  const language = ref(safeGet('language', 'fr'))

  function setLanguage(code) {
    language.value = code
    safeSet('language', code)
  }

  return { language, setLanguage, LANGUAGES }
}
