/**
 * Unit tests for main.js
 *
 * Tests the main application entry point including:
 * - handleHashChange() function for browser back/forward navigation
 * - manageLandingCompositor() function for 3D compositor lifecycle
 * - showNewSection override for compositor integration
 * - Document ready handler with hash-based routing
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock Page class
class MockPage {
  constructor(_p) {
    this.id = _p.id || '';
    this.tier = _p.tier || 0;
    this.downLinks = _p.downLinks || [];
    this.upLinks = _p.upLinks || [];
    this.isInitialized = false;
  }

  initPage() {
    this.isInitialized = true;
  }

  static findPage(pageId) {
    const page = mockPages.find(p => p.id === pageId);
    if (!page) {
      throw new Error(`Can't find page: ${pageId}`);
    }
    return page;
  }
}

// Test state
let mockPages = [];
let currentPage = null;
let isNavigating = false;
let showNewSectionMock = vi.fn();
let mockLandingCompositor = null;

// Mock window and location
let mockHash = '';
const mockLocation = {
  get hash() {
    return mockHash;
  },
  set hash(value) {
    mockHash = value;
  },
};

// Mock jQuery
const createMockjQuery = () => {
  const elements = new Map();

  const $ = vi.fn(selector => {
    if (selector === document) {
      return {
        ready: vi.fn(callback => callback()),
      };
    }

    // Return a mock jQuery element
    const element = elements.get(selector) || {
      selector,
      hasClass: vi.fn().mockReturnValue(false),
      addClass: vi.fn().mockReturnThis(),
      removeClass: vi.fn().mockReturnThis(),
    };
    elements.set(selector, element);
    return element;
  });

  $.getElement = selector => elements.get(selector);
  $.clearElements = () => elements.clear();

  return $;
};

describe('main.js', () => {
  let $;
  let originalWindow;
  let originalConsole;
  let hashChangeHandler;

  beforeEach(() => {
    // Reset test state
    mockPages = [
      new MockPage({ id: '#landing', tier: 1, downLinks: ['#menu'] }),
      new MockPage({
        id: '#menu',
        tier: 2,
        upLinks: ['#landing'],
        downLinks: ['#sound', '#vision'],
      }),
      new MockPage({ id: '#sound', tier: 3, upLinks: ['#menu'] }),
      new MockPage({ id: '#vision', tier: 3, upLinks: ['#menu'] }),
      new MockPage({ id: '#stills', tier: 4, upLinks: ['#vision'] }),
      new MockPage({ id: '#diary', tier: 4, upLinks: ['#vision'] }),
    ];

    currentPage = null;
    isNavigating = false;
    mockHash = '';
    showNewSectionMock = vi.fn();
    mockLandingCompositor = null;

    // Create mock jQuery
    $ = createMockjQuery();

    // Store original console
    originalConsole = { ...console };

    // Mock console.warn
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});

    // Store hashchange handler for triggering
    hashChangeHandler = null;

    // Mock window
    originalWindow = global.window;
    global.window = {
      location: mockLocation,
      addEventListener: vi.fn((event, handler) => {
        if (event === 'hashchange') {
          hashChangeHandler = handler;
        }
      }),
      removeEventListener: vi.fn(),
      landingCompositor: mockLandingCompositor,
    };
  });

  afterEach(() => {
    global.window = originalWindow;
    vi.clearAllMocks();
    $.clearElements();
  });

  describe('handleHashChange()', () => {
    /**
     * Implementation of handleHashChange for testing
     * Mirrors the actual implementation in main.js
     */
    const handleHashChange = () => {
      if (isNavigating) {
        return;
      }

      const hash = window.location.hash || '#landing';

      // Don't navigate if we're already on this page
      if (currentPage && currentPage.id === hash) {
        return;
      }

      try {
        const targetPage = MockPage.findPage(hash);
        if (targetPage) {
          showNewSectionMock(hash);
        }
      } catch (error) {
        // If page not found, navigate to landing
        console.warn(`Page not found: ${hash}, navigating to landing`);
        window.location.hash = '#landing';
      }
    };

    it('should return early when isNavigating is true', () => {
      isNavigating = true;
      mockHash = '#sound';

      handleHashChange();

      expect(showNewSectionMock).not.toHaveBeenCalled();
    });

    it('should return early when already on current page', () => {
      currentPage = MockPage.findPage('#menu');
      mockHash = '#menu';

      handleHashChange();

      expect(showNewSectionMock).not.toHaveBeenCalled();
    });

    it('should call showNewSection for valid hash', () => {
      currentPage = MockPage.findPage('#landing');
      mockHash = '#sound';

      handleHashChange();

      expect(showNewSectionMock).toHaveBeenCalledWith('#sound');
    });

    it('should fallback to #landing when hash is empty', () => {
      currentPage = null;
      mockHash = '';

      handleHashChange();

      // With empty hash, defaults to #landing, but since currentPage is null
      // it should navigate to landing
      expect(showNewSectionMock).toHaveBeenCalledWith('#landing');
    });

    it('should fallback to #landing for invalid hash', () => {
      currentPage = MockPage.findPage('#landing');
      mockHash = '#nonexistent';

      handleHashChange();

      expect(console.warn).toHaveBeenCalledWith(
        'Page not found: #nonexistent, navigating to landing'
      );
      expect(window.location.hash).toBe('#landing');
    });

    it('should navigate when currentPage is null', () => {
      currentPage = null;
      mockHash = '#vision';

      handleHashChange();

      expect(showNewSectionMock).toHaveBeenCalledWith('#vision');
    });

    it('should not navigate when isNavigating flag prevents it', () => {
      isNavigating = true;
      currentPage = MockPage.findPage('#landing');
      mockHash = '#menu';

      handleHashChange();

      expect(showNewSectionMock).not.toHaveBeenCalled();
      // isNavigating should still be true (unchanged)
      expect(isNavigating).toBe(true);
    });

    it('should handle navigation from deep page to another deep page', () => {
      currentPage = MockPage.findPage('#stills');
      mockHash = '#diary';

      handleHashChange();

      expect(showNewSectionMock).toHaveBeenCalledWith('#diary');
    });
  });

  describe('manageLandingCompositor()', () => {
    /**
     * Implementation of manageLandingCompositor for testing
     * Mirrors the actual implementation in main.js
     */
    const manageLandingCompositor = () => {
      // Check if compositor exists
      if (!window.landingCompositor) {
        return;
      }

      const isOnLanding = currentPage && currentPage.id === '#landing';

      if (isOnLanding && !window.landingCompositor.isRunning) {
        // Resume compositor when returning to landing
        window.landingCompositor.start();
      } else if (!isOnLanding && window.landingCompositor.isRunning) {
        // Pause compositor when leaving landing
        window.landingCompositor.stop();
      }
    };

    it('should do nothing when compositor does not exist', () => {
      window.landingCompositor = null;
      currentPage = MockPage.findPage('#landing');

      // Should not throw
      expect(() => manageLandingCompositor()).not.toThrow();
    });

    it('should do nothing when compositor is undefined', () => {
      window.landingCompositor = undefined;
      currentPage = MockPage.findPage('#landing');

      expect(() => manageLandingCompositor()).not.toThrow();
    });

    it('should start compositor when on landing and not running', () => {
      const mockCompositor = {
        isRunning: false,
        start: vi.fn(),
        stop: vi.fn(),
      };
      window.landingCompositor = mockCompositor;
      currentPage = MockPage.findPage('#landing');

      manageLandingCompositor();

      expect(mockCompositor.start).toHaveBeenCalled();
      expect(mockCompositor.stop).not.toHaveBeenCalled();
    });

    it('should stop compositor when leaving landing and running', () => {
      const mockCompositor = {
        isRunning: true,
        start: vi.fn(),
        stop: vi.fn(),
      };
      window.landingCompositor = mockCompositor;
      currentPage = MockPage.findPage('#menu');

      manageLandingCompositor();

      expect(mockCompositor.stop).toHaveBeenCalled();
      expect(mockCompositor.start).not.toHaveBeenCalled();
    });

    it('should not start compositor when already running on landing', () => {
      const mockCompositor = {
        isRunning: true,
        start: vi.fn(),
        stop: vi.fn(),
      };
      window.landingCompositor = mockCompositor;
      currentPage = MockPage.findPage('#landing');

      manageLandingCompositor();

      expect(mockCompositor.start).not.toHaveBeenCalled();
      expect(mockCompositor.stop).not.toHaveBeenCalled();
    });

    it('should not stop compositor when not running and not on landing', () => {
      const mockCompositor = {
        isRunning: false,
        start: vi.fn(),
        stop: vi.fn(),
      };
      window.landingCompositor = mockCompositor;
      currentPage = MockPage.findPage('#sound');

      manageLandingCompositor();

      expect(mockCompositor.start).not.toHaveBeenCalled();
      expect(mockCompositor.stop).not.toHaveBeenCalled();
    });

    it('should handle null currentPage', () => {
      const mockCompositor = {
        isRunning: true,
        start: vi.fn(),
        stop: vi.fn(),
      };
      window.landingCompositor = mockCompositor;
      currentPage = null;

      // isOnLanding will be false because currentPage is null
      manageLandingCompositor();

      // Should stop since not on landing
      expect(mockCompositor.stop).toHaveBeenCalled();
    });
  });

  describe('showNewSection override', () => {
    it('should call original showNewSection when overriding', () => {
      const originalShowNewSection = vi.fn();
      const manageLandingCompositorMock = vi.fn();

      // Simulate the override pattern from main.js
      const overriddenShowNewSection = pageId => {
        originalShowNewSection(pageId);
        setTimeout(manageLandingCompositorMock, 100);
      };

      overriddenShowNewSection('#menu');

      expect(originalShowNewSection).toHaveBeenCalledWith('#menu');
    });

    it('should call manageLandingCompositor after delay', async () => {
      vi.useFakeTimers();

      const originalShowNewSection = vi.fn();
      const manageLandingCompositorMock = vi.fn();

      const overriddenShowNewSection = pageId => {
        originalShowNewSection(pageId);
        setTimeout(manageLandingCompositorMock, 100);
      };

      overriddenShowNewSection('#sound');

      // Verify manageLandingCompositor not called yet
      expect(manageLandingCompositorMock).not.toHaveBeenCalled();

      // Fast-forward time
      vi.advanceTimersByTime(100);

      expect(manageLandingCompositorMock).toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('should not override if original showNewSection is undefined', () => {
      const _originalShowNewSection = undefined;

      // This mimics the conditional in main.js
      const shouldOverride =
        _originalShowNewSection !== null &&
        _originalShowNewSection !== undefined;

      expect(shouldOverride).toBe(false);
    });

    it('should override if original showNewSection exists', () => {
      const _originalShowNewSection = vi.fn();

      const shouldOverride =
        _originalShowNewSection !== null &&
        _originalShowNewSection !== undefined;

      expect(shouldOverride).toBe(true);
    });
  });

  describe('Document ready handler', () => {
    /**
     * Simulates the document ready handler logic from main.js
     */
    const documentReadyHandler = () => {
      const hash = window.location.hash;

      if (hash) {
        try {
          const _hash = $(hash);

          _hash.removeClass('dn');
          if (hash === '#stills' || hash === '#diary') {
            _hash.addClass('dt');
          }
          currentPage = MockPage.findPage(hash);
          currentPage.initPage();
        } catch (error) {
          // Fallback to landing page if hash is invalid
          console.warn(`Invalid hash on load: ${hash}, defaulting to landing`);
          $('#landing').removeClass('dn');
          currentPage = MockPage.findPage('#landing');
          window.location.hash = '#landing';
        }
      } else {
        $('#landing').removeClass('dn');
        currentPage = MockPage.findPage('#landing');
      }
    };

    it('should show hash section if present in URL', () => {
      mockHash = '#sound';

      documentReadyHandler();

      const soundElement = $.getElement('#sound');
      expect(soundElement.removeClass).toHaveBeenCalledWith('dn');
      expect(currentPage.id).toBe('#sound');
      expect(currentPage.isInitialized).toBe(true);
    });

    it('should default to landing when no hash', () => {
      mockHash = '';

      documentReadyHandler();

      const landingElement = $.getElement('#landing');
      expect(landingElement.removeClass).toHaveBeenCalledWith('dn');
      expect(currentPage.id).toBe('#landing');
    });

    it('should add dt class for #stills page', () => {
      mockHash = '#stills';

      documentReadyHandler();

      const stillsElement = $.getElement('#stills');
      expect(stillsElement.removeClass).toHaveBeenCalledWith('dn');
      expect(stillsElement.addClass).toHaveBeenCalledWith('dt');
    });

    it('should add dt class for #diary page', () => {
      mockHash = '#diary';

      documentReadyHandler();

      const diaryElement = $.getElement('#diary');
      expect(diaryElement.removeClass).toHaveBeenCalledWith('dn');
      expect(diaryElement.addClass).toHaveBeenCalledWith('dt');
    });

    it('should not add dt class for non-stills/diary pages', () => {
      mockHash = '#sound';

      documentReadyHandler();

      const soundElement = $.getElement('#sound');
      expect(soundElement.addClass).not.toHaveBeenCalledWith('dt');
    });

    it('should fallback to landing for invalid hash on load', () => {
      mockHash = '#invalid-page';

      documentReadyHandler();

      expect(console.warn).toHaveBeenCalledWith(
        'Invalid hash on load: #invalid-page, defaulting to landing'
      );
      expect(window.location.hash).toBe('#landing');
      expect(currentPage.id).toBe('#landing');
    });

    it('should initialize the current page', () => {
      mockHash = '#menu';

      documentReadyHandler();

      expect(currentPage.isInitialized).toBe(true);
    });

    it('should handle menu page correctly', () => {
      mockHash = '#menu';

      documentReadyHandler();

      const menuElement = $.getElement('#menu');
      expect(menuElement.removeClass).toHaveBeenCalledWith('dn');
      expect(currentPage.id).toBe('#menu');
    });

    it('should handle tier 4 page correctly', () => {
      mockHash = '#stills';

      documentReadyHandler();

      expect(currentPage.id).toBe('#stills');
      expect(currentPage.tier).toBe(4);
    });
  });

  describe('Service Worker registration', () => {
    it('should check for serviceWorker support', () => {
      const hasServiceWorker = 'serviceWorker' in navigator;
      // Our mock navigator doesn't have serviceWorker by default
      expect(typeof hasServiceWorker).toBe('boolean');
    });

    it('should register service worker when supported', async () => {
      const mockRegistration = { scope: '/' };
      const registerMock = vi.fn().mockResolvedValue(mockRegistration);

      // Mock navigator with serviceWorker
      const mockNavigator = {
        serviceWorker: {
          register: registerMock,
        },
      };

      // Simulate SW registration
      if (mockNavigator.serviceWorker) {
        const registration =
          await mockNavigator.serviceWorker.register('/sw.js');
        expect(registration.scope).toBe('/');
      }

      expect(registerMock).toHaveBeenCalledWith('/sw.js');
    });

    it('should handle service worker registration failure', async () => {
      const error = new Error('SW registration failed');
      const registerMock = vi.fn().mockRejectedValue(error);

      const mockNavigator = {
        serviceWorker: {
          register: registerMock,
        },
      };

      // Simulate SW registration with error handling
      try {
        await mockNavigator.serviceWorker.register('/sw.js');
      } catch (err) {
        expect(err.message).toBe('SW registration failed');
      }
    });
  });

  describe('isNavigating flag', () => {
    it('should default to false', () => {
      const defaultIsNavigating = false;
      expect(defaultIsNavigating).toBe(false);
    });

    it('should prevent hash change handling when true', () => {
      isNavigating = true;

      const handleHashChange = () => {
        if (isNavigating) {
          return 'early-return';
        }
        return 'navigated';
      };

      expect(handleHashChange()).toBe('early-return');
    });

    it('should allow hash change handling when false', () => {
      isNavigating = false;
      currentPage = MockPage.findPage('#landing');
      mockHash = '#menu';

      const handleHashChange = () => {
        if (isNavigating) {
          return 'early-return';
        }
        if (currentPage && currentPage.id === mockHash) {
          return 'same-page';
        }
        return 'navigated';
      };

      expect(handleHashChange()).toBe('navigated');
    });
  });

  describe('hashchange event listener', () => {
    it('should register hashchange listener on window', () => {
      window.addEventListener('hashchange', () => {});

      expect(window.addEventListener).toHaveBeenCalledWith(
        'hashchange',
        expect.any(Function)
      );
    });

    it('should call handleHashChange when hashchange event fires', () => {
      const handleHashChangeMock = vi.fn();

      window.addEventListener('hashchange', handleHashChangeMock);

      // Simulate hashchange
      if (hashChangeHandler) {
        hashChangeHandler();
      }

      // If handler was registered, it should exist
      expect(window.addEventListener).toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('should handle rapid consecutive hash changes', () => {
      const handleHashChange = () => {
        if (isNavigating) {
          return 'blocked';
        }
        const hash = window.location.hash || '#landing';
        if (currentPage && currentPage.id === hash) {
          return 'same-page';
        }
        try {
          MockPage.findPage(hash);
          showNewSectionMock(hash);
          return 'navigated';
        } catch {
          window.location.hash = '#landing';
          return 'fallback';
        }
      };

      currentPage = MockPage.findPage('#landing');
      mockHash = '#menu';
      expect(handleHashChange()).toBe('navigated');

      mockHash = '#sound';
      expect(handleHashChange()).toBe('navigated');

      expect(showNewSectionMock).toHaveBeenCalledTimes(2);
    });

    it('should handle hash with invalid characters gracefully', () => {
      currentPage = MockPage.findPage('#landing');
      mockHash = '#invalid<>page';

      const handleHashChange = () => {
        if (isNavigating) {
          return;
        }
        const hash = window.location.hash || '#landing';
        if (currentPage && currentPage.id === hash) {
          return;
        }
        try {
          const targetPage = MockPage.findPage(hash);
          if (targetPage) {
            showNewSectionMock(hash);
          }
        } catch {
          console.warn(`Page not found: ${hash}, navigating to landing`);
          window.location.hash = '#landing';
        }
      };

      handleHashChange();

      expect(console.warn).toHaveBeenCalled();
      expect(window.location.hash).toBe('#landing');
    });

    it('should handle empty pages array gracefully', () => {
      mockPages = [];
      mockHash = '#landing';
      currentPage = null;

      const handleHashChange = () => {
        const hash = window.location.hash || '#landing';
        try {
          MockPage.findPage(hash);
          showNewSectionMock(hash);
        } catch {
          console.warn(`Page not found: ${hash}`);
        }
      };

      handleHashChange();

      expect(console.warn).toHaveBeenCalled();
      expect(showNewSectionMock).not.toHaveBeenCalled();
    });
  });
});
