/**
 * Service Worker for ET CETER4
 * Provides basic caching for critical assets with offline fallback
 * Cache limit ~5MB due to large images
 *
 * Bump CACHE_VERSION when deploying updated assets to bust stale caches
 */

const CACHE_VERSION = 5;
const CACHE_NAME = `etceter4-v${CACHE_VERSION}`;

/**
 * Critical assets to cache
 * Limited to essential CSS, JS, and favicon
 */
// Use relative URLs so the service worker works both at the site root
// (e.g. etceter4.com/) and under a GitHub Pages subpath (e.g. /a-mavs-olevm/).
// self.location.pathname gives the sw.js path; strip the filename to get the base.
const _swBase = self.location.pathname.replace(/\/sw\.js$/, '') || '';
const CRITICAL_ASSETS = [
  _swBase + '/',
  _swBase + '/index.html',
  _swBase + '/offline.html',
  _swBase + '/css/styles.css',
  _swBase + '/css/vendor/tachyons/css/tachyons.min.css',
  _swBase + '/js/data/source-catalogue.js',
  _swBase + '/js/config.js',
  _swBase + '/js/modules/ScriptLoader.js',
  _swBase + '/js/modules/ChamberLoader.js',
  _swBase + '/js/modules/JourneyTracker.js',
  _swBase + '/js/modules/JourneyNarrative.js',
  _swBase + '/js/chamberManifest.js',
  _swBase + '/js/main.js',
  _swBase + '/js/page.js',
  _swBase + '/js/pageData.js',
  _swBase + '/img/favicon.ico',
  _swBase + '/img/placeholder.jpg',
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
  if (
    event.request.url.includes('/chambers/') &&
    event.request.url.endsWith('/fragment.html')
  ) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches
            .open(CACHE_NAME)
            .then(cache => cache.put(event.request, clone));
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
            return caches.match(_swBase + '/offline.html');
          }
          return cachedResponse;
        });
      })
  );
});
