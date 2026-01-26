/**
 * @file tests/unit/setup.js
 * @description Test setup and mocks for Vitest unit tests
 * Provides mocked Three.js and Tone.js objects for testing
 */

import { vi } from 'vitest';

// Mock THREE.js namespace
const mockVector3 = vi.fn().mockImplementation((x = 0, y = 0, z = 0) => ({
  x,
  y,
  z,
  clone: vi.fn().mockReturnThis(),
  add: vi.fn().mockReturnThis(),
  sub: vi.fn().mockReturnThis(),
  multiplyScalar: vi.fn().mockReturnThis(),
  normalize: vi.fn().mockReturnThis(),
  crossVectors: vi.fn().mockReturnThis(),
  lengthSq: vi.fn().mockReturnValue(0),
  set: vi.fn().mockReturnThis(),
}));

const mockVector2 = vi.fn().mockImplementation((x = 0, y = 0) => ({
  x,
  y,
  set: vi.fn().mockReturnThis(),
}));

const mockColor = vi.fn().mockImplementation(hex => ({
  r: 1,
  g: 1,
  b: 1,
  setHex: vi.fn().mockReturnThis(),
}));

const mockEuler = vi
  .fn()
  .mockImplementation((x = 0, y = 0, z = 0, order = 'XYZ') => ({
    x,
    y,
    z,
    order,
    setFromQuaternion: vi.fn().mockReturnThis(),
  }));

const mockQuaternion = vi.fn().mockImplementation(() => ({
  setFromEuler: vi.fn().mockReturnThis(),
}));

const mockClock = vi.fn().mockImplementation(() => ({
  start: vi.fn(),
  stop: vi.fn(),
  getDelta: vi.fn().mockReturnValue(0.016),
  getElapsedTime: vi.fn().mockReturnValue(0),
}));

const mockWebGLRenderer = vi.fn().mockImplementation(() => ({
  setSize: vi.fn(),
  setPixelRatio: vi.fn(),
  render: vi.fn(),
  dispose: vi.fn(),
  getSize: vi.fn().mockReturnValue({ x: 800, y: 600 }),
  setRenderTarget: vi.fn(),
  domElement: document.createElement('canvas'),
  outputColorSpace: '',
  toneMapping: 0,
  toneMappingExposure: 1,
}));

const mockScene = vi.fn().mockImplementation(() => ({
  add: vi.fn(),
  remove: vi.fn(),
  traverse: vi.fn(),
  background: null,
  fog: null,
}));

const mockPerspectiveCamera = vi
  .fn()
  .mockImplementation((fov, aspect, near, far) => ({
    fov,
    aspect,
    near,
    far,
    position: {
      x: 0,
      y: 0,
      z: 5,
      set: vi.fn(),
      add: vi.fn(),
      clone: vi.fn().mockReturnThis(),
    },
    quaternion: { setFromEuler: vi.fn() },
    updateProjectionMatrix: vi.fn(),
    getWorldDirection: vi.fn().mockImplementation(target => target),
  }));

const mockBufferGeometry = vi.fn().mockImplementation(() => ({
  setAttribute: vi.fn(),
  dispose: vi.fn(),
}));

const mockBufferAttribute = vi.fn().mockImplementation((array, itemSize) => ({
  array,
  itemSize,
}));

const mockMesh = vi.fn().mockImplementation((geometry, material) => ({
  geometry,
  material,
  position: { x: 0, y: 0, z: 0, set: vi.fn() },
  rotation: { x: 0, y: 0, z: 0 },
}));

const mockPoints = vi.fn().mockImplementation((geometry, material) => ({
  geometry,
  material,
  position: { x: 0, y: 0, z: 0, set: vi.fn() },
}));

const mockMaterial = {
  dispose: vi.fn(),
  color: { r: 1, g: 1, b: 1 },
};

