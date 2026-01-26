/**
 * @file OGODAudioEngine.js
 * @description Audio engine for OGOD 3D environments using Tone.js
 * Handles stem-separated playback with position-based mixing and spatial audio
 *
 * SPATIAL AUDIO FEATURES:
 * - 3D Positional Audio: Panner3D nodes for HRTF-based spatialization
 * - Stem Zone Routing: Walking toward zones increases stem volumes
 * - Distance-Based Reverb: Reverb intensity based on listener distance
 * - Doppler/Movement Effects: Pitch shift and wind sounds when moving
 */

'use strict';

/**
 * @typedef {Object} StemZone
 * @property {string} stem - Stem name ('drums', 'bass', 'vocals', 'other')
 * @property {Object} position - 3D position {x, y, z}
 * @property {number} radius - Zone influence radius
 * @property {string} color - Visual indicator color (hex)
 */

/**
 * @typedef {Object} SpatialAudioConfig
 * @property {boolean} enabled - Enable spatial audio features
 * @property {string} panningModel - 'HRTF' or 'equalpower'
 * @property {string} distanceModel - 'inverse', 'linear', or 'exponential'
 * @property {number} refDistance - Reference distance for attenuation
 * @property {number} maxDistance - Maximum distance for attenuation
 * @property {number} rolloffFactor - How quickly sound attenuates
 * @property {number} coneInnerAngle - Inner cone angle (degrees)
 * @property {number} coneOuterAngle - Outer cone angle (degrees)
 * @property {number} coneOuterGain - Gain outside outer cone
 */

/**
 * @typedef {Object} ReverbConfig
 * @property {number} decay - Reverb decay time in seconds
 * @property {number} preDelay - Pre-delay in seconds
 * @property {number} minWet - Minimum wet/dry mix (close to source)
 * @property {number} maxWet - Maximum wet/dry mix (far from source)
 * @property {number} distanceThreshold - Distance for max reverb
 */

/**
 * @typedef {Object} DopplerConfig
 * @property {boolean} enabled - Enable Doppler effect
 * @property {number} intensity - Doppler intensity (0-1)
 * @property {number} speedOfSound - Speed of sound for calculations
 * @property {boolean} windEnabled - Enable wind sound when moving
 * @property {number} windThreshold - Minimum speed for wind sound
 * @property {number} windMaxVolume - Maximum wind volume
 */

/**
 * OGODAudioEngine - Stem-based audio mixing engine with spatial audio
 * @class
 */
