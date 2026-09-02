// Source unique de vérité pour les catégories de cartes.
//
// Cette constante existait auparavant en quatre exemplaires divergents (App.vue,
// useFilteredGroups, useExport, CategoryGroup) et servait de FILTRE : seules les
// catégories listées étaient affichées, les autres étaient écartées sans un mot.
//
// Or une catégorie ne vient pas toujours de nous. Archidekt laisse l'utilisateur
// nommer les siennes librement (« Ramp », « Removal », « Buff »…) et scryfall.js
// leur donne la priorité (`card.category || deriveCategoryFromTypeLine(...)`).
// Résultat mesuré en production sur un deck Archidekt réel : 63 cartes sur 100
// disparaissaient de l'affichage ET de l'export, pendant que le compteur affichait
// toujours 100. Quelqu'un achetait 37 cartes en croyant en acheter 100.
//
// D'où la règle : on ORDONNE, on ne filtre jamais. Toute catégorie inconnue est
// affichée entre les types de cartes et les zones annexes, sous son nom d'origine.

/** Types de cartes, dans l'ordre de lecture habituel d'une decklist. */
const LEADING = [
  'Commander',
  'Creature',
  'Instant',
  'Sorcery',
  'Artifact',
  'Enchantment',
  'Planeswalker',
  'Land',
]

/** Zones annexes, toujours repoussées en fin de liste. */
const TRAILING = ['Other', 'Sideboard', 'Maybeboard']

export const CATEGORY_ORDER = [...LEADING, ...TRAILING]

/** Libellés au singulier — en-têtes d'export, pastilles de navigation. */
export const CATEGORY_FR = {
  Commander: 'Commandant',
  Creature: 'Créature',
  Instant: 'Éphémère',
  Sorcery: 'Rituel',
  Artifact: 'Artefact',
  Enchantment: 'Enchantement',
  Planeswalker: 'Planeswalker',
  Land: 'Terrain',
  Other: 'Autre',
  Sideboard: 'Réserve',
  Maybeboard: 'Maybeboard',
}

/** Libellés au pluriel — titres de groupes dans la liste. */
export const CATEGORY_FR_PLURAL = {
  ...CATEGORY_FR,
  Creature: 'Créatures',
  Instant: 'Éphémères',
  Sorcery: 'Rituels',
  Artifact: 'Artefacts',
  Enchantment: 'Enchantements',
  Planeswalker: 'Planeswalkers',
  Land: 'Terrains',
}

export const CATEGORY_COLORS = {
  Commander: '#f59e0b',
  Creature: '#10b981',
  Instant: '#3b82f6',
  Sorcery: '#8b5cf6',
  Artifact: '#a1a1aa',
  Enchantment: '#f472b6',
  Planeswalker: '#a855f7',
  Land: '#a16207',
  Other: '#6b7280',
  Sideboard: '#64748b',
  Maybeboard: '#64748b',
}

/** Couleur des catégories personnalisées, qu'on ne peut pas connaître à l'avance. */
export const CATEGORY_COLOR_FALLBACK = '#7c8598'

/**
 * Libellé affichable d'une catégorie.
 * Une catégorie personnalisée n'est pas traduisible : on rend son nom d'origine.
 */
export function categoryLabel(category, { plural = false } = {}) {
  const map = plural ? CATEGORY_FR_PLURAL : CATEGORY_FR
  return map[category] || category
}

export function categoryColor(category) {
  return CATEGORY_COLORS[category] || CATEGORY_COLOR_FALLBACK
}

export function isKnownCategory(category) {
  return CATEGORY_ORDER.includes(category)
}

/**
 * Ordonne les catégories réellement présentes, sans en perdre aucune :
 * types de cartes connus, puis catégories personnalisées par ordre alphabétique,
 * puis zones annexes.
 *
 * @param {Iterable<string>} present - les catégories rencontrées dans le deck
 * @returns {string[]} toutes les catégories reçues, réordonnées
 */
export function orderCategories(present) {
  const seen = new Set(present)
  const custom = [...seen]
    .filter(cat => !CATEGORY_ORDER.includes(cat))
    .sort((a, b) => a.localeCompare(b, 'fr'))

  return [
    ...LEADING.filter(cat => seen.has(cat)),
    ...custom,
    ...TRAILING.filter(cat => seen.has(cat)),
  ]
}
