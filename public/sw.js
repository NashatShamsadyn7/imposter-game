// ═══════════════════════════════════════════════════════════
//  Service Worker — بۆ تواناکردنی دامەزراندن (PWA) و کارکردن بەبێ ئینتەرنێت
// ═══════════════════════════════════════════════════════════

const CACHE = 'imposter-v7'
const APP_SHELL = ['/', '/index.html', '/favicon.svg', '/manifest.webmanifest']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(APP_SHELL)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// وەرگرتنی Push (تەنانەت کاتێک ئەپ بەتەواوی داخراوە)
self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch (e) {
    data = { title: 'ساختەکار', body: event.data?.text() || '' }
  }
  const title = data.title || 'ساختەکار'
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || '',
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: data.tag || 'push',
      data: { url: data.url || '/' },
    })
  )
})

// کرتە لەسەر ئاگادارکردنەوەی سیستەم — ئەپ بکەرەوە/فۆکەس بکە (لەگەڵ لینکی ڕاستەوخۆ)
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ('focus' in c) {
          // ئەگەر لینکەکە بانگهێشتی ژوور بوو، ناوبڕینی بکە بۆ ئەو URLـە
          if (url !== '/' && 'navigate' in c) c.navigate(url).catch(() => {})
          return c.focus()
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url)
    })
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  // تەنها داواکاری GET ـی هەمان ڕەگەزە (origin) کاش دەکەین
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return

  // گەشتکردن (navigation): سەرەتا تۆڕ، ئەگەر سەرکەوتوو نەبوو لە کاش
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(request, copy))
          return res
        })
        .catch(() => caches.match(request).then((r) => r || caches.match('/index.html')))
    )
    return
  }

  // سەرچاوەکانی تر: سەرەتا کاش، پاشان تۆڕ (stale-while-revalidate)
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(request, copy))
          }
          return res
        })
        .catch(() => cached)
      return cached || network
    })
  )
})
