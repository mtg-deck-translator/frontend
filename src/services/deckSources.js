// Les fonctions serverless (api/) vivent dans le même déploiement Vercel que le front.
// On appelle donc /api en chemin relatif, en dur : pas de CORS, pas d'URL à synchroniser,
// et surtout aucune variable d'env qui puisse repointer le front vers un backend mort —
// c'est exactement ce qui est arrivé avec VITE_BACKEND_URL et le service Railway éteint.

export function isArchidektUrl(url)  { return /archidekt\.com\/decks\//i.test(url) }
export function isMtgtop8Url(url)    { return /mtgtop8\.com\/event/i.test(url) }
export function isMoxfieldUrl(url)   { return /moxfield\.com\/decks\//i.test(url) }
export function isTappedoutUrl(url)  { return /tappedout\.net\/mtg-decks\//i.test(url) }

export function isSupportedUrl(url) {
  return isArchidektUrl(url) || isMtgtop8Url(url) || isMoxfieldUrl(url) || isTappedoutUrl(url)
}

export async function fetchDeckFromBackend(url) {
  let resp
  try {
    resp = await fetch(`/api/deck?url=${encodeURIComponent(url)}`)
  } catch {
    throw new Error("Impossible de contacter le serveur. Vérifiez votre connexion.")
  }

  // Une fonction Vercel qui dépasse son délai renvoie une page HTML, pas du JSON.
  // Sans ce try, l'utilisateur lisait « Unexpected token '<' » dans la bannière.
  let data
  try {
    data = await resp.json()
  } catch {
    throw new Error(
      resp.status === 504
        ? "La source met trop de temps à répondre. Réessayez dans un instant."
        : `Réponse inattendue du serveur (HTTP ${resp.status}).`
    )
  }

  if (!resp.ok) throw new Error(data.error || `Erreur serveur (HTTP ${resp.status}).`)
  return data
}
