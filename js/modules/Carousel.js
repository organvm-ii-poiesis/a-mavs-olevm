/**
 * @file Carousel.js
 * @description Shared carousel module for image galleries
 * Used by both stills and diary sections
 *
 * @requires jQuery
 * @requires page.js - Page navigation system
 */

'use strict';

/**
 * Appends a series of numbered images to a DOM element
 * Used for gallery-style image loading with sequential numbering
 *
 * @param {string} element - CSS selector for the container element
 * @param {string} location - Base path to the image directory
 * @param {string} prefix - Filename prefix before the number (e.g., "photo_")
 * @param {string} fileExtension - File extension including the period (e.g., ".jpg", ".png")
 * @param {number} start - Starting number (inclusive)
 * @param {number} end - Ending number (inclusive)
 *
 * @example
 * appendImagesTo('#stills', 'img/gallery/', 'photo_', '.jpg', 1, 20);
 */
function appendImagesTo(element, location, prefix, fileExtension, start, end) {
  const srcContents = location + prefix;
  const $element = $(element);
  while (start <= end) {
    $element.append(
      '<div id="stillsImage" class="dn v-mid heightControl-stills min-h-21_875rem min-h-28_125rem-ns tc h-100">' +
        '<img class="mw-100 mh-100 w-auto h-auto anim anim-easeout" src="' +
        srcContents +
        start +
        fileExtension +
        '" alt="Gallery image ' +
        start +
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
 * @param {string} element - CSS selector for the container to search within
 *
 * @example
 * replacePlaceholders('#stills');
 */
function replacePlaceholders(element) {
  const images = $(element).find("img[src='img/placeholder.jpg']");
  if (images.length !== 0) {
    images.each(function () {
      const actualImage = $(this).attr('data-src');
      if (actualImage) {
        $(this).attr('src', actualImage);
      }
    });
  }
}

/**
 * Carousel Class
 *
 * A reusable carousel component for image galleries
 */
class Carousel {
  /**
   * Create a Carousel instance
   * @param {Object} config - Carousel configuration
   * @param {string} config.id - Container element ID (e.g., '#stills')
   * @param {Page|null} config.page - Associated Page object
   * @param {jQuery|null} config.caption - Caption element
   * @param {number} config.index - Current image index
   * @param {number} config.total - Total number of images
   * @param {Array} config.images - Image data array
   * @param {number} config.loadOffset - Offset for lazy loading
   * @param {Object} config.captionData - Caption data object for this carousel
   */
  constructor(config) {
    this.id = config.id || '';
    this.page = config.page || null;
    this.caption = config.caption || null;
    this.index = config.index || 0;
    this.total = config.total || 0;
    this.images = config.images || [];
    this.loadOffset = config.loadOffset || 0;
    this.indexLoadLeft = config.indexLoadLeft || 0;
    this.indexLoadRight = config.indexLoadRight || this.total - 1;
    this.totalLoaded = config.totalLoaded || 0;
    this.captionData = config.captionData || {};
    this.imageSelector = config.imageSelector || '[id*=stillsImage]';

    // Touch handler state
    this._touchActiveClass = null;
    this._touchHiddenClass = null;
    this._touchHandlersInitialized = false;
  }

  /**
   * Increment the current index with wrapping
   */
  incIndex() {
    const newIndex = this.index + 1;
    if (newIndex > this.total - 1) {
      this.setIndex(0);
    } else {
      this.index = newIndex;
    }
  }

  /**
   * Decrement the current index with wrapping
   */
  decIndex() {
    const newIndex = this.index - 1;
    if (newIndex < 0) {
      this.setIndex(this.total - 1);
    } else {
      this.index = newIndex;
    }
  }

  /**
   * Set the current index
   * @param {number} n - New index value
   */
  setIndex(n) {
    this.index = n;
  }

  /**
   * Load caption for the current image
   * @param {jQuery} img - Image element
   */
  loadCaption(img) {
    if (!this.caption || !this.captionData) {
      return;
    }

    const imgSrc = img.children().attr('src');
    if (!imgSrc) {
      this.caption.html('');
      return;
    }

    const regExp = /img\/photos\/[a-z]*\/([a-z]*)(\d*)/g;
    const match = regExp.exec(imgSrc);

    if (!match) {
      this.caption.html('');
      return;
    }

    const name = match[1];
    const num = match[2];
    const caption = this.captionData[name]?.[num];

    if (caption !== undefined && caption !== '') {
      this.caption.html(caption);
    } else {
      this.caption.html('');
    }
  }

  /**
   * Update the indicator display
   */
  setIndicator() {
    const adjIndex = this.index + 1;
    const indicatorId =
      this.id === '#stills' ? '#stills-indicator' : '#diary-indicator';
    $(indicatorId).text(adjIndex.toString() + '/' + this.total);
  }

  /**
   * Load all images for this carousel
   * @returns {boolean} True if images were loaded
   */
  loadImages() {
    try {
      const page = Page.findPage(this.id);
      if (page.hasAllData) {
        return false;
      }

      const images = this.images;
      if (!images || images.length === 0) {
        return false;
      }

      for (let i = 0; i < images.length; i++) {
        const name = images[i][0];
        const imgAmount = images[i][1];
        const start = name === 'media' ? 4 : 1;
        appendImagesTo(
          this.id + ' #imageContainer',
          'img/photos/' + name + '/',
          name,
          '.jpg',
          start,
          imgAmount
        );
      }

      page.hasAllData = true;
      return true;
    } catch (error) {
      console.error('Error loading carousel images:', error.message);
      return false;
    }
  }

  /**
   * Emit a slide event
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

  /**
   * Update total loaded count
   */
  updateTotalLoaded() {
    this.totalLoaded = $(this.imageSelector).length;
  }

  /**
   * Navigate to the previous image
   * @param {string} activeClass - CSS class for active image (e.g., 'dtc')
   * @param {string} hiddenClass - CSS class for hidden image (e.g., 'dn')
   */
  navigatePrev(activeClass, hiddenClass) {
    const img = $(this.imageSelector + '.' + activeClass);
    const tmpIndex = this.index;

    this.decIndex();
    this.emitSlide('left');
    this.setIndicator();
    img.removeClass(activeClass).addClass(hiddenClass);

    let loadingImage;
    if (tmpIndex !== 0) {
      loadingImage = img.prev();
    } else {
      loadingImage = $(this.imageSelector).last();
    }

    loadingImage.addClass(activeClass).removeClass(hiddenClass);
    loadingImage.children().addClass('anim-fadeIn');

    if (this.caption) {
      this.loadCaption(loadingImage);
    }
  }

  /**
   * Navigate to the next image
   * @param {string} activeClass - CSS class for active image (e.g., 'dtc')
   * @param {string} hiddenClass - CSS class for hidden image (e.g., 'dn')
   */
  navigateNext(activeClass, hiddenClass) {
    const img = $(this.imageSelector + '.' + activeClass);
    const tmpIndex = this.index + 1;

    this.incIndex();
    this.emitSlide('right');
    this.setIndicator();
    img.removeClass(activeClass).addClass(hiddenClass);

    let loadingImage;
    if (tmpIndex < this.total) {
      loadingImage = img.next();
    } else {
      loadingImage = $(this.imageSelector).first();
    }

    loadingImage.addClass(activeClass).removeClass(hiddenClass);
    loadingImage.children().addClass('anim-fadeIn');

    if (this.caption) {
      this.loadCaption(loadingImage);
    }
  }

  /**
   * Initialize touch handlers for swipe navigation
   * Stores active/hidden classes for use in destroy method
   * @param {string} activeClass - CSS class for active image (e.g., 'dtc')
   * @param {string} hiddenClass - CSS class for hidden image (e.g., 'dn')
   */
  initTouchHandlers(activeClass, hiddenClass) {
    const self = this;
    const container = $(this.id);
    const swipeThreshold =
      typeof ETCETER4_CONFIG !== 'undefined'
        ? ETCETER4_CONFIG.carousel.swipeThreshold
        : 50;

    // Store for cleanup
    this._touchActiveClass = activeClass;
    this._touchHiddenClass = hiddenClass;
    this._touchHandlersInitialized = true;

    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;

    container.on('touchstart.carousel', function (e) {
      touchStartX = e.originalEvent.touches[0].clientX;
      touchStartY = e.originalEvent.touches[0].clientY;
    });

    container.on('touchend.carousel', function (e) {
      touchEndX = e.originalEvent.changedTouches[0].clientX;
      touchEndY = e.originalEvent.changedTouches[0].clientY;

      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;

      // Only trigger if horizontal swipe is greater than vertical (prevent scroll interference)
      if (
        Math.abs(deltaX) > Math.abs(deltaY) &&
        Math.abs(deltaX) > swipeThreshold
      ) {
        if (deltaX > 0) {
          // Swipe right - go to previous
          self.navigatePrev(activeClass, hiddenClass);
        } else {
          // Swipe left - go to next
          self.navigateNext(activeClass, hiddenClass);
        }
      }
    });
  }

  /**
   * Destroy touch handlers for cleanup
   * Should be called when navigating away from carousel page
   */
  destroyTouchHandlers() {
    if (this._touchHandlersInitialized) {
      $(this.id).off('touchstart.carousel touchend.carousel');
      this._touchHandlersInitialized = false;
    }
  }

  /**
   * Full cleanup method for carousel
   * Removes all event handlers and resets state
   */
  destroy() {
    this.destroyTouchHandlers();
    $(this.id).off('carousel:slide');
  }
}
