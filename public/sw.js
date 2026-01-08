const CACHE_NAME = 'factory-pulse-v1';
const STATIC_ASSETS = [
  '/index.html'
];

// Instalação do Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.warn('Error caching assets:', err);
        // Continue installation even if caching fails
        return Promise.resolve();
      });
    })
  );
  self.skipWaiting();
});

// Ativar novo Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Intercetar pedidos - Network first, fallback to cache
self.addEventListener('fetch', event => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Network first strategy
  event.respondWith(
    fetch(request)
      .then(response => {
        // Clone the response
        const clonedResponse = response.clone();
        
        // Cache successful responses
        if (response.status === 200) {
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, clonedResponse);
          });
        }
        
        return response;
      })
      .catch(() => {
        // Fallback to cache on network error
        return caches.match(request).then(cachedResponse => {
          return cachedResponse || new Response('Offline - resource not available', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/plain'
            })
          });
        });
      })
  );
});
