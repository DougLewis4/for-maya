const CACHE_NAME = 'for-maya-v10';

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
// - Code files (HTML/JS/JSON): never cached — always fetch fresh so updates appear instantly
// - Media files (images/video): cache-first (large files that never change)
self.addEventListener('fetch', event => {
  const url = event.request.url;
  const isCode  = /\.(html|js|json)(\?.*)?$/.test(url) || url.endsWith('/for-maya/') || url.endsWith('/for-maya');
  const isMedia = /\.(png|jpg|jpeg|mp4|webm|gif)$/i.test(url);

  // Code files are never cached — always fetch fresh
  if (isCode) {
    event.respondWith(fetch(event.request));
    return;
  }

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
    // Everything else: network-first with cache fallback
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
