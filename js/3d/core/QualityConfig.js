/**
 * @file QualityConfig.js
 * @description Quality presets and adaptive quality configuration for ETCETER4 3D
 *
 * Performance Impact:
 * - Ultra: Full quality, targets 60fps on desktop GPU
 * - High: Reduced post-processing, targets 60fps on mobile GPU
 * - Medium: Lower resolution scale, targets 30fps on older mobile
 * - Low: Minimal effects, targets 30fps on low-end devices
 *
 * Typical performance improvements per level drop:
 * - Resolution scale: 15-25% GPU savings
 * - Particle reduction: 10-20% CPU/GPU savings
 * - Effect quality: 5-15% GPU savings
 * - LOD bias: 5-10% GPU savings
 */

'use strict';

/**
 * Quality preset definitions
 * @type {Object<string, QualityPreset>}
 */
const QualityPresets = {
  ultra: {
    name: 'Ultra',
    resolutionScale: 1.0,
    maxPixelRatio: 2.0,
    particleMultiplier: 1.0,
    lodBias: 0,
    shadowQuality: 'high',
    postProcessing: {
      enabled: true,
      bloomStrength: 0.5,
      bloomRadius: 0.5,
      bloomThreshold: 0.8,
    },
    antialias: true,
    maxLights: 8,
    textureQuality: 'high',
    geometryDetail: 'high',
  },

  high: {
    name: 'High',
    resolutionScale: 1.0,
    maxPixelRatio: 1.5,
    particleMultiplier: 0.75,
    lodBias: 5,
    shadowQuality: 'medium',
    postProcessing: {
      enabled: true,
      bloomStrength: 0.4,
      bloomRadius: 0.4,
      bloomThreshold: 0.85,
    },
    antialias: true,
    maxLights: 6,
    textureQuality: 'high',
    geometryDetail: 'high',
  },

  medium: {
    name: 'Medium',
    resolutionScale: 0.75,
    maxPixelRatio: 1.0,
    particleMultiplier: 0.5,
    lodBias: 10,
    shadowQuality: 'low',
    postProcessing: {
      enabled: true,
      bloomStrength: 0.3,
      bloomRadius: 0.3,
      bloomThreshold: 0.9,
    },
    antialias: false,
    maxLights: 4,
    textureQuality: 'medium',
    geometryDetail: 'medium',
  },

  low: {
    name: 'Low',
    resolutionScale: 0.5,
    maxPixelRatio: 1.0,
    particleMultiplier: 0.25,
    lodBias: 20,
    shadowQuality: 'off',
    postProcessing: {
      enabled: false,
      bloomStrength: 0,
      bloomRadius: 0,
      bloomThreshold: 1.0,
    },
    antialias: false,
    maxLights: 2,
    textureQuality: 'low',
    geometryDetail: 'low',
  },
};

/**
 * Adaptive quality configuration
 * @type {Object}
 */
const AdaptiveQualityConfig = {
  // Enable automatic quality adjustment
  enabled: true,

  // Target frame rate
  targetFPS: 60,

  // FPS threshold below which quality drops
  lowerThreshold: 45,

  // FPS threshold above which quality can increase
  upperThreshold: 58,

  // How many frames to sample before making decisions
  sampleFrames: 60,

  // Minimum time (ms) between quality changes
  cooldownTime: 3000,

  // How aggressive to drop quality (frames below threshold)
  aggressiveDropFrames: 30,

  // Quality level order (index for stepping)
  qualityOrder: ['low', 'medium', 'high', 'ultra'],

  // Initial quality level
  initialQuality: 'high',

  // Allow quality to increase automatically
  allowIncrease: true,

  // Maximum quality increases per session (prevents oscillation)
  maxIncreases: 3,
};

/**
 * Device detection for initial quality
 * @returns {string} Recommended initial quality preset
 */
function detectRecommendedQuality() {
  // Check for WebGL2 support and renderer info
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

  if (!gl) {
    return 'low';
  }

  // Check device pixel ratio as proxy for device capability
  const dpr = window.devicePixelRatio || 1;

  // Check for mobile device
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

  // Check for low memory indicator
  const lowMemory = navigator.deviceMemory && navigator.deviceMemory < 4;

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  // Determine quality
  if (prefersReducedMotion || lowMemory) {
    return 'low';
  }

  if (isMobile) {
    // Check if high-end mobile (high DPR typically means flagship)
    if (dpr >= 3) {
      return 'high';
    }
    return 'medium';
  }

  // Desktop with high DPR (retina/4K)
  if (dpr >= 2) {
    return 'high';
  }

  // Standard desktop
  return 'ultra';
}

/**
 * Get quality preset by name
 * @param {string} name - Preset name
 * @returns {Object} Quality preset configuration
 */
function getQualityPreset(name) {
  return QualityPresets[name] || QualityPresets.medium;
}

/**
 * Interpolate between two quality presets
 * @param {Object} preset1 - Lower quality preset
 * @param {Object} preset2 - Higher quality preset
 * @param {number} t - Interpolation factor (0-1)
 * @returns {Object} Interpolated preset
 */
function interpolatePresets(preset1, preset2, t) {
  return {
    name: t < 0.5 ? preset1.name : preset2.name,
    resolutionScale: lerp(preset1.resolutionScale, preset2.resolutionScale, t),
    maxPixelRatio: lerp(preset1.maxPixelRatio, preset2.maxPixelRatio, t),
    particleMultiplier: lerp(
      preset1.particleMultiplier,
      preset2.particleMultiplier,
      t
    ),
    lodBias: lerp(preset1.lodBias, preset2.lodBias, t),
    postProcessing: {
      enabled:
        t > 0.5
          ? preset2.postProcessing.enabled
          : preset1.postProcessing.enabled,
      bloomStrength: lerp(
        preset1.postProcessing.bloomStrength,
        preset2.postProcessing.bloomStrength,
        t
      ),
      bloomRadius: lerp(
        preset1.postProcessing.bloomRadius,
        preset2.postProcessing.bloomRadius,
        t
      ),
      bloomThreshold: lerp(
        preset1.postProcessing.bloomThreshold,
        preset2.postProcessing.bloomThreshold,
        t
      ),
    },
    antialias: t > 0.5 ? preset2.antialias : preset1.antialias,
    maxLights: Math.round(lerp(preset1.maxLights, preset2.maxLights, t)),
    textureQuality: t < 0.5 ? preset1.textureQuality : preset2.textureQuality,
    geometryDetail: t < 0.5 ? preset1.geometryDetail : preset2.geometryDetail,
  };
}

/**
 * Linear interpolation helper
 * @private
 */
function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Export for global scope
window.QualityPresets = QualityPresets;
window.AdaptiveQualityConfig = AdaptiveQualityConfig;
window.detectRecommendedQuality = detectRecommendedQuality;
window.getQualityPreset = getQualityPreset;
window.interpolatePresets = interpolatePresets;
