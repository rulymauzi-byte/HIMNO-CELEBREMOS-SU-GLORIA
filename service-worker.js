const CACHE_NAME = 'celebremos-sg-mauzi-v4';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return Promise.all(APP_SHELL.map(function(url) {
          return cache.add(url).catch(function() { return null; });
        }));
      })
      .then(function() { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys()
      .then(function(keys) {
        return Promise.all(keys.map(function(key) {
          return key === CACHE_NAME ? null : caches.delete(key);
        }));
      })
      .then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(event) {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(function(response) {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put('./index.html', copy);
            });
          }
          return response;
        })
        .catch(function() {
          return caches.match('./index.html', { ignoreSearch: true })
            .then(function(response) {
              return response || caches.match('./', { ignoreSearch: true });
            });
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request, { ignoreSearch: true })
      .then(function(cached) {
        if (cached) return cached;

        return fetch(request).then(function(response) {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put(request, copy);
            });
          }
          return response;
        });
      })
  );
});
