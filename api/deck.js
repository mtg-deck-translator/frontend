import { fetchMoxfieldDeck } from './_lib/moxfield.js'
import { fetchArchidektDeck } from './_lib/archidekt.js'
import { fetchMtgtop8Deck } from './_lib/mtgtop8.js'
import { fetchTappedoutDeck } from './_lib/tappedout.js'

// Proxy de récupération de decklists.
// Indispensable : aucune des 4 sources n'autorise le CORS navigateur (Archidekt renvoie
// un Access-Control-Allow-Origin codé en dur sur localhost:3000, Moxfield et Tappedout
// sont derrière Cloudflare). Scryfall, lui, est appelé directement depuis le front.
const SOURCES = [
  { test: /moxfield\.com\/decks\//i,   fetch: fetchMoxfieldDeck },
  { test: /mtgtop8\.com\/event/i,      fetch: fetchMtgtop8Deck },
  { test: /archidekt\.com\/decks\//i,  fetch: fetchArchidektDeck },
  { test: /tappedout\.net\/mtg-decks\//i, fetch: fetchTappedoutDeck },
]

export default async function handler(req, res) {
  const { url } = req.query

  if (!url) {
    return res.status(400).json({ error: 'Paramètre url manquant.' })
  }

  const source = SOURCES.find(s => s.test.test(url))
  if (!source) {
    return res.status(400).json({
      error: 'Source non reconnue. URLs supportées : Archidekt, Moxfield, MTGTOP8, Tappedout.',
    })
  }

  try {
    const deck = await source.fetch(url)
    return res.status(200).json(deck)
  } catch (err) {
    return res.status(502).json({ error: err.message })
  }
}
