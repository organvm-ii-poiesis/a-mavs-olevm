'use strict';

/**
 * @global {Object} currentPage - current page object
 * @global {string} transitionState - current transition state (IDLE, TRANSITIONING, READY)
 * @global {boolean} livingPantheonInitialized - track if Living Pantheon has been initialized
 */

let currentPage = {};
let livingPantheonInitialized = false;

/**
 * Transition State Machine
 * Prevents race conditions during page navigation
 * States: IDLE → TRANSITIONING → READY
 */
const TransitionState = {
  IDLE: 'IDLE',
  TRANSITIONING: 'TRANSITIONING',
  READY: 'READY',
};

let transitionState = TransitionState.IDLE;

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
 * Uses a state machine to prevent race conditions during navigation.
 *
 * @param {String} loadingSection - page to be faded in
 * @returns {Boolean} true if successful
 *
 */

function showNewSection(_loadingSection) {
  // Prevent navigation if already transitioning or invalid input
  if (
    !_loadingSection ||
    currentPage.isLoading ||
    transitionState === TransitionState.TRANSITIONING
  ) {
    return false;
  }

  try {
    const loadingSection = Page.findPage(_loadingSection);

    // Set state to transitioning
    transitionState = TransitionState.TRANSITIONING;

    // Prepare ambient audio crossfade before fadeOut
    try {
      if (typeof LivingPantheonCore !== 'undefined') {
        const livingPantheon = LivingPantheonCore.getInstance();
        if (livingPantheon && livingPantheon.subsystems.ambient) {
          // Prepare ambient layer for crossfade on the new chamber
          // This will be triggered after fadeInPage completes
        }
      }
    } catch (pantheError) {
      console.warn(
        'Living Pantheon audio preparation warning:',
        pantheError.message
      );
    }

    // Play page exit sound
    if (typeof UISounds !== 'undefined' && UISounds.isEnabled()) {
      UISounds.pageExit(0.5);
    }

    // Update URL hash for browser history (set flag to prevent double navigation)
    if (typeof isNavigating !== 'undefined') {
      isNavigating = true;
    }
    window.location.hash = _loadingSection;
    if (typeof isNavigating !== 'undefined') {
      setTimeout(() => {
        isNavigating = false;
      }, ETCETER4_CONFIG.animations.navigationDebounce);
    }

    loadingSection.initPage();

    fadeOutPage(currentPage, () => {
      fadeInPage(loadingSection, () => {
        // Transition Living Pantheon to new chamber after page is visible
        try {
          if (typeof LivingPantheonCore !== 'undefined') {
            const livingPantheon = LivingPantheonCore.getInstance();
            if (livingPantheon && livingPantheon.isRunning) {
              // Extract chamber ID from page ID (remove '#' prefix)
              const chamberId = _loadingSection.replace('#', '');
              // Get chamber color from config if available
              const chamberConfig =
                typeof ETCETER4_CONFIG !== 'undefined'
                  ? ETCETER4_CONFIG.livingPantheon?.chambers?.[chamberId]
                  : null;
              const chamberColor = chamberConfig?.color || null;

              livingPantheon.transitionToNewChamber(chamberId, chamberColor);
            }
          }
        } catch (pantheError) {
          console.warn(
            'Living Pantheon transition warning:',
            pantheError.message
          );
        }

        // Play page enter sound
        if (typeof UISounds !== 'undefined' && UISounds.isEnabled()) {
          UISounds.pageEnter(0.5);
        }

        // Set state to ready when transition completes
        transitionState = TransitionState.READY;
        setTimeout(() => {
          transitionState = TransitionState.IDLE;
        }, ETCETER4_CONFIG.animations.transitionCooldown);
      });
    });

    return true;
  } catch (error) {
    console.error(`Navigation error: ${error.message}`);
    transitionState = TransitionState.IDLE;
    return false;
  }
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
    try {
      // make sure opacity is 0 & then the object is there
      $(_Page.id).css('opacity', 0);
      if (_Page.id === '#stills' || _Page.id === '#diary') {
        _display = 'table';
      }

      // fade in next section
      $(_Page.id).velocity('fadeIn', {
        delay: 0,
        duration: ETCETER4_CONFIG.animations.fadeInDuration,
        display: _display,
        easing: 'easeInSine',
        begin() {
          _Page.isLoading = true;
        },
        complete() {
          try {
            _Page.isLoading = false;
            window.currentPage = _Page;

            // Manage focus for accessibility
            if (typeof manageFocus === 'function') {
              manageFocus(_Page.id);
            }

            // Announce page transition to screen readers
            if (typeof announcePageTransition === 'function') {
              announcePageTransition(_Page.id);
            }

            if (_cb) {
              _cb();
            }
          } catch (completeError) {
            console.error(
              'FadeIn complete callback error:',
              completeError.message
            );
            _Page.isLoading = false;
            transitionState = TransitionState.IDLE;
          }
          return true;
        },
      });
    } catch (error) {
      console.error('FadeIn animation error:', error.message);
      _Page.isLoading = false;
      transitionState = TransitionState.IDLE;
      return false;
    }
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
    try {
      const displayOfPage = $(_Page.id).css('display');
      // make sure it's not fading out a hidden or non existant element
      if (displayOfPage !== undefined && displayOfPage !== 'none') {
        $(_Page.id).velocity('fadeOut', {
          delay: ETCETER4_CONFIG.animations.fadeOutDelay,
          duration: ETCETER4_CONFIG.animations.fadeOutDuration,
          easing: 'ease-out',
          begin() {
            currentPage = _Page;
            _Page.isLoading = true;
          },
          complete() {
            try {
              // hide the current page when faded out
              $(_Page.id).addClass('dn');
              _Page.isLoading = false;
              currentPage.isLoading = false;
              if (_cb) {
                _cb();
              }
            } catch (completeError) {
              console.error(
                'FadeOut complete callback error:',
                completeError.message
              );
              _Page.isLoading = false;
              currentPage.isLoading = false;
              transitionState = TransitionState.IDLE;
            }
            return true;
          },
        });
      } else {
        currentPage.isLoading = false;
        if (_cb) {
          _cb();
        }
        return false; // Page isn't loaded
      }
    } catch (error) {
      console.error('FadeOut animation error:', error.message);
      _Page.isLoading = false;
      currentPage.isLoading = false;
      transitionState = TransitionState.IDLE;
      return false;
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
$('#toSoundPage').on('click', () => {
  showNewSection('#sound');
});
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
$('#toOGOD3D').on('click', e => {
  e.preventDefault();
  showNewSection('#ogod3d');
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

$('.c-hamburger').on('click', function () {
  const hamburgerMenu = $(this);
  const mobileMenu = $('.mobileMenu');

  if (hamburgerMenu.hasClass('is-active')) {
    hamburgerMenu.removeClass('is-active');
    hamburgerMenu.attr('aria-expanded', 'false');
    mobileMenu.removeClass('open');
    // Unlock scroll when menu closes
    document.body.style.overflow = '';
  } else {
    hamburgerMenu.addClass('is-active');
    hamburgerMenu.attr('aria-expanded', 'true');
    mobileMenu.addClass('open');
    // Lock scroll when menu opens
    document.body.style.overflow = 'hidden';
  }
});

/**
 * Keyboard Navigation
 * Provides accessible keyboard controls for site navigation
 */

document.addEventListener('keydown', event => {
  // Check for Cmd/Ctrl+K to open global search (works even in input fields)
  const isMetaOrCtrl = event.metaKey || event.ctrlKey;
  if (isMetaOrCtrl && event.key === 'k') {
    event.preventDefault();
    // Open search modal via DiscoveryController
    if (typeof DiscoveryController !== 'undefined') {
      const controller = DiscoveryController.getInstance();
      if (controller && controller.openSearchModal) {
        controller.openSearchModal();
      }
    }
    return;
  }

  // Skip other shortcuts if user is typing in an input field
  if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
    return;
  }

  // Check for Living Pantheon toggle (Ctrl+Shift+L)
  const isCtrl =
    event.ctrlKey || (event.metaKey && navigator.platform.includes('Mac'));
  const isShift = event.shiftKey;
  const isL = event.key.toLowerCase() === 'l';

  if (isCtrl && isShift && isL) {
    // Living Pantheon toggle - allow LivingPantheonCore to handle it
    // This will be processed by LivingPantheonCore's keydown listener
    if (typeof LivingPantheonCore !== 'undefined') {
      // The LivingPantheonCore will handle this event
      return;
    }
  }

  switch (event.key) {
    case 'Escape':
      // Go back/up in navigation hierarchy
      if (currentPage && typeof currentPage.getBackElement === 'function') {
        const backPage = currentPage.getBackElement();
        if (backPage && backPage.id) {
          showNewSection(backPage.id);
        }
      }
      break;

    case 'Enter':
    case ' ':
      // Activate focused element
      if (document.activeElement && document.activeElement.click) {
        // Prevent space from scrolling
        if (event.key === ' ') {
          event.preventDefault();
        }
        document.activeElement.click();
      }
      break;

    case 'ArrowLeft':
      // Previous item in carousels
      if (currentPage && currentPage.id === '#stills') {
        $('#stills-left').trigger('click');
      } else if (currentPage && currentPage.id === '#diary') {
        $('#stills-left-diary').trigger('click');
      }
      break;

    case 'ArrowRight':
      // Next item in carousels
      if (currentPage && currentPage.id === '#stills') {
        $('#stills-right').trigger('click');
      } else if (currentPage && currentPage.id === '#diary') {
        $('#stills-right-diary').trigger('click');
      }
      break;

    case 'Home':
      // Go to landing page
      showNewSection('#landing');
      break;

    case 'm':
    case 'M':
      // Go to menu (if not typing)
      if (!event.ctrlKey && !event.metaKey) {
        showNewSection('#menu');
      }
      break;

    case '?':
      // Show keyboard shortcuts help
      // Note: Ctrl+Shift+L toggles Living Pantheon immersive effects
      // (This could trigger a help modal if implemented)
      break;
  }
});

/**
 * Focus management for accessibility
 * Ensures proper focus handling during page transitions
 */
function manageFocus(pageId) {
  const page = $(pageId);
  if (page.length) {
    // Set focus to the first focusable element in the page
    const focusable = page
      .find('a, button, input, [tabindex]:not([tabindex="-1"])')
      .first();
    if (focusable.length) {
      focusable.trigger('focus');
    }
  }
}

/**
 * Announce page transition to screen readers
 * Uses aria-live region for accessibility
 * @param {string} pageId - The page identifier (e.g., '#menu')
 */
function announcePageTransition(pageId) {
  const announcer = document.getElementById('page-announcer');
  if (!announcer) {
    return;
  }

  // Map page IDs to friendly names
  const pageNames = {
    '#landing': 'Landing page',
    '#menu': 'Main menu',
    '#words': 'Words section',
    '#vision': 'Vision section',
    '#sound': 'Sound section',
    '#info': 'Info section',
    '#video': 'Video section',
    '#stills': 'Stills gallery',
    '#diary': 'Diary gallery',
    '#blog': 'Blog section',
    '#ogod3d': 'OGOD 3D immersive experience',
  };

  const pageName = pageNames[pageId] || `${pageId.replace('#', '')} page`;
  announcer.textContent = `Navigated to ${pageName}`;
}

/**
 * Initialize Living Pantheon system on first page load
 * Sets up the generative immersive effects with proper error handling
 * @param {string} initialPageId - The initial page ID to set as first chamber
 */
function initializeLivingPantheon(initialPageId) {
  if (livingPantheonInitialized) {
    return; // Already initialized
  }

  try {
    if (typeof LivingPantheonCore === 'undefined') {
      console.info('Living Pantheon not available');
      return;
    }

    const livingPantheon = LivingPantheonCore.getInstance();
    if (!livingPantheon) {
      console.warn('Failed to get Living Pantheon instance');
      return;
    }

    // Extract chamber ID from page ID (remove '#' prefix)
    const chamberId = initialPageId.replace('#', '');

    // Get chamber color from config if available
    let chamberColor = null;
    if (
      typeof ETCETER4_CONFIG !== 'undefined' &&
      ETCETER4_CONFIG.livingPantheon?.chambers?.[chamberId]
    ) {
      chamberColor = ETCETER4_CONFIG.livingPantheon.chambers[chamberId].color;
    }

    // Initialize with first page
    livingPantheon.initialize({
      chamberId,
      chamberColor,
    });

    // Start the system (respects user preference from localStorage)
    livingPantheon.start();

    // Listen for status changes for debugging/monitoring
    livingPantheon.on(eventDetail => {
      if (eventDetail.status.isRunning) {
        console.debug('Living Pantheon active');
      }
    });

    livingPantheonInitialized = true;
    console.info('Living Pantheon initialized');
  } catch (error) {
    console.warn('Living Pantheon initialization error:', error.message);
    // Don't throw - system is optional and shouldn't break page navigation
  }
}
