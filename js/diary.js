/**
 * @file diary.js
 * @description Handles diary/journal entry image loading and processing
 * Manages lazy loading of diary images using placeholder replacement technique
 *
 * @author gabriel
 * @requires jQuery
 */

/**
 * Appends a series of numbered images to a DOM element
 * Used for gallery-style image loading with sequential numbering
 *
 * @param {string} element - CSS selector for the container element
 * @param {string} location - Base path to the image directory
 * @param {string} prefix - Filename prefix before the number (e.g., "image_")
 * @param {string} fileExtension - File extension including the period (e.g., ".jpg", ".png")
 * @param {number} start - Starting number (inclusive)
 * @param {number} end - Ending number (inclusive)
 *
 * @example
 * // Appends image_1.jpg through image_10.jpg from img/photos/
 * appendImagesTo('#gallery', 'img/photos/', 'image_', '.jpg', 1, 10);
 */

function appendImagesTo(element, location, prefix, fileExtension, start, end) {
  const srcContents = location + prefix;
  element = $(element);
  while (start <= end) {
    element.append(
      '<div id="stillsImage" class="dn v-mid heightControl-stills min-h-21_875rem min-h-28_125rem-ns tc h-100">' +
        '<img class="mw-100 mh-100 w-auto h-auto anim anim-easeout" src="' +
        srcContents +
        start +
        fileExtension +
        '"/>' +
        '</div>'
    );
    start++;
  }
}

/**
 * Replaces placeholder images with actual images for lazy loading
 * Searches for images with src="img/placeholder.jpg" and replaces them
 * with the actual source from the data-src attribute
 *
 * Performance optimization: Only loads images when the page is initialized,
 * reducing initial page load time
 *
 * @param {string} element - CSS selector for the container to search within
 *
 * @example
 * // HTML: <img src="img/placeholder.jpg" data-src="img/actual-image.jpg" />
 * // After calling: <img src="img/actual-image.jpg" data-src="img/actual-image.jpg" />
 * replacePlaceholders('#diary');
 */
function replacePlaceholders(element) {
  const dstills = $(element).find("img[src='img/placeholder.jpg']");
  if (dstills.length !== 0) {
    dstills.each(function () {
      const actualImage = $(this).attr('data-src');
      $(this).attr('src', actualImage);
    });
  }
}

/**
 * Carousel
 *
 * @summary A pretty dope carousel for images
 *
 * @param {string} element - html element to search
 */

