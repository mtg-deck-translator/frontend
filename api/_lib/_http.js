import { gotScraping } from 'got-scraping'

// got lève par défaut sur toute réponse non-2xx (throwHttpErrors). Les scrapers
// testaient donc `resp.statusCode === 404` dans des branches inatteignables :
// le catch s'était déjà déclenché, et l'utilisateur lisait
// « Impossible de contacter Moxfield : Response code 404 (Not Found) »
// au lieu de « Ce deck est privé ». On rend la main sur le statut aux appelants.
//
// Le timeout est tout aussi important : Vercel coupe la fonction à 30 s et
// renvoie alors du HTML, que le front ne sait pas lire. Mieux vaut abandonner
// avant et répondre du JSON.
const DEFAULT_TIMEOUT_MS = 12000

export async function scrape(url, options = {}) {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, sourceName = 'la source', ...rest } = options

  try {
    return await gotScraping({
      url,
      throwHttpErrors: false,
      timeout: { request: timeoutMs },
      retry: { limit: 0 },
      ...rest,
    })
  } catch (err) {
    const timedOut = err.code === 'ETIMEDOUT' || err.name === 'TimeoutError'
    throw new Error(
      timedOut
        ? `${sourceName} met trop de temps à répondre. Réessayez dans un instant.`
        : `Impossible de contacter ${sourceName}.`
    )
  }
}

/** Message lisible pour un statut HTTP renvoyé par une source de decks. */
export function describeStatus(status, sourceName) {
  if (status === 404) return `Deck ${sourceName} introuvable. Vérifiez le lien.`
  if (status === 401 || status === 403) return `Ce deck ${sourceName} est privé, ou ${sourceName} bloque l'accès automatisé.`
  if (status === 429) return `${sourceName} limite temporairement les requêtes. Réessayez dans un instant.`
  if (status >= 500) return `${sourceName} rencontre un problème de son côté. Réessayez plus tard.`
  return `Erreur ${sourceName} (HTTP ${status}).`
}
