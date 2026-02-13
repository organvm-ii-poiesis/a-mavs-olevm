/**
 * @file pageData.js
 * @description Page configuration and data management for etceter4.com
 * Defines the page tree structure, relationships, and initialization logic
 * for all pages in the site navigation system.
 *
 * @requires page.js - Page constructor and prototype methods
 * @requires jQuery - For DOM manipulation and AJAX
 *
 * This file creates the page hierarchy and defines:
 * - Page IDs and their relationships (upLinks, downLinks)
 * - Page tier levels in the navigation tree
 * - Initialization functions for each page
 * - Dynamic content loading for various sections
 */

/**
 * Page ID constants
 * @const {Object} _pID - Maps page names to their HTML element IDs
 * @property {string} landing - Landing page ID
 * @property {string} menu - Main menu page ID
 * @property {string} sound - Sound/music section ID
 * @property {string} vision - Visual content section ID
 * @property {string} words - Written content section ID
 * @property {string} blog - Blog section ID
 * @property {string} diary - Diary/journal section ID
 * @property {string} video - Video content section ID
 * @property {string} stills - Still images/photos section ID
 * @property {string} info - Information/about section ID
 */

const _pID = {
  landing: '#landing',
  menu: '#menu',
  sound: '#sound',
  vision: '#vision',
  words: '#words',
  blog: '#blog',
  diary: '#diary',
  video: '#video',
  stills: '#stills',
  info: '#info',
  ogod3d: '#ogod3d',
  ogodViewer: '#ogod-viewer',
  eastWing: '#east-wing',
  westWing: '#west-wing',
  southWing: '#south-wing',
  northWing: '#north-wing',
  bibliotheke: '#bibliotheke',
  oikos: '#oikos',
  pinakotheke: '#pinakotheke',
  agora: '#agora',
  symposion: '#symposion',
  odeion: '#odeion',
  theatron: '#theatron',
  ergasterion: '#ergasterion',
  akademia: '#akademia',
  khronos: '#khronos',
  discovery: '#discovery',
};

/**
 * Pages array - Contains all page instances
 * @type {Page[]}
 * @global
 *
 * Each page is created with:
 * - id: HTML element ID (matches _pID constants)
 * - tier: Depth level in navigation tree (higher = deeper)
 * - upLinks: Array of parent page IDs (for back navigation)
 * - downLinks: Array of child page IDs (for forward navigation)
 * - initialize: Function called on first page load
 * - load: Function called on subsequent page loads (optional)
 *
 * Navigation Flow:
 * Landing (tier 1) → Menu (tier 2) → Content sections (tier 3) → Detail pages (tier 4)
 */
let pages = [];

/**
 * Menu page configuration
 * Tier 2 - Main hub connecting to all major sections
 */
pages.menu = new Page({
  id: _pID.menu,
  tier: 2,
  downLinks: [
    _pID.words,
    _pID.sound,
    _pID.vision,
    _pID.info,
    _pID.eastWing,
    _pID.westWing,
    _pID.southWing,
    _pID.northWing,
    _pID.discovery,
  ],
  upLinks: [_pID.landing],
  initialize() {
    // get the lib and sketch
    $.cachedScript('js/vendor/p5.js').done((script, textStatus) => {});
    // $.cachedScript( "js/sketch.js" ).done(function( script, textStatus ) {});
  },
});

/**
 * Sound page configuration
 * Tier 3 - Music/audio section with embedded Bandcamp players
 * Initializes with album iframes from Bandcamp
 */
