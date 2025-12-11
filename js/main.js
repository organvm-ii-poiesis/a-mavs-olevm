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

$(document).ready(function () {
  const hash = window.location.hash;
  // Goes to the section in the URL
  if (hash) {
    const _hash = $(hash);

    _hash.removeClass('dn');
    if (hash === '#stills' || hash === '#diary') {
      _hash.addClass('dt');
    }
    currentPage = Page.findPage(hash);
    currentPage.initPage();
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

    if (this == null) {
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
