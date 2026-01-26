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
 * Register Service Worker for PWA support
 */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(registration => {
        console.log('SW registered:', registration.scope);
      })
      .catch(error => {
        console.warn('SW registration failed:', error);
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

// Extend showNewSection to manage 3D compositor lifecycle
const _originalShowNewSection =
  typeof showNewSection !== 'undefined' ? showNewSection : null;

if (_originalShowNewSection) {
  // Override showNewSection to handle compositor lifecycle
  window.showNewSection = function (pageId) {
    // Call original navigation
    _originalShowNewSection(pageId);

    // Manage compositor after navigation (with slight delay for page transition)
    setTimeout(manageLandingCompositor, 100);
  };
}

$(document).ready(() => {
  const hash = window.location.hash;
  // Goes to the section in the URL
  if (hash) {
    try {
      const _hash = $(hash);

      _hash.removeClass('dn');
      if (hash === '#stills' || hash === '#diary') {
        _hash.addClass('dt');
      }
      currentPage = Page.findPage(hash);
      currentPage.initPage();

      // Manage compositor on initial load
      manageLandingCompositor();
    } catch (error) {
      // Fallback to landing page if hash is invalid
      console.warn(`Invalid hash on load: ${hash}, defaulting to landing`);
      $('#landing').removeClass('dn');
      currentPage = Page.findPage('#landing');
      window.location.hash = '#landing';
    }
  } else {
    $('#landing').removeClass('dn');
    currentPage = Page.findPage('#landing');
  }
});
