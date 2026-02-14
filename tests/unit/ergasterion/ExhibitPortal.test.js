/**
 * Unit tests for ExhibitPortal and ExhibitBridge
 *
 * Tests gallery rendering, exhibit lifecycle, bridge communication,
 * and graceful fallback behavior.
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Inline ExhibitBridge for testing
class ExhibitBridge {
  constructor(iframe, callbacks = {}) {
    this.iframe = iframe;
    this.callbacks = callbacks;
    this.isConnected = false;
    this._atmospherePaused = false;
    this._boundOnMessage = this._onMessage.bind(this);
    window.addEventListener('message', this._boundOnMessage);
  }

  sendReady() {
    if (this.iframe?.contentWindow) {
      this.iframe.contentWindow.postMessage(
        { type: 'PARENT_READY', source: 'etceter4' },
        '*'
      );
    }
  }

  pauseAtmosphere() {
    const core = window.livingPantheonCoreInstance;
    if (core?.isRunning) {
      core.stop();
      this._atmospherePaused = true;
    }
  }

  resumeAtmosphere() {
    if (this._atmospherePaused) {
      const core = window.livingPantheonCoreInstance;
      core?.start();
      this._atmospherePaused = false;
    }
  }

  _onMessage(event) {
    const data = event.data;
    if (!data || typeof data.type !== 'string') {
      return;
    }

    switch (data.type) {
      case 'EXHIBIT_LOADED':
        this.isConnected = true;
        this.callbacks.onLoaded?.();
        break;
      case 'EXHIBIT_ERROR':
        this.callbacks.onError?.(data.error);
        break;
      case 'CLOSE_EXHIBIT':
        this.callbacks.onClose?.();
        break;
    }
  }

  dispose() {
    window.removeEventListener('message', this._boundOnMessage);
    this.resumeAtmosphere();
    this.iframe = null;
    this.isConnected = false;
  }
}

// Inline ExhibitPortal for testing
class ExhibitPortal {
  constructor() {
    this.exhibits = [
      {
        id: 'audio-orb',
        title: 'Audio Orb',
        description: 'Real-time voice AI conversation',
        tech: 'Lit + Three.js + Gemini',
        color: '#00ffcc',
        icon: '\u{1F50A}',
        src: 'absorb-alchemize/audio-orb/dist/index.html',
      },
      {
        id: 'gemini-ink-studio',
        title: 'Gemini Ink Studio',
        description: 'AI voice-controlled digital painting',
        tech: 'React + LBM Physics + Gemini',
        color: '#ff6b9d',
        icon: '\u{1F3A8}',
        src: 'absorb-alchemize/gemini-ink-studio/dist/index.html',
      },
    ];

    this.currentExhibit = null;
    this.bridge = null;
    this.container = null;
    this.galleryEl = null;
    this.iframeContainer = null;
  }

  initialize(container) {
    this.container = container;

    this.galleryEl = document.createElement('div');
    this.galleryEl.className = 'exhibit-gallery';
    this.galleryEl.innerHTML = this.exhibits
      .map(ex => this._renderCard(ex))
      .join('');
    container.appendChild(this.galleryEl);

    this.iframeContainer = document.createElement('div');
    this.iframeContainer.className = 'exhibit-iframe-container dn';
    this.iframeContainer.innerHTML = `
      <div class="exhibit-iframe-header">
        <span id="exhibit-title"></span>
        <span id="exhibit-tech"></span>
        <button id="exhibit-back-btn">Back</button>
      </div>
      <div>
        <div id="exhibit-loading"></div>
        <iframe id="exhibit-iframe"></iframe>
      </div>
    `;
    container.appendChild(this.iframeContainer);

    this.galleryEl.addEventListener('click', e => {
      const card = e.target.closest('.exhibit-card');
      if (card) {
        this.launchExhibit(card.dataset.exhibitId);
      }
    });

    document
      .getElementById('exhibit-back-btn')
      ?.addEventListener('click', () => this.closeExhibit());
  }

  _renderCard(exhibit) {
    return `
      <div class="exhibit-card pointer" data-exhibit-id="${exhibit.id}"
           style="border-color: ${exhibit.color}">
        <h3 style="color: ${exhibit.color}">${exhibit.title}</h3>
        <p>${exhibit.description}</p>
        <p>${exhibit.tech}</p>
      </div>
    `;
  }

  launchExhibit(exhibitId) {
    const exhibit = this.exhibits.find(e => e.id === exhibitId);
    if (!exhibit) {
      return;
    }

    this.currentExhibit = exhibit;
    document.getElementById('exhibit-title').textContent = exhibit.title;
    document.getElementById('exhibit-tech').textContent = exhibit.tech;

    this.galleryEl.classList.add('dn');
    this.iframeContainer.classList.remove('dn');

    const iframe = document.getElementById('exhibit-iframe');
    if (!iframe) {
      return;
    }

    if (this.bridge) {
      this.bridge.dispose();
    }
    this.bridge = new ExhibitBridge(iframe, {
      onLoaded: () => {},
      onError: () => {},
      onClose: () => this.closeExhibit(),
    });

    iframe.src = exhibit.src;
  }

  closeExhibit() {
    const iframe = document.getElementById('exhibit-iframe');
    if (iframe) {
      iframe.src = 'about:blank';
    }

    if (this.bridge) {
      this.bridge.dispose();
      this.bridge = null;
    }

    this.currentExhibit = null;
    if (this.iframeContainer) {
      this.iframeContainer.classList.add('dn');
    }
    if (this.galleryEl) {
      this.galleryEl.classList.remove('dn');
    }
  }

  dispose() {
    this.closeExhibit();
    if (this.galleryEl) {
      this.galleryEl.remove();
    }
    if (this.iframeContainer) {
      this.iframeContainer.remove();
    }
  }
}

describe('ExhibitPortal', () => {
  let portal;
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'ergasterion-exhibit-portal';
    document.body.appendChild(container);
    portal = new ExhibitPortal();
  });

  afterEach(() => {
    portal.dispose();
    container.remove();
    vi.restoreAllMocks();
  });

  describe('Constructor', () => {
    it('should have exhibits array', () => {
      expect(portal.exhibits).toBeInstanceOf(Array);
      expect(portal.exhibits.length).toBeGreaterThan(0);
    });

    it('should have null initial state', () => {
      expect(portal.currentExhibit).toBeNull();
      expect(portal.bridge).toBeNull();
      expect(portal.container).toBeNull();
      expect(portal.galleryEl).toBeNull();
      expect(portal.iframeContainer).toBeNull();
    });

    it('should have exhibits with required fields', () => {
      portal.exhibits.forEach(exhibit => {
        expect(exhibit.id).toBeDefined();
        expect(exhibit.title).toBeDefined();
        expect(exhibit.description).toBeDefined();
        expect(exhibit.tech).toBeDefined();
        expect(exhibit.color).toBeDefined();
        expect(exhibit.src).toBeDefined();
      });
    });
  });

  describe('initialize()', () => {
    it('should set container reference', () => {
      portal.initialize(container);
      expect(portal.container).toBe(container);
    });

    it('should create gallery element with exhibit cards', () => {
      portal.initialize(container);
      expect(portal.galleryEl).not.toBeNull();
      expect(portal.galleryEl.classList.contains('exhibit-gallery')).toBe(true);

      const cards = portal.galleryEl.querySelectorAll('.exhibit-card');
      expect(cards.length).toBe(portal.exhibits.length);
    });

    it('should create iframe container in hidden state', () => {
      portal.initialize(container);
      expect(portal.iframeContainer).not.toBeNull();
      expect(portal.iframeContainer.classList.contains('dn')).toBe(true);
    });

    it('should render exhibit card with correct data attributes', () => {
      portal.initialize(container);
      const firstCard = portal.galleryEl.querySelector('.exhibit-card');
      expect(firstCard.dataset.exhibitId).toBe(portal.exhibits[0].id);
    });
  });

  describe('launchExhibit()', () => {
    beforeEach(() => {
      portal.initialize(container);
    });

    it('should set currentExhibit when launching', () => {
      portal.launchExhibit('audio-orb');
      expect(portal.currentExhibit).not.toBeNull();
      expect(portal.currentExhibit.id).toBe('audio-orb');
    });

    it('should hide gallery and show iframe container', () => {
      portal.launchExhibit('audio-orb');
      expect(portal.galleryEl.classList.contains('dn')).toBe(true);
      expect(portal.iframeContainer.classList.contains('dn')).toBe(false);
    });

    it('should set iframe src to exhibit src', () => {
      portal.launchExhibit('audio-orb');
      const iframe = document.getElementById('exhibit-iframe');
      expect(iframe.src).toContain('audio-orb');
    });

    it('should create a bridge', () => {
      portal.launchExhibit('audio-orb');
      expect(portal.bridge).not.toBeNull();
    });

    it('should do nothing for unknown exhibit ID', () => {
      portal.launchExhibit('nonexistent');
      expect(portal.currentExhibit).toBeNull();
    });

    it('should update title and tech display', () => {
      portal.launchExhibit('audio-orb');
      expect(document.getElementById('exhibit-title').textContent).toBe(
        'Audio Orb'
      );
      expect(document.getElementById('exhibit-tech').textContent).toContain(
        'Lit'
      );
    });
  });

  describe('closeExhibit()', () => {
    beforeEach(() => {
      portal.initialize(container);
      portal.launchExhibit('audio-orb');
    });

    it('should clear currentExhibit', () => {
      portal.closeExhibit();
      expect(portal.currentExhibit).toBeNull();
    });

    it('should show gallery and hide iframe container', () => {
      portal.closeExhibit();
      expect(portal.galleryEl.classList.contains('dn')).toBe(false);
      expect(portal.iframeContainer.classList.contains('dn')).toBe(true);
    });

    it('should dispose the bridge', () => {
      expect(portal.bridge).not.toBeNull();
      portal.closeExhibit();
      expect(portal.bridge).toBeNull();
    });

    it('should reset iframe src', () => {
      portal.closeExhibit();
      const iframe = document.getElementById('exhibit-iframe');
      expect(iframe.src).toContain('about:blank');
    });
  });

  describe('dispose()', () => {
    it('should remove gallery and iframe elements from DOM', () => {
      portal.initialize(container);
      portal.dispose();
      expect(container.querySelector('.exhibit-gallery')).toBeNull();
      expect(container.querySelector('.exhibit-iframe-container')).toBeNull();
    });

    it('should be safe to call on uninitialized portal', () => {
      expect(() => portal.dispose()).not.toThrow();
    });
  });
});

describe('ExhibitBridge', () => {
  let bridge;
  let mockIframe;

  beforeEach(() => {
    mockIframe = document.createElement('iframe');
    document.body.appendChild(mockIframe);
  });

  afterEach(() => {
    if (bridge) {
      bridge.dispose();
    }
    mockIframe.remove();
    vi.restoreAllMocks();
    delete window.livingPantheonCoreInstance;
  });

  describe('Constructor', () => {
    it('should store iframe reference', () => {
      bridge = new ExhibitBridge(mockIframe);
      expect(bridge.iframe).toBe(mockIframe);
    });

    it('should start as not connected', () => {
      bridge = new ExhibitBridge(mockIframe);
      expect(bridge.isConnected).toBe(false);
    });

    it('should register message listener', () => {
      const spy = vi.spyOn(window, 'addEventListener');
      bridge = new ExhibitBridge(mockIframe);
      expect(spy).toHaveBeenCalledWith('message', expect.any(Function));
    });
  });

  describe('Message handling', () => {
    it('should set isConnected on EXHIBIT_LOADED', () => {
      const onLoaded = vi.fn();
      bridge = new ExhibitBridge(mockIframe, { onLoaded });

      window.dispatchEvent(
        new MessageEvent('message', {
          data: { type: 'EXHIBIT_LOADED' },
        })
      );

      expect(bridge.isConnected).toBe(true);
      expect(onLoaded).toHaveBeenCalledTimes(1);
    });

    it('should call onError on EXHIBIT_ERROR', () => {
      const onError = vi.fn();
      bridge = new ExhibitBridge(mockIframe, { onError });

      window.dispatchEvent(
        new MessageEvent('message', {
          data: { type: 'EXHIBIT_ERROR', error: 'test error' },
        })
      );

      expect(onError).toHaveBeenCalledWith('test error');
    });

    it('should call onClose on CLOSE_EXHIBIT', () => {
      const onClose = vi.fn();
      bridge = new ExhibitBridge(mockIframe, { onClose });

      window.dispatchEvent(
        new MessageEvent('message', {
          data: { type: 'CLOSE_EXHIBIT' },
        })
      );

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should ignore messages without type', () => {
      const onLoaded = vi.fn();
      bridge = new ExhibitBridge(mockIframe, { onLoaded });

      window.dispatchEvent(
        new MessageEvent('message', { data: { foo: 'bar' } })
      );
      window.dispatchEvent(new MessageEvent('message', { data: null }));

      expect(onLoaded).not.toHaveBeenCalled();
    });
  });

  describe('Atmosphere management', () => {
    it('should pause atmosphere when core is running', () => {
      const stop = vi.fn();
      window.livingPantheonCoreInstance = {
        isRunning: true,
        stop,
        start: vi.fn(),
      };
      bridge = new ExhibitBridge(mockIframe);

      bridge.pauseAtmosphere();

      expect(stop).toHaveBeenCalledTimes(1);
      expect(bridge._atmospherePaused).toBe(true);
    });

    it('should not pause if core is not running', () => {
      window.livingPantheonCoreInstance = { isRunning: false, stop: vi.fn() };
      bridge = new ExhibitBridge(mockIframe);

      bridge.pauseAtmosphere();

      expect(bridge._atmospherePaused).toBe(false);
    });

    it('should resume atmosphere on dispose if paused', () => {
      const start = vi.fn();
      window.livingPantheonCoreInstance = {
        isRunning: true,
        stop: vi.fn(),
        start,
      };
      bridge = new ExhibitBridge(mockIframe);
      bridge.pauseAtmosphere();

      bridge.dispose();

      expect(start).toHaveBeenCalledTimes(1);
    });
  });

  describe('dispose()', () => {
    it('should remove message listener', () => {
      const spy = vi.spyOn(window, 'removeEventListener');
      bridge = new ExhibitBridge(mockIframe);

      bridge.dispose();

      expect(spy).toHaveBeenCalledWith('message', expect.any(Function));
    });

    it('should clear iframe reference and connection state', () => {
      bridge = new ExhibitBridge(mockIframe);
      bridge.isConnected = true;

      bridge.dispose();

      expect(bridge.iframe).toBeNull();
      expect(bridge.isConnected).toBe(false);
    });
  });
});
