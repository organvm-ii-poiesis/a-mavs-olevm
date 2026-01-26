# ETCETER4 3D System Documentation

This document provides comprehensive documentation for the 3D immersive audio-visual experience system used in ETCETER4.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Environment Creation Guide](#environment-creation-guide)
3. [Audio Integration Guide](#audio-integration-guide)
4. [Performance Tuning Guide](#performance-tuning-guide)
5. [API Reference](#api-reference)

---

## Architecture Overview

The 3D system is built on Three.js for rendering and Tone.js for audio, designed to create immersive environments that respond to user navigation and environmental data.

### System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        ogod-3d.html                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐     ┌──────────────────┐                  │
│  │  OGODSceneManager│────▶│   SceneManager   │                  │
│  │                 │     │  (Three.js core) │                  │
│  └────────┬────────┘     └────────┬─────────┘                  │
│           │                       │                             │
│           │                       ▼                             │
│           │              ┌──────────────────┐                  │
│           │              │ WebGLRenderer    │                  │
│           │              │ Scene, Camera    │                  │
│           │              │ Post-processing  │                  │
│           │              └──────────────────┘                  │
│           │                                                     │
│           ▼                                                     │
│  ┌─────────────────┐     ┌──────────────────┐                  │
│  │  Environment    │     │ FirstPerson      │                  │
│  │  (archetype)    │     │ Controller       │                  │
│  │  - GradientFog  │     │ - Keyboard       │                  │
│  │  - StripeBar    │     │ - Mouse          │                  │
│  │  - BokehGrid    │     │ - Touch          │                  │
│  │  - etc...       │     │ - Gyroscope      │                  │
│  └─────────────────┘     └────────┬─────────┘                  │
│                                   │                             │
│                                   ▼                             │
│                          ┌──────────────────┐                  │
│                          │  OGODAudioEngine │                  │
│                          │  (Tone.js)       │                  │
│                          │  - Stems         │                  │
│                          │  - Effects       │                  │
│                          │  - Position mix  │                  │
│                          └──────────────────┘                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Core Components

#### SceneManager (`js/3d/core/SceneManager.js`)

The base Three.js lifecycle manager that handles:
- WebGL renderer setup with optimized settings
- Scene and camera management
- Animation loop with delta time
- Post-processing (bloom effect)
- Window resize handling
- Resource disposal

#### OGODSceneManager (`js/3d/ogod/OGODSceneManager.js`)

OGOD-specific scene manager that extends SceneManager functionality:
- Track configuration loading
- Environment archetype selection
- Color zones for audio mapping
- First-person controller integration
- Audio engine connection

#### EnvironmentBase (`js/3d/ogod/environments/EnvironmentBase.js`)

Abstract base class for all environment archetypes providing:
- Color palette conversion
- Object lifecycle management
- Particle system creation
- Ground plane generation
- Animation callback registration

#### FirstPersonController (`js/3d/ogod/controls/FirstPersonController.js`)

Cross-platform camera controls supporting:
- WASD/Arrow key movement
- Mouse look (pointer lock)
- Touch drag to look
- Virtual joystick for mobile movement
- Device orientation (gyroscope)
- Swipe gestures for navigation

#### OGODAudioEngine (`js/3d/ogod/OGODAudioEngine.js`)

Audio system using Tone.js for:
- Multi-stem audio playback (drums, bass, vocals, other)
- Position-based stem volume mixing
- Effect chains (reverb, delay)
- Smooth volume transitions
- Fallback to single file playback

---

## Environment Creation Guide

### Creating a New Environment Archetype

1. **Create the environment class file**

```javascript
// js/3d/ogod/environments/MyNewEnv.js

'use strict';

/**
 * MyNewEnvironment - Description of the environment
 * @class
 * @extends EnvironmentBase
 */
class MyNewEnvironment extends EnvironmentBase {
  /**
   * @param {Object} options
   * @param {SceneManager} options.sceneManager
   * @param {Array<string>} options.palette
   */
  constructor(options) {
    super(options);

    // Environment-specific configuration
    this.particleCount = 5000;
    this.animationSpeed = 1.0;
  }

  /**
   * Initialize the environment
   * @returns {Promise<void>}
   */
  async initialize() {
    // Create objects
    this._createGround();
    this._createParticles();
    this._createLights();
    this._createColorZones();

    // Set up animation
    this._onAnimate((deltaTime, elapsedTime) => {
      this._animateParticles(deltaTime, elapsedTime);
    });

    this.isInitialized = true;
  }

  _createGround() {
    const ground = this._createGround({
      size: 200,
      color: this.colors[0],
      opacity: 0.3,
    });
    this._addObject(ground);
  }

  _createParticles() {
    const particles = this._createParticles({
      count: this.particleCount,
      color: this.colors[1],
      size: 0.1,
      spread: 100,
    });
    this._addObject(particles);
    this.particles = particles;
  }

  _createLights() {
    const ambient = this._createAmbientLight(0.5);
    this._addObject(ambient);
  }

  _createColorZones() {
    // Create visible color zones at cardinal positions
    const positions = [
      { x: -20, y: 5, z: 0 },
      { x: 20, y: 5, z: 0 },
      { x: 0, y: 5, z: -20 },
      { x: 0, y: 5, z: 20 },
    ];

    positions.forEach((pos, i) => {
      const zone = this._createColorZone(this.colors[i % this.colors.length], pos, 15);
      this._addObject(zone);
    });
  }

  _animateParticles(deltaTime, elapsedTime) {
    if (!this.particles) return;

    // Animate particle positions
    const positions = this.particles.geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      positions[i + 1] += Math.sin(elapsedTime + i) * 0.01;
    }
    this.particles.geometry.attributes.position.needsUpdate = true;
  }
}

// Export for global scope
window.MyNewEnvironment = MyNewEnvironment;
```

2. **Register the archetype in OGODSceneManager**

Add the case to the `_createEnvironment` switch statement:

```javascript
case 'my-new-env':
  this.environment = new MyNewEnvironment({
    sceneManager: this.sceneManager,
    palette,
  });
  break;
```

3. **Configure tracks to use the new archetype**

In `js/config.js`, add track configurations:

```javascript
ogodTracks: {
  30: {
    game: 'New Game',
    archetype: 'my-new-env',
    palette: ['#ff0000', '#00ff00', '#0000ff', '#ffff00'],
  },
}
```

4. **Add the script to ogod-3d.html**

```html
<script src="js/3d/ogod/environments/MyNewEnv.js"></script>
```

### Environment Archetype Reference

| Archetype | Description | Key Visual Elements |
|-----------|-------------|---------------------|
| `gradient-fog` | Volumetric color fog zones | FogExp2, colored planes, ambient particles |
| `stripe-bar` | Vertical parallax bars | Instanced bars, parallax movement |
| `bokeh-grid` | Neon glowing spheres | Point lights, sphere grid, bloom |
| `high-contrast` | Black/white shadow world | Harsh shadows, minimal color |
| `layered-colors` | Stacked transparent planes | Multiple semi-transparent layers |
| `glitch-digital` | RGB split, scanlines | Custom shaders, noise textures |

---

## Audio Integration Guide

### Setting Up Audio Stems

Audio stems are separated tracks that can be independently controlled:

1. **Directory structure**

```
assets/audio/stems/ogod/
├── 01/
│   ├── drums.mp3
│   ├── bass.mp3
│   ├── vocals.mp3
│   └── other.mp3
├── 02/
│   └── ...
└── ...
```

2. **Processing stems with the helper script**

```bash
# Process a source file into stems using Demucs
./scripts/process-stems.sh /path/to/track.mp3 01
```

3. **Fallback audio**

If stems are unavailable, the engine falls back to single-file playback from:

```
ogod/ogodtracks/01 I.mp3
```

### Position-Based Audio Mixing

The audio engine adjusts stem volumes based on the player's position relative to color zones:

```javascript
// OGODSceneManager._onPositionUpdate
_onPositionUpdate(position) {
  const stemVolumes = {};

  for (const zone of this.colorZones) {
    const distance = Math.sqrt(
      Math.pow(position.x - zone.position.x, 2) +
      Math.pow(position.z - zone.position.z, 2)
    );

    // Volume decreases with distance
    const volume = Math.max(0, 1 - distance / zone.radius);
    stemVolumes[zone.stem] = volume;
  }

  this.audioEngine.setStemVolumes(stemVolumes);
}
```

### Audio API Examples

```javascript
// Initialize audio engine
const audioEngine = new OGODAudioEngine({ trackNumber: 1 });
await audioEngine.initialize();

// Start playback (requires user interaction)
await audioEngine.start();

// Adjust volumes
audioEngine.setStemVolumes({
  drums: 0.8,
  bass: 1.0,
  vocals: 0.5,
  other: 0.3,
});

// Adjust master volume
audioEngine.setMasterVolume(0.7);

// Adjust reverb
audioEngine.setReverbMix(0.4);

// Get current stem volumes
const volumes = audioEngine.getStemVolumes();

// Stop and clean up
audioEngine.stop();
audioEngine.dispose();
```

---

## Performance Tuning Guide

### Target Performance Metrics

| Metric | Target | Acceptable | Poor |
|--------|--------|------------|------|
| FPS | 60+ | 30-59 | <30 |
| Frame Time | <16.67ms | 16.67-33ms | >33ms |
| P99 Frame Time | <25ms | 25-50ms | >50ms |
| Memory | <200MB | 200-500MB | >500MB |
| Memory Growth | <0.1MB/s | 0.1-0.5MB/s | >0.5MB/s |
| Draw Calls | <100 | 100-500 | >500 |

### Optimization Techniques

#### 1. Use Instance Rendering

For many similar objects, use InstancedMesh:

```javascript
const geometry = new THREE.SphereGeometry(0.5, 8, 8);
const material = new THREE.MeshBasicMaterial();
const mesh = new THREE.InstancedMesh(geometry, material, 1000);

// Set each instance's transform
const matrix = new THREE.Matrix4();
for (let i = 0; i < 1000; i++) {
  matrix.setPosition(Math.random() * 100, 0, Math.random() * 100);
  mesh.setMatrixAt(i, matrix);
}
```

#### 2. LOD (Level of Detail)

Reduce geometry complexity at distance:

```javascript
const lod = new THREE.LOD();
lod.addLevel(highDetailMesh, 0);
lod.addLevel(mediumDetailMesh, 50);
lod.addLevel(lowDetailMesh, 100);
scene.add(lod);
```

#### 3. Frustum Culling

Objects outside camera view are automatically culled. Ensure `frustumCulled = true` (default).

#### 4. Texture Optimization

- Use power-of-2 textures (256, 512, 1024, etc.)
- Compress textures where possible
- Use mipmaps for distant objects
- Share materials between objects

#### 5. Particle Systems

- Use BufferGeometry with position/color attributes
- Limit particle count (1000-5000 typical)
- Use point sprites instead of meshes
- Update only necessary attributes

#### 6. Post-Processing

Bloom adds GPU cost. Adjust parameters:

```javascript
sceneManager.enableBloom({
  strength: 0.3,    // Lower = faster
  threshold: 0.85,  // Higher = fewer pixels processed
  radius: 0.3,      // Lower = faster blur
});
```

### Monitoring Performance

Use the benchmark tools:

```bash
# Open the benchmark page
open tests/benchmarks/index.html

# Or run automated tests
npm run test:unit
```

---

## API Reference

### SceneManager

```typescript
class SceneManager {
  constructor(options: {
    container: HTMLElement;
    antialias?: boolean;
    alpha?: boolean;
    pixelRatio?: number;
  });

  // Post-processing
  enableBloom(options?: { strength?: number; threshold?: number; radius?: number }): void;
  disableBloom(): void;
  setBloomParams(params: { strength?: number; threshold?: number; radius?: number }): void;

  // Scene configuration
  setBackground(background: THREE.Color | THREE.Texture | string): void;
  setFog(fog: THREE.Fog | THREE.FogExp2): void;

  // Object management
  add(object: THREE.Object3D): void;
  remove(object: THREE.Object3D): void;

  // Animation
  onAnimate(callback: (deltaTime: number, elapsedTime: number) => void): () => void;

  // Lifecycle
  start(): void;
  stop(): void;
  dispose(): void;

  // Getters
  getRenderer(): THREE.WebGLRenderer;
  getScene(): THREE.Scene;
  getCamera(): THREE.Camera;
  setCamera(camera: THREE.Camera): void;
}
```

### OGODSceneManager

```typescript
class OGODSceneManager {
  constructor(options: {
    container: HTMLElement;
    trackNumber: number;
    audioEngine?: OGODAudioEngine;
  });

  // Lifecycle
  initialize(): Promise<void>;
  start(): void;
  stop(): void;
  dispose(): void;

  // State
  getCameraPosition(): THREE.Vector3;
  getColorZones(): Array<{
    color: string;
    position: { x: number; y: number; z: number };
    stem: string;
    radius: number;
  }>;
}
```

### OGODAudioEngine

```typescript
class OGODAudioEngine {
  constructor(options: {
    trackNumber: number;
    stemsPath?: string;
    fallbackPath?: string;
    useFallback?: boolean;
  });

  // Lifecycle
  initialize(): Promise<void>;
  start(): Promise<void>;
  stop(): void;
  dispose(): void;

  // Volume control
  setStemVolumes(volumes: { drums?: number; bass?: number; vocals?: number; other?: number }): void;
  setMasterVolume(volume: number): void;
  setReverbMix(mix: number): void;

  // State
  getStemVolumes(): { drums: number; bass: number; vocals: number; other: number };
  getPosition(): number;

  // Update (call each frame)
  update(): void;
}
```

### FirstPersonController

```typescript
class FirstPersonController {
  constructor(options: {
    camera: THREE.Camera;
    domElement: HTMLElement;
    moveSpeed?: number;
    lookSpeed?: number;
    onPositionChange?: (position: THREE.Vector3) => void;
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    onLongPress?: () => void;
  });

  // Control
  enable(): void;
  disable(): void;
  dispose(): void;

  // Gyroscope
  enableGyroscope(): Promise<boolean>;
  disableGyroscope(): void;
  toggleGyroscope(): Promise<boolean>;

  // Update (call each frame)
  update(delta: number): void;
}
```

### EnvironmentBase

```typescript
abstract class EnvironmentBase {
  constructor(options: {
    sceneManager: SceneManager;
    palette: string[];
  });

  // Must implement in subclass
  abstract initialize(): Promise<void>;

  // Protected helpers
  protected _addObject(object: THREE.Object3D): void;
  protected _onAnimate(callback: (delta: number, elapsed: number) => void): void;
  protected _createColorZone(color: THREE.Color, position: object, radius?: number): THREE.Mesh;
  protected _createParticles(options: object): THREE.Points;
  protected _createGround(options?: object): THREE.Mesh;
  protected _createAmbientLight(intensity?: number): THREE.AmbientLight;
  protected _lerpColor(a: THREE.Color, b: THREE.Color, t: number): THREE.Color;

  // Cleanup
  dispose(): void;
}
```

### EnvironmentData

```typescript
class EnvironmentData {
  constructor(options?: {
    weatherApiKey?: string;
    astronomyApiId?: string;
    astronomyApiSecret?: string;
    updateInterval?: number;
  });

  // Lifecycle
  initialize(): Promise<void>;
  dispose(): void;

  // Data access
  getData(): {
    location: { lat: number; lng: number; available: boolean };
    time: { hours: number; minutes: number; seconds: number; timeOfDay: number; sunPosition: number; period: string; colorTemperature: number };
    weather: { condition: string; temperature: number; humidity: number; cloudCover: number; windSpeed: number; available: boolean };
    astronomy: { moonPhase: number; moonIllumination: number; sunAltitude: number; available: boolean };
  };

  getVisualParams(): {
    particleDensity: number;
    blurAmount: number;
    colorTemperature: number;
    colorTempRGB: { r: number; g: number; b: number };
    moonGlow: number;
    moonPhase: number;
    ambientIntensity: number;
    windSpeed: number;
    timeOfDay: number;
    period: string;
    sunPosition: number;
  };

  // Subscription
  onUpdate(callback: (data: object) => void): () => void;
}
```

---

## Testing

### Running Unit Tests

```bash
# Run all unit tests
npm run test:unit

# Run with coverage
npm run test:unit:coverage

# Watch mode during development
npm run test:unit:watch
```

### Running E2E Tests

```bash
# Run all E2E tests
npm run test

# Run with headed browser
npm run test:headed

# Run with UI
npm run test:ui
```

### Running Performance Benchmarks

1. Start the dev server: `npm run dev`
2. Open `tests/benchmarks/index.html` in a browser
3. Click "Run Full Benchmark" to run a 30-second performance test
4. Review metrics and check for issues

---

## Troubleshooting

### Common Issues

**WebGL Context Lost**
- Reduce texture sizes
- Lower particle counts
- Check for memory leaks

**Audio Not Playing**
- Ensure user interaction before calling `audioEngine.start()`
- Check browser audio context state
- Verify audio file paths

**Low FPS**
- Disable post-processing
- Reduce particle counts
- Use simpler environment archetype
- Check for expensive animation callbacks

**Memory Leaks**
- Ensure `dispose()` is called on all objects
- Use PerformanceMonitor to track memory growth
- Check for detached DOM elements

### Debug Mode

Enable debug logging:

```javascript
// In js/config.js
debug: {
  showStats: true,      // Show FPS stats
  logPerformance: true, // Log performance metrics
  wireframe: false,     // Show wireframe
}
```