pages.sound = new Page({
  id: _pID.sound,
  tier: 3,
  upLinks: [_pID.menu],
  initialize() {
    // add the iFrames
    const _iFrames = [
      '<iframe style="border: 0; width: 300px; height: 300px;" src="https://bandcamp.com/EmbeddedPlayer/album=3780915385/size=large/bgcol=ffffff/linkcol=0687f5/minimal=true/transparent=true/"><a href="https://music.etceter4.com/album/ogod">OGOD by ET CETER4</a></iframe>',
      '<iframe style="border: 0; width: 300px; height: 300px;" src="https://bandcamp.com/EmbeddedPlayer/album=604244064/size=large/bgcol=ffffff/linkcol=333333/minimal=true/transparent=true/"><a href="https://music.etceter4.com/album/et-ceter4-rmxs">ET CETER4 RMXS by ET CETER4</a></iframe>',
      '<iframe style="border: 10px; width: 300px; height: 300px;" src="https://bandcamp.com/EmbeddedPlayer/album=489900059/size=large/bgcol=ffffff/linkcol=0687f5/minimal=true/transparent=true/"><a href="https://music.etceter4.com/album/the-progression-of-digression">ProgressionDigression by ET CETER4</a></iframe>',
      '<iframe style="border: 10px; width: 300px; height: 300px;" src="https://bandcamp.com/EmbeddedPlayer/album=448587485/size=large/bgcol=ffffff/linkcol=de270f/minimal=true/transparent=true/"><a href="https://music.etceter4.com/album/etc">Etc by ET CETER4</a></iframe>',
    ];

    $('#sound #BCContainer').each(function (index) {
      $(this).html(_iFrames[index]);
    });
  },
});

/**
 * Stills page configuration
 * Tier 4 - Image gallery section
 * Uses replacePlaceholders function to load dynamic image content
 */
pages.stills = new Page({
  id: _pID.stills,
  tier: 4,
  upLinks: [_pID.vision],
  initialize() {
    replacePlaceholders(this.id);
  },
});

/**
 * Diary page configuration
 * Tier 4 - Journal/blog entries section
 * Uses replacePlaceholders function to load dynamic diary content
 */
pages.diary = new Page({
  id: _pID.diary,
  tier: 4,
  upLinks: [_pID.words],
  initialize() {
    replacePlaceholders(this.id);
  },
});

/**
 * Info page configuration
 * About/information section with contact and details
 */
pages.info = new Page({
  id: _pID.info,
  upLinks: [_pID.menu],
});

/**
 * OGOD 3D experience helper function
 * Creates and initializes the 3D scene manager and audio engine
 * @param {Object} options - Configuration options
 * @param {HTMLElement} options.container - DOM element for the canvas
 * @param {number} options.trackNumber - Track number (1-29)
 * @returns {Promise<Object>} The experience object with sceneManager and audioEngine
 */
async function createOGODExperience(options) {
  const { container, trackNumber } = options;

  // Create audio engine
  const audioEngine = new OGODAudioEngine({
    trackNumber,
    useFallback: true,
  });

  // Create scene manager
  const sceneManager = new OGODSceneManager({
    container,
    trackNumber,
    audioEngine,
  });

  // Initialize
  await audioEngine.initialize();
  await sceneManager.initialize();

  return {
    sceneManager,
    audioEngine,
    dispose() {
      sceneManager.dispose();
      audioEngine.dispose();
    },
  };
}

// Make available globally
window.createOGODExperience = createOGODExperience;

/**
 * OGOD 3D page configuration
 * Tier 4 - Immersive 3D audio-visual experience
 */
