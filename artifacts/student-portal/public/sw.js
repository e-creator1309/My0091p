// ASPU Student Portal — Service Worker v2
const CACHE = 'aspu-v2';
const OFFLINE_URL = '/My0091p/offline.html';

const PRECACHE = [
  '/My0091p/',
  '/My0091p/index.html',
  '/My0091p/offline.html',
  '/My0091p/manifest.json',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).catch(() => {})
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

  // Never intercept API / worker calls
  if (url.includes('workers.dev') || e.request.method !== 'GET') return;

  // Navigation requests: network first, offline.html as fallback
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
          return res;
        })
        .catch(() =>
          caches.match(OFFLINE_URL).then(r => r || new Response('Offline', { status: 503 }))
        )
    );
    return;
  }

  // Assets: cache first, network fallback
  e.respondWith(
    caches.match(e.request).then(cached => {
      const networkFetch = fetch(e.request)
        .then(res => {
          if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
          return res;
        })
        .catch(() => cached || new Response('Offline', { status: 503 }));
      return cached || networkFetch;
    })
  );
});
