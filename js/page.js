'use strict';

/**
 * @global {Object} currentPage - current page object
 * @global {Boolean} adIsLoaded - tells us whether or not the ad has been loaded
 */

let currentPage = {};
const adIsLoaded = false;

/**
 * Page Class
 *
 * Modern ES6 class for managing page state and navigation
 *
 * @param {Object} config - Page configuration object
 * @param {string} config.id - identifier, equal to their HTML element ID name
 * @param {number} config.tier - their row in the tree
 * @param {String[]} config.downLinks - element id's connected to them below in the tree
 * @param {String[]} config.upLinks - element id's connected to them above them in the tree
 * @param {function} config.initialize - create initial state for page
 * @param {function} config.load - loads the page
 */

class Page {
  constructor(_p) {
    // core data
    this.id = _p.id || '';
    this.tier = _p.tier || 0;
    this.downLinks = _p.downLinks || [];
    this.upLinks = _p.upLinks || [];

    // page state
    this.trace = '';
    this.isVisible = false;
    this.isInitialized = false;
    this.isInitializing = false;
    this.isLoaded = false;
    this.isLoading = false;
    this.hasAllData = false;

    // page handlers
    this.initialize = _p.initialize || function () {};
    this.load = _p.load || function () {};
  }

  /**
   * Initializes the page
   */
  initPage() {
    if (!this.isInitialized && !this.isInitializing) {
      this.isInitializing = true;
      this.initialize();
      this.isInitializing = false;
      this.isInitialized = true;
    }
  }

  /**
   * getBackElement
   *
   * @summary Takes a page and returns the name of the section that will bring you back
   * @param {Page} _Page - the page object you're looking for the back for
   * @returns {string|Page} The back page identifier or object
   */
  getBackElement(_Page) {
    _Page = _Page || this;
    const pageObj = Page.findPage(_Page.id);

    if (pageObj.trace) {
      return pageObj.trace;
    } else if (pageObj.upLinks[0]) {
      // always return the left most link
      return Page.findPage(pageObj.upLinks[0]);
    } else {
      return '';
    }
  }

  /**
   * findPage (static method)
   *
   * @summary Takes a page identifier and returns the object if found
   * @param {string} _pageid - the page id you're searching for
   * @returns {Page} The found page object
   * @throws {Error} If page is not found
   */
  static findPage(_pageid) {
    const index = pages.findIndex(current => _pageid === current.id);
    if (index === -1) {
      throw new Error(`Can't find page: ${_pageid}`);
    }
    return pages[index];
  }
}

/**
 * showNewSection
 *
 * @summary - Navigates from the currently loaded section to the section provided (loading section).
 * It performs an animation that fades out the current section, then fades in the loading section.
 *
 * @param {String} loadingSection - page to be faded in
 * @returns {Boolean} true if successful
 *
 */

function showNewSection(_loadingSection) {
  if (!_loadingSection || currentPage.isLoading) {
    return false; // loadingSection isn't defined, or the page is loading
  } else {
    const loadingSection = Page.findPage(_loadingSection);

    loadingSection.initPage();

    fadeOutPage(currentPage, () => {
      fadeInPage(loadingSection);
    });
  }
  return true;
}

/**
 *  Fades in a page
 *
 * @param {Object} Page - page to be faded in
 * @returns {Boolean} true if successful
 */

function fadeInPage(_Page, _cb) {
  let _display;

  if (_Page.isLoading === false) {
    // make sure opacity is 0 & then the object is there
    $(_Page.id).css('opacity', 0);
    if (_Page.id === '#stills' || _Page.id === '#diary') {
      _display = 'table';
    }

    // fade in next section
    $(_Page.id).velocity('fadeIn', {
      delay: 0,
      duration: 500,
      display: _display,
      easing: 'easeInSine',
      begin() {
        _Page.isLoading = true;
      },
      complete() {
        // console.log("Finished Fade In")
        _Page.isLoading = false;
        window.currentPage = _Page;
        if (_cb) {
          _cb();
          return true;
        } else {
          return true;
        }
      },
    });
  } else {
    // prevents fast clicking of the buttons from overloading the function
    return false;
  }
}

/**
 *  Fades out a page
 *
 * @param {Object} _Page - page to be faded out
 * @returns {Boolean} true if successful
 */

function fadeOutPage(_Page, _cb) {
  if (_Page.isLoading === false) {
    const displayOfPage = $(_Page.id).css('display');
    // make sure it's not fading out a hidden or non existant element
    if (displayOfPage !== undefined && displayOfPage !== 'none') {
      $(_Page.id).velocity('fadeOut', {
        delay: 1000,
        duration: 200, // 200-300
        easing: 'ease-out',
        begin() {
          currentPage = _Page;
          _Page.isLoading = true;
        },
        complete() {
          // hide the current page when faded out
          // console.log('Finished fadeout');
          $(_Page.id).addClass('dn');
          _Page.isLoading = false;
          currentPage.isLoading = false;
          if (_cb) {
            _cb();
            return true;
          } else {
            return true;
          }
        },
      });
    } else {
      currentPage.isLoading = false;
      return false; // Page isn't loaded
    }
  } else {
    return false; // Page is already loading
  }
}

/**
 * Site navigation listeners
 */

// these listen for when the page is meant to be loaded, trys to init then load, then fade out the current section
// if any, then fade in the new section
$('#backButton').on('click', () => {
  showNewSection(currentPage.getBackElement().id);
});
$('#toLandingPage').on('click', () => {
  showNewSection('#landing');
});
$('#toMenuPage').on('click', () => {
  showNewSection('#menu');
});
$('#toWordsPage').on('click', () => {
  showNewSection('#words');
});
// $("#toSoundPage").on("click", function() { showNewSection("#sound"); });
$('#toVisionPage').on('click', () => {
  showNewSection('#vision');
});
$('#toInfoPage').on('click', () => {
  showNewSection('#info');
});
$('#toVideoPage').on('click', () => {
  showNewSection('#video');
});
$('#toStillsPage').on('click', () => {
  showNewSection('#stills');
});
$('#toMapPage').on('click', () => {
  showNewSection('#sitemap');
});
$('#toDiaryPage').on('click', () => {
  showNewSection('#diary');
});
$('#toBlogPage').on('click', () => {
  showNewSection('#blog');
});
$('#toLoopPage').on('click', () => {
  showNewSection('#loop');
});

$('#SoundBackButton').on('click', () => {
  showNewSection('#menu');
});
$('#WordBackButton').on('click', () => {
  showNewSection('#menu');
});
$('#VisionBackButton').on('click', () => {
  showNewSection('#menu');
});
$('#InfoBackButton').on('click', () => {
  showNewSection('#menu');
});

$('#VideoBackButton').on('click', () => {
  showNewSection('#vision');
});
$('#VideoBackButton2').on('click', () => {
  showNewSection('#vision');
});
$('#VideoBackButton3').on('click', () => {
  showNewSection('#vision');
});
$('#VideoBackButton4').on('click', () => {
  showNewSection('#vision');
});
$('#VideoBackButton5').on('click', () => {
  showNewSection('#vision');
});

/*
 * Mobile Menu Button
 */

$('.c-hamburger').on('click', () => {
  const hamburgerMenu = $('.c-hamburger');
  const mobileMenu = $('.mobileMenu');

  if (hamburgerMenu.hasClass('is-active')) {
    hamburgerMenu.removeClass('is-active');
    mobileMenu.removeClass('open');
  } else {
    hamburgerMenu.addClass('is-active');
    mobileMenu.addClass('open');
  }
});