pages.ogod3d = new Page({
  id: _pID.ogod3d,
  tier: 4,
  upLinks: [_pID.vision],
  initialize() {
    // Initialize OGOD 3D experience on first visit
    const container = document.getElementById('ogod3d-container');
    const loadingScreen = document.getElementById('ogod3d-loading');
    const loadingBar = document.getElementById('ogod3d-loading-bar');
    const loadingText = document.getElementById('ogod3d-loading-text');

    if (!container) {
      console.warn('OGOD 3D: Container not found');
      return;
    }

    // Track state
    window.ogod3dState = window.ogod3dState || {
      currentTrack: 1,
      experience: null,
      audioStarted: false,
      isTransitioning: false,
    };

    const state = window.ogod3dState;

    // Update loading UI
    const updateLoading = (progress, text) => {
      if (loadingBar) {
        loadingBar.style.width = `${progress}%`;
      }
      if (loadingText) {
        loadingText.textContent = text;
      }
    };

    // Load a track
    const loadTrack = async trackNum => {
      if (state.isTransitioning) {
        return;
      }

      const isInitialLoad = !state.experience;

      // Show transition if switching tracks
      if (!isInitialLoad) {
        state.isTransitioning = true;
        state.experience.dispose();
        state.experience = null;
      }

      // Show loading
      if (loadingScreen) {
        loadingScreen.classList.remove('hidden');
      }
      updateLoading(10, 'Loading environment...');

      state.currentTrack = trackNum;

      // Update track buttons
      document.querySelectorAll('.ogod3d-track-btn').forEach(btn => {
        btn.classList.toggle(
          'active',
          parseInt(btn.dataset.track) === trackNum
        );
      });

      try {
        updateLoading(30, 'Creating 3D scene...');
        container.innerHTML = '';

        state.experience = await createOGODExperience({
          container,
          trackNumber: trackNum,
        });

        updateLoading(70, 'Starting visuals...');
        state.experience.sceneManager.start();

        updateLoading(100, 'Ready!');

        // Hide loading
        setTimeout(() => {
          if (loadingScreen) {
            loadingScreen.classList.add('hidden');
          }
          state.isTransitioning = false;
        }, 300);

        // Start audio if already enabled
        if (state.audioStarted && state.experience.audioEngine) {
          state.experience.audioEngine.start();
        }
      } catch (error) {
        console.error('OGOD 3D: Failed to load track:', error);
        updateLoading(100, 'Error loading track');
        state.isTransitioning = false;
      }
    };

    // Create track selector buttons
    const trackSelector = document.getElementById('ogod3d-track-selector');
    if (trackSelector && !trackSelector.dataset.initialized) {
      trackSelector.dataset.initialized = 'true';
      const tracks = ETCETER4_CONFIG.ogodTracks;

      Object.keys(tracks).forEach(num => {
        const btn = document.createElement('button');
        btn.className = `ogod3d-track-btn${
          parseInt(num) === state.currentTrack ? ' active' : ''
        }`;
        btn.dataset.track = num;
        btn.textContent = [
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
        ][num];
        btn.title = tracks[num].game;
        btn.onclick = () => loadTrack(parseInt(num));
        trackSelector.appendChild(btn);
      });
    }

    // Audio button handler
    const audioBtn = document.getElementById('ogod3d-audio-btn');
    if (audioBtn && !audioBtn.dataset.initialized) {
      audioBtn.dataset.initialized = 'true';
      audioBtn.onclick = async () => {
        if (!state.audioStarted && typeof Tone !== 'undefined') {
          await Tone.start();
          state.audioStarted = true;
          audioBtn.textContent = 'Audio Playing';
          audioBtn.classList.add('playing');

          if (state.experience?.audioEngine) {
            state.experience.audioEngine.start();
          }
        }
      };
    }

    // Back button handler
    const backBtn = document.getElementById('ogod3d-back-btn');
    if (backBtn && !backBtn.dataset.initialized) {
      backBtn.dataset.initialized = 'true';
      backBtn.onclick = e => {
        e.preventDefault();
        // Stop and dispose experience when leaving
        if (state.experience) {
          state.experience.dispose();
          state.experience = null;
        }
        showNewSection(_pID.vision);
      };
    }

    // Load initial track
    loadTrack(state.currentTrack);
  },
});

/**
 * OGOD Animation Viewer page configuration
 * Tier 4 - 2D animation viewer with mode switching
 */