// Create THREE mock namespace
global.THREE = {
  Vector3: mockVector3,
  Vector2: mockVector2,
  Color: mockColor,
  Euler: mockEuler,
  Quaternion: mockQuaternion,
  Clock: mockClock,
  WebGLRenderer: mockWebGLRenderer,
  Scene: mockScene,
  PerspectiveCamera: mockPerspectiveCamera,
  OrthographicCamera: vi.fn().mockImplementation(() => ({})),
  BufferGeometry: mockBufferGeometry,
  BufferAttribute: mockBufferAttribute,
  Mesh: mockMesh,
  Points: mockPoints,
  SphereGeometry: vi.fn().mockImplementation(() => ({ dispose: vi.fn() })),
  PlaneGeometry: vi.fn().mockImplementation(() => ({ dispose: vi.fn() })),
  BoxGeometry: vi.fn().mockImplementation(() => ({ dispose: vi.fn() })),
  MeshBasicMaterial: vi.fn().mockImplementation(() => ({ ...mockMaterial })),
  MeshStandardMaterial: vi.fn().mockImplementation(() => ({ ...mockMaterial })),
  PointsMaterial: vi.fn().mockImplementation(() => ({ ...mockMaterial })),
  ShaderMaterial: vi.fn().mockImplementation(() => ({ ...mockMaterial })),
  AmbientLight: vi.fn().mockImplementation(() => ({})),
  DirectionalLight: vi
    .fn()
    .mockImplementation(() => ({ position: { set: vi.fn() } })),
  PointLight: vi
    .fn()
    .mockImplementation(() => ({ position: { set: vi.fn() } })),
  Fog: vi.fn().mockImplementation((color, near, far) => ({ color, near, far })),
  FogExp2: vi.fn().mockImplementation((color, density) => ({ color, density })),
  WebGLRenderTarget: vi.fn().mockImplementation(() => ({
    texture: {},
    setSize: vi.fn(),
    dispose: vi.fn(),
  })),
  LinearFilter: 1,
  RGBAFormat: 1,
  SRGBColorSpace: 'srgb',
  ACESFilmicToneMapping: 4,
  AdditiveBlending: 2,
  DoubleSide: 2,
  MathUtils: {
    degToRad: deg => (deg * Math.PI) / 180,
    radToDeg: rad => (rad * 180) / Math.PI,
    clamp: (val, min, max) => Math.max(min, Math.min(max, val)),
  },
  // Post-processing classes (simple mocks)
  EffectComposer: vi.fn().mockImplementation(() => ({
    addPass: vi.fn(),
    render: vi.fn(),
    setSize: vi.fn(),
    dispose: vi.fn(),
  })),
  RenderPass: vi.fn().mockImplementation(() => ({
    enabled: true,
    render: vi.fn(),
  })),
  UnrealBloomPass: vi.fn().mockImplementation(() => ({
    enabled: true,
    strength: 0.5,
    threshold: 0.8,
    radius: 0.5,
    render: vi.fn(),
    dispose: vi.fn(),
  })),
};

// Mock Tone.js namespace
const mockTonePlayer = vi.fn().mockImplementation(() => ({
  start: vi.fn(),
  stop: vi.fn(),
  dispose: vi.fn(),
  connect: vi.fn().mockReturnThis(),
  toSeconds: vi.fn().mockReturnValue(0),
  loaded: Promise.resolve(),
}));

const mockToneGain = vi.fn().mockImplementation((value = 1) => ({
  gain: { value, setValueAtTime: vi.fn() },
  connect: vi.fn().mockReturnThis(),
  toDestination: vi.fn().mockReturnThis(),
  dispose: vi.fn(),
}));

const mockToneReverb = vi.fn().mockImplementation(() => ({
  wet: { value: 0.3, setValueAtTime: vi.fn() },
  connect: vi.fn().mockReturnThis(),
  dispose: vi.fn(),
}));

const mockToneFeedbackDelay = vi.fn().mockImplementation(() => ({
  connect: vi.fn().mockReturnThis(),
  dispose: vi.fn(),
}));

global.Tone = {
  Player: mockTonePlayer,
  Gain: mockToneGain,
  Reverb: mockToneReverb,
  FeedbackDelay: mockToneFeedbackDelay,
  start: vi.fn().mockResolvedValue(undefined),
  now: vi.fn().mockReturnValue(0),
};

// Mock global configuration
global.ETCETER4_CONFIG = {
  threeD: {
    weatherApiKey: '',
    astronomyApiId: '',
    astronomyApiSecret: '',
    ogodEnv: {
      camera: {
        fov: 75,
        near: 0.1,
        far: 1000,
        moveSpeed: 5.0,
        lookSpeed: 0.002,
      },
      fog: {
        enabled: true,
        near: 1,
        far: 50,
        density: 0.02,
      },
      postProcessing: {
        bloom: { enabled: true, strength: 0.5, threshold: 0.8, radius: 0.5 },
      },
      audio: {
        masterVolume: 0.8,
        stemBlendRadius: 15,
        reverbMix: 0.3,
        delayTime: 0.2,
      },
    },
  },
  ogodTracks: {
    1: {
      game: 'Animal Crossing',
      archetype: 'gradient-fog',
      palette: ['#6B4C7A', '#C45B8E', '#D98C4A', '#5A6B3D'],
    },
  },
};

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn(cb => setTimeout(cb, 16));
global.cancelAnimationFrame = vi.fn(id => clearTimeout(id));

// Mock navigator
global.navigator = {
  ...global.navigator,
  geolocation: {
    getCurrentPosition: vi.fn(success => {
      success({ coords: { latitude: 40.7128, longitude: -74.006 } });
    }),
  },
  maxTouchPoints: 0,
  vibrate: vi.fn(),
};

// Mock fetch
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: vi.fn().mockResolvedValue({}),
});

// Mock matchMedia
global.matchMedia = vi.fn().mockImplementation(query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

// Mock DeviceOrientationEvent
global.DeviceOrientationEvent = class DeviceOrientationEvent extends Event {
  static requestPermission = vi.fn().mockResolvedValue('granted');
};

// Export mocks for tests to use directly
export {
  mockVector3,
  mockVector2,
  mockColor,
  mockClock,
  mockWebGLRenderer,
  mockScene,
  mockPerspectiveCamera,
  mockTonePlayer,
  mockToneGain,
};
