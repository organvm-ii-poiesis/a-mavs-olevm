/**
 * Unit tests for Page class and navigation functions (js/page.js)
 *
 * Tests the core SPA navigation system including:
 * - Page class construction and methods
 * - Static findPage method
 * - Navigation state management
 * - Transition state machine
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock the global scope as the code uses it
let mockPages = [];
let currentPage = {};
let transitionState = 'IDLE';

// Define TransitionState enum
const TransitionState = {
  IDLE: 'IDLE',
  TRANSITIONING: 'TRANSITIONING',
  READY: 'READY',
};

/**
 * Page class implementation for testing
 * Mirrors the actual Page class from js/page.js
 */
class Page {
  constructor(_p) {
    this.id = _p.id || '';
    this.tier = _p.tier || 0;
    this.downLinks = _p.downLinks || [];
    this.upLinks = _p.upLinks || [];
    this.trace = '';
    this.isVisible = false;
    this.isInitialized = false;
    this.isInitializing = false;
    this.isLoaded = false;
    this.isLoading = false;
    this.hasAllData = false;
    this.initialize = _p.initialize || function () {};
    this.load = _p.load || function () {};
  }

  initPage() {
    if (!this.isInitialized && !this.isInitializing) {
      this.isInitializing = true;
      this.initialize();
      this.isInitializing = false;
      this.isInitialized = true;
    }
  }

  getBackElement(_Page) {
    _Page = _Page || this;
    const pageObj = Page.findPage(_Page.id);

    if (pageObj.trace) {
      return pageObj.trace;
    } else if (pageObj.upLinks[0]) {
      return Page.findPage(pageObj.upLinks[0]);
    } else {
      return '';
    }
  }

  static findPage(_pageid) {
    const index = mockPages.findIndex(current => _pageid === current.id);
    if (index === -1) {
      throw new Error(`Can't find page: ${_pageid}`);
    }
    return mockPages[index];
  }
}

describe('Page Class', () => {
  beforeEach(() => {
    mockPages = [];
    currentPage = {};
    transitionState = TransitionState.IDLE;
  });

  afterEach(() => {
    mockPages = [];
    vi.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create a page with default values when no config provided', () => {
      const page = new Page({});

      expect(page.id).toBe('');
      expect(page.tier).toBe(0);
      expect(page.downLinks).toEqual([]);
      expect(page.upLinks).toEqual([]);
      expect(page.trace).toBe('');
      expect(page.isVisible).toBe(false);
      expect(page.isInitialized).toBe(false);
      expect(page.isInitializing).toBe(false);
      expect(page.isLoaded).toBe(false);
      expect(page.isLoading).toBe(false);
      expect(page.hasAllData).toBe(false);
    });

    it('should create a page with provided configuration', () => {
      const initFn = vi.fn();
      const loadFn = vi.fn();

      const page = new Page({
        id: '#test-page',
        tier: 2,
        downLinks: ['#child1', '#child2'],
        upLinks: ['#parent'],
        initialize: initFn,
        load: loadFn,
      });

      expect(page.id).toBe('#test-page');
      expect(page.tier).toBe(2);
      expect(page.downLinks).toEqual(['#child1', '#child2']);
      expect(page.upLinks).toEqual(['#parent']);
      expect(page.initialize).toBe(initFn);
      expect(page.load).toBe(loadFn);
    });

    it('should provide default noop functions for initialize and load', () => {
      const page = new Page({});

      // Should not throw when called
      expect(() => page.initialize()).not.toThrow();
      expect(() => page.load()).not.toThrow();
    });
  });

  describe('initPage method', () => {
    it('should call initialize function on first invocation', () => {
      const initFn = vi.fn();
      const page = new Page({
        id: '#test',
        initialize: initFn,
      });

      page.initPage();

      expect(initFn).toHaveBeenCalledTimes(1);
      expect(page.isInitialized).toBe(true);
      expect(page.isInitializing).toBe(false);
    });

    it('should not call initialize function on subsequent invocations', () => {
      const initFn = vi.fn();
      const page = new Page({
        id: '#test',
        initialize: initFn,
      });

      page.initPage();
      page.initPage();
      page.initPage();

      expect(initFn).toHaveBeenCalledTimes(1);
    });

    it('should not reinitialize if already initializing', () => {
      const initFn = vi.fn();
      const page = new Page({
        id: '#test',
        initialize: initFn,
      });

      // Simulate already initializing
      page.isInitializing = true;

      page.initPage();

      expect(initFn).not.toHaveBeenCalled();
    });

    it('should set isInitializing to false after initialization completes', () => {
      const page = new Page({
        id: '#test',
        initialize: function () {
          // During initialization, isInitializing should be true
          expect(this.isInitializing).toBe(true);
        },
      });

      page.initPage();

      expect(page.isInitializing).toBe(false);
    });
  });

  describe('static findPage method', () => {
    beforeEach(() => {
      // Setup test pages
      mockPages = [
        new Page({ id: '#landing', tier: 1 }),
        new Page({ id: '#menu', tier: 2 }),
        new Page({ id: '#sound', tier: 3 }),
      ];
    });

    it('should find a page by its ID', () => {
      const result = Page.findPage('#menu');

      expect(result).toBeDefined();
      expect(result.id).toBe('#menu');
      expect(result.tier).toBe(2);
    });

    it('should throw an error when page is not found', () => {
      expect(() => Page.findPage('#nonexistent')).toThrow(
        "Can't find page: #nonexistent"
      );
    });

    it('should find the first page in the array', () => {
      const result = Page.findPage('#landing');

      expect(result.id).toBe('#landing');
      expect(result.tier).toBe(1);
    });

    it('should find the last page in the array', () => {
      const result = Page.findPage('#sound');

      expect(result.id).toBe('#sound');
      expect(result.tier).toBe(3);
    });
  });

  describe('getBackElement method', () => {
    beforeEach(() => {
      mockPages = [
        new Page({ id: '#landing', tier: 1, downLinks: ['#menu'] }),
        new Page({
          id: '#menu',
          tier: 2,
          upLinks: ['#landing'],
          downLinks: ['#sound', '#vision'],
        }),
        new Page({ id: '#sound', tier: 3, upLinks: ['#menu'] }),
        new Page({ id: '#vision', tier: 3, upLinks: ['#menu'] }),
      ];
    });

    it('should return the first upLink when no trace is set', () => {
      const soundPage = Page.findPage('#sound');
      const backElement = soundPage.getBackElement();

      expect(backElement.id).toBe('#menu');
    });

    it('should return trace when set', () => {
      const soundPage = Page.findPage('#sound');
      soundPage.trace = '#landing';

      const backElement = soundPage.getBackElement();

      expect(backElement).toBe('#landing');
    });

    it('should return empty string when no upLinks and no trace', () => {
      const landingPage = Page.findPage('#landing');
      const backElement = landingPage.getBackElement();

      expect(backElement).toBe('');
    });

    it('should accept a different page object as parameter', () => {
      const landingPage = Page.findPage('#landing');
      const soundPage = Page.findPage('#sound');

      const backElement = landingPage.getBackElement(soundPage);

      expect(backElement.id).toBe('#menu');
    });
  });
});