pages.ogodViewer = new Page({
  id: _pID.ogodViewer,
  tier: 4,
  upLinks: [_pID.vision],
  initialize() {
    const container = document.getElementById('ogod-viewer-container');
    if (!container) {
      console.warn('OGOD Viewer: Container not found');
      return;
    }

    // Track state
    window.ogodViewerState = window.ogodViewerState || {
      currentTrack: 1,
      currentMode: 'enhanced',
      engine: null,
      audioAdapter: null,
    };

    const state = window.ogodViewerState;

    // Check for deep link query param (?ogod=N)
    const params = new URLSearchParams(window.location.search);
    const ogodParam = params.get('ogod');
    if (ogodParam) {
      const trackNum = parseInt(ogodParam);
      if (trackNum >= 1 && trackNum <= 29) {
        state.currentTrack = trackNum;
      }
    }

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

    /** Update track info display */
    const updateTrackInfo = trackNum => {
      const tracks = ETCETER4_CONFIG.ogodTracks;
      const track = tracks[trackNum];
      const infoEl = document.getElementById('ogod-viewer-track-info');
      if (infoEl && track) {
        infoEl.textContent = `Track ${romanNumerals[trackNum]} \u2014 ${track.game}`;
      }
    };

    /** Load a track with the current mode */
    const loadTrack = async trackNum => {
      // Dispose previous engine
      if (state.engine) {
        state.engine.dispose();
        state.engine = null;
      }

      state.currentTrack = trackNum;
      container.innerHTML = '';

      // Update track buttons
      document.querySelectorAll('.ogod-viewer-track-btn').forEach(btn => {
        btn.classList.toggle(
          'active',
          parseInt(btn.dataset.track) === trackNum
        );
      });

      updateTrackInfo(trackNum);

      // If 3D mode, switch to ogod3d page
      if (state.currentMode === '3d') {
        if (window.ogod3dState) {
          window.ogod3dState.currentTrack = trackNum;
        }
        showNewSection(_pID.ogod3d);
        return;
      }

      try {
        // Create audio adapter (standalone, no Tone.js needed)
        if (!state.audioAdapter) {
          state.audioAdapter = new OGODAudioAdapter({});
        }

        state.engine = new OGODAnimationEngine({
          container,
          mode: state.currentMode,
          trackNumber: trackNum,
          audioAdapter: state.audioAdapter,
        });

        const tracks = ETCETER4_CONFIG.ogodTracks;
        const trackConfig = tracks[trackNum];
        if (
          trackConfig &&
          trackConfig.palette &&
          state.engine.renderer &&
          state.engine.renderer.setPalette
        ) {
          state.engine.renderer.setPalette(trackConfig.palette);
        }

        await state.engine.initialize();
        state.engine.start();
      } catch (error) {
        console.error('OGOD Viewer: Failed to load track:', error);
      }
    };

    /** Switch rendering mode */
    const setMode = mode => {
      if (mode === state.currentMode) {
        return;
      }

      state.currentMode = mode;

      // Update mode buttons
      document.querySelectorAll('.ogod-viewer-mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
      });

      if (mode === '3d') {
        if (window.ogod3dState) {
          window.ogod3dState.currentTrack = state.currentTrack;
        }
        showNewSection(_pID.ogod3d);
        return;
      }

      if (state.engine) {
        state.engine.setMode(mode);
      } else {
        loadTrack(state.currentTrack);
      }
    };

    // Build track selector
    const trackSelector = document.getElementById('ogod-viewer-track-selector');
    if (trackSelector && !trackSelector.dataset.initialized) {
      trackSelector.dataset.initialized = 'true';
      const tracks = ETCETER4_CONFIG.ogodTracks;

      Object.keys(tracks).forEach(num => {
        const btn = document.createElement('button');
        btn.className = `ogod3d-track-btn ogod-viewer-track-btn${parseInt(num) === state.currentTrack ? ' active' : ''}`;
        btn.dataset.track = num;
        btn.textContent = romanNumerals[num];
        btn.title = tracks[num].game;
        btn.onclick = () => loadTrack(parseInt(num));
        trackSelector.appendChild(btn);
      });
    }

    // Mode selector
    const modeSelector = document.getElementById('ogod-viewer-mode-selector');
    if (modeSelector && !modeSelector.dataset.initialized) {
      modeSelector.dataset.initialized = 'true';
      modeSelector.querySelectorAll('.ogod-viewer-mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === state.currentMode);
        btn.onclick = () => setMode(btn.dataset.mode);
      });
    }

    // Back button
    const backBtn = document.getElementById('ogod-viewer-back-btn');
    if (backBtn && !backBtn.dataset.initialized) {
      backBtn.dataset.initialized = 'true';
      backBtn.onclick = e => {
        e.preventDefault();
        if (state.engine) {
          state.engine.dispose();
          state.engine = null;
        }
        showNewSection(_pID.vision);
      };
    }

    // Pause button
    const pauseBtn = document.getElementById('ogod-viewer-pause-btn');
    if (pauseBtn && !pauseBtn.dataset.initialized) {
      pauseBtn.dataset.initialized = 'true';
      pauseBtn.onclick = () => {
        if (state.engine) {
          state.engine.togglePause();
          pauseBtn.textContent = state.engine.isPaused ? 'Play' : 'Pause';
        }
      };
    }

    // Custom image file input
    const fileInput = document.getElementById('ogod-viewer-file-input');
    if (fileInput && !fileInput.dataset.initialized) {
      fileInput.dataset.initialized = 'true';
      fileInput.onchange = async e => {
        const file = e.target.files[0];
        if (!file) {
          return;
        }
        const url = URL.createObjectURL(file);
        if (state.engine) {
          await state.engine.setCustomImage(url);
        }
      };
    }

    // Keyboard controls
    const keyHandler = e => {
      if (
        document.activeElement &&
        document.activeElement.tagName === 'INPUT'
      ) {
        return;
      }
      switch (e.key) {
        case ' ':
          e.preventDefault();
          if (state.engine) {
            state.engine.togglePause();
            if (pauseBtn) {
              pauseBtn.textContent = state.engine.isPaused ? 'Play' : 'Pause';
            }
          }
          break;
        case '1':
          setMode('faithful');
          break;
        case '2':
          setMode('enhanced');
          break;
        case '3':
          setMode('generative');
          break;
        case 'ArrowLeft':
          if (state.currentTrack > 1) {
            loadTrack(state.currentTrack - 1);
          }
          break;
        case 'ArrowRight':
          if (state.currentTrack < 29) {
            loadTrack(state.currentTrack + 1);
          }
          break;
      }
    };
    document.addEventListener('keydown', keyHandler);
    // Store for cleanup
    window._ogodViewerKeyHandler = keyHandler;

    // Load initial track
    loadTrack(state.currentTrack);
  },
});