class OGODAudioEngine {
  /**
   * @param {Object} options - Configuration options
   * @param {number} options.trackNumber - Track number (1-29)
   * @param {string} [options.stemsPath] - Base path for stem files
   * @param {boolean} [options.useFallback=true] - Use single file fallback if stems unavailable
   * @param {SpatialAudioConfig} [options.spatial] - Spatial audio configuration
   * @param {ReverbConfig} [options.reverb] - Reverb configuration
   * @param {DopplerConfig} [options.doppler] - Doppler effect configuration
   * @param {boolean} [options.enableAnalysis=true] - Enable audio analysis for visual reactivity
   */
  constructor(options = {}) {
    const config =
      typeof ETCETER4_CONFIG !== 'undefined'
        ? ETCETER4_CONFIG.threeD?.ogodEnv?.audio || {}
        : {};

    this.trackNumber = options.trackNumber || 1;
    this.stemsPath = options.stemsPath || 'assets/audio/stems/ogod';
    this.fallbackPath = options.fallbackPath || 'ogod/ogodtracks';
    this.useFallback = options.useFallback !== false;
    this.enableAnalysis = options.enableAnalysis !== false;

    // Detect mobile for performance optimizations
    this.isMobile = this._detectMobile();

    this.config = {
      masterVolume: config.masterVolume || 0.8,
      stemBlendRadius: config.stemBlendRadius || 15,
      reverbMix: config.reverbMix || 0.3,
      delayTime: config.delayTime || 0.2,
    };

    /**
     * Spatial audio configuration
     * @type {SpatialAudioConfig}
     */
    this.spatialConfig = {
      enabled: options.spatial?.enabled !== false,
      panningModel: options.spatial?.panningModel || 'HRTF',
      distanceModel: options.spatial?.distanceModel || 'inverse',
      refDistance: options.spatial?.refDistance || 1,
      maxDistance: options.spatial?.maxDistance || 100,
      rolloffFactor: options.spatial?.rolloffFactor || 1,
      coneInnerAngle: options.spatial?.coneInnerAngle || 360,
      coneOuterAngle: options.spatial?.coneOuterAngle || 360,
      coneOuterGain: options.spatial?.coneOuterGain || 0,
      ...options.spatial,
    };

    // Use equalpower on mobile for performance
    if (this.isMobile && this.spatialConfig.panningModel === 'HRTF') {
      this.spatialConfig.panningModel = 'equalpower';
    }

    /**
     * Reverb configuration
     * @type {ReverbConfig}
     */
    this.reverbConfig = {
      decay: options.reverb?.decay || 4,
      preDelay: options.reverb?.preDelay || 0.01,
      minWet: options.reverb?.minWet || 0.1,
      maxWet: options.reverb?.maxWet || 0.7,
      distanceThreshold: options.reverb?.distanceThreshold || 30,
      ...options.reverb,
    };

    /**
     * Doppler effect configuration
     * @type {DopplerConfig}
     */
    this.dopplerConfig = {
      enabled: options.doppler?.enabled !== false && !this.isMobile, // Disable on mobile
      intensity: options.doppler?.intensity || 0.3,
      speedOfSound: options.doppler?.speedOfSound || 343, // meters per second
      windEnabled: options.doppler?.windEnabled !== false && !this.isMobile,
      windThreshold: options.doppler?.windThreshold || 3,
      windMaxVolume: options.doppler?.windMaxVolume || 0.15,
      ...options.doppler,
    };

    // Stem names
    this.stemNames = ['drums', 'bass', 'vocals', 'other'];

    // Players for each stem
    this.players = {};
    this.stemVolumes = {};

    // Spatial audio nodes
    /** @type {Object.<string, Tone.Panner3D>} */
    this.panners = {};

    // Effects chain
    this.reverb = null;
    this.delay = null;
    this.masterGain = null;

    // Wind effect for Doppler
    /** @type {Tone.Noise|null} */
    this.windNoise = null;
    /** @type {Tone.Filter|null} */
    this.windFilter = null;
    /** @type {Tone.Gain|null} */
    this.windGain = null;

    // Pitch shift for Doppler
    /** @type {Object.<string, Tone.PitchShift>} */
    this.pitchShifters = {};

    // State
    this.isInitialized = false;
    this.isPlaying = false;
    this.usingSingleFile = false;

    // Listener state (camera position/orientation)
    this.listenerPosition = { x: 0, y: 2, z: 0 };
    this.listenerVelocity = { x: 0, y: 0, z: 0 };
    this.listenerForward = { x: 0, y: 0, z: -1 };
    this.listenerUp = { x: 0, y: 1, z: 0 };

    // Previous position for velocity calculation
    this._prevListenerPosition = { x: 0, y: 2, z: 0 };
    this._prevTime = 0;

    /**
     * Stem zone definitions
     * @type {StemZone[]}
     */
    this.stemZones = [];

    // Volume targets for smooth transitions
    this.volumeTargets = {};
    this.volumeLerpSpeed = 0.1;

    // Current reverb wet value (for smooth transitions)
    this._currentReverbWet = this.reverbConfig.minWet;
    this._targetReverbWet = this.reverbConfig.minWet;

    // Current wind volume
    this._currentWindVolume = 0;
    this._targetWindVolume = 0;

    // Audio analysis for visual reactivity
    /** @type {AudioAnalyzer|null} */
    this.analyzer = null;

    /** @type {BeatDetector|null} */
    this.beatDetector = null;

    /** @type {Tone.Gain|null} */
    this.analysisNode = null; // Clean audio for analysis (before effects)

    // Cached analysis data for efficient access
    this._analysisData = {
      bassLevel: 0,
      midLevel: 0,
      trebleLevel: 0,
      subBassLevel: 0,
      lowMidLevel: 0,
      highMidLevel: 0,
      kickHit: 0,
      snareHit: 0,
      beatHit: 0,
      energy: 0,
      averageEnergy: 0,
      bpm: 0,
      stemVolumes: {},
    };
  }

