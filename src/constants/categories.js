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

/**
 * Couleurs de catégorie, en variables CSS plutôt qu'en littéraux : elles
 * doivent suivre le thème. Trois d'entre elles échouaient au seuil AA sur fond
 * sombre (Land 4,10:1, Other 4,17:1, Sideboard 4,24:1) et l'ambre du
 * commandant serait illisible sur fond clair. Les valeurs vivent dans
 * assets/style.css, où les deux thèmes sont définis côte à côte.
 */
export const CATEGORY_COLOR_VARS = {
  Commander: '--cat-commander',
  Creature: '--cat-creature',
  Instant: '--cat-instant',
  Sorcery: '--cat-sorcery',
  Artifact: '--cat-artifact',
  Enchantment: '--cat-enchantment',
  Planeswalker: '--cat-planeswalker',
  Land: '--cat-land',
  Other: '--cat-other',
  Sideboard: '--cat-zone',
  Maybeboard: '--cat-zone',
}

/** Couleur des catégories personnalisées, qu'on ne peut pas connaître à l'avance. */
export const CATEGORY_COLOR_FALLBACK = 'var(--cat-custom)'

export function categoryLabel(category, { plural = false } = {}) {
  const map = plural ? CATEGORY_FR_PLURAL : CATEGORY_FR
  return map[category] || category
}

export function categoryColor(category) {
  const v = CATEGORY_COLOR_VARS[category]
  return v ? `var(${v})` : CATEGORY_COLOR_FALLBACK
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