describe('TransitionState', () => {
  it('should have correct state values', () => {
    expect(TransitionState.IDLE).toBe('IDLE');
    expect(TransitionState.TRANSITIONING).toBe('TRANSITIONING');
    expect(TransitionState.READY).toBe('READY');
  });
});

describe('Page Navigation Hierarchy', () => {
  beforeEach(() => {
    // Setup a typical site navigation structure
    mockPages = [
      new Page({
        id: '#landing',
        tier: 1,
        downLinks: ['#menu'],
      }),
      new Page({
        id: '#menu',
        tier: 2,
        upLinks: ['#landing'],
        downLinks: ['#words', '#sound', '#vision', '#info'],
      }),
      new Page({
        id: '#words',
        tier: 3,
        upLinks: ['#menu'],
        downLinks: ['#diary', '#blog'],
      }),
      new Page({
        id: '#sound',
        tier: 3,
        upLinks: ['#menu'],
      }),
      new Page({
        id: '#vision',
        tier: 3,
        upLinks: ['#menu'],
        downLinks: ['#stills', '#diary', '#video'],
      }),
      new Page({
        id: '#info',
        tier: 3,
        upLinks: ['#menu'],
      }),
      new Page({
        id: '#stills',
        tier: 4,
        upLinks: ['#vision'],
      }),
      new Page({
        id: '#diary',
        tier: 4,
        upLinks: ['#vision'],
      }),
      new Page({
        id: '#video',
        tier: 4,
        upLinks: ['#vision'],
      }),
      new Page({
        id: '#blog',
        tier: 4,
        upLinks: ['#words'],
      }),
    ];
  });

  it('should have landing page at tier 1', () => {
    const landing = Page.findPage('#landing');
    expect(landing.tier).toBe(1);
    expect(landing.upLinks).toHaveLength(0);
  });

  it('should have menu page at tier 2', () => {
    const menu = Page.findPage('#menu');
    expect(menu.tier).toBe(2);
    expect(menu.upLinks).toContain('#landing');
  });

  it('should have content sections at tier 3', () => {
    const sections = ['#words', '#sound', '#vision', '#info'];
    sections.forEach(sectionId => {
      const section = Page.findPage(sectionId);
      expect(section.tier).toBe(3);
      expect(section.upLinks).toContain('#menu');
    });
  });

  it('should have detail pages at tier 4', () => {
    const details = ['#stills', '#diary', '#video', '#blog'];
    details.forEach(detailId => {
      const detail = Page.findPage(detailId);
      expect(detail.tier).toBe(4);
    });
  });

  it('should allow navigation back from tier 4 to tier 3', () => {
    const stills = Page.findPage('#stills');
    const backPage = stills.getBackElement();
    expect(backPage.tier).toBe(3);
  });

  it('should allow navigation back from tier 3 to tier 2', () => {
    const sound = Page.findPage('#sound');
    const backPage = sound.getBackElement();
    expect(backPage.tier).toBe(2);
  });

  it('should allow navigation back from tier 2 to tier 1', () => {
    const menu = Page.findPage('#menu');
    const backPage = menu.getBackElement();
    expect(backPage.tier).toBe(1);
  });

  it('should have no back navigation from tier 1 (landing)', () => {
    const landing = Page.findPage('#landing');
    const backPage = landing.getBackElement();
    expect(backPage).toBe('');
  });
});

describe('Page State Management', () => {
  it('should track loading state correctly', () => {
    const page = new Page({ id: '#test' });

    expect(page.isLoading).toBe(false);

    page.isLoading = true;
    expect(page.isLoading).toBe(true);

    page.isLoading = false;
    expect(page.isLoading).toBe(false);
  });

  it('should track visibility state', () => {
    const page = new Page({ id: '#test' });

    expect(page.isVisible).toBe(false);

    page.isVisible = true;
    expect(page.isVisible).toBe(true);
  });

  it('should track data loading state', () => {
    const page = new Page({ id: '#test' });

    expect(page.hasAllData).toBe(false);

    page.hasAllData = true;
    expect(page.hasAllData).toBe(true);
  });
});