  /**
   * Detect if running on mobile device
   * @private
   * @returns {boolean}
   */
  _detectMobile() {
    return (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) || window.innerWidth < 768
    );
  }

  /**
   * Get track filename from number
   * @private
   * @returns {string}
   */
  _getTrackFilename() {
    const romanNumerals = [
      '',
      'I',
      'II',
      'III',
      'IV',
      'V',
      'VI',
      'VII',
      'VIII',
      'IX',
      'X',
      'XI',
      'XII',
      'XIII',
      'XIV',
      'XV',
      'XVI',
      'XVII',
      'XVIII',
      'XIX',
      'XX',
      'XXI',
      'XXII',
      'XXIII',
      'XXIV',
      'XXV',
      'XXVI',
      'XXVII',
      'XXVIII',
      'XXIX',
    ];

    const numStr = String(this.trackNumber).padStart(2, '0');
    const roman = romanNumerals[this.trackNumber] || this.trackNumber;

    return `${numStr} ${roman}`;
  }

  /**
   * Initialize the audio engine
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    // Create master gain
    this.masterGain = new Tone.Gain(this.config.masterVolume).toDestination();

    // Create effects
    this.reverb = new Tone.Reverb({
      decay: this.reverbConfig.decay,
      preDelay: this.reverbConfig.preDelay,
      wet: this.reverbConfig.minWet,
    }).connect(this.masterGain);

    // Wait for reverb to generate impulse response
    await this.reverb.ready;

    this.delay = new Tone.FeedbackDelay({
      delayTime: this.config.delayTime,
      feedback: 0.2,
      wet: 0.1,
    }).connect(this.reverb);

    // Initialize wind effect for Doppler
    if (this.dopplerConfig.windEnabled) {
      this._initializeWindEffect();
    }

    // Initialize audio analysis for visual reactivity
    if (this.enableAnalysis) {
      this._initializeAudioAnalysis();
    }

    // Try to load stems
    const stemsLoaded = await this._loadStems();

    // Fall back to single file if stems not available
    if (!stemsLoaded && this.useFallback) {
      await this._loadFallbackAudio();
    }

    // Initialize volume targets
    for (const stem of this.stemNames) {
      this.stemVolumes[stem] = 1.0;
      this.volumeTargets[stem] = 1.0;
    }

    // Set up default stem zones
    this._initializeDefaultStemZones();

    this.isInitialized = true;
  }

  /**
   * Initialize audio analysis for visual reactivity
   * @private
   */
  _initializeAudioAnalysis() {
    // Create a gain node to sum all audio for analysis (before effects)
    this.analysisNode = new Tone.Gain(1.0);

    // Create analyzer and beat detector
    if (typeof AudioAnalyzer !== 'undefined') {
      this.analyzer = new AudioAnalyzer({
        fftSize: 2048,
        smoothing: 0.8,
      });
      this.analyzer.initialize();
      this.analyzer.connect(this.analysisNode);
    } else {
      console.warn('OGODAudioEngine: AudioAnalyzer not available');
    }

    if (typeof BeatDetector !== 'undefined' && this.analyzer) {
      this.beatDetector = new BeatDetector({
        analyzer: this.analyzer,
        kickThreshold: 1.4,
        snareThreshold: 1.2,
        hitDecay: 0.9,
      });
    } else {
      console.warn('OGODAudioEngine: BeatDetector not available');
    }
  }

  /**
   * Initialize wind noise effect for fast movement
   * @private
   */
  _initializeWindEffect() {
    // Create wind noise (pink noise sounds more natural)
    this.windNoise = new Tone.Noise('pink');
    this.windNoise.volume.value = -Infinity; // Start silent

    // Bandpass filter to shape wind sound
    this.windFilter = new Tone.Filter({
      type: 'bandpass',
      frequency: 800,
      Q: 0.5,
    });

    // Gain control for wind volume
    this.windGain = new Tone.Gain(0);

    // Connect wind chain: noise -> filter -> gain -> master
    this.windNoise.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.masterGain);
  }

  /**
   * Initialize default stem zone positions
   * @private
   */
  _initializeDefaultStemZones() {
    // Default cardinal positions for stems
    const defaultPositions = {
      drums: { x: 0, y: 0, z: -20 }, // North
      bass: { x: 0, y: 0, z: 20 }, // South
      vocals: { x: -20, y: 0, z: 0 }, // West
      other: { x: 20, y: 0, z: 0 }, // East
    };

    this.stemZones = this.stemNames.map((stem, index) => ({
      stem,
      position: defaultPositions[stem] || { x: 0, y: 0, z: 0 },
      radius: this.config.stemBlendRadius,
      color: this._getDefaultZoneColor(index),
    }));
  }

  /**
   * Get default color for stem zone visualization
   * @private
   * @param {number} index - Stem index
   * @returns {string} Hex color
   */
  _getDefaultZoneColor(index) {
    const colors = ['#FF4136', '#0074D9', '#2ECC40', '#FFDC00'];
    return colors[index % colors.length];
  }

  /**
   * Load stem audio files with spatial audio nodes
   * @private
   * @returns {Promise<boolean>} - Whether stems were loaded successfully
   */
  async _loadStems() {
    const trackNum = String(this.trackNumber).padStart(2, '0');
    const basePath = `${this.stemsPath}/${trackNum}`;

    try {
      const loadPromises = this.stemNames.map(async (stem, index) => {
        const url = `${basePath}/${stem}.mp3`;
        const player = new Tone.Player({
          url,
          loop: true,
          fadeIn: 0.5,
          fadeOut: 0.5,
        });

        // Create gain node for volume control
        const gainNode = new Tone.Gain(1.0);

        // Create spatial audio chain if enabled
        if (this.spatialConfig.enabled) {
          // Create 3D panner for positional audio
          const panner = new Tone.Panner3D({
            panningModel: this.spatialConfig.panningModel,
            distanceModel: this.spatialConfig.distanceModel,
            refDistance: this.spatialConfig.refDistance,
            maxDistance: this.spatialConfig.maxDistance,
            rolloffFactor: this.spatialConfig.rolloffFactor,
            coneInnerAngle: this.spatialConfig.coneInnerAngle,
            coneOuterAngle: this.spatialConfig.coneOuterAngle,
            coneOuterGain: this.spatialConfig.coneOuterGain,
          });

          // Set initial position based on stem zone
          const zone = this.stemZones[index];
          if (zone) {
            panner.positionX.value = zone.position.x;
            panner.positionY.value = zone.position.y;
            panner.positionZ.value = zone.position.z;
          }

          this.panners[stem] = panner;

          // Create pitch shifter for Doppler effect (only if enabled)
          if (this.dopplerConfig.enabled) {
            const pitchShifter = new Tone.PitchShift({
              pitch: 0, // Semitones
              windowSize: 0.1,
              delayTime: 0,
              feedback: 0,
            });
            this.pitchShifters[stem] = pitchShifter;

            // Chain: player -> gain -> pitchShifter -> panner -> delay
            player.connect(gainNode);
            gainNode.connect(pitchShifter);
            pitchShifter.connect(panner);
            panner.connect(this.delay);
          } else {
            // Chain without pitch shift: player -> gain -> panner -> delay
            player.connect(gainNode);
            gainNode.connect(panner);
            panner.connect(this.delay);
          }
        } else {
          // Non-spatial chain: player -> gain -> delay
          player.connect(gainNode);
          gainNode.connect(this.delay);
        }

        // Connect to analysis node for audio reactivity (clean signal)
        if (this.analysisNode) {
          gainNode.connect(this.analysisNode);
        }

        this.players[stem] = {
          player,
          gain: gainNode,
        };

        return player.loaded;
      });

      await Promise.all(loadPromises);
      return true;
    } catch (error) {
      console.warn(
        'OGODAudioEngine: Could not load stems, will use fallback',
        error
      );
      return false;
    }
  }

  /**
   * Load single fallback audio file
   * @private
   * @returns {Promise<void>}
   */
  async _loadFallbackAudio() {
    const filename = this._getTrackFilename();
    const url = `${this.fallbackPath}/${filename}.mp3`;

    try {
      const player = new Tone.Player({
        url,
        loop: true,
        fadeIn: 0.5,
        fadeOut: 0.5,
      });

      player.connect(this.delay);

      // Connect to analysis node for audio reactivity
      if (this.analysisNode) {
        player.connect(this.analysisNode);
      }

      this.players.master = {
        player,
        gain: null,
      };

      this.usingSingleFile = true;

      await player.loaded;
    } catch (error) {
      console.error('OGODAudioEngine: Could not load fallback audio', error);
    }
  }

  /**
   * Start audio playback
   */
  async start() {
    if (!this.isInitialized) {
      console.warn('OGODAudioEngine: Not initialized');
      return;
    }

    if (this.isPlaying) {
      return;
    }

    // Ensure Tone.js audio context is started
    await Tone.start();

    // Initialize listener position tracking
    this._prevTime = Tone.now();
    this._prevListenerPosition = { ...this.listenerPosition };

    // Start all players
    const now = Tone.now();

    if (this.usingSingleFile) {
      this.players.master?.player.start(now);
    } else {
      for (const stem of this.stemNames) {
        if (this.players[stem]) {
          this.players[stem].player.start(now);
        }
      }
    }

    // Start wind noise if enabled
    if (this.windNoise && this.dopplerConfig.windEnabled) {
      this.windNoise.start(now);
    }

    this.isPlaying = true;
  }

  /**
   * Stop audio playback
   */
  stop() {
    if (!this.isPlaying) {
      return;
    }

    if (this.usingSingleFile) {
      this.players.master?.player.stop();
    } else {
      for (const stem of this.stemNames) {
        if (this.players[stem]) {
          this.players[stem].player.stop();
        }
      }
    }

    // Stop wind noise
    if (this.windNoise) {
      this.windNoise.stop();
    }

    this.isPlaying = false;
  }

  /**
   * Set stem volumes based on position
   * @param {Object} volumes - Object with stem names as keys and volumes (0-1) as values
   */
  setStemVolumes(volumes) {
    if (this.usingSingleFile) {
      // Can't mix individual stems with single file
      return;
    }

    for (const stem of this.stemNames) {
      if (Object.prototype.hasOwnProperty.call(volumes, stem)) {
        // Set target volume (will lerp towards it)
        this.volumeTargets[stem] = Math.max(0, Math.min(1, volumes[stem]));
      }
    }
  }

  /**
   * Update audio state - call each frame for smooth volume transitions, spatial audio, and analysis
   * @param {number} [deltaTime] - Time since last frame in seconds
   */
  update(deltaTime) {
    if (!this.isInitialized) {
      return;
    }

    const now = Tone.now();

    // Calculate delta if not provided
    if (deltaTime === undefined) {
      deltaTime = this._prevTime > 0 ? now - this._prevTime : 0.016;
    }
    this._prevTime = now;

    // Update audio analysis
    this._updateAnalysis();

    if (!this.isPlaying) {
      return;
    }

    // Calculate listener velocity from position change
    this._updateListenerVelocity(deltaTime);

    // Update spatial audio if enabled and using stems
    if (!this.usingSingleFile && this.spatialConfig.enabled) {
      this._updateSpatialAudio();
      this._updateDistanceBasedReverb();
    }

    // Update Doppler effect
    if (this.dopplerConfig.enabled && !this.usingSingleFile) {
      this._updateDopplerEffect(deltaTime);
    }

    // Update wind effect
    if (this.dopplerConfig.windEnabled) {
      this._updateWindEffect(deltaTime);
    }

    // Lerp volumes towards targets (stem mixing)
    if (!this.usingSingleFile) {
      this._updateStemVolumes();
    }

    // Store previous position for next frame
    this._prevListenerPosition = { ...this.listenerPosition };
  }

  /**
   * Update listener velocity based on position change
   * @private
   * @param {number} deltaTime - Time since last frame
   */
  _updateListenerVelocity(deltaTime) {
    if (deltaTime <= 0) {
      return;
    }

    this.listenerVelocity = {
      x: (this.listenerPosition.x - this._prevListenerPosition.x) / deltaTime,
      y: (this.listenerPosition.y - this._prevListenerPosition.y) / deltaTime,
      z: (this.listenerPosition.z - this._prevListenerPosition.z) / deltaTime,
    };
  }

  /**
   * Update spatial audio panner positions and listener
   * @private
   */
  _updateSpatialAudio() {
    // Update Tone.js listener position and orientation
    const listener = Tone.getContext().listener;
    if (listener) {
      // Set listener position
      if (listener.positionX) {
        listener.positionX.setValueAtTime(this.listenerPosition.x, Tone.now());
        listener.positionY.setValueAtTime(this.listenerPosition.y, Tone.now());
        listener.positionZ.setValueAtTime(this.listenerPosition.z, Tone.now());
      }

      // Set listener orientation (forward and up vectors)
      if (listener.forwardX) {
        listener.forwardX.setValueAtTime(this.listenerForward.x, Tone.now());
        listener.forwardY.setValueAtTime(this.listenerForward.y, Tone.now());
        listener.forwardZ.setValueAtTime(this.listenerForward.z, Tone.now());
        listener.upX.setValueAtTime(this.listenerUp.x, Tone.now());
        listener.upY.setValueAtTime(this.listenerUp.y, Tone.now());
        listener.upZ.setValueAtTime(this.listenerUp.z, Tone.now());
      }
    }

    // Update panner positions based on stem zones
    for (const zone of this.stemZones) {
      const panner = this.panners[zone.stem];
      if (panner) {
        panner.positionX.setValueAtTime(zone.position.x, Tone.now());
        panner.positionY.setValueAtTime(zone.position.y, Tone.now());
        panner.positionZ.setValueAtTime(zone.position.z, Tone.now());
      }
    }
  }

  /**
   * Update reverb wet/dry based on distance from sound sources
   * @private
   */
  _updateDistanceBasedReverb() {
    if (!this.reverb) {
      return;
    }

    // Calculate average distance to all stem zones
    let totalDistance = 0;
    let count = 0;

    for (const zone of this.stemZones) {
      const dx = this.listenerPosition.x - zone.position.x;
      const dy = this.listenerPosition.y - zone.position.y;
      const dz = this.listenerPosition.z - zone.position.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      totalDistance += distance;
      count++;
    }

    const avgDistance = count > 0 ? totalDistance / count : 0;

    // Map distance to reverb wet amount
    const distanceFactor = Math.min(
      1,
      avgDistance / this.reverbConfig.distanceThreshold
    );
    this._targetReverbWet =
      this.reverbConfig.minWet +
      (this.reverbConfig.maxWet - this.reverbConfig.minWet) * distanceFactor;

    // Smooth transition to target reverb wet
    const reverbLerpSpeed = 0.05;
    this._currentReverbWet +=
      (this._targetReverbWet - this._currentReverbWet) * reverbLerpSpeed;

    // Apply reverb wet value
    this.reverb.wet.setValueAtTime(this._currentReverbWet, Tone.now());
  }

  /**
   * Update Doppler effect based on relative velocity
   * @private
   * @param {number} deltaTime - Time since last frame
   */
  _updateDopplerEffect(deltaTime) {
    if (!this.dopplerConfig.enabled || this.usingSingleFile) {
      return;
    }

    const speedOfSound = this.dopplerConfig.speedOfSound;
    const intensity = this.dopplerConfig.intensity;

    for (const zone of this.stemZones) {
      const pitchShifter = this.pitchShifters[zone.stem];
      if (!pitchShifter) {
        continue;
      }

      // Calculate vector from listener to source
      const dx = zone.position.x - this.listenerPosition.x;
      const dy = zone.position.y - this.listenerPosition.y;
      const dz = zone.position.z - this.listenerPosition.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (distance < 0.01) {
        // Avoid division by zero
        pitchShifter.pitch = 0;
        continue;
      }

      // Normalize direction vector
      const dirX = dx / distance;
      const dirY = dy / distance;
      const dirZ = dz / distance;

      // Calculate relative velocity along the direction to source
      // Positive = moving toward source, Negative = moving away
      const relativeVelocity =
        this.listenerVelocity.x * dirX +
        this.listenerVelocity.y * dirY +
        this.listenerVelocity.z * dirZ;

      // Calculate Doppler pitch shift
      // Moving toward: frequency increases (positive semitones)
      // Moving away: frequency decreases (negative semitones)
      const dopplerRatio = relativeVelocity / speedOfSound;

      // Convert ratio to semitones: semitones = 12 * log2(1 + ratio)
      const semitones = 12 * Math.log2(1 + dopplerRatio) * intensity;

      // Clamp to reasonable range (-2 to +2 semitones)
      const clampedSemitones = Math.max(-2, Math.min(2, semitones));

      // Apply with smoothing
      const currentPitch = pitchShifter.pitch;
      const targetPitch = clampedSemitones;
      const smoothedPitch = currentPitch + (targetPitch - currentPitch) * 0.1;

      pitchShifter.pitch = smoothedPitch;
    }
  }

  /**
   * Update wind sound effect based on movement speed
   * @private
   * @param {number} deltaTime - Time since last frame
   */
  _updateWindEffect(deltaTime) {
    if (!this.windNoise || !this.windGain) {
      return;
    }

    // Calculate listener speed
    const speed = Math.sqrt(
      this.listenerVelocity.x * this.listenerVelocity.x +
        this.listenerVelocity.y * this.listenerVelocity.y +
        this.listenerVelocity.z * this.listenerVelocity.z
    );

    // Calculate target wind volume based on speed
    if (speed > this.dopplerConfig.windThreshold) {
      const speedFactor = Math.min(
        1,
        (speed - this.dopplerConfig.windThreshold) /
          (this.dopplerConfig.windThreshold * 3)
      );
      this._targetWindVolume = speedFactor * this.dopplerConfig.windMaxVolume;
    } else {
      this._targetWindVolume = 0;
    }

    // Smooth transition
    const windLerpSpeed = 0.15;
    this._currentWindVolume +=
      (this._targetWindVolume - this._currentWindVolume) * windLerpSpeed;

    // Apply wind volume
    if (this._currentWindVolume > 0.001) {
      // Convert to dB (Tone.js uses dB for volume)
      const volumeDb = 20 * Math.log10(this._currentWindVolume);
      this.windNoise.volume.setValueAtTime(Math.max(-60, volumeDb), Tone.now());

      // Adjust wind filter frequency based on speed (higher speed = higher pitch)
      const filterFreq = 400 + speed * 100;
      this.windFilter.frequency.setValueAtTime(
        Math.min(2000, filterFreq),
        Tone.now()
      );
    } else {
      this.windNoise.volume.setValueAtTime(-Infinity, Tone.now());
    }
  }

  /**
   * Update stem volumes with smooth lerping
   * @private
   */
  _updateStemVolumes() {
    for (const stem of this.stemNames) {
      const current = this.stemVolumes[stem];
      const target = this.volumeTargets[stem];

      if (Math.abs(current - target) > 0.001) {
        const newVolume = current + (target - current) * this.volumeLerpSpeed;
        this.stemVolumes[stem] = newVolume;

        // Apply to gain node
        if (this.players[stem]?.gain) {
          this.players[stem].gain.gain.setValueAtTime(newVolume, Tone.now());
        }
      }
    }
  }

  /**
   * Update audio analysis data
   * @private
   */
  _updateAnalysis() {
    if (!this.enableAnalysis || !this.isPlaying) {
      return;
    }

    // Update analyzer
    if (this.analyzer) {
      this.analyzer.update();

      // Cache band levels
      this._analysisData.subBassLevel = this.analyzer.getSubBassLevel();
      this._analysisData.bassLevel = this.analyzer.getBassLevel();
      this._analysisData.lowMidLevel = this.analyzer.getLowMidLevel();
      this._analysisData.midLevel = this.analyzer.getMidLevel();
      this._analysisData.highMidLevel = this.analyzer.getHighMidLevel();
      this._analysisData.trebleLevel = this.analyzer.getTrebleLevel();
      this._analysisData.energy = this.analyzer.getEnergy();
      this._analysisData.averageEnergy = this.analyzer.getAverageEnergy();
    }

    // Update beat detector
    if (this.beatDetector) {
      this.beatDetector.update();

      // Cache beat data
      this._analysisData.kickHit = this.beatDetector.getKickHit();
      this._analysisData.snareHit = this.beatDetector.getSnareHit();
      this._analysisData.beatHit = this.beatDetector.getBeatHit();
      this._analysisData.bpm = this.beatDetector.getBPM();
    }

    // Update stem volumes in analysis data
    this._analysisData.stemVolumes = { ...this.stemVolumes };
  }

  /**
   * Get current audio analysis data for visual reactivity
   * @returns {Object} Analysis data with frequency bands, beat detection, and energy
   */
  getAnalysisData() {
    return { ...this._analysisData };
  }

  /**
   * Get bass level (60-250Hz) for visuals
   * @returns {number} Level 0-1
   */
  getBassLevel() {
    return this._analysisData.bassLevel;
  }

  /**
   * Get mid level (500-2000Hz) for visuals
   * @returns {number} Level 0-1
   */
  getMidLevel() {
    return this._analysisData.midLevel;
  }

  /**
   * Get treble level (4000-20000Hz) for visuals
   * @returns {number} Level 0-1
   */
  getTrebleLevel() {
    return this._analysisData.trebleLevel;
  }

  /**
   * Get kick hit value (0-1, decays after detection)
   * @returns {number}
   */
  getKickHit() {
    return this._analysisData.kickHit;
  }

  /**
   * Get snare hit value (0-1, decays after detection)
   * @returns {number}
   */
  getSnareHit() {
    return this._analysisData.snareHit;
  }

  /**
   * Get beat hit value (0-1, decays after detection)
   * @returns {number}
   */
  getBeatHit() {
    return this._analysisData.beatHit;
  }

  /**
   * Register callback for beat events
   * @param {Function} callback - Called when any beat is detected
   * @returns {Function} Unsubscribe function
   */
  onBeat(callback) {
    if (this.beatDetector) {
      return this.beatDetector.onBeat(callback);
    }
    return () => {};
  }

  /**
   * Register callback for kick events
   * @param {Function} callback - Called when a kick is detected
   * @returns {Function} Unsubscribe function
   */
  onKick(callback) {
    if (this.beatDetector) {
      return this.beatDetector.onKick(callback);
    }
    return () => {};
  }

  /**
   * Register callback for snare events
   * @param {Function} callback - Called when a snare is detected
   * @returns {Function} Unsubscribe function
   */
  onSnare(callback) {
    if (this.beatDetector) {
      return this.beatDetector.onSnare(callback);
    }
    return () => {};
  }

  // =========================================================================
  // SPATIAL AUDIO API
  // =========================================================================

  /**
   * Set listener position (typically camera position)
   * @param {Object} position - Position with x, y, z coordinates
   * @param {number} position.x - X coordinate
   * @param {number} position.y - Y coordinate
   * @param {number} position.z - Z coordinate
   */
  setListenerPosition(position) {
    if (position) {
      this.listenerPosition.x = position.x ?? this.listenerPosition.x;
      this.listenerPosition.y = position.y ?? this.listenerPosition.y;
      this.listenerPosition.z = position.z ?? this.listenerPosition.z;
    }
  }

  /**
   * Set listener orientation (camera direction)
   * @param {Object} forward - Forward direction vector (normalized)
   * @param {Object} [up] - Up direction vector (normalized), defaults to (0, 1, 0)
   */
  setListenerOrientation(forward, up) {
    if (forward) {
      this.listenerForward.x = forward.x ?? this.listenerForward.x;
      this.listenerForward.y = forward.y ?? this.listenerForward.y;
      this.listenerForward.z = forward.z ?? this.listenerForward.z;
    }
    if (up) {
      this.listenerUp.x = up.x ?? this.listenerUp.x;
      this.listenerUp.y = up.y ?? this.listenerUp.y;
      this.listenerUp.z = up.z ?? this.listenerUp.z;
    }
  }

  /**
   * Get current listener position
   * @returns {Object} Position with x, y, z coordinates
   */
  getListenerPosition() {
    return { ...this.listenerPosition };
  }

  /**
   * Get current listener velocity
   * @returns {Object} Velocity with x, y, z components
   */
  getListenerVelocity() {
    return { ...this.listenerVelocity };
  }

  /**
   * Get listener speed (magnitude of velocity)
   * @returns {number} Speed in units per second
   */
  getListenerSpeed() {
    return Math.sqrt(
      this.listenerVelocity.x * this.listenerVelocity.x +
        this.listenerVelocity.y * this.listenerVelocity.y +
        this.listenerVelocity.z * this.listenerVelocity.z
    );
  }

  /**
   * Set stem zone positions
   * @param {StemZone[]} zones - Array of stem zone configurations
   */
  setStemZones(zones) {
    if (Array.isArray(zones)) {
      this.stemZones = zones.map((zone, index) => ({
        stem: zone.stem || this.stemNames[index % this.stemNames.length],
        position: zone.position || { x: 0, y: 0, z: 0 },
        radius: zone.radius || this.config.stemBlendRadius,
        color: zone.color || this._getDefaultZoneColor(index),
      }));

      // Update panner positions immediately
      for (const zone of this.stemZones) {
        const panner = this.panners[zone.stem];
        if (panner) {
          panner.positionX.value = zone.position.x;
          panner.positionY.value = zone.position.y;
          panner.positionZ.value = zone.position.z;
        }
      }
    }
  }

  /**
   * Get stem zone configurations
   * @returns {StemZone[]} Array of stem zone configurations
   */
  getStemZones() {
    return this.stemZones.map(zone => ({
      ...zone,
      position: { ...zone.position },
    }));
  }

  /**
   * Set a specific stem zone's position
   * @param {string} stem - Stem name ('drums', 'bass', 'vocals', 'other')
   * @param {Object} position - New position {x, y, z}
   */
  setStemZonePosition(stem, position) {
    const zone = this.stemZones.find(z => z.stem === stem);
    if (zone && position) {
      zone.position = {
        x: position.x ?? zone.position.x,
        y: position.y ?? zone.position.y,
        z: position.z ?? zone.position.z,
      };

      // Update panner position
      const panner = this.panners[stem];
      if (panner) {
        panner.positionX.value = zone.position.x;
        panner.positionY.value = zone.position.y;
        panner.positionZ.value = zone.position.z;
      }
    }
  }

  /**
   * Calculate stem volume based on distance from listener to zone
   * @param {string} stem - Stem name
   * @returns {number} Volume 0-1 based on proximity
   */
  getStemProximityVolume(stem) {
    const zone = this.stemZones.find(z => z.stem === stem);
    if (!zone) {
      return 1.0;
    }

    const dx = this.listenerPosition.x - zone.position.x;
    const dy = this.listenerPosition.y - zone.position.y;
    const dz = this.listenerPosition.z - zone.position.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    // Inverse distance with clamping (closer = louder)
    return Math.max(0, Math.min(1, 1 - distance / zone.radius));
  }

  /**
   * Enable or disable spatial audio
   * @param {boolean} enabled - Whether spatial audio is enabled
   */
  setSpatialEnabled(enabled) {
    this.spatialConfig.enabled = enabled;
  }

  /**
   * Enable or disable Doppler effect
   * @param {boolean} enabled - Whether Doppler effect is enabled
   */
  setDopplerEnabled(enabled) {
    this.dopplerConfig.enabled = enabled && !this.isMobile;
  }

  /**
   * Set Doppler effect intensity
   * @param {number} intensity - Intensity 0-1
   */
  setDopplerIntensity(intensity) {
    this.dopplerConfig.intensity = Math.max(0, Math.min(1, intensity));
  }

  /**
   * Enable or disable wind sound effect
   * @param {boolean} enabled - Whether wind effect is enabled
   */
  setWindEnabled(enabled) {
    this.dopplerConfig.windEnabled = enabled && !this.isMobile;
  }

  /**
   * Set reverb configuration
   * @param {Object} config - Reverb configuration
   * @param {number} [config.decay] - Decay time in seconds
   * @param {number} [config.minWet] - Minimum wet/dry mix (close to source)
   * @param {number} [config.maxWet] - Maximum wet/dry mix (far from source)
   * @param {number} [config.distanceThreshold] - Distance for max reverb
   */
  setReverbConfig(config) {
    if (config.decay !== undefined) {
      this.reverbConfig.decay = config.decay;
    }
    if (config.minWet !== undefined) {
      this.reverbConfig.minWet = config.minWet;
    }
    if (config.maxWet !== undefined) {
      this.reverbConfig.maxWet = config.maxWet;
    }
    if (config.distanceThreshold !== undefined) {
      this.reverbConfig.distanceThreshold = config.distanceThreshold;
    }
  }

  /**
   * Get current reverb wet value
   * @returns {number} Current reverb wet value 0-1
   */
  getCurrentReverbWet() {
    return this._currentReverbWet;
  }

  /**
   * Get current wind volume
   * @returns {number} Current wind volume 0-1
   */
  getCurrentWindVolume() {
    return this._currentWindVolume;
  }

  // =========================================================================
  // VOLUME AND PLAYBACK API
  // =========================================================================

  /**
   * Set master volume
   * @param {number} volume - Volume 0-1
   */
  setMasterVolume(volume) {
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(
        Math.max(0, Math.min(1, volume)),
        Tone.now()
      );
    }
  }

  /**
   * Set reverb mix
   * @param {number} mix - Wet/dry mix 0-1
   */
  setReverbMix(mix) {
    if (this.reverb) {
      this.reverb.wet.setValueAtTime(Math.max(0, Math.min(1, mix)), Tone.now());
    }
  }

  /**
   * Get current playback position
   * @returns {number} - Current position in seconds
   */
  getPosition() {
    if (this.usingSingleFile) {
      return this.players.master?.player.toSeconds() || 0;
    }

    // Use first stem as reference
    const firstStem = this.stemNames[0];
    return this.players[firstStem]?.player.toSeconds() || 0;
  }

  /**
   * Get current stem volumes
   * @returns {Object}
   */
  getStemVolumes() {
    return { ...this.stemVolumes };
  }

  /**
   * Clean up resources
   */
  dispose() {
    this.stop();

    // Dispose players
    if (this.usingSingleFile) {
      this.players.master?.player.dispose();
    } else {
      for (const stem of this.stemNames) {
        if (this.players[stem]) {
          this.players[stem].player.dispose();
          this.players[stem].gain.dispose();
        }
      }
    }

    // Dispose effects
    this.reverb?.dispose();
    this.delay?.dispose();
    this.masterGain?.dispose();

    // Dispose audio analysis
    if (this.analyzer) {
      this.analyzer.dispose();
      this.analyzer = null;
    }
    if (this.beatDetector) {
      this.beatDetector.dispose();
      this.beatDetector = null;
    }
    if (this.analysisNode) {
      this.analysisNode.dispose();
      this.analysisNode = null;
    }

    // Dispose panners and pitch shifters
    for (const stem of this.stemNames) {
      if (this.panners[stem]) {
        this.panners[stem].dispose();
      }
      if (this.pitchShifters[stem]) {
        this.pitchShifters[stem].dispose();
      }
    }
    this.panners = {};
    this.pitchShifters = {};

    // Dispose wind effect
    if (this.windNoise) {
      this.windNoise.dispose();
      this.windNoise = null;
    }
    if (this.windFilter) {
      this.windFilter.dispose();
      this.windFilter = null;
    }
    if (this.windGain) {
      this.windGain.dispose();
      this.windGain = null;
    }

    this.players = {};
    this.isInitialized = false;
  }
}

