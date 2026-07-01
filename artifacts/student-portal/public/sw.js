// ASPU Student Portal — Service Worker
const CACHE = 'aspu-v1';

// App shell files to pre-cache
const PRECACHE = [
  '/My0091p/',
  '/My0091p/index.html',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(PRECACHE))
      .catch(() => {}) // Don't fail install if pre-cache fails
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  // Never intercept API calls or Cloudflare Worker requests
  if (url.includes('workers.dev') || e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      const networkFetch = fetch(e.request)
        .then(res => {
          if (res.ok) {
            caches.open(CACHE).then(c => c.put(e.request, res.clone()));
          }
          return res;
        })
        .catch(() => cached || new Response('Offline', { status: 503 }));
      // Return cached immediately, update in background
      return cached || networkFetch;
    })
  );
});
