/**
 * @file diary.js
 * @description Diary gallery configuration and event handlers
 * Uses shared Carousel module from js/modules/Carousel.js
 *
 * @author gabriel
 * @requires jQuery
 * @requires js/modules/Carousel.js
 */

'use strict';

/**
 * Caption data for diary images
 */
const diaryData = {
  diary: {
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
};

/**
 * Diary carousel instance
 */
const diaryCarousel = new Carousel({
  id: '#diary',
  images: [['diary', 125]],
  total: 125,
  indexLoadLeft: $('[id*=diary-leftImage]').length,
  loadOffset: 4,
  caption: null,
  captionData: diaryData,
  imageSelector: '#diary [id*=diary-leftImage]',
});

/**
 * Diary gallery navigation handlers
 */
$('#stills-left-diary').on('click', () => {
  const img = $('#diary-leftImage:visible').first();
  const sC = diaryCarousel;
  const tmpIndex = sC.index;

  sC.decIndex();
  sC.emitSlide('left');
  img.addClass('dn').removeClass('dib-ns db');

  let loadingImage;
  if (tmpIndex !== 0) {
    loadingImage = img.prev('[id*=diary-leftImage]');
    if (loadingImage.length === 0) {
      loadingImage = $('[id*=diary-leftImage]').last();
    }
  } else {
    loadingImage = $('[id*=diary-leftImage]').last();
  }

  loadingImage.addClass('dib-ns db').removeClass('dn');
  loadingImage.find('img').addClass('anim-fadeIn');
});

$('#stills-right-diary').on('click', () => {
  const img = $('#diary-leftImage:visible').first();
  const sC = diaryCarousel;
  const tmpIndex = sC.index + 1;

  sC.incIndex();
  sC.emitSlide('right');
  img.addClass('dn').removeClass('dib-ns db');

  let loadingImage;
  if (tmpIndex < sC.total) {
    loadingImage = img.next('[id*=diary-leftImage]');
    if (loadingImage.length === 0) {
      loadingImage = $('[id*=diary-leftImage]').first();
    }
  } else {
    loadingImage = $('[id*=diary-leftImage]').first();
  }

  loadingImage.addClass('dib-ns db').removeClass('dn');
  loadingImage.find('img').addClass('anim-fadeIn');
});

/**
 * Track if diary event handlers are bound to prevent accumulation
 * @type {boolean}
 */
let diaryHandlersBound = false;

/**
 * Initialize diary gallery event handlers
 * Safe to call multiple times - prevents event listener accumulation
 */
function initDiaryHandlers() {
  if (diaryHandlersBound) {
    return;
  }

  $('#diary').on(
    'carousel:slide',
    (event, _index, _indexLoadLeft, _indexLoadRight, _images, _dir, _this) => {
      try {
        const diaryPage = Page.findPage('#diary');
        if (diaryPage.hasAllData === true) {
          $('#diary').off('carousel:slide');
          diaryHandlersBound = false;
          return;
        } else if (_index === _indexLoadLeft || _index === _indexLoadRight) {
          _this.loadImages();
        }
      } catch (error) {
        console.error('Error in diary carousel slide handler:', error.message);
      }
    }
  );

  diaryHandlersBound = true;
}

/**
 * Cleanup diary gallery resources
 * Call when navigating away from diary page
 */
function cleanupDiary() {
  if (diaryHandlersBound) {
    $('#diary').off('carousel:slide');
    diaryHandlersBound = false;
  }
  diaryCarousel.destroy();
}

// Initialize handlers on load
initDiaryHandlers();
