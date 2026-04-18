import { useToast } from './useToast.js'

const CATEGORY_ORDER = ['Commander', 'Creature', 'Instant', 'Sorcery', 'Artifact', 'Enchantment', 'Planeswalker', 'Land', 'Other']

const CATEGORY_FR = {
  Commander: 'Commandant',
  Creature: 'Créature',
  Instant: 'Éphémère',
  Sorcery: 'Rituel',
  Artifact: 'Artefact',
  Enchantment: 'Enchantement',
  Planeswalker: 'Planeswalker',
  Land: 'Terrain',
  Other: 'Autre',
}

function formatCards(cards) {
  const groups = {}
  for (const card of cards) {
    const cat = card.category || 'Other'
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(card)
  }

  const lines = []
  for (const cat of CATEGORY_ORDER) {
    if (!groups[cat]?.length) continue
    lines.push(`// ${CATEGORY_FR[cat] || cat}`)
    for (const card of groups[cat]) {
      lines.push(`${card.qty} ${card.frName}`)
    }
    lines.push('')
  }

  return lines.join('\n').trim()
}

export function useExport(cards, checkedMap) {
  const { show } = useToast()

  async function copyToClipboard(text, label) {
    try {
      await navigator.clipboard.writeText(text)
      show(`${label} copié !`, 'success')
    } catch {
      show('Échec de la copie', 'error')
    }
  }

  async function copyAll() {
    const text = formatCards(cards.value)
    await copyToClipboard(text, 'Liste complète')
  }

  async function copyMissing() {
    const missing = cards.value.filter(c => !checkedMap.value[c.queryName])
    const text = formatCards(missing)
    await copyToClipboard(text, 'Liste des manquantes')
  }

  function downloadTxt(deckName) {
    const text = formatCards(cards.value)
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(deckName || 'deck').replace(/[^a-z0-9]/gi, '_').toLowerCase()}_fr.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    show('Téléchargement lancé', 'success')
  }

  const CM_LANG_MAP = { fr: 'fr', de: 'de', it: 'it', es: 'es', pt: 'pt' }

  async function buyCardmarket(lang) {
    const missing = cards.value.filter(c => !checkedMap.value[c.queryName])
    if (missing.length === 0) {
      show('Aucune carte manquante !', 'success')
      return
    }

    const text = missing.map(c => `${c.qty} ${c.displayName}`).join('\n')
    try { await navigator.clipboard.writeText(text) } catch {}

    const cmLang = CM_LANG_MAP[lang] || 'en'
    window.open(`https://www.cardmarket.com/${cmLang}/Magic/Wants`, '_blank', 'noopener')
    show('Liste copiée ! Collez-la dans Cardmarket → "Add from list"', 'success')
  }

  return { copyAll, copyMissing, downloadTxt, buyCardmarket }
}