/**
 * Wing page configurations
 * Tier 3 - Navigation hubs for chamber groupings
 */
pages.eastWing = new Page({
  id: _pID.eastWing,
  tier: 3,
  upLinks: [_pID.menu],
  downLinks: [_pID.akademia, _pID.bibliotheke, _pID.pinakotheke],
});

pages.westWing = new Page({
  id: _pID.westWing,
  tier: 3,
  upLinks: [_pID.menu],
  downLinks: [_pID.agora, _pID.symposion, _pID.oikos],
});

pages.southWing = new Page({
  id: _pID.southWing,
  tier: 3,
  upLinks: [_pID.menu],
  downLinks: [_pID.odeion, _pID.theatron],
});

pages.northWing = new Page({
  id: _pID.northWing,
  tier: 3,
  upLinks: [_pID.menu],
  downLinks: [_pID.ergasterion, _pID.khronos],
});

/**
 * Initialize section navigation filtering for a chamber
 * Binds click handlers to .section-btn elements that show/hide .chamber-card elements
 * @param {string} sectionId - The chamber's section ID selector (e.g., '#akademia')
 */
function initChamberSectionNav(sectionId) {
  const el = $(sectionId);
  el.find('.section-btn').on('click', function () {
    el.find('.section-btn').removeClass('active');
    $(this).addClass('active');
    const section = $(this).data('section');
    el.find('.chamber-card').each(function () {
      const show = section === 'all' || $(this).data('section') === section;
      $(this).toggleClass('dn', !show);
    });
  });
}

/**
 * Chamber page configurations
 * Tier 4 - Individual chambers within each wing
 */
pages.akademia = new Page({
  id: _pID.akademia,
  tier: 4,
  upLinks: [_pID.eastWing],
  initialize() {
    replacePlaceholders(this.id);
    initChamberSectionNav(this.id);
  },
});

pages.bibliotheke = new Page({
  id: _pID.bibliotheke,
  tier: 4,
  upLinks: [_pID.eastWing],
  initialize() {
    replacePlaceholders(this.id);
    initChamberSectionNav(this.id);
  },
});

pages.oikos = new Page({
  id: _pID.oikos,
  tier: 4,
  upLinks: [_pID.westWing],
  initialize() {
    replacePlaceholders(this.id);
    initChamberSectionNav(this.id);
  },
});

pages.pinakotheke = new Page({
  id: _pID.pinakotheke,
  tier: 4,
  upLinks: [_pID.eastWing],
  initialize() {
    replacePlaceholders(this.id);
    initChamberSectionNav(this.id);
  },
});

pages.agora = new Page({
  id: _pID.agora,
  tier: 4,
  upLinks: [_pID.westWing],
  initialize() {
    replacePlaceholders(this.id);
    initChamberSectionNav(this.id);
  },
});

pages.symposion = new Page({
  id: _pID.symposion,
  tier: 4,
  upLinks: [_pID.westWing],
  initialize() {
    replacePlaceholders(this.id);
    initChamberSectionNav(this.id);
  },
});

