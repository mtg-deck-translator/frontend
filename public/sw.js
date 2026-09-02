// Service worker minimal, volontairement.
//
// Deux règles seulement, parce qu'un cache mal réglé est pire que pas de cache :
//   - /assets/* porte un hash de contenu : immuable, donc cache d'abord ;
//   - tout le reste passe par le réseau, avec le cache en filet de secours.
// /api/* n'est JAMAIS mis en cache : une decklist qui change doit être relue,
// et une erreur réseau ne doit pas se figer.
const CACHE = 'mtg-translator-v1'
const SHELL = ['/', '/favicon.svg', '/manifest.webmanifest']

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/api/')) return

  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then(hit => hit || fetch(request).then(resp => {
        const copy = resp.clone()
        caches.open(CACHE).then(c => c.put(request, copy))
        return resp
      }))
    )
    return
  }

  event.respondWith(
    fetch(request)
      .then(resp => {
        const copy = resp.clone()
        caches.open(CACHE).then(c => c.put(request, copy))
        return resp
      })
      .catch(() => caches.match(request).then(hit => hit || caches.match('/')))
  )
})
