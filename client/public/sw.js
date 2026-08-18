const SHELL_CACHE = 'tsp-tracker-shell-v1';
const DATA_CACHE = 'tsp-tracker-public-data-v1';
const APP_SHELL = ['/', '/manifest.webmanifest', '/favicon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => ![SHELL_CACHE, DATA_CACHE].includes(key))
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

function isPublicFundQuery(url) {
  if (url.origin !== self.location.origin || !url.pathname.startsWith('/api/trpc/')) return false;
  if (url.pathname.includes('auth.') || url.pathname.includes('settings.')) return false;
  return url.pathname.includes('funds.');
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(SHELL_CACHE).then((cache) => cache.put('/', copy));
            return response;
          }
          return caches.match('/').then((cached) => cached || response);
        })
        .catch(() => caches.match('/'))
    );
    return;
  }

  if (isPublicFundQuery(url)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(DATA_CACHE).then((cache) => cache.put(request, copy));
            return response;
          }
          return caches.match(request).then((cached) => cached || response);
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  if (request.destination === 'script' || request.destination === 'style' || request.destination === 'font' || request.destination === 'image') {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      }))
    );
  }
});
