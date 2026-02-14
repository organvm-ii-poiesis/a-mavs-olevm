/**
 * Service Worker for ET CETER4
 * Provides basic caching for critical assets with offline fallback
 * Cache limit ~5MB due to large images
 *
 * Bump CACHE_VERSION when deploying updated assets to bust stale caches
 */

const CACHE_VERSION = 4;
const CACHE_NAME = `etceter4-v${CACHE_VERSION}`;

/**
 * Critical assets to cache
 * Limited to essential CSS, JS, and favicon
 */
const CRITICAL_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/css/styles.css',
  '/css/vendor/tachyons/css/tachyons.min.css',
  '/js/config.js',
  '/js/modules/ScriptLoader.js',
  '/js/modules/ChamberLoader.js',
  '/js/modules/JourneyTracker.js',
  '/js/modules/JourneyNarrative.js',
  '/js/chamberManifest.js',
  '/js/main.js',
  '/js/page.js',
  '/js/pageData.js',
  '/img/favicon.ico',
  '/img/placeholder.jpg',
];

/**
 * Install event - cache critical assets
 */
self.addEventListener('install', event => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(CRITICAL_ASSETS).catch(err => {
          console.warn('Failed to cache some assets:', err);
          return Promise.resolve();
        });
      })
      .then(() => {
        return self.skipWaiting();
      })
      .catch(err => {
        console.error('Service worker install failed:', err);
      })
  );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => cacheName !== CACHE_NAME)
            .map(cacheName => caches.delete(cacheName))
        ).catch(err => {
          console.warn('Cache cleanup failed:', err);
          return Promise.resolve();
        });
      })
      .then(() => {
        return self.clients.claim();
      })
      .catch(err => {
        console.warn('Service worker activation warning:', err);
      })
  );
});

/**
 * Fetch event - network first, fallback to cache, then offline page
 * Does not cache large images to respect cache limits
 */
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip large image files from caching
  if (
    event.request.url.includes('/img/photos/') ||
    event.request.url.includes('.gif') ||
    event.request.url.includes('.png')
  ) {
    return;
  }

  // Chamber fragments: network-first with cache fallback for offline
  if (event.request.url.includes('/chambers/') && event.request.url.endsWith('/fragment.html')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Clone the response before caching
        const responseClone = response.clone();

        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });

        return response;
      })
      .catch(() => {
        // Fallback to cache if network fails
        return caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // For navigation requests, serve the offline page
          if (event.request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
          return cachedResponse;
        });
      })
  );
});
