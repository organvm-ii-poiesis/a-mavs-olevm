/**
 * Unit tests for Carousel class (js/modules/Carousel.js)
 *
 * Tests the shared carousel component including:
 * - Constructor defaults and config acceptance
 * - Index management (increment, decrement, wrapping)
 * - Caption loading from data objects
 * - Touch handler initialization and cleanup
 * - Destroy/cleanup methods
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import vm from 'vm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Mock jQuery element
const createMockEl = () => {
  const el = {
    trigger: vi.fn(),
    text: vi.fn(),
    html: vi.fn(),
    find: vi.fn().mockReturnValue({ length: 0, each: vi.fn() }),
    on: vi.fn(),
    off: vi.fn(),
    append: vi.fn(),
    children: vi.fn().mockReturnValue({
      attr: vi.fn().mockReturnValue('img/photos/media/media1.jpg'),
      addClass: vi.fn(),
    }),
    attr: vi.fn(),
    addClass: vi.fn().mockReturnThis(),
    removeClass: vi.fn().mockReturnThis(),
    prev: vi.fn(),
    next: vi.fn(),
    first: vi.fn(),
    last: vi.fn(),
    length: 5,
  };
  el.prev.mockReturnValue(el);
  el.next.mockReturnValue(el);
  el.first.mockReturnValue(el);
  el.last.mockReturnValue(el);
  return el;
};

const mockEl = createMockEl();
const $ = vi.fn().mockReturnValue(mockEl);
globalThis.$ = $;
globalThis.jQuery = $;

globalThis.Page = {
  findPage: vi.fn().mockReturnValue({ hasAllData: false }),
};

globalThis.ETCETER4_CONFIG = {
  carousel: { swipeThreshold: 50 },
};

// Load and execute Carousel source in the current global context
const carouselSource = readFileSync(
  resolve(__dirname, '../../js/modules/Carousel.js'),
  'utf-8'
);
vm.runInThisContext(carouselSource, { filename: 'Carousel.js' });

describe('Carousel', () => {
  let carousel;

  beforeEach(() => {
    vi.clearAllMocks();
    $.mockReturnValue(mockEl);

    carousel = new Carousel({
      id: '#stills',
      total: 10,
      index: 0,
      images: [['media', 10]],
      imageSelector: '.stillsImage',
    });
  });

  describe('constructor', () => {
    it('should set default values for missing config properties', () => {
      const c = new Carousel({});
      expect(c.id).toBe('');
      expect(c.page).toBeNull();
      expect(c.caption).toBeNull();
      expect(c.index).toBe(0);
      expect(c.total).toBe(0);
      expect(c.images).toEqual([]);
      expect(c.loadOffset).toBe(0);
      expect(c.captionData).toEqual({});
      expect(c.imageSelector).toBe('.stillsImage');
    });

    it('should accept all config properties', () => {
      const captionEl = { html: vi.fn() };
      const c = new Carousel({
        id: '#diary',
        page: { id: '#diary' },
        caption: captionEl,
        index: 3,
        total: 20,
        images: [['diary', 20]],
        loadOffset: 4,
        captionData: { diary: { 1: 'test' } },
        imageSelector: '#diary .diaryImage',
      });
      expect(c.id).toBe('#diary');
      expect(c.page).toEqual({ id: '#diary' });
      expect(c.caption).toBe(captionEl);
      expect(c.index).toBe(3);
      expect(c.total).toBe(20);
      expect(c.loadOffset).toBe(4);
      expect(c.imageSelector).toBe('#diary .diaryImage');
    });

    it('should initialize touch handler state as inactive', () => {
      expect(carousel._touchActiveClass).toBeNull();
      expect(carousel._touchHiddenClass).toBeNull();
      expect(carousel._touchHandlersInitialized).toBe(false);
    });
  });

  describe('incIndex', () => {
    it('should increment index by 1', () => {
      carousel.index = 0;
      carousel.incIndex();
      expect(carousel.index).toBe(1);
    });

    it('should wrap around to 0 when at last index', () => {
      carousel.index = 9;
      carousel.incIndex();
      expect(carousel.index).toBe(0);
    });

    it('should increment through middle values', () => {
      carousel.index = 5;
      carousel.incIndex();
      expect(carousel.index).toBe(6);
    });
  });

  describe('decIndex', () => {
    it('should decrement index by 1', () => {
      carousel.index = 5;
      carousel.decIndex();
      expect(carousel.index).toBe(4);
    });

    it('should wrap around to last index when at 0', () => {
      carousel.index = 0;
      carousel.decIndex();
      expect(carousel.index).toBe(9);
    });

    it('should decrement from 1 to 0', () => {
      carousel.index = 1;
      carousel.decIndex();
      expect(carousel.index).toBe(0);
    });
  });

  describe('setIndex', () => {
    it('should set index to specified value', () => {
      carousel.setIndex(7);
      expect(carousel.index).toBe(7);
    });

    it('should set index to 0', () => {
      carousel.index = 5;
      carousel.setIndex(0);
      expect(carousel.index).toBe(0);
    });
  });

  describe('index wrapping cycle', () => {
    it('should cycle forward through all indices', () => {
      carousel.index = 0;
      for (let i = 0; i < 10; i++) {
        expect(carousel.index).toBe(i);
        carousel.incIndex();
      }
      expect(carousel.index).toBe(0);
    });

    it('should cycle backward through all indices', () => {
      carousel.index = 0;
      carousel.decIndex();
      for (let i = 9; i >= 0; i--) {
        expect(carousel.index).toBe(i);
        carousel.decIndex();
      }
      expect(carousel.index).toBe(9);
    });
  });

  describe('emitSlide', () => {
    it('should trigger carousel:slide event with correct args', () => {
      carousel.index = 3;
      carousel.indexLoadLeft = 0;
      carousel.indexLoadRight = 9;

      carousel.emitSlide('right');

      expect(mockEl.trigger).toHaveBeenCalledWith('carousel:slide', [
        3,
        0,
        9,
        [['media', 10]],
        'right',
        carousel,
      ]);
    });
  });

  describe('setIndicator', () => {
    it('should display 1-based index', () => {
      carousel.id = '#stills';
      carousel.index = 0;
      carousel.total = 10;

      carousel.setIndicator();

      expect(mockEl.text).toHaveBeenCalledWith('1/10');
    });

    it('should display middle index correctly', () => {
      carousel.id = '#stills';
      carousel.index = 4;
      carousel.total = 10;

      carousel.setIndicator();

      expect(mockEl.text).toHaveBeenCalledWith('5/10');
    });
  });

  describe('loadCaption', () => {
    it('should set caption html when caption data exists', () => {
      const captionEl = { html: vi.fn() };
      carousel.caption = captionEl;
      carousel.captionData = {
        media: { 1: 'Test caption' },
      };

      const img = {
        children: vi.fn().mockReturnValue({
          attr: vi.fn().mockReturnValue('img/photos/media/media1.jpg'),
        }),
      };

      carousel.loadCaption(img);

      expect(captionEl.html).toHaveBeenCalledWith('Test caption');
    });

    it('should clear caption when no matching data', () => {
      const captionEl = { html: vi.fn() };
      carousel.caption = captionEl;
      carousel.captionData = { media: {} };

      const img = {
        children: vi.fn().mockReturnValue({
          attr: vi.fn().mockReturnValue('img/photos/media/media99.jpg'),
        }),
      };

      carousel.loadCaption(img);

      expect(captionEl.html).toHaveBeenCalledWith('');
    });

    it('should do nothing when caption element is null', () => {
      carousel.caption = null;
      const img = {
        children: vi.fn().mockReturnValue({
          attr: vi.fn().mockReturnValue('img/photos/media/media1.jpg'),
        }),
      };
      expect(() => carousel.loadCaption(img)).not.toThrow();
    });

    it('should clear caption when image has no src', () => {
      const captionEl = { html: vi.fn() };
      carousel.caption = captionEl;
      carousel.captionData = { media: { 1: 'Caption' } };

      const img = {
        children: vi.fn().mockReturnValue({
          attr: vi.fn().mockReturnValue(undefined),
        }),
      };

      carousel.loadCaption(img);

      expect(captionEl.html).toHaveBeenCalledWith('');
    });
  });

  describe('initTouchHandlers', () => {
    it('should store active and hidden classes', () => {
      carousel.initTouchHandlers('dtc', 'dn');

      expect(carousel._touchActiveClass).toBe('dtc');
      expect(carousel._touchHiddenClass).toBe('dn');
      expect(carousel._touchHandlersInitialized).toBe(true);
    });

    it('should bind touchstart and touchend events', () => {
      carousel.initTouchHandlers('dtc', 'dn');

      expect(mockEl.on).toHaveBeenCalledWith(
        'touchstart.carousel',
        expect.any(Function)
      );
      expect(mockEl.on).toHaveBeenCalledWith(
        'touchend.carousel',
        expect.any(Function)
      );
    });
  });

  describe('destroyTouchHandlers', () => {
    it('should unbind touch events when initialized', () => {
      carousel.initTouchHandlers('dtc', 'dn');
      mockEl.off.mockClear();

      carousel.destroyTouchHandlers();

      expect(mockEl.off).toHaveBeenCalledWith(
        'touchstart.carousel touchend.carousel'
      );
      expect(carousel._touchHandlersInitialized).toBe(false);
    });

    it('should do nothing when not initialized', () => {
      carousel.destroyTouchHandlers();
      expect(mockEl.off).not.toHaveBeenCalled();
    });
  });

  describe('destroy', () => {
    it('should clean up touch handlers and slide event', () => {
      carousel.initTouchHandlers('dtc', 'dn');
      mockEl.off.mockClear();

      carousel.destroy();

      expect(mockEl.off).toHaveBeenCalledWith(
        'touchstart.carousel touchend.carousel'
      );
      expect(mockEl.off).toHaveBeenCalledWith('carousel:slide');
    });

    it('should be safe to call multiple times', () => {
      carousel.destroy();
      expect(() => carousel.destroy()).not.toThrow();
    });
  });

  describe('loadImages', () => {
    it('should return false when page hasAllData', () => {
      globalThis.Page.findPage.mockReturnValue({ hasAllData: true });

      const result = carousel.loadImages();

      expect(result).toBe(false);
    });

    it('should return false when images array is empty', () => {
      globalThis.Page.findPage.mockReturnValue({ hasAllData: false });
      carousel.images = [];

      const result = carousel.loadImages();

      expect(result).toBe(false);
    });

    it('should set hasAllData to true after loading', () => {
      const mockPage = { hasAllData: false };
      globalThis.Page.findPage.mockReturnValue(mockPage);

      carousel.loadImages();

      expect(mockPage.hasAllData).toBe(true);
    });

    it('should handle errors gracefully', () => {
      globalThis.Page.findPage.mockImplementation(() => {
        throw new Error('Page not found');
      });
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = carousel.loadImages();

      expect(result).toBe(false);
      errorSpy.mockRestore();
    });
  });

  describe('bindNavButtons', () => {
    it('should bind click handlers to left and right selectors', () => {
      carousel.bindNavButtons('#left', '#right', 'dtc', 'dn');

      // $ is called with '#left' and '#right'
      expect($.mock.calls.some(c => c[0] === '#left')).toBe(true);
      expect($.mock.calls.some(c => c[0] === '#right')).toBe(true);
      // on('click', ...) should have been called
      expect(mockEl.on).toHaveBeenCalledWith('click', expect.any(Function));
    });
  });

  describe('bindLazyLoad', () => {
    it('should bind carousel:slide event', () => {
      carousel.bindLazyLoad();

      expect(mockEl.on).toHaveBeenCalledWith(
        'carousel:slide',
        expect.any(Function)
      );
    });

    it('should not double-bind', () => {
      carousel.bindLazyLoad();
      const callCount = mockEl.on.mock.calls.filter(
        c => c[0] === 'carousel:slide'
      ).length;

      carousel.bindLazyLoad();
      const newCallCount = mockEl.on.mock.calls.filter(
        c => c[0] === 'carousel:slide'
      ).length;

      expect(newCallCount).toBe(callCount);
    });

    it('should reset _lazyLoadBound on destroy', () => {
      carousel.bindLazyLoad();
      expect(carousel._lazyLoadBound).toBe(true);

      carousel.destroy();
      expect(carousel._lazyLoadBound).toBe(false);
    });
  });
});

describe('Global helper functions', () => {
  it('appendImagesTo should be defined', () => {
    expect(typeof globalThis.appendImagesTo).toBe('function');
  });

  it('replacePlaceholders should be defined', () => {
    expect(typeof globalThis.replacePlaceholders).toBe('function');
  });

  it('Carousel should be defined', () => {
    // Carousel is a class declaration — available in the vm context but not on globalThis
    expect(typeof Carousel).toBe('function');
  });
});
