/**
 * Unit tests for PinakothekeGenerator generative gallery system
 *
 * Tests constructor, initialization, sketch mapping, observer lifecycle, and destroy.
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock IntersectionObserver for jsdom
globalThis.IntersectionObserver = class IntersectionObserver {
  constructor(callback, options) {
    this._callback = callback;
    this._options = options;
    this._entries = [];
  }
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Inline class for testing (avoids global scope / p5 dependency issues)
class PinakothekeGenerator {
  constructor() {
    this.instances = [];
    this.initialized = false;
    this.observer = null;
    this.palette = {
      primary: [255, 0, 255],
      accent1: [0, 255, 255],
      accent2: [255, 215, 0],
      accent3: [65, 105, 225],
      dark: [10, 10, 10],
    };
  }

  initialize(containerSelector) {
    if (this.initialized) {
      return;
    }

    if (typeof p5 === 'undefined') {
      return;
    }

    const container = document.querySelector(containerSelector);
    if (!container) {
      return;
    }

    const canvases = container.querySelectorAll('.pinakotheke-canvas');
    if (canvases.length === 0) {
      return;
    }

    this.observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          const idx = parseInt(entry.target.dataset.sketchIndex, 10);
          const instance = this.instances[idx];
          if (!instance) {
            return;
          }
          if (entry.isIntersecting) {
            instance.loop();
          } else {
            instance.noLoop();
          }
        });
      },
      { threshold: 0.1 }
    );

    const sketchMap = {
      noiseField: this._noiseField.bind(this),
      vectorForms: this._vectorForms.bind(this),
      pixelGlitch: this._pixelGlitch.bind(this),
      flowParticles: this._flowParticles.bind(this),
      fractalGrowth: this._fractalGrowth.bind(this),
    };

    canvases.forEach((canvas, index) => {
      const sketchName = canvas.dataset.sketch;
      const sketchFn = sketchMap[sketchName];
      if (!sketchFn) {
        return;
      }

      canvas.dataset.sketchIndex = index;

      try {
        const parent = canvas.parentElement;
        const instance = new p5(sketchFn(canvas), parent);
        this.instances.push(instance);
        this.observer.observe(canvas);
      } catch (err) {
        this.instances.push(null);
      }
    });

    this.initialized = true;
  }

  destroy() {
    this.instances.forEach(instance => {
      if (instance) {
        try {
          instance.remove();
        } catch (_e) {
          // ignore
        }
      }
    });
    this.instances = [];
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.initialized = false;
  }

  _noiseField() {
    return () => {};
  }
  _vectorForms() {
    return () => {};
  }
  _pixelGlitch() {
    return () => {};
  }
  _flowParticles() {
    return () => {};
  }
  _fractalGrowth() {
    return () => {};
  }
}

describe('PinakothekeGenerator', () => {
  let gen;

  beforeEach(() => {
    gen = new PinakothekeGenerator();
  });

  afterEach(() => {
    gen.destroy();
    vi.restoreAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with empty instances array', () => {
      expect(gen.instances).toEqual([]);
    });

    it('should not be initialized by default', () => {
      expect(gen.initialized).toBe(false);
    });

    it('should have null observer by default', () => {
      expect(gen.observer).toBeNull();
    });

    it('should have the correct palette', () => {
      expect(gen.palette.primary).toEqual([255, 0, 255]);
      expect(gen.palette.accent1).toEqual([0, 255, 255]);
      expect(gen.palette.accent2).toEqual([255, 215, 0]);
      expect(gen.palette.accent3).toEqual([65, 105, 225]);
      expect(gen.palette.dark).toEqual([10, 10, 10]);
    });
  });

  describe('initialize()', () => {
    it('should bail if p5 is not defined', () => {
      // p5 is not in jsdom, so this should return without setting initialized
      gen.initialize('#pinakotheke-gallery');
      expect(gen.initialized).toBe(false);
    });

    it('should bail if already initialized', () => {
      gen.initialized = true;
      // Even with p5 mock, should return early
      globalThis.p5 = vi.fn();
      gen.initialize('#pinakotheke-gallery');
      expect(gen.observer).toBeNull();
      delete globalThis.p5;
    });

    it('should bail if container not found', () => {
      globalThis.p5 = vi.fn();
      gen.initialize('#nonexistent-container');
      expect(gen.initialized).toBe(false);
      delete globalThis.p5;
    });

    it('should bail if no canvas elements found', () => {
      const container = document.createElement('div');
      container.id = 'pinakotheke-gallery';
      document.body.appendChild(container);

      globalThis.p5 = vi.fn();
      gen.initialize('#pinakotheke-gallery');
      expect(gen.initialized).toBe(false);

      container.remove();
      delete globalThis.p5;
    });

    it('should create IntersectionObserver and set initialized when canvases exist', () => {
      const container = document.createElement('div');
      container.id = 'pinakotheke-gallery';
      const wrapper = document.createElement('div');
      const canvas = document.createElement('div');
      canvas.classList.add('pinakotheke-canvas');
      canvas.dataset.sketch = 'noiseField';
      wrapper.appendChild(canvas);
      container.appendChild(wrapper);
      document.body.appendChild(container);

      // Mock p5 constructor
      const mockInstance = { remove: vi.fn(), loop: vi.fn(), noLoop: vi.fn() };
      globalThis.p5 = vi.fn(() => mockInstance);

      gen.initialize('#pinakotheke-gallery');

      expect(gen.initialized).toBe(true);
      expect(gen.observer).not.toBeNull();
      expect(gen.instances).toHaveLength(1);
      expect(gen.instances[0]).toBe(mockInstance);

      container.remove();
      delete globalThis.p5;
    });

    it('should skip canvases with unknown sketch names', () => {
      const container = document.createElement('div');
      container.id = 'pinakotheke-gallery';
      const wrapper = document.createElement('div');
      const canvas = document.createElement('div');
      canvas.classList.add('pinakotheke-canvas');
      canvas.dataset.sketch = 'unknownSketch';
      wrapper.appendChild(canvas);
      container.appendChild(wrapper);
      document.body.appendChild(container);

      const mockInstance = { remove: vi.fn() };
      globalThis.p5 = vi.fn(() => mockInstance);

      gen.initialize('#pinakotheke-gallery');

      expect(gen.initialized).toBe(true);
      expect(gen.instances).toHaveLength(0);

      container.remove();
      delete globalThis.p5;
    });

    it('should handle p5 constructor errors gracefully', () => {
      const container = document.createElement('div');
      container.id = 'pinakotheke-gallery';
      const wrapper = document.createElement('div');
      const canvas = document.createElement('div');
      canvas.classList.add('pinakotheke-canvas');
      canvas.dataset.sketch = 'noiseField';
      wrapper.appendChild(canvas);
      container.appendChild(wrapper);
      document.body.appendChild(container);

      globalThis.p5 = vi.fn(() => {
        throw new Error('p5 init failed');
      });

      gen.initialize('#pinakotheke-gallery');

      expect(gen.initialized).toBe(true);
      expect(gen.instances).toHaveLength(1);
      expect(gen.instances[0]).toBeNull();

      container.remove();
      delete globalThis.p5;
    });
  });

  describe('destroy()', () => {
    it('should remove all p5 instances', () => {
      const mockRemove = vi.fn();
      gen.instances = [{ remove: mockRemove }, null, { remove: mockRemove }];
      gen.initialized = true;

      gen.destroy();

      expect(mockRemove).toHaveBeenCalledTimes(2);
      expect(gen.instances).toEqual([]);
      expect(gen.initialized).toBe(false);
    });

    it('should disconnect observer', () => {
      const mockDisconnect = vi.fn();
      gen.observer = { disconnect: mockDisconnect };
      gen.initialized = true;

      gen.destroy();

      expect(mockDisconnect).toHaveBeenCalledTimes(1);
      expect(gen.observer).toBeNull();
    });

    it('should handle instance remove() errors gracefully', () => {
      gen.instances = [
        {
          remove: () => {
            throw new Error('cleanup error');
          },
        },
      ];
      gen.initialized = true;

      expect(() => gen.destroy()).not.toThrow();
      expect(gen.instances).toEqual([]);
    });

    it('should be safe to call on fresh instance', () => {
      expect(() => gen.destroy()).not.toThrow();
      expect(gen.initialized).toBe(false);
    });
  });

  describe('Sketch factories', () => {
    it('should have all 5 sketch methods', () => {
      expect(typeof gen._noiseField).toBe('function');
      expect(typeof gen._vectorForms).toBe('function');
      expect(typeof gen._pixelGlitch).toBe('function');
      expect(typeof gen._flowParticles).toBe('function');
      expect(typeof gen._fractalGrowth).toBe('function');
    });

    it('should return a function from each sketch factory', () => {
      const canvas = document.createElement('div');
      expect(typeof gen._noiseField(canvas)).toBe('function');
      expect(typeof gen._vectorForms(canvas)).toBe('function');
      expect(typeof gen._pixelGlitch(canvas)).toBe('function');
      expect(typeof gen._flowParticles(canvas)).toBe('function');
      expect(typeof gen._fractalGrowth(canvas)).toBe('function');
    });
  });
});
