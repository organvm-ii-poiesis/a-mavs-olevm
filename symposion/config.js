/**
 * @file symposion/config.js
 * @description Content metadata and configuration for the Symposion chamber
 * Dialogues, interviews, conversations — West Wing, discourse & collaborative thought
 */

'use strict';

/**
 * @global {Object} SYMPOSION_CONFIG - Symposion chamber configuration
 */
// eslint-disable-next-line no-unused-vars
const SYMPOSION_CONFIG = {
  /**
   * Chamber Identity
   */
  chamber: {
    id: 'symposion',
    name: 'SYMPOSION',
    subtitle: 'Dialogues, interviews, conversations',
    description: 'Multi-voice format exploring collaborative discourse, artistic dialogue, and conversational thought.',
    wing: 'west',
    color: '#722F37',
    secondaryColor: '#F5F5DC',
  },

  /**
   * Interviews Section
   * One-on-one conversations and structured Q&A
   */
  interviews: [
    {
      id: 'interview-001',
      title: 'Interview with [Guest Name]',
      slug: 'interview-guest-name',
      date: '2024-01-15',
      speakers: ['ET CETER4', '[Guest Name]'],
      speakerColors: ['#722F37', '#A0522D'],
      excerpt: 'A structured exploration of artistic practice and creative philosophy.',
      featured: true,
      file: 'interviews/interview-001.html',
    },
    {
      id: 'interview-002',
      title: 'Interview with [Another Guest]',
      slug: 'interview-another-guest',
      date: '2023-12-20',
      speakers: ['ET CETER4', '[Another Guest]'],
      speakerColors: ['#722F37', '#8B4513'],
      excerpt: 'Discussing themes of storytelling, music, and visual art.',
      featured: false,
      file: 'interviews/interview-002.html',
    },
  ],

  /**
   * Conversations Section
   * Informal dialogues and multi-voice exchanges
   */
  conversations: [
    {
      id: 'conversation-001',
      title: 'Conversation on Creative Process',
      slug: 'conversation-creative-process',
      date: '2024-01-10',
      speakers: ['ET CETER4', 'Collaborator A', 'Collaborator B'],
      speakerColors: ['#722F37', '#A0522D', '#8B4513'],
      excerpt: 'An informal dialogue exploring the intersection of music, code, and visual art.',
      featured: true,
      file: 'conversations/conversation-001.html',
    },
    {
      id: 'conversation-002',
      title: 'Conversation on Digital Art and Glitch',
      slug: 'conversation-digital-art-glitch',
      date: '2023-11-30',
      speakers: ['ET CETER4', 'Artist'],
      speakerColors: ['#722F37', '#CD919E'],
      excerpt: 'Exploring aesthetics of error, digital decay, and intentional glitch in artistic practice.',
      featured: false,
      file: 'conversations/conversation-002.html',
    },
  ],

  /**
   * Display and Layout Configuration
   */
  display: {
    // Grid layout for dialogue cards
    gridColumns: {
      desktop: 3,
      tablet: 2,
      mobile: 1,
    },
    // Card styling
    cardStyle: {
      shadow: true,
      hoverEffect: 'lift',
      borderColor: 'symposion-primary',
    },
    // Conversation badges styling
    speakerBadges: {
      position: 'inline',
      style: 'pill',
      animated: true,
    },
  },

  /**
   * Typography Configuration
   * Elegant, conversational fonts aligned with chamber aesthetic
   */
  typography: {
    // Serif fonts for body text (conversational feel)
    serif: "'Bodoni Moda', Georgia, serif",
    // Sans-serif for headers (clarity)
    sansSerif: "'Futura', 'Century Gothic', sans-serif",
    // Monospace for speaker names (attribution clarity)
    mono: "'IBM Plex Mono', 'Monaco', monospace",

    // Font sizes
    sizes: {
      dialogueTitle: '1.5rem',
      speakerLabel: '0.75rem',
      dialogueText: '1rem',
      excerpt: '0.95rem',
    },

    // Line heights
    lineHeights: {
      tight: 1.3,
      normal: 1.5,
      relaxed: 1.7,
    },
  },

  /**
   * Color Palette
   * Primary: Wine/Maroon (#722F37)
   * Secondary: Cream (#F5F5DC)
   * Accents: Sienna, Chocolate for speaker variety
   */
  colors: {
    primary: '#722F37',
    secondary: '#F5F5DC',
    dark: '#3E1B23',
    light: '#A0522D',
    accent1: '#8B4513',     // Chocolate
    accent2: '#CD919E',     // Rosy brown
    accent3: '#A0522D',     // Sienna
    accent4: '#8B7355',     // Burlywood
    text: '#1a1a1a',
    textLight: '#666666',
    border: 'rgba(114, 47, 55, 0.2)',
    background: '#fafaf8',
    backgroundAlt: '#f5f5f0',
  },

  /**
   * Speaker Configuration
   * Define speaker styling and identification
   */
  speakers: {
    roles: {
      artist: {
        label: 'ET',
        color: '#722F37',
        icon: '◆',
      },
      guest: {
        label: 'Guest',
        color: '#A0522D',
        icon: '◇',
      },
      collaborator: {
        label: 'Voice',
        color: '#8B4513',
        icon: '◈',
      },
    },
    // Attribution format
    format: 'Role: Name',
    // Show speaker color on dialogue text
    textColorBySpeaker: true,
  },

  /**
   * Dialogue Features
   * Special formatting for multi-voice content
   */
  dialogueFeatures: {
    // Quote styling
    quotes: {
      enabled: true,
      leftBorder: true,
      borderColor: 'symposion-primary',
    },
    // Alternating speaker indentation
    indentation: {
      enabled: true,
      amount: '1.5rem',
    },
    // Time markers for long dialogues
    timeMarkers: {
      enabled: false,
      interval: 300, // seconds
    },
    // Speaker interruptions (em-dashes)
    interruptions: {
      enabled: true,
      marker: '—',
    },
  },

  /**
   * Navigation and Filtering
   */
  navigation: {
    // Section filters
    sections: ['all', 'interviews', 'conversations'],
    // Sort order
    sortBy: 'date',
    sortOrder: 'descending',
    // Featured content highlighting
    featuredFirst: true,
  },

  /**
   * Metadata and SEO
   */
  metadata: {
    // Open Graph tags
    og: {
      title: 'SYMPOSION | Dialogues & Conversations',
      description: 'Multi-voice explorations of artistic practice and creative philosophy',
      image: 'img/og/symposion-og.jpg',
    },
    // Schema.org markup for interviews
    schema: 'Conversation',
    // Accessibility
    a11y: {
      roleAttribute: 'article',
      transcriptAvailable: true,
      audioDescription: false,
    },
  },

  /**
   * Content Loading
   */
  loading: {
    // Lazy load dialogue transcripts
    lazy: true,
    // Show loading indicator
    showIndicator: true,
    // Cache strategy
    cache: true,
    // Animation on load
    fadeIn: true,
  },
};
