/**
 * @file Handles image loading & processing.
 * @author gabriel
 */

/**
 * appendImagesTo
 *
 * @summary Appends images to an element
 *
 * @param {string} element - html element you're appending to
 * @param {string} location - pathway to the images
 * @param {string} prefix - prefix of the name of the images are
 * @param {string} fileExtension - file extension of the images. Must include a period (.)
 * @param {number} start - integer value we should start at (inclusive)
 * @param {number} end - integer value we should stop at (inclusive)
 */

function appendImagesTo(element, location, prefix, fileExtension, start, end) {
  const srcContents = `${location}${prefix}`;
  element = $(element);
  while (start <= end) {
    element.append(
      `<div id="stillsImage" class="dn v-mid heightControl-stills min-h-21_875rem min-h-28_125rem-ns tc h-100"><img class="mw-100 mh-100 w-auto h-auto anim anim-easeout" src="${srcContents}${start}${fileExtension}" loading="lazy" alt="Gallery image ${start}"/></div>`
    );
    start++;
  }
}

/**
 * replacePlaceholders
 *
 * @summary Replaces the placeholders of any images within a page
 *
 * @param {string} element - html element to search
 */

function replacePlaceholders(element) {
  const images = $(element).find("img[src='img/placeholder.jpg']");
  if (images.length !== 0) {
    images.each(function () {
      const actualImage = $(this).attr('data-src');
      $(this).attr('src', actualImage);
    });
  }
}

/**
 * Carousel Class
 *
 * Modern ES6 class for managing image carousels
 *
 * @param {Object} config - Carousel configuration object
 * @param {string} config.id - HTML element identifier
 * @param {Page} config.page - Associated page object
 * @param {jQuery} config.caption - Caption element
 * @param {number} config.index - Current image index
 * @param {number} config.total - Total number of images
 * @param {Array} config.images - Array of image data
 * @param {number} config.loadOffset - Offset for lazy loading
 * @param {number} config.indexLoadLeft - Left load boundary
 * @param {number} config.indexLoadRight - Right load boundary
 * @param {number} config.totalLoaded - Number of loaded images
 */

class Carousel {
  constructor(_c) {
    this.id = _c.id || '';
    this.page = _c.page || null;
    this.caption = _c.caption || null;
    this.index = _c.index || 0;
    this.total = _c.total || 0;
    this.images = _c.images || [];
    this.loadOffset = _c.loadOffset || 0;
    this.indexLoadLeft = _c.indexLoadLeft || 0;
    this.indexLoadRight = _c.indexLoadRight || this.total - 1;
    this.totalLoaded = _c.totalLoaded || 0;
  }

  incIndex() {
    const _index = this.index + 1;
    if (_index > this.total - 1) {
      this.setIndex(0);
    } else {
      this.index = _index;
    }
  }

  decIndex() {
    const _index = this.index - 1;
    if (_index < 0) {
      this.setIndex(this.total - 1);
    } else {
      this.index = _index;
    }
  }

  setIndex(n) {
    this.index = n;
  }

  loadCaption(img) {
    const _img = img.children().attr('src');
    const regExp = /img\/photos\/[a-z]*\/([a-z]*)(\d*)/g;
    const match = regExp.exec(_img);
    if (!match) {
      return;
    }

    const name = match[1];
    const num = match[2];
    const caption = stillsData[name]?.[num];

    if (caption !== undefined) {
      this.caption.html(caption);
    } else {
      this.caption.html('');
    }
  }

  setIndicator() {
    const adjIndex = this.index + 1;
    $('#stills-indicator').text(`${adjIndex}/${this.total}`);
  }

  loadImages() {
    const _stillsPage = Page.findPage(this.id);
    if (!_stillsPage.hasAllData) {
      const _images = this.images;
      const len = _images.length;
      if (_images[0] !== undefined) {
        for (let i = 0; i < len; i++) {
          const _name = _images[i][0];
          const _imgAmount = _images[i][1];
          const _start = _name === 'media' ? 4 : 1;
          appendImagesTo(
            `${this.id} #imageContainer`,
            `img/photos/${_name}/`,
            _name,
            '.jpg',
            _start,
            _imgAmount
          );
        }

        _stillsPage.hasAllData = true;
        return true;
      } else {
        return false;
      }
    }
  }

