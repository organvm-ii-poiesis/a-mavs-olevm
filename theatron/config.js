/**
 * @file theatron/config.js
 * @description THEATRON chamber configuration
 * Metadata for performances, rehearsals, and stage documentation
 * Dramatic, theatrical styling with purple primary color and velvet red secondary
 */

"use strict";

/**
 * @global {Object} THEATRON_CONFIG - Theatron chamber configuration
 */
// eslint-disable-next-line no-unused-vars
const THEATRON_CONFIG = {
  /**
   * Chamber identification and display
   */
  chamber: {
    id: "theatron",
    name: "THEATRON",
    subtitle: "Performance recordings, rehearsals, stage",
    description:
      "The dramatic stage chamber of performance documentation, rehearsal processes, and theatrical presentation",
    color: "#800080",
    secondaryColor: "#C71585",
    darkColor: "#4B0082",
    lightColor: "#DDA0DD",
    velvetRed: "#8B0000",
  },

  /**
   * Sections configuration
   * Each section has metadata and entry management settings
   */
  sections: {
    performances: {
      id: "performances",
      name: "PERFORMANCES",
      icon: "🎭",
      description: "Complete performance recordings and documentation",
      color: "#800080",
      entryCount: 0,
      sortOrder: "desc",
      dateFormat: "MMDDYY",
      storageKey: "theatron-performances",
    },
    rehearsals: {
      id: "rehearsals",
      name: "REHEARSALS",
      icon: "🎬",
      description: "Rehearsal processes and creative development",
      color: "#C71585",
      entryCount: 0,
      sortOrder: "desc",
      dateFormat: "MMDDYY",
      storageKey: "theatron-rehearsals",
    },
  },

  /**
   * Performance video entries
   * Each entry contains metadata for video playback
   */
  performances: [
    {
      id: "electronica-2015",
      title: "Live at Electronica 1.3",
      venue: "Detroit Electronic Music Festival",
      year: 2015,
      duration: "45:00",
      description:
        "Full audiovisual performance with live synthesis and video manipulation. Features material from OGOD album with real-time glitch processing.",
      thumbnail: "/video/performances/electronica-2015/thumb.jpg",
      category: "live",
      chapters: [
        { time: 0, title: "Opening / Ambient Intro" },
        { time: 180, title: "Animal Crossing (OGOD 01)" },
        { time: 480, title: "Castlevania (OGOD 02)" },
        { time: 780, title: "Chrono Trigger (OGOD 03)" },
        { time: 1080, title: "Visual Interlude" },
        { time: 1380, title: "Golden Sun (OGOD 09)" },
        { time: 1680, title: "Wind Waker (OGOD 28)" },
        { time: 1980, title: "Finale / Applause" },
      ],
      subtitles: [],
      tags: ["live", "audiovisual", "ogod", "2015"],
    },
    {
      id: "ogod-release-show",
      title: "OGOD Album Release Show",
      venue: "The Loft",
      year: 2015,
      duration: "62:00",
      description:
        "Album release performance celebrating OGOD. Full album performance with expanded visual arrangements and guest appearances.",
      thumbnail: "/video/performances/ogod-release-show/thumb.jpg",
      category: "live",
      chapters: [
        { time: 0, title: "Introduction" },
        { time: 120, title: "Side A: 1-10" },
        { time: 1800, title: "Intermission" },
        { time: 1920, title: "Side B: 11-20" },
        { time: 3300, title: "Side C: 21-29" },
        { time: 3600, title: "Encore" },
      ],
      subtitles: [],
      tags: ["album release", "live", "ogod", "2015"],
    },
    {
      id: "modular-session-01",
      title: "Modular Synthesis Session #1",
      venue: "Studio",
      year: 2018,
      duration: "28:00",
      description:
        "Experimental session with Eurorack modular synthesizer. Exploring generative patches and audio-reactive visuals.",
      thumbnail: "/video/performances/modular-session-01/thumb.jpg",
      category: "studio",
      chapters: [
        { time: 0, title: "Patch Overview" },
        { time: 300, title: "Generative Sequence" },
        { time: 900, title: "Audio-Reactive Visuals" },
        { time: 1400, title: "Improvisation" },
      ],
      subtitles: [],
      tags: ["modular", "experimental", "studio", "2018"],
    },
  ],

  /**
   * Rehearsal video entries
   */
  rehearsals: [
    {
      id: "electronica-prep-01",
      title: "Electronica 1.3 Rehearsal",
      venue: "Studio",
      year: 2015,
      duration: "35:00",
      description:
        "Preparation session for the Electronica 1.3 performance. Testing visual sync, audio routing, and performance flow.",
      thumbnail: "/video/rehearsals/electronica-prep-01/thumb.jpg",
      category: "rehearsal",
      chapters: [
        { time: 0, title: "Setup & Sound Check" },
        { time: 600, title: "Set Run-Through" },
        { time: 1500, title: "Visual Sync Testing" },
      ],
      subtitles: [],
      tags: ["rehearsal", "electronica", "2015"],
    },
    {
      id: "visual-dev-session",
      title: "Visual Development Session",
      venue: "Studio",
      year: 2016,
      duration: "42:00",
      description:
        "Development session for new live visual system. Exploring shader programming and real-time audio analysis integration.",
      thumbnail: "/video/rehearsals/visual-dev-session/thumb.jpg",
      category: "development",
      chapters: [
        { time: 0, title: "Shader Setup" },
        { time: 720, title: "Audio Analysis Integration" },
        { time: 1440, title: "Testing with Tracks" },
        { time: 2100, title: "Notes & Next Steps" },
      ],
      subtitles: [],
      tags: ["development", "visuals", "shaders", "2016"],
    },
  ],

  /**
   * Video player configuration
   * Settings for EnhancedVideoPlayer integration
   */
  videoPlayer: {
    enabled: true,
    defaultQuality: "auto",
    defaultVolume: 0.8,
    allowFullscreen: true,
    showControls: true,
    autoPlay: false,
    preload: "metadata",
    responsive: true,
    playbackRates: [0.75, 1, 1.25, 1.5],
  },

  /**
   * Performance entry display and formatting
   */
  entries: {
    // Maximum characters per entry preview
    previewLength: 500,
    // Character limit for full entry display
    maxLength: 100000,
    // Whether to show timestamps
    showTimestamp: true,
    // Date display format (MMDDYY or YYYY-MM-DD)
    dateDisplay: "MMDDYY",
    // Truncation indicator
    truncationMarker: "…",
    // Show entry count per section
    showCounts: true,
    // Enable entry search
    searchEnabled: true,
    // Show performance duration
    showDuration: true,
  },

  /**
   * Storage configuration
   * How entries are persisted and managed
   */
  storage: {
    // Use localStorage for entries
    enabled: true,
    // Sync to server endpoint (optional)
    syncEnabled: false,
    syncEndpoint: "/api/chambers/theatron/entries",
    // Backup frequency in milliseconds (24 hours)
    backupInterval: 86400000,
    // Maximum stored entries per section
    maxEntriesPerSection: 500,
  },

  /**
   * Animation and UI settings
   * Dramatic, theatrical styling with spotlight effects
   */
  ui: {
    // Fade in duration for entries (ms)
    fadeInDuration: 800,
    // Transition between sections (ms)
    transitionDuration: 400,
    // Show/hide animation easing
    easing: "easeInOutQuad",
    // Card hover effects
    hoverEffects: true,
    // Glow intensity on hover
    glowIntensity: 0.5,
    // Spotlight effect intensity
    spotlightIntensity: 0.8,
    // Enable dramatic dark background
    dramatiCBackground: true,
  },

  /**
   * Privacy and security
   */
  privacy: {
    // Whether entries are private by default
    private: false,
    // Allow sharing of individual performances
    allowSharing: true,
    // Encrypt stored entries (client-side)
    encryptionEnabled: false,
    // Auto-lock after inactivity (minutes)
    autoLockTimeout: 60,
  },

  /**
   * Living Pantheon integration
   * Enables animated effects and ambient audio for the chamber
   */
  livingPantheon: {
    enabled: true,
    systems: {
      glitch: {
        enabled: true,
        frequency: 0.01, // 1% chance per frame
        intensity: 0.2,
      },
      ambient: {
        enabled: true,
        volume: 0.03,
        tracks: [
          {
            name: "theatron-ambient",
            path: "/audio/ambient/theatron-ambient.mp3",
            loop: true,
          },
        ],
      },
      morphing: {
        enabled: false, // Reserved for future visual effects
      },
      animation: {
        enabled: true,
        breathing: true,
        textDrift: true,
        pulseIntensity: 0.4,
      },
    },
  },

  /**
   * Metadata for entry templates
   */
  entryTemplate: {
    performances: {
      prompt: "Document this performance",
      placeholder: "Performance title, date, duration, notes...",
      fields: [
        "title",
        "date",
        "duration",
        "venue",
        "description",
        "technicalNotes",
      ],
    },
    rehearsals: {
      prompt: "Record this rehearsal session",
      placeholder: "Rehearsal focus, objectives, notes...",
      fields: ["date", "duration", "focus", "objectives", "notes", "nextSteps"],
    },
  },

  /**
   * Metadata for search engines and social sharing
   */
  metadata: {
    og: {
      title: "THEATRON | ET CETER4",
      description:
        "Performance recordings, rehearsals, and stage documentation",
      image: "/img/og/theatron-og.jpg",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "THEATRON | ET CETER4",
      description:
        "Performance chamber: recordings, rehearsals, and theatrical documentation",
      image: "/img/og/theatron-og.jpg",
    },
  },

  /**
   * Navigation configuration
   */
  navigation: {
    backLink: "../index.html#menu",
    backText: "Back to Naos",
    sectionNav: true,
    footerLinks: [
      { text: "ETCETER4", href: "../index.html#landing" },
      { text: "NAOS", href: "../index.html#menu" },
      { text: "SITE MAP", href: "../sitemap.html" },
    ],
  },

  /**
   * Accessibility settings
   */
  accessibility: {
    storageKey: "etceter4-theatron-prefs",
    ariaLabels: {
      performances: "Performances section",
      rehearsals: "Rehearsals section",
      videoPlayer: "Performance video player",
    },
  },

  /**
   * Wing designation
   * THEATRON is part of the South Wing (performance/presentation)
   */
  wing: {
    id: "south",
    name: "South Wing",
    description: "Performance and presentation chambers",
  },
};
