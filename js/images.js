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
  indexLoadLeft: $('[id*=stillsImage]').length,
  loadOffset: ETCETER4_CONFIG.carousel.loadOffset,
  caption: $('#stillsCaption'),
  captionData: stillsData,
  imageSelector: '#stills [id*=stillsImage]',
});

// Initialize touch handlers for mobile swipe support
stillsCarousel.initTouchHandlers('dtc', 'dn');

/**
 * Stills gallery navigation handlers
 */
$('#stills-left').on('click', () => {
  const img = $('#stills #stillsImage.dtc');
  const sC = stillsCarousel;
  const tmpIndex = sC.index;
  let loadingImage;

  sC.decIndex();
  sC.emitSlide('left');
  sC.setIndicator();
  img.removeClass('dtc').addClass('dn');

  if (tmpIndex !== 0) {
    loadingImage = img.prev();
    loadingImage.addClass('dtc').removeClass('dn');
    loadingImage.children().addClass('anim-fadeIn');
  } else {
    loadingImage = $('#stills [id*=stillsImage]').last();
    loadingImage.addClass('dtc').removeClass('dn');
    loadingImage.children().addClass('anim-fadeIn');
  }
  sC.loadCaption(loadingImage);
});

$('#stills-right').on('click', () => {
  const img = $('#stills #stillsImage.dtc');
  const sC = stillsCarousel;
  const tmpIndex = sC.index + 1;
  let loadingImage;

  sC.incIndex();
  sC.emitSlide('right');
  sC.setIndicator();
  img.removeClass('dtc').addClass('dn');

  if (tmpIndex < sC.total) {
    loadingImage = img.next();
    loadingImage.addClass('dtc').removeClass('dn');
    loadingImage.children().addClass('anim-fadeIn');
  } else {
    loadingImage = $('#stills [id*=stillsImage]').first();
    loadingImage.addClass('dtc').removeClass('dn');
    loadingImage.children().addClass('anim-fadeIn');
  }
  sC.loadCaption(loadingImage);
});

/**
 * Track if stills event handlers are bound to prevent accumulation
 * @type {boolean}
 */
let stillsHandlersBound = false;

/**
 * Initialize stills gallery event handlers
 * Safe to call multiple times - prevents event listener accumulation
 */
function initStillsHandlers() {
  if (stillsHandlersBound) {
    return;
  }

  $('#stills').on(
    'carousel:slide',
    (event, _index, _indexLoadLeft, _indexLoadRight, _images, _dir, _this) => {
      try {
        const stillsPage = Page.findPage('#stills');
        if (stillsPage.hasAllData === true) {
          $('#stills').off('carousel:slide');
          stillsHandlersBound = false;
          return;
        } else if (_index === _indexLoadLeft || _index === _indexLoadRight) {
          _this.loadImages();
        }
      } catch (error) {
        console.error('Error in stills carousel slide handler:', error.message);
      }
    }
  );

  stillsHandlersBound = true;
}

/**
 * Cleanup stills gallery resources
 * Call when navigating away from stills page
 */
function cleanupStills() {
  if (stillsHandlersBound) {
    $('#stills').off('carousel:slide');
    stillsHandlersBound = false;
  }
  stillsCarousel.destroy();
}

// Initialize handlers on load
initStillsHandlers();