pages.odeion = new Page({
  id: _pID.odeion,
  tier: 4,
  upLinks: [_pID.southWing],
  initialize() {
    replacePlaceholders(this.id);
    initChamberSectionNav(this.id);
    // Initialize enhanced audio player if available
    if (typeof EnhancedAudioPlayer !== 'undefined') {
      try {
        const playerContainer = document.getElementById(
          'odeion-player-container'
        );
        const waveformCanvas = document.getElementById('odeion-waveform');
        if (playerContainer && waveformCanvas) {
          window.odeionPlayer = new EnhancedAudioPlayer({
            container: playerContainer,
            waveformCanvas,
          });
          if (typeof WaveformVisualizer !== 'undefined') {
            window.odeionWaveform = new WaveformVisualizer({
              canvas: waveformCanvas,
              primaryColor: '#FFD700',
              secondaryColor: '#000000',
            });
          }
        }
      } catch (audioError) {
        console.warn('Odeion audio player init:', audioError.message);
      }
    }
  },
});

pages.theatron = new Page({
  id: _pID.theatron,
  tier: 4,
  upLinks: [_pID.southWing],
  initialize() {
    replacePlaceholders(this.id);
    initChamberSectionNav(this.id);
    // Initialize enhanced video player if available
    if (typeof EnhancedVideoPlayer !== 'undefined') {
      try {
        const videoContainer = document.getElementById(
          'theatron-video-container'
        );
        if (videoContainer) {
          window.theatronPlayer = new EnhancedVideoPlayer({
            container: videoContainer,
          });
        }
      } catch (videoError) {
        console.warn('Theatron video player init:', videoError.message);
      }
    }
  },
});

pages.ergasterion = new Page({
  id: _pID.ergasterion,
  tier: 4,
  upLinks: [_pID.northWing],
  initialize() {
    replacePlaceholders(this.id);
    initChamberSectionNav(this.id);
  },
});

pages.khronos = new Page({
  id: _pID.khronos,
  tier: 4,
  upLinks: [_pID.northWing],
  initialize() {
    replacePlaceholders(this.id);
    initChamberSectionNav(this.id);
  },
});

/**
 * Discovery page configuration
 * Tier 2 - Same level as menu for quick access
 * Unified search and filtering across all chambers
 */
pages.discovery = new Page({
  id: _pID.discovery,
  tier: 2,
  upLinks: [_pID.menu],
  initialize() {
    // Initialize discovery controller
    if (typeof DiscoveryController !== 'undefined') {
      DiscoveryController.initialize();
    }
  },
});

pages = [
  pages.menu,
  pages.sound,
  pages.stills,
  pages.diary,
  pages.info,
  pages.ogod3d,
  pages.ogodViewer,
  pages.eastWing,
  pages.westWing,
  pages.southWing,
  pages.northWing,
  pages.akademia,
  pages.bibliotheke,
  pages.oikos,
  pages.pinakotheke,
  pages.agora,
  pages.symposion,
  pages.odeion,
  pages.theatron,
  pages.ergasterion,
  pages.khronos,
  pages.discovery,
  new Page({
    id: _pID.landing,
    tier: 1,
    downLinks: [_pID.menu],
  }),
  new Page({
    id: _pID.vision,
    tier: 3,
    upLinks: [_pID.menu],
    downLinks: [_pID.ogod3d, _pID.ogodViewer],
  }),
  new Page({
    id: _pID.words,
    tier: 3,
    downLinks: [_pID.diary, _pID.blog],
    upLinks: [_pID.menu],
  }),
  new Page({
    id: _pID.blog,
    tier: 4,
    upLinks: [_pID.words],
  }),
  new Page({
    id: _pID.video,
    tier: 4,
    upLinks: [_pID.vision],
  }),
];

// taken from here: https://api.jquery.com/jquery.getscript/
jQuery.cachedScript = function (url, options) {
  // Allow user to set any option except for dataType, cache, and url
  options = $.extend(options || {}, {
    dataType: 'script',
    cache: true,
    url,
  });

  // Use $.ajax() since it is more flexible than $.getScript
  // Return the jqXHR object so we can chain callbacks
  return $.ajax(options);
};
