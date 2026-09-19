// Service Worker for RunRadar PWA
const CACHE_NAME = 'runradar-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Network-first strategy for dynamic radar content, fallback to cache for static shell
self.addEventListener('fetch', (event) => {
  // Ignorar peticiones a websockets, socket.io y APIs dinámicas
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/socket.io') || url.pathname.startsWith('/api')) {
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
  }
});
