// ASPU Student Portal — Service Worker v3
const CACHE = 'aspu-v3';
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
  if (url.includes('workers.dev') || e.request.method !== 'GET') return;

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

// Open the app when user taps a notification
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (client.url.includes('/My0091p/') && 'focus' in client) return client.focus();
      }
      return clients.openWindow('/My0091p/');
    })
  );
});
