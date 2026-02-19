/* ============================================
   VELTRIX IDE — service-worker.js
   PWA Service Worker (Cache-First Strategy)
   ============================================ */

const CACHE_NAME = 'veltrix-ide-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/about.html',
  '/tutorials.html',
  '/lab.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
];

/* ====== INSTALL: Cache static assets ====== */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

/* ====== ACTIVATE: Clear old caches ====== */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

/* ====== FETCH: Cache-first, network fallback ====== */
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Skip non-http(s) requests
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        // Cache new resources
        if (networkResponse && networkResponse.status === 200) {
          const cloned = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, cloned);
          });
        }
        return networkResponse;
      });
    }).catch(() => {
      // Offline fallback: return index.html for navigation requests
      if (event.request.mode === 'navigate') {
        return caches.match('/index.html');
      }
    })
  );
});
