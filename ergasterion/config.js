/**
 * @file ergasterion/config.js
 * @description ERGASTERION chamber configuration
 * Metadata for code experiments, prototypes, and interactive tools
 */

'use strict';

/**
 * @global {Object} ERGASTERION_CONFIG - Ergasterion chamber configuration
 */
// eslint-disable-next-line no-unused-vars
const ERGASTERION_CONFIG = {
  /**
   * Chamber identification and display
   */
  chamber: {
    id: 'ergasterion',
    name: 'ERGASTERION',
    subtitle: 'Code experiments, prototypes, interactive demos',
    description: 'The workshop and laboratory of ETCETER4: interactive code experiments, algorithmic explorations, and technical prototypes',
    color: '#00FF00',
    secondaryColor: '#000000',
    darkColor: '#228B22',
    lightColor: '#BFFF00',
    wing: 'North',
  },

  /**
   * Sections configuration
   * Each section represents a category of code/technical work
   */
  sections: {
    experiments: {
      id: 'experiments',
      name: 'EXPERIMENTS',
      icon: '⚗',
      description: 'Algorithmic explorations and generative art sketches',
      color: '#00FF00',
      entryCount: 0,
      sortOrder: 'desc',
      storageKey: 'ergasterion-experiments',
    },
    tools: {
      id: 'tools',
      name: 'TOOLS',
      icon: '⚙',
      description: 'Interactive utilities and code sandboxes',
      color: '#BFFF00',
      entryCount: 0,
      sortOrder: 'desc',
      storageKey: 'ergasterion-tools',
    },
  },

  /**
   * Code execution environment
   */
  execution: {
    // Enable sandboxed iframe execution
    sandboxEnabled: true,
    // Sandbox permissions
    sandboxAttributes: 'allow-scripts allow-same-origin allow-popups',
    // Maximum script execution time (ms)
    executionTimeout: 5000,
    // Enable console output capture
    captureConsole: true,
    // Enable error logging
    logErrors: true,
  },

  /**
   * Code display and formatting
   */
  code: {
    // Default language for syntax highlighting
    defaultLanguage: 'javascript',
    // Show line numbers
    showLineNumbers: true,
    // Enable copy-to-clipboard
    copyEnabled: true,
    // Syntax theme (light/dark)
    theme: 'dark',
    // Tab size in spaces
    tabSize: 2,
    // Code preview character limit
    previewLength: 500,
    // Enable code editing inline
    editEnabled: false,
  },

  /**
   * Project/experiment metadata
   */
  projects: {
    // Allow creation of new experiments
    creationEnabled: true,
    // Maximum file size for uploads (bytes)
    maxFileSize: 5242880, // 5MB
    // Supported file types
    supportedTypes: ['js', 'html', 'css', 'json', 'txt'],
    // Show metadata (created, modified dates)
    showMetadata: true,
    // Enable version history
    versionControl: false,
  },

  /**
   * Storage configuration
   */
  storage: {
    // Use localStorage for project data
    enabled: true,
    // Sync to server endpoint (optional)
    syncEnabled: false,
    syncEndpoint: '/api/chambers/ergasterion/projects',
    // Backup frequency in milliseconds (24 hours)
    backupInterval: 86400000,
    // Maximum stored projects
    maxProjects: 50,
  },

  /**
   * Animation and UI settings
   */
  ui: {
    // Fade in duration for code blocks (ms)
    fadeInDuration: 400,
    // Transition between sections (ms)
    transitionDuration: 300,
    // Terminal effect (typewriter-like)
    terminalEffect: true,
    // Cursor blink rate (ms)
    cursorBlinkRate: 600,
    // Glow intensity on hover
    glowIntensity: 0.4,
    // Show/hide animation easing
    easing: 'easeInOutQuad',
  },

  /**
   * Terminal/hacker aesthetic settings
   */
  terminal: {
    // Font family for code
    fontFamily: 'Monaco, "Courier New", monospace',
    // Font size (px)
    fontSize: 14,
    // Line height multiplier
    lineHeight: 1.5,
    // Background color
    backgroundColor: '#000000',
    // Text color
    textColor: '#00FF00',
    // Accent color
    accentColor: '#BFFF00',
    // Border style (pixels)
    borderWidth: 2,
    // Show scan lines effect
    scanLines: false,
    // Show cursor in code blocks
    showCursor: true,
  },

  /**
   * Documentation and help
   */
  docs: {
    // Enable documentation panel
    docsEnabled: true,
    // Show inline help
    inlineHelp: true,
    // External API docs links
    externalDocs: {
      javascript: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
      html: 'https://developer.mozilla.org/en-US/docs/Web/HTML',
      css: 'https://developer.mozilla.org/en-US/docs/Web/CSS',
    },
  },

  /**
   * Gallery/showcase settings
   */
  gallery: {
    // Show project thumbnails
    thumbnailsEnabled: true,
    // Thumbnail size (px)
    thumbnailSize: 200,
    // Grid columns (responsive)
    gridColumns: {
      desktop: 3,
      tablet: 2,
      mobile: 1,
    },
    // Show project stats (runs, views, forks)
    showStats: true,
  },

  /**
   * Sharing and collaboration
   */
  sharing: {
    // Enable project sharing
    sharingEnabled: true,
    // Allow forking
    forkingEnabled: true,
    // Allow commenting
    commentsEnabled: false,
    // Show author info
    showAuthor: true,
  },
};
