const CACHE_NAME = 'for-maya-v5';

// Media files: cache-first (large, never change, need offline access)
const MEDIA_ASSETS = [
  '/photos/gb.png',
  '/photos/gb-eats.mp4',
  '/photos/gb-dance.mp4'
];

// On install: pre-cache media files only
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(MEDIA_ASSETS))
  );
  self.skipWaiting();
});

// On activate: remove old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch strategy:
// - Media files (images/video): cache-first
// - Everything else (HTML/JS/CSS): network-first with cache fallback
self.addEventListener('fetch', event => {
  const url = event.request.url;
  const isMedia = /\.(png|jpg|jpeg|mp4|webm|gif)$/i.test(url);

  if (isMedia) {
    // Cache-first: serve instantly from cache, fall back to network
    event.respondWith(
      caches.match(event.request).then(cached => {
        return cached || fetch(event.request).then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        });
      })
    );
  } else {
    // Network-first: always try to get fresh code, fall back to cache if offline
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  }
});