  /**
   * Emits a slide event when the carousel begins sliding to a new image
   * @param {string} dir - Direction of slide ('left' or 'right')
   */
  emitSlide(dir) {
    $(this.id).trigger('carousel:slide', [
      this.index,
      this.indexLoadLeft,
      this.indexLoadRight,
      this.images,
      dir,
      this,
    ]);
  }
}

const stillsCarousel = new Carousel({
  id: '#stills',
  images: [
    ['media', 44],
    ['faster', 28],
    ['slip', 6],
    ['live', 5],
  ],
  total: 44 + 5 + 28 + 6,
  indexLoadLeft: $('[id*=stillsImage]').length,
  loadOffset: 4,
  caption: $('#stillsCaption'),
});

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
 * Image handlers
 *
 */

$('#stills-left').on('click', () => {
  const img = $('#stillsImage.dtc');
  const sC = stillsCarousel;
  const _tmpIndex = sC.index;
  let loadingImage;

  sC.decIndex();
  sC.emitSlide('left');
  sC.setIndicator();
  img.removeClass('dtc').addClass('dn');

  if (_tmpIndex !== 0) {
    loadingImage = img.prev();
    loadingImage.addClass('dtc').removeClass('dn');
    loadingImage.children().addClass('anim-fadeIn');
  } else {
    loadingImage = $('[id*=stillsImage]').last();
    loadingImage.addClass('dtc').removeClass('dn');
    loadingImage.children().addClass('anim-fadeIn');
  }
  sC.loadCaption(loadingImage);
});

$('#stills-right').on('click', () => {
  const img = $('#stillsImage.dtc');
  const sC = stillsCarousel;
  const _tmpIndex = sC.index + 1;
  let loadingImage;

  sC.incIndex();
  sC.emitSlide('right');
  sC.setIndicator();
  img.removeClass('dtc').addClass('dn');

  if (_tmpIndex < sC.total) {
    loadingImage = img.next();
    loadingImage.addClass('dtc').removeClass('dn');
    loadingImage.children().addClass('anim-fadeIn');
  } else {
    loadingImage = $('[id*=stillsImage]').first();
    loadingImage.addClass('dtc').removeClass('dn');
    loadingImage.children().addClass('anim-fadeIn');
  }
  sC.loadCaption(loadingImage);
});

$('#stills').on(
  'carousel:slide',
  (event, _index, _indexLoadLeft, _indexLoadRight, _images, _dir, _this) => {
    const _stillsPage = Page.findPage('#stills');
    if (_stillsPage.hasAllData === true) {
      // disable the event handler
      $('#stills').off('carousel:slide');
      return;
    } else if (_index === _indexLoadLeft || _index === _indexLoadRight) {
      _this.loadImages();
    }
  }
);

$('.carousel').on('slid.bs.carousel', () => {
  // tie this event to a custom event so you can turn it off after it's done
  // this might help if you apply it to the carousel event https://learn.jquery.com/events/introduction-to-custom-events/
  // $( document ).trigger( "myCustomEvent", [ "bim", "baz" ] );

  const diaryPage = Page.findPage('#diary');
  if (diaryPage.hasAllData === true) {
    return;
  } else {
    const index = $('.carousel .active').index('.carousel .item');
    if (index + 1 === 9) {
      appendImagesTo(
        '#diaryCarouselInner',
        'img/photos/diary/',
        'diary',
        '.jpg',
        11,
        21
      );
      return;
    } else if (index + 1 === 20) {
      appendImagesTo(
        '#diaryCarouselInner',
        'img/photos/diary/',
        'diary',
        '.jpg',
        22,
        32
      );
      return;
    } else if (index + 1 === 30) {
      appendImagesTo(
        '#diaryCarouselInner',
        'img/photos/diary/',
        'diary',
        '.jpg',
        33,
        63
      );
      diaryPage.hasAllData = true;
      return;
    }
  }
});
