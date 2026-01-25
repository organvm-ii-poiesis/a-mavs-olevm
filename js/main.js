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

/**
 * Array.some() polyfill
 * Production steps of ECMA-262, Edition 5, 15.4.4.17
 * Reference: http://es5.github.io/#x15.4.4.17
 */

if (!Array.prototype.some) {
  Array.prototype.some = function (fun /*, thisArg*/) {
    'use strict';

    if (this === null || this === undefined) {
      throw new TypeError('Array.prototype.some called on null or undefined');
    }

    if (typeof fun !== 'function') {
      throw new TypeError();
    }

    const t = Object(this);
    const len = t.length >>> 0;

    const thisArg = arguments.length >= 2 ? arguments[1] : void 0;
    for (let i = 0; i < len; i++) {
      if (i in t && fun.call(thisArg, t[i], i, t)) {
        return true;
      }
    }

    return false;
  };
}
