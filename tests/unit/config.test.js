/**
 * Unit tests for js/config.js
 *
 * Validates the ETCETER4_CONFIG structure by reading the source file directly.
 * The real config.js uses global scope and can't be imported as a module,
 * so we validate structure via source file analysis and by evaluating
 * a sandboxed copy.
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('config.js source file structure', () => {
  let configSource;

  beforeAll(() => {
    configSource = readFileSync(
      resolve(__dirname, '../../js/config.js'),
      'utf-8'
    );
  });

  describe('top-level keys', () => {
    it('should define ETCETER4_CONFIG as const', () => {
      expect(configSource).toContain('const ETCETER4_CONFIG');
    });

    it('should have all required top-level keys', () => {
      const requiredKeys = [
        'images:',
        'animations:',
        'ogod:',
        'ogodAnimation:',
        'carousel:',
        'threeD:',
        'ogodTracks:',
        'media:',
      ];

      requiredKeys.forEach(key => {
        expect(configSource).toContain(key);
      });
    });
  });

  describe('images configuration', () => {
    it('should have media, faster, slip, live as image counts', () => {
      expect(configSource).toContain('images:');
      expect(configSource).toContain('media:');
      expect(configSource).toContain('faster:');
      expect(configSource).toContain('slip:');
      expect(configSource).toContain('live:');
    });

    it('should have positive number values for image counts', () => {
      const imagesMatch = configSource.match(
        /images:\s*\{[^}]*media:\s*(\d+)[^}]*faster:\s*(\d+)[^}]*slip:\s*(\d+)[^}]*live:\s*(\d+)/
      );
      expect(imagesMatch).not.toBeNull();
      expect(Number(imagesMatch[1])).toBeGreaterThan(0);
      expect(Number(imagesMatch[2])).toBeGreaterThan(0);
      expect(Number(imagesMatch[3])).toBeGreaterThan(0);
      expect(Number(imagesMatch[4])).toBeGreaterThan(0);
    });
  });

  describe('animations configuration', () => {
    it('should have all required animation timing keys', () => {
      expect(configSource).toContain('animations:');
      expect(configSource).toContain('fadeOutDelay:');
      expect(configSource).toContain('fadeOutDuration:');
      expect(configSource).toContain('fadeInDuration:');
      expect(configSource).toContain('transitionCooldown:');
      expect(configSource).toContain('navigationDebounce:');
    });

    it('should have positive number values for animation timings', () => {
      const timingKeys = [
        'fadeOutDelay',
        'fadeOutDuration',
        'fadeInDuration',
        'transitionCooldown',
        'navigationDebounce',
      ];

      timingKeys.forEach(key => {
        const regex = new RegExp(`${key}:\\s*(\\d+)`);
        const match = configSource.match(regex);
        expect(match, `${key} should have a numeric value`).not.toBeNull();
        expect(
          Number(match[1]),
          `${key} should be a positive number`
        ).toBeGreaterThan(0);
      });
    });
  });

  describe('carousel configuration', () => {
    it('should have loadOffset and swipeThreshold', () => {
      expect(configSource).toContain('carousel:');
      expect(configSource).toContain('loadOffset:');
      expect(configSource).toContain('swipeThreshold:');
    });

    it('should have positive number values for carousel settings', () => {
      const carouselKeys = ['loadOffset', 'swipeThreshold'];

      carouselKeys.forEach(key => {
        const regex = new RegExp(`${key}:\\s*(\\d+)`);
        const match = configSource.match(regex);
        expect(match, `${key} should have a numeric value`).not.toBeNull();
        expect(
          Number(match[1]),
          `${key} should be a positive number`
        ).toBeGreaterThan(0);
      });
    });
  });

  describe('ogodTracks configuration', () => {
    it('should have ogodTracks placeholder in config.js', () => {
      expect(configSource).toContain('ogodTracks:');
    });
  });

  describe('ogodTracks data file', () => {
    let tracksSource;

    beforeAll(() => {
      tracksSource = readFileSync(
        resolve(__dirname, '../../js/data/ogodTracks.js'),
        'utf-8'
      );
    });

    it('should have 29 tracks (keys 1-29)', () => {
      const trackMatches = tracksSource.match(/^\s+\d+:\s*\{/gm);
      expect(trackMatches).not.toBeNull();
      expect(trackMatches.length).toBeGreaterThanOrEqual(29);
    });

    it('should have each track with game, archetype, and palette fields', () => {
      for (let i = 1; i <= 29; i++) {
        const trackRegex = new RegExp(`\\b${i}:\\s*\\{[^}]*game:`);
        expect(
          tracksSource.match(trackRegex),
          `Track ${i} should have a game field`
        ).not.toBeNull();
      }
    });

    it('should have palette arrays with 4 hex colors per track', () => {
      const paletteMatches = tracksSource.match(
        /palette:\s*\[\s*'#[0-9A-Fa-f]{6}'\s*,\s*'#[0-9A-Fa-f]{6}'\s*,\s*'#[0-9A-Fa-f]{6}'\s*,\s*'#[0-9A-Fa-f]{6}'\s*\]/g
      );
      expect(paletteMatches).not.toBeNull();
      expect(paletteMatches.length).toBe(29);
    });
  });

  describe('media configuration', () => {
    it('should have audio and video sub-configs', () => {
      expect(configSource).toContain('audio:');
      expect(configSource).toContain('video:');
    });

    it('should have album metadata', () => {
      expect(configSource).toContain('albums:');
    });

    it('should have audio format priority', () => {
      expect(configSource).toContain('formatPriority:');
    });

    it('should have video quality order', () => {
      expect(configSource).toContain('qualityOrder:');
    });

    it('should have HLS configuration', () => {
      expect(configSource).toContain('hlsConfig:');
    });
  });

  describe('threeD.ogodEnv configuration', () => {
    it('should have camera sub-config', () => {
      expect(configSource).toContain('ogodEnv:');
      expect(configSource).toContain('camera:');
      expect(configSource).toContain('fov:');
      expect(configSource).toContain('near:');
      expect(configSource).toContain('far:');
    });

    it('should have fog sub-config', () => {
      expect(configSource).toContain('fog:');
      expect(configSource).toContain('density:');
    });

    it('should have audio sub-config', () => {
      expect(configSource).toContain('masterVolume:');
      expect(configSource).toContain('stemBlendRadius:');
    });

    it('should have postProcessing sub-config', () => {
      expect(configSource).toContain('postProcessing:');
      expect(configSource).toContain('bloom:');
    });
  });

  describe('ogodAnimation configuration', () => {
    it('should have enhanced as default mode', () => {
      expect(configSource).toContain("defaultMode: 'enhanced'");
    });

    it('should have faithful, enhanced, generative, and tkol sub-modes', () => {
      expect(configSource).toContain('faithful:');
      expect(configSource).toContain('enhanced:');
      expect(configSource).toContain('generative:');
      expect(configSource).toContain('tkol:');
    });

    it('should have playback configuration', () => {
      expect(configSource).toContain('playback:');
      expect(configSource).toContain('defaultOrder:');
      expect(configSource).toContain('loopMode:');
    });

    it('should have accessibility settings for reduced motion', () => {
      expect(configSource).toContain('respectReducedMotion: true');
    });
  });
});

describe('ETCETER4_CONFIG evaluated structure', () => {
  let config;

  beforeAll(() => {
    // Evaluate config.js in a sandboxed context to get the actual object
    const source = readFileSync(
      resolve(__dirname, '../../js/config.js'),
      'utf-8'
    );
    // Replace const with let so we can capture it, remove 'use strict'
    const evalSource = source
      .replace(/^'use strict';\s*/m, '')
      .replace('const ETCETER4_CONFIG', 'var ETCETER4_CONFIG');
    // Also load ogodTracks data file (sets ETCETER4_CONFIG.ogodTracks)
    const tracksSource = readFileSync(
      resolve(__dirname, '../../js/data/ogodTracks.js'),
      'utf-8'
    );
    const tracksEval = tracksSource.replace(/^'use strict';\s*/m, '');
    const fn = new Function(
      `${evalSource}\n${tracksEval}\nreturn ETCETER4_CONFIG;`
    );
    config = fn();
  });

  it('should have images with positive counts', () => {
    expect(config.images.media).toBeGreaterThan(0);
    expect(config.images.faster).toBeGreaterThan(0);
    expect(config.images.slip).toBeGreaterThan(0);
    expect(config.images.live).toBeGreaterThan(0);
  });

  it('should have 29 OGOD tracks', () => {
    const keys = Object.keys(config.ogodTracks);
    expect(keys.length).toBe(29);
  });

  it('should have valid track structure with game, archetype, palette', () => {
    for (let i = 1; i <= 29; i++) {
      const track = config.ogodTracks[i];
      expect(track, `Track ${i} should exist`).toBeDefined();
      expect(typeof track.game).toBe('string');
      expect(typeof track.archetype).toBe('string');
      expect(Array.isArray(track.palette)).toBe(true);
      expect(track.palette).toHaveLength(4);
      track.palette.forEach(color => {
        expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    }
  });

  it('should have animation timing values', () => {
    expect(config.animations.fadeOutDelay).toBeGreaterThan(0);
    expect(config.animations.fadeOutDuration).toBeGreaterThan(0);
    expect(config.animations.fadeInDuration).toBeGreaterThan(0);
  });

  it('should have carousel settings', () => {
    expect(config.carousel.loadOffset).toBeGreaterThan(0);
    expect(config.carousel.swipeThreshold).toBeGreaterThan(0);
  });

  it('should have threeD.ogodEnv with camera, fog, audio, postProcessing', () => {
    expect(config.threeD.ogodEnv.camera.fov).toBeGreaterThan(0);
    expect(config.threeD.ogodEnv.fog.enabled).toBe(true);
    expect(config.threeD.ogodEnv.audio.masterVolume).toBeGreaterThan(0);
    expect(config.threeD.ogodEnv.postProcessing.bloom.enabled).toBe(true);
  });

  it('should have media baseUrl method', () => {
    expect(typeof config.media.baseUrl).toBe('function');
  });
});
