/**
 * @file main.js
 * @description Main application entry point for etceter4.com
 * Handles document ready initialization, page routing based on URL hash,
 * and provides polyfills for older browser compatibility.
 *
 * @requires jQuery
 * @requires page.js - Page navigation and management system
 * @requires pageData.js - Page configuration and data
 *
 * @global {Object} currentPage - The currently active page object (from page.js)
 *
 * Considering following the idiomatic style guide
 * https://www.npmjs.com/package/eslint-config-idiomatic
 * https://github.com/rwaldron/idiomatic.js
 */

/**
 * Document ready handler - Application initialization
 * @listens document#ready
 *
 * Flow:
 * 1. Check for hash in URL (e.g., #landing, #diary, #stills)
 * 2. If hash exists, show that section and initialize it
 * 3. If no hash, default to showing the landing page
 * 4. Sets the global currentPage variable to track active page
 */

/**
 * Global error boundary
 * Catches unhandled errors and promise rejections to prevent silent failures
 */
window.onerror = (msg, src, line, col, err) => {
  console.error(`Global error: ${msg} at ${src}:${line}:${col}`, err);
  return false;
};

window.addEventListener('unhandledrejection', e => {
  console.error('Unhandled promise rejection:', e.reason);
});

/**
 * Flag to prevent hashchange handler during programmatic navigation
 * Reassigned in page.js during navigation
 * @type {boolean}
 */
// eslint-disable-next-line prefer-const
let isNavigating = false;

/**
 * Handles browser back/forward navigation via hashchange event
 * @listens window#hashchange
 */
function handleHashChange() {
  if (isNavigating) {
    return;
  }

  const hash = window.location.hash || '#landing';

  // Don't navigate if we're already on this page
  if (currentPage && currentPage.id === hash) {
    return;
  }

  try {
    const targetPage = Page.findPage(hash);
    if (targetPage) {
      showNewSection(hash);
    }
  } catch (error) {
    // If page not found, navigate to landing
    console.warn(`Page not found: ${hash}, navigating to landing`);
    window.location.hash = '#landing';
  }
}

// Listen for browser back/forward navigation
window.addEventListener('hashchange', handleHashChange);

/**
 * Register Service Workers for PWA support and media caching
 */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Register main PWA service worker
    navigator.serviceWorker
      .register('/sw.js')
      .then(registration => {
        console.log('SW registered:', registration.scope);
        // Check for updates periodically
        setInterval(() => {
          registration.update().catch(error => {
            console.warn('SW update check failed:', error);
          });
        }, 60000); // Check every 60 seconds
      })
      .catch(error => {
        console.warn('SW registration failed:', error);
      });

    // Register MediaServiceWorker for offline media caching
    navigator.serviceWorker
      .register('/js/media/cache/MediaServiceWorker.js')
      .then(registration => {
        console.log('MediaServiceWorker registered:', registration.scope);
        // Check for updates periodically
        setInterval(() => {
          registration.update().catch(error => {
            console.warn('MediaServiceWorker update check failed:', error);
          });
        }, 60000); // Check every 60 seconds
      })
      .catch(error => {
        console.warn('MediaServiceWorker registration failed:', error);
      });
  });
}

/**
 * Manage LandingCompositor lifecycle during page navigation
 * Pauses compositor when leaving #landing, resumes when returning
 */
function manageLandingCompositor() {
  // Check if compositor exists
  if (!window.landingCompositor) {
    return;
  }

  const isOnLanding = currentPage && currentPage.id === '#landing';

  if (isOnLanding && !window.landingCompositor.isRunning) {
    // Resume compositor when returning to landing
    window.landingCompositor.start();
  } else if (!isOnLanding && window.landingCompositor.isRunning) {
    // Pause compositor when leaving landing
    window.landingCompositor.stop();
  }
}

/**
 * Cmd/Ctrl+K search bootstrap
 * Loads discovery scripts on first use, then delegates to DiscoveryController
 */
document.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();

    // If DiscoveryController is already loaded, let it handle subsequent events
    if (typeof DiscoveryController !== 'undefined') {
      return;
    }

    // Load discovery chamber scripts on first Cmd+K press
    if (typeof ChamberLoader !== 'undefined') {
      const loader = ChamberLoader.getInstance();
      if (loader.isRegistered('discovery')) {
        loader.ensureLoaded('discovery').then(() => {
          // Initialize ContentRegistry for search
          if (typeof ContentRegistry !== 'undefined') {
            try {
              ContentRegistry.getInstance()
                .initialize()
                .then(() => {
                  // Open search modal after scripts are ready
                  const modal = document.getElementById('searchModal');
                  if (modal) {
                    modal.classList.remove('dn');
                  }
                  const input = document.getElementById('globalSearchInput');
                  if (input) {
                    input.focus();
                  }
                })
                .catch(err => {
                  console.warn('ContentRegistry init error:', err.message);
                });
            } catch (regErr) {
              console.warn('ContentRegistry setup error:', regErr.message);
            }
          }
        });
      }
    }
  }
});

$(document).ready(() => {
  const hash = window.location.hash;

  // Goes to the section in the URL
  if (hash) {
    try {
      const _hash = $(hash);

      currentPage = Page.findPage(hash);
      currentPage.initPage().then(() => {
        _hash.removeClass('dn');
        if (hash === '#stills' || hash === '#diary') {
          _hash.addClass('dt');
        }

        // Manage compositor on initial load
        manageLandingCompositor();

        // Initialize Living Pantheon system on first page load
        if (typeof initializeLivingPantheon === 'function') {
          try {
            initializeLivingPantheon(hash);
          } catch (pantheError) {
            console.warn(
              'Living Pantheon initialization error:',
              pantheError.message
            );
          }
        }
      });
    } catch (error) {
      // Fallback to landing page if hash is invalid
      console.warn(`Invalid hash on load: ${hash}, defaulting to landing`);
      $('#landing').removeClass('dn');
      currentPage = Page.findPage('#landing');
      window.location.hash = '#landing';

      // Initialize Living Pantheon with landing page
      if (typeof initializeLivingPantheon === 'function') {
        try {
          initializeLivingPantheon('#landing');
        } catch (pantheError) {
          console.warn(
            'Living Pantheon initialization error:',
            pantheError.message
          );
        }
      }
    }
  } else {
    $('#landing').removeClass('dn');
    currentPage = Page.findPage('#landing');

    // Initialize Living Pantheon with landing page (default)
    if (typeof initializeLivingPantheon === 'function') {
      try {
        initializeLivingPantheon('#landing');
      } catch (pantheError) {
        console.warn(
          'Living Pantheon initialization error:',
          pantheError.message
        );
      }
    }
  }
});
