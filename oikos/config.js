─────┬──────────────────────────────────────────────────────────────────────────
     │ STDIN
─────┼──────────────────────────────────────────────────────────────────────────
   1 │ /**
   2 │  * @file oikos/config.js
   3 │  * @description OIKOS chamber configuration
   4 │  * Metadata for reflections, dreams, and confessions sections
   5 │  */
   6 │ 
   7 │ 'use strict';
   8 │ 
   9 │ /**
  10 │  * @global {Object} OIKOS_CONFIG - Oikos chamber configuration
  11 │  */
  12 │ // eslint-disable-next-line no-unused-vars
  13 │ const OIKOS_CONFIG = {
  14 │   /**
  15 │    * Chamber identification and display
  16 │    */
  17 │   chamber: {
  18 │     id: 'oikos',
  19 │     name: 'OIKOS',
  20 │     subtitle: 'Reflections, dreams, confessions',
  21 │     description: 'The intimate chamber of personal reflection, unconscious exploration, and honest confession',
  22 │     color: '#FF8C00',
  23 │     secondaryColor: '#FFB6C1',
  24 │     darkColor: '#CC7000',
  25 │     lightColor: '#FFD9B3',
  26 │   },
  27 │ 
  28 │   /**
  29 │    * Sections configuration
  30 │    * Each section has metadata and entry management settings
  31 │    */
  32 │   sections: {
  33 │     reflections: {
  34 │       id: 'reflections',
  35 │       name: 'REFLECTIONS',
  36 │       icon: '◇',
  37 │       description: 'Conscious observations and meditations',
  38 │       color: '#FF8C00',
  39 │       entryCount: 0,
  40 │       sortOrder: 'desc', // Most recent first
  41 │       dateFormat: 'MMDDYY',
  42 │       storageKey: 'oikos-reflections',
  43 │     },
  44 │     dreams: {
  45 │       id: 'dreams',
  46 │       name: 'DREAMS',
  47 │       icon: '◐',
  48 │       description: 'Nocturnal visions and subconscious narratives',
  49 │       color: '#FFB6C1',
  50 │       entryCount: 0,
  51 │       sortOrder: 'desc',
  52 │       dateFormat: 'MMDDYY',
  53 │       storageKey: 'oikos-dreams',
  54 │     },
  55 │     confessions: {
  56 │       id: 'confessions',
  57 │       name: 'CONFESSIONS',
  58 │       icon: '◆',
  59 │       description: 'Honest admissions and vulnerable truths',
  60 │       color: '#FFD9B3',
  61 │       entryCount: 0,
  62 │       sortOrder: 'desc',
  63 │       dateFormat: 'MMDDYY',
  64 │       storageKey: 'oikos-confessions',
  65 │     },
  66 │   },
  67 │ 
  68 │   /**
  69 │    * Entry display and formatting
  70 │    */
  71 │   entries: {
  72 │     // Maximum characters per entry preview
  73 │     previewLength: 300,
  74 │     // Character limit for full entry display
  75 │     maxLength: 50000,
  76 │     // Whether to show timestamps
  77 │     showTimestamp: true,
  78 │     // Date display format (MMDDYY or YYYY-MM-DD)
  79 │     dateDisplay: 'MMDDYY',
  80 │     // Truncation indicator
  81 │     truncationMarker: '…',
  82 │     // Show entry count per section
  83 │     showCounts: true,
  84 │     // Enable entry search
  85 │     searchEnabled: true,
  86 │   },
  87 │ 
  88 │   /**
  89 │    * Storage configuration
  90 │    * How entries are persisted and managed
  91 │    */
  92 │   storage: {
  93 │     // Use localStorage for entries
  94 │     enabled: true,
  95 │     // Sync to server endpoint (optional)
  96 │     syncEnabled: false,
  97 │     syncEndpoint: '/api/chambers/oikos/entries',
  98 │     // Backup frequency in milliseconds (24 hours)
  99 │     backupInterval: 86400000,
 100 │     // Maximum stored entries per section
 101 │     maxEntriesPerSection: 1000,
 102 │   },
 103 │ 
 104 │   /**
 105 │    * Animation and UI settings
 106 │    */
 107 │   ui: {
 108 │     // Fade in duration for entries (ms)
 109 │     fadeInDuration: 500,
 110 │     // Transition between sections (ms)
 111 │     transitionDuration: 300,
 112 │     // Show/hide animation easing
 113 │     easing: 'easeInOutQuad',
 114 │     // Card hover effects
 115 │     hoverEffects: true,
 116 │     // Glow intensity on hover
 117 │     glowIntensity: 0.3,
 118 │   },
 119 │ 
 120 │   /**
 121 │    * Privacy and security
 122 │    */
 123 │   privacy: {
 124 │     // Whether entries are private by default
 125 │     private: true,
 126 │     // Allow sharing of individual entries
 127 │     allowSharing: false,
 128 │     // Encrypt stored entries (client-side)
 129 │     encryptionEnabled: false,
 130 │     // Auto-lock after inactivity (minutes)
 131 │     autoLockTimeout: 30,
 132 │   },
 133 │ 
 134 │   /**
 135 │    * Metadata for entry templates
 136 │    */
 137 │   entryTemplate: {
 138 │     reflections: {
 139 │       prompt: 'What clarity emerged today?',
 140 │       placeholder: 'Record your observation...',
 141 │     },
 142 │     dreams: {
 143 │       prompt: 'What did your unconscious reveal?',
 144 │       placeholder: 'Describe your dream...',
 145 │     },
 146 │     confessions: {
 147 │       prompt: 'What truth do you need to speak?',
 148 │       placeholder: 'Write your confession...',
 149 │     },
 150 │   },
 151 │ };
─────┴──────────────────────────────────────────────────────────────────────────
