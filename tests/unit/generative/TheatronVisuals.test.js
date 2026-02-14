/**
 * Unit tests for TheatronVisuals generative system
 *
 * Tests sketch selection, p5 guard, and destroy cleanup.
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Read the actual source file
const sourceCode = readFileSync(
  resolve(__dirname, '../../../js/generative/TheatronVisuals.js'),
  'utf-8'
);

const classCode = sourceCode
  .replace(/^'use strict';\s*/, '')
  .replace(/\/\/ eslint-disable-next-line no-unused-vars\n/, '');
// eslint-disable-next-line no-eval
const TheatronVisuals = eval(
  `(function() { ${classCode}; return TheatronVisuals; })()`
);

describe('TheatronVisuals', () => {
  let visuals;

  beforeEach(() => {
    visuals = new TheatronVisuals();
  });

  afterEach(() => {
    visuals.destroy();
    document.body.innerHTML = '';
    // Clean up any global p5 mock
    delete globalThis.p5;
  });

  describe('constructor', () => {
    it('initializes with default state', () => {
      expect(visuals.initialized).toBe(false);
      expect(visuals.activeInstance).toBeNull();
      expect(visuals.activeSketch).toBeNull();
      expect(visuals.container).toBeNull();
    });

    it('has color palette', () => {
      expect(visuals.palette.purple).toEqual([128, 0, 128]);
      expect(visuals.palette.violet).toEqual([199, 21, 133]);
      expect(visuals.palette.dark).toEqual([15, 15, 20]);
      expect(visuals.palette.accent).toEqual([200, 100, 255]);
    });
  });

  describe('_getSketchFunction', () => {
    it('returns a function for liveWaveform', () => {
      const fn = visuals._getSketchFunction('liveWaveform');
      expect(typeof fn).toBe('function');
    });

    it('returns a function for particleStorm', () => {
      const fn = visuals._getSketchFunction('particleStorm');
      expect(typeof fn).toBe('function');
    });

    it('returns a function for modularPatch', () => {
      const fn = visuals._getSketchFunction('modularPatch');
      expect(typeof fn).toBe('function');
    });

    it('returns a function for rehearsalGhost', () => {
      const fn = visuals._getSketchFunction('rehearsalGhost');
      expect(typeof fn).toBe('function');
    });

    it('returns null for unknown sketch name', () => {
      const fn = visuals._getSketchFunction('nonexistent');
      expect(fn).toBeNull();
    });
  });

  describe('initialize', () => {
    it('initializes with valid container', () => {
      document.body.innerHTML = `
        <div id="theatron">
          <div class="aspect-ratio--object"></div>
        </div>
      `;
      visuals.initialize('#theatron');
      expect(visuals.initialized).toBe(true);
      expect(visuals.container).not.toBeNull();
    });

    it('does not initialize without chamber element', () => {
      visuals.initialize('#nonexistent');
      expect(visuals.initialized).toBe(false);
    });

    it('does not initialize without aspect-ratio--object', () => {
      document.body.innerHTML = '<div id="theatron"></div>';
      visuals.initialize('#theatron');
      expect(visuals.initialized).toBe(false);
    });

    it('does not double-initialize', () => {
      document.body.innerHTML = `
        <div id="theatron">
          <div class="aspect-ratio--object"></div>
        </div>
      `;
      visuals.initialize('#theatron');
      const firstContainer = visuals.container;
      visuals.initialize('#theatron');
      expect(visuals.container).toBe(firstContainer);
    });
  });

  describe('loadSketch', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div id="theatron">
          <div class="aspect-ratio--object">
            <p>Select a performance to experience</p>
          </div>
        </div>
      `;
      visuals.initialize('#theatron');
    });

    it('shows fallback message when p5 is unavailable', () => {
      // p5 is not defined globally
      visuals.loadSketch('liveWaveform');
      expect(visuals.container.innerHTML).toContain('p5.js not available');
    });

    it('sets activeSketch name when p5 is available', () => {
      // Mock p5 constructor
      globalThis.p5 = class {
        constructor(fn, container) {
          fn(this);
        }
        remove() {}
      };

      // Need to re-eval with p5 available — or just test the state tracking
      visuals.loadSketch('particleStorm');
      expect(visuals.activeSketch).toBe('particleStorm');
    });

    it('clears container before loading', () => {
      globalThis.p5 = class {
        constructor(fn, container) {
          fn(this);
        }
        remove() {}
      };

      visuals.loadSketch('liveWaveform');
      // Original placeholder text should be gone
      expect(visuals.container.innerHTML).not.toContain('Select a performance');
    });

    it('adds theatron-sketch-active class', () => {
      globalThis.p5 = class {
        constructor(fn, container) {
          fn(this);
        }
        remove() {}
      };

      visuals.loadSketch('modularPatch');
      expect(
        visuals.container.classList.contains('theatron-sketch-active')
      ).toBe(true);
    });

    it('destroys previous sketch before loading new one', () => {
      const removeSpy = vi.fn();
      globalThis.p5 = class {
        constructor(fn, container) {
          this.remove = removeSpy;
          fn(this);
        }
        remove() {}
      };

      visuals.loadSketch('liveWaveform');
      visuals.activeInstance = { remove: removeSpy };
      visuals.loadSketch('particleStorm');
      expect(removeSpy).toHaveBeenCalled();
    });
  });

  describe('_destroyActiveSketch', () => {
    it('removes p5 instance', () => {
      const removeSpy = vi.fn();
      visuals.activeInstance = { remove: removeSpy };
      visuals.activeSketch = 'test';

      document.body.innerHTML = `
        <div id="theatron">
          <div class="aspect-ratio--object theatron-sketch-active"></div>
        </div>
      `;
      visuals.container = document.querySelector('.aspect-ratio--object');

      visuals._destroyActiveSketch();
      expect(removeSpy).toHaveBeenCalled();
      expect(visuals.activeInstance).toBeNull();
      expect(visuals.activeSketch).toBeNull();
      expect(
        visuals.container.classList.contains('theatron-sketch-active')
      ).toBe(false);
    });

    it('handles no active instance gracefully', () => {
      visuals.activeInstance = null;
      expect(() => visuals._destroyActiveSketch()).not.toThrow();
    });
  });

  describe('destroy', () => {
    it('cleans up all state', () => {
      document.body.innerHTML = `
        <div id="theatron">
          <div class="aspect-ratio--object"></div>
        </div>
      `;
      visuals.initialize('#theatron');
      visuals.destroy();

      expect(visuals.initialized).toBe(false);
      expect(visuals.activeInstance).toBeNull();
      expect(visuals.container).toBeNull();
    });
  });
});
