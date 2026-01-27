/**
 * @file QualityConfig.test.js
 * @description Unit tests for QualityConfig quality presets and device detection
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import '../unit/setup.js';

// Import module by evaluating the source
const QualityConfigSource = await import(
  '../../js/3d/core/QualityConfig.js?raw'
).then(m => m.default);
eval(QualityConfigSource);

describe('QualityPresets', () => {
  describe('preset definitions', () => {
    it('should have all four quality presets defined', () => {
      expect(QualityPresets).toHaveProperty('ultra');
      expect(QualityPresets).toHaveProperty('high');
      expect(QualityPresets).toHaveProperty('medium');
      expect(QualityPresets).toHaveProperty('low');
    });

    it('should have correct resolution scales for each preset', () => {
      expect(QualityPresets.ultra.resolutionScale).toBe(1.0);
      expect(QualityPresets.high.resolutionScale).toBe(1.0);
      expect(QualityPresets.medium.resolutionScale).toBe(0.75);
      expect(QualityPresets.low.resolutionScale).toBe(0.5);
    });

    it('should have decreasing particle multipliers from ultra to low', () => {
      expect(QualityPresets.ultra.particleMultiplier).toBe(1.0);
      expect(QualityPresets.high.particleMultiplier).toBe(0.75);
      expect(QualityPresets.medium.particleMultiplier).toBe(0.5);
      expect(QualityPresets.low.particleMultiplier).toBe(0.25);
    });

    it('should have increasing LOD bias from ultra to low', () => {
      expect(QualityPresets.ultra.lodBias).toBe(0);
      expect(QualityPresets.high.lodBias).toBe(5);
      expect(QualityPresets.medium.lodBias).toBe(10);
      expect(QualityPresets.low.lodBias).toBe(20);
    });

    it('should disable post-processing on low preset', () => {
      expect(QualityPresets.ultra.postProcessing.enabled).toBe(true);
      expect(QualityPresets.high.postProcessing.enabled).toBe(true);
      expect(QualityPresets.medium.postProcessing.enabled).toBe(true);
      expect(QualityPresets.low.postProcessing.enabled).toBe(false);
    });

    it('should have antialias enabled only on ultra and high', () => {
      expect(QualityPresets.ultra.antialias).toBe(true);
      expect(QualityPresets.high.antialias).toBe(true);
      expect(QualityPresets.medium.antialias).toBe(false);
      expect(QualityPresets.low.antialias).toBe(false);
    });

    it('should have decreasing max lights from ultra to low', () => {
      expect(QualityPresets.ultra.maxLights).toBe(8);
      expect(QualityPresets.high.maxLights).toBe(6);
      expect(QualityPresets.medium.maxLights).toBe(4);
      expect(QualityPresets.low.maxLights).toBe(2);
    });
  });

  describe('bloom settings', () => {
    it('should have bloom strength decrease from ultra to low', () => {
      expect(QualityPresets.ultra.postProcessing.bloomStrength).toBe(0.5);
      expect(QualityPresets.high.postProcessing.bloomStrength).toBe(0.4);
      expect(QualityPresets.medium.postProcessing.bloomStrength).toBe(0.3);
      expect(QualityPresets.low.postProcessing.bloomStrength).toBe(0);
    });

    it('should have bloom threshold increase from ultra to low', () => {
      expect(QualityPresets.ultra.postProcessing.bloomThreshold).toBe(0.8);
      expect(QualityPresets.high.postProcessing.bloomThreshold).toBe(0.85);
      expect(QualityPresets.medium.postProcessing.bloomThreshold).toBe(0.9);
      expect(QualityPresets.low.postProcessing.bloomThreshold).toBe(1.0);
    });
  });
});

describe('AdaptiveQualityConfig', () => {
  it('should have adaptive quality enabled by default', () => {
    expect(AdaptiveQualityConfig.enabled).toBe(true);
  });

  it('should target 60 FPS', () => {
    expect(AdaptiveQualityConfig.targetFPS).toBe(60);
  });

  it('should have threshold below target for quality drop', () => {
    expect(AdaptiveQualityConfig.lowerThreshold).toBeLessThan(
      AdaptiveQualityConfig.targetFPS
    );
    expect(AdaptiveQualityConfig.lowerThreshold).toBe(45);
  });

  it('should have threshold near target for quality increase', () => {
    expect(AdaptiveQualityConfig.upperThreshold).toBeLessThan(
      AdaptiveQualityConfig.targetFPS
    );
    expect(AdaptiveQualityConfig.upperThreshold).toBe(58);
  });

  it('should have quality order from low to ultra', () => {
    expect(AdaptiveQualityConfig.qualityOrder).toEqual([
      'low',
      'medium',
      'high',
      'ultra',
    ]);
  });

  it('should start at high quality by default', () => {
    expect(AdaptiveQualityConfig.initialQuality).toBe('high');
  });

  it('should have cooldown between quality changes', () => {
    expect(AdaptiveQualityConfig.cooldownTime).toBeGreaterThan(0);
    expect(AdaptiveQualityConfig.cooldownTime).toBe(3000);
  });

  it('should limit quality increases per session', () => {
    expect(AdaptiveQualityConfig.maxIncreases).toBe(3);
  });
});

describe('getQualityPreset', () => {
  it('should return preset by name', () => {
    const ultra = getQualityPreset('ultra');
    expect(ultra.name).toBe('Ultra');
    expect(ultra.resolutionScale).toBe(1.0);
  });

  it('should return medium as fallback for invalid name', () => {
    const invalid = getQualityPreset('invalid');
    expect(invalid.name).toBe('Medium');
  });

  it('should return medium as fallback for undefined', () => {
    const undef = getQualityPreset(undefined);
    expect(undef.name).toBe('Medium');
  });
});

describe('detectRecommendedQuality', () => {
  let originalCreateElement;
  let originalMatchMedia;
  let originalNavigator;

  beforeEach(() => {
    originalCreateElement = document.createElement;
    originalMatchMedia = window.matchMedia;
    originalNavigator = global.navigator;

    // Reset mocks
    document.createElement = vi.fn().mockReturnValue({
      getContext: vi.fn().mockReturnValue({}),
    });

    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
    });

    window.devicePixelRatio = 1;

    global.navigator = {
      userAgent: 'Mozilla/5.0 Chrome',
      deviceMemory: 8,
    };
  });

  afterEach(() => {
    document.createElement = originalCreateElement;
    window.matchMedia = originalMatchMedia;
    global.navigator = originalNavigator;
  });

  it('should return low when WebGL is not supported', () => {
    document.createElement = vi.fn().mockReturnValue({
      getContext: vi.fn().mockReturnValue(null),
    });

    const quality = detectRecommendedQuality();
    expect(quality).toBe('low');
  });

  it('should return low when reduced motion is preferred', () => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
    });

    const quality = detectRecommendedQuality();
    expect(quality).toBe('low');
  });

  it('should return low when device has low memory', () => {
    global.navigator = {
      ...global.navigator,
      deviceMemory: 2,
    };

    const quality = detectRecommendedQuality();
    expect(quality).toBe('low');
  });

  it('should return medium for mobile devices', () => {
    global.navigator = {
      ...global.navigator,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)',
    };
    window.devicePixelRatio = 2;

    const quality = detectRecommendedQuality();
    expect(quality).toBe('medium');
  });

  it('should return high for high-end mobile (high DPR)', () => {
    global.navigator = {
      ...global.navigator,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)',
    };
    window.devicePixelRatio = 3;

    const quality = detectRecommendedQuality();
    expect(quality).toBe('high');
  });

  it('should return high for desktop with retina display', () => {
    window.devicePixelRatio = 2;

    const quality = detectRecommendedQuality();
    expect(quality).toBe('high');
  });

  it('should return ultra for standard desktop', () => {
    window.devicePixelRatio = 1;

    const quality = detectRecommendedQuality();
    expect(quality).toBe('ultra');
  });
});

describe('interpolatePresets', () => {
  it('should return first preset values at t=0', () => {
    const result = interpolatePresets(QualityPresets.low, QualityPresets.ultra, 0);
    expect(result.resolutionScale).toBe(0.5);
    expect(result.particleMultiplier).toBe(0.25);
    expect(result.name).toBe('Low');
  });

  it('should return second preset values at t=1', () => {
    const result = interpolatePresets(QualityPresets.low, QualityPresets.ultra, 1);
    expect(result.resolutionScale).toBe(1.0);
    expect(result.particleMultiplier).toBe(1.0);
    expect(result.name).toBe('Ultra');
  });

  it('should interpolate numeric values at t=0.5', () => {
    const result = interpolatePresets(
      QualityPresets.low,
      QualityPresets.ultra,
      0.5
    );
    expect(result.resolutionScale).toBe(0.75);
    expect(result.particleMultiplier).toBe(0.625);
    expect(result.lodBias).toBe(10);
  });

  it('should switch boolean and discrete values at t=0.5', () => {
    const result = interpolatePresets(
      QualityPresets.low,
      QualityPresets.ultra,
      0.5
    );
    // At t=0.5, uses first preset for booleans (t > 0.5 is false)
    expect(result.antialias).toBe(false);
    expect(result.postProcessing.enabled).toBe(false);
  });

  it('should interpolate bloom settings', () => {
    const result = interpolatePresets(
      QualityPresets.low,
      QualityPresets.ultra,
      0.5
    );
    expect(result.postProcessing.bloomStrength).toBe(0.25);
    expect(result.postProcessing.bloomRadius).toBe(0.25);
  });

  it('should round maxLights to integer', () => {
    const result = interpolatePresets(
      QualityPresets.low,
      QualityPresets.ultra,
      0.5
    );
    expect(Number.isInteger(result.maxLights)).toBe(true);
    expect(result.maxLights).toBe(5);
  });
});
