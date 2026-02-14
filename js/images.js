/**
 * @file images.js
 * @description Stills gallery configuration and event handlers
 * Uses shared Carousel module from js/modules/Carousel.js
 *
 * @author gabriel
 * @requires jQuery
 * @requires js/modules/Carousel.js
 */

'use strict';

/**
 * Caption data for stills gallery images
 */
const stillsData = {
  media: {
    1: 'Fires, fury, absolution.<br>Delusion, fantasy, insincerity.<br>Constants follow us.<br>News breaks us.',
    2: 'Culture, rocks, freedom.<br>Eat me, hide me.',
    3: "It's simple, belive us. Believe us. Believe us.",
    4: '',
    5: '',
    6: '',
    7: '',
    8: '',
    9: '',
    10: '',
    11: '',
    12: '',
    13: '',
    14: '',
    15: '',
    16: '',
    17: '',
    18: '',
    19: '',
    20: '',
    21: '',
    22: '',
    23: '',
  },
  live: {
    1: 'perception',
    2: '',
    3: '',
    4: '',
    5: '',
  },
  faster: {
    1: 'console, swell.<br>the clean within',
    2: '',
    3: '',
    4: '',
    5: '',
  },
  slip: {
    1: 'darkness',
    2: '',
    3: '',
    4: '',
    5: '',
    6: '',
  },
};

/**
 * Stills carousel instance
 */
const stillsCarousel = new Carousel({
  id: '#stills',
  images: [
    ['media', ETCETER4_CONFIG.images.media],
    ['faster', ETCETER4_CONFIG.images.faster],
    ['slip', ETCETER4_CONFIG.images.slip],
    ['live', ETCETER4_CONFIG.images.live],
  ],
  total:
    ETCETER4_CONFIG.images.media +
    ETCETER4_CONFIG.images.faster +
    ETCETER4_CONFIG.images.slip +
    ETCETER4_CONFIG.images.live,
  indexLoadLeft: $('.stillsImage').length,
  loadOffset: ETCETER4_CONFIG.carousel.loadOffset,
  caption: $('#stillsCaption'),
  captionData: stillsData,
  imageSelector: '#stills .stillsImage',
});

// Initialize touch handlers for mobile swipe support
stillsCarousel.initTouchHandlers('dtc', 'dn');

// Bind navigation buttons using shared Carousel methods
stillsCarousel.bindNavButtons('#stills-left', '#stills-right', 'dtc', 'dn');

// Bind lazy-load handler for progressive image loading
stillsCarousel.bindLazyLoad();

/**
 * Cleanup stills gallery resources
 * Call when navigating away from stills page
 */
function cleanupStills() {
  stillsCarousel.destroy();
}