function Carousel(_c) {
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

Carousel.prototype.incIndex = function () {
  const _index = this.index + 1;
  if (_index > this.total - 1) {
    this.setIndex(0);
  } else {
    this.index = _index;
  }
};

Carousel.prototype.decIndex = function () {
  const _index = this.index - 1;
  if (_index < 0) {
    this.setIndex(this.total - 1);
  } else {
    this.index = _index;
  }
};

Carousel.prototype.setIndex = function (n) {
  this.index = n;
};

Carousel.prototype.loadCaption = function (img) {
  const _img = img.children().attr('src');
  const regExp = /img\/photos\/[a-z]*\/([a-z]*)(\d*)/g;
  const match = regExp.exec(_img);
  const name = match[1];
  const num = match[2];
  const caption = stillsData[name][num];

  console.log(name + ' ' + num);
  console.log(stillsData[name][num]);
  if (caption !== undefined) {
    this.caption.html(caption);
  } else {
    this.caption.html('');
  }
};

Carousel.prototype.setIndicator = function () {
  const adjIndex = this.index + 1;
  $('#stills-indicator').text(adjIndex.toString() + '/' + this.total);
};

Carousel.prototype.loadImages = function () {
  const _stillsPage = Page.findPage(this.id);
  if (!_stillsPage.hasAllData) {
    const _images = this.images;
    const len = _images.length;
    if (_images[0] !== undefined) {
      for (let i = 0; i < len; i++) {
        const _name = _images[i][0];
        const _imgAmount = _images[i][1];
        const _start = _name === 'diary' ? 0 : 0;
        appendImagesTo(
          this.id + ' #imageContainer',
          'img/photos/' + _name + '/',
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
};

// when this is emitted, the Carousel has began to slide into a new image
Carousel.prototype.emitSlide = function (dir) {
  $(this.id).trigger('carousel:slide', [
    this.index,
    this.indexLoadLeft,
    this.indexLoadRight,
    this.images,
    dir,
    this,
  ]);
};

const stillsCarousel = new Carousel({
  id: '#stills',
  images: [['diary', 125]],
  total: 125,
  indexLoadLeft: $('[id*=diary-leftImage]').length,
  loadOffset: 4,
  caption: $('#stillsCaption'),
});

const stillsData = {
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

$('#stills-left-diary').on('click', function () {
  const img = $('#diary-leftImage.dtc');
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
    loadingImage = $('[id*=diary-leftImage]').last();
    loadingImage.addClass('dtc').removeClass('dn');
    loadingImage.children().addClass('anim-fadeIn');
  }
  // sC.loadCaption(loadingImage);
});

$('#stills-right-diary').on('click', function () {
  const img = $('#diary-leftImage.dtc');
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
    loadingImage = $('[id*=diary-leftImage]').first();
    loadingImage.addClass('dtc').removeClass('dn');
    loadingImage.children().addClass('anim-fadeIn');
  }
  // sC.loadCaption(loadingImage);
});

$('#diary').on(
  'carousel:slide',
  function (
    event,
    _index,
    _indexLoadLeft,
    _indexLoadRight,
    _images,
    _dir,
    _this
  ) {
    const _stillsPage = Page.findPage('#diary');
    if (_stillsPage.hasAllData === true) {
      // disable the event handler
      $('#diary').off('carousel:slide');
      return;
    } else if (_index === _indexLoadLeft || _index === _indexLoadRight) {
      _this.loadImages();
    }
  }
);

Carousel.prototype.updateTotalLoaded = function () {
  this.totalLoaded = $('[id*=stillsImage]').length;
};

Carousel.prototype.loadLeft = function () {
  console.log('load left event');
  const _stillsPage = Page.findPage(this.id);
  if (!_stillsPage.hasAllData) {
    const _images = this.images;
    if (_images[0] !== undefined) {
      const _name = _images[0][0];
      const _imgAmount = _images[0][1];
      let _start = 1;
      console.log(_last + ' ' + _name + ' ' + _imgAmount);

      if (_name === 'media') {
        _start = 4;
      }

      appendImagesTo(
        this.id + ' #imageContainer',
        'img/photos/' + _name + '/',
        _name,
        '.jpg',
        _start,
        _imgAmount
      );
      this.setLoadLeftIndex(_imgAmount);
      this.images.splice(0, 1);
      this.updateTotalLoaded();

      return;
    } else {
      _stillsPage.hasAllData = true;
      return;
    }
  }
};

Carousel.prototype.loadRight = function () {
  console.log('load right event');
  const _stillsPage = Page.findPage(this.id);
  if (!_stillsPage.hasAllData) {
    const _images = this.images;
    if (_images[0] !== undefined) {
      const _last = _images.length - 1;
      const _name = _images[_last][0];
      const _imgAmount = _images[_last][1];
      let _start = 1;

      if (_name === 'media') {
        _start = 4;
      }
      appendImagesTo(
        this.id + ' #imageContainer',
        'img/photos/' + _name + '/',
        _name,
        '.jpg',
        _start,
        _imgAmount
      );
      this.setLoadRightIndex(_imgAmount);
      this.images.splice(_last, 1);
      this.updateTotalLoaded();

      return;
    } else {
      _stillsPage.hasAllData = true;
      return;
    }
  }
};

Carousel.prototype.setLoadRightIndex = function (_n) {
  if (this.images[0] !== undefined) {
    this.indexLoadRight -= _n - this.loadOffset;
  } else {
    this.hasAllData = true;
  }
};

Carousel.prototype.setLoadLeftIndex = function (_n) {
  if (this.images[0] !== undefined) {
    this.indexLoadLeft += _n;
  } else {
    this.hasAllData = true;
  }
};

$('.carousel').on('slid.bs.carousel', function () {
  // tie this event to a custom event so you can turn it off after it's done
  // this might help if you apply it to the carousel event https://learn.jquery.com/events/introduction-to-custom-events/
  // $( document ).trigger( "myCustomEvent", [ "bim", "baz" ] );

  if (pages[7].hasAllData === true) {
    // console.log('not loading any more images');
    return;
  } else {
    const index = $('.carousel .active').index('.carousel .item');
    console.log('index = ' + index);
    if (index + 1 === 9) {
      // console.log('9th image loaded, loading new set');
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
      // console.log('20th image loaded, loading new set');
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
      // console.log('30th image loaded, loading rest of diary');
      appendImagesTo(
        '#diaryCarouselInner',
        'img/photos/diary/',
        'diary',
        '.jpg',
        33,
        63
      );
      pages[7].hasAllData = true;
      return;
    }
  }
});
