const CACHE = 'orlyo-pwa-v1'

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url)

  // Uniquement requêtes GET same-origin
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return

  // Assets Next.js (content-hashed) : cache-first
  if (url.pathname.startsWith('/_next/static/')) {
    e.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const hit = await cache.match(e.request)
        if (hit) return hit
        const res = await fetch(e.request)
        if (res.ok) cache.put(e.request, res.clone())
        return res
      })
    )
    return
  }

  // Pages QR client : réseau en priorité, cache en fallback (offline)
  if (url.pathname.startsWith('/mon-qr-code/')) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          if (res.ok) {
            caches.open(CACHE).then((c) => c.put(e.request, res.clone()))
          }
          return res
        })
        .catch(() => caches.match(e.request))
    )
    return
  }
})

// Notifications push
self.addEventListener('push', (e) => {
  if (!e.data) return
  const d = e.data.json()
  e.waitUntil(
    self.registration.showNotification(d.title || 'Orlyo', {
      body: d.body || '',
      icon: d.icon || '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: d.tag || 'orlyo',
      data: { url: d.url || '/' },
    })
  )
})

self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const url = e.notification.data?.url || '/'
  e.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((wcs) => {
        for (const wc of wcs) {
          if (wc.url === url) return wc.focus()
        }
        return clients.openWindow(url)
      })
  )
})