// Export for global scope
window.OGODAudioEngine = OGODAudioEngine;

/**
 * Helper function to create a complete OGOD experience
 * @param {Object} options
 * @param {HTMLElement} options.container - Container element
 * @param {number} options.trackNumber - Track number (1-29)
 * @returns {Promise<Object>} - Object with sceneManager and audioEngine
 */
async function createOGODExperience(options = {}) {
  const { container, trackNumber = 1 } = options;

  // Create audio engine
  const audioEngine = new OGODAudioEngine({ trackNumber });
  await audioEngine.initialize();

  // Create scene manager with audio engine
  const sceneManager = new OGODSceneManager({
    container,
    trackNumber,
    audioEngine,
  });
  await sceneManager.initialize();

  // Connect audio update to animation loop
  sceneManager.sceneManager.onAnimate(delta => {
    audioEngine.update(delta);
    sceneManager.controller?.update(delta);
  });

  return {
    sceneManager,
    audioEngine,
    start: () => {
      sceneManager.start();
      audioEngine.start();
    },
    stop: () => {
      sceneManager.stop();
      audioEngine.stop();
    },
    dispose: () => {
      sceneManager.dispose();
      audioEngine.dispose();
    },
  };
}

// Export helper
window.createOGODExperience = createOGODExperience;
