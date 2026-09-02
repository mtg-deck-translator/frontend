import { fetchMoxfieldDeck } from './_lib/moxfield.js'
import { fetchArchidektDeck } from './_lib/archidekt.js'
import { fetchMtgtop8Deck } from './_lib/mtgtop8.js'
import { fetchTappedoutDeck } from './_lib/tappedout.js'

// Proxy de récupération de decklists.
// Indispensable : aucune des 4 sources n'autorise le CORS navigateur (Archidekt renvoie
// un Access-Control-Allow-Origin codé en dur sur localhost:3000, Moxfield et Tappedout
// sont derrière Cloudflare). Scryfall, lui, est appelé directement depuis le front.
//
// La reconnaissance se fait sur le HOST, pas sur une regex appliquée à la chaîne
// entière. L'ancienne version testait `/moxfield\.com\/decks\//.test(url)`, ce qui
// laissait passer « http://169.254.169.254/moxfield.com/decks/x ». Aucun scraper ne
// refetchait l'URL telle quelle, donc ce n'était pas exploitable — mais la sécurité
// tenait à une propriété des adaptateurs, pas à une vérification. Elle est explicite.
const SOURCES = [
  { hosts: ['moxfield.com', 'www.moxfield.com'],   path: /^\/decks\//i,      fetch: fetchMoxfieldDeck },
  { hosts: ['mtgtop8.com', 'www.mtgtop8.com'],     path: /^\/event/i,        fetch: fetchMtgtop8Deck },
  { hosts: ['archidekt.com', 'www.archidekt.com'], path: /^\/decks\//i,      fetch: fetchArchidektDeck },
  { hosts: ['tappedout.net', 'www.tappedout.net'], path: /^\/mtg-decks\//i,  fetch: fetchTappedoutDeck },
]

function resolveSource(rawUrl) {
  let parsed
  try {
    parsed = new URL(rawUrl)
  } catch {
    return null
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null

  return SOURCES.find(s =>
    s.hosts.includes(parsed.hostname.toLowerCase()) && s.path.test(parsed.pathname)
  ) || null
}

export default async function handler(req, res) {
  const { url } = req.query

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Paramètre url manquant.' })
  }

  const source = resolveSource(url)
  if (!source) {
    return res.status(400).json({
      error: 'Source non reconnue. URLs supportées : Archidekt, Moxfield, MTGTOP8, Tappedout.',
    })
  }

  try {
    const deck = await source.fetch(url)
    // Une decklist bouge peu. Le CDN absorbe les consultations répétées d'un même
    // deck et allège d'autant les sources, qu'on préfère ne pas solliciter en vain.
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
    return res.status(200).json(deck)
  } catch (err) {
    // Les messages des adaptateurs sont écrits pour être lus par un humain.
    // Tout le reste resterait technique et exposerait le fonctionnement interne.
    const message = err?.message && err.message.length < 200
      ? err.message
      : "La source n'a pas pu être lue. Réessayez dans un instant."
    return res.status(502).json({ error: message })
  }
}
