/**
 * Bibliotheke Chamber Configuration
 * Defines content metadata, sections, and settings for the literary chamber
 * Part of ETCETER4 Pantheon Project
 *
 * Chamber Details:
 * - Name: BIBLIOTHEKE
 * - Subtitle: Poetry, prose, lyrics, literary criticism
 * - Color: #8B4513 (brown)
 * - Secondary Color: #F5F5DC (cream)
 */

'use strict';

/**
 * Bibliotheke configuration object
 * Contains metadata for poetry, prose, lyrics, and critical essays
 */
const bibliothekeConfig = {
  chamberId: 'bibliotheke',
  chamberName: 'BIBLIOTHEKE',
  chamberSubtitle: 'Poetry, prose, lyrics, literary criticism',
  primaryColor: '#8B4513',
  secondaryColor: '#F5F5DC',

  /**
   * Section definitions for content organization
   */
  sections: {
    poetry: {
      id: 'poetry',
      title: 'Poetry',
      icon: '📜',
      description: 'Lyrical explorations in contemporary form',
      items: [
        {
          id: 'untitled-verses',
          title: 'Untitled Verses',
          subtitle: 'Contemporary Poetry Collection',
          description: 'A collection of lyrical explorations in contemporary form. Working with rhythm, silence, and the spaces between words.',
          date: '2024',
          status: 'coming-soon',
          content: '/bibliotheke/poetry/',
        },
      ],
    },

    prose: {
      id: 'prose',
      title: 'Prose',
      icon: '📖',
      description: 'Narrative experimentation and short fiction',
      items: [
        {
          id: 'narrative-fragments',
          title: 'Narrative Fragments',
          subtitle: 'Short-Form Prose Collection',
          description: 'Short-form prose exploring themes of identity, memory, and transformation through narrative experimentation.',
          date: '2024',
          status: 'coming-soon',
          content: '/bibliotheke/prose/',
        },
      ],
    },

    lyrics: {
      id: 'lyrics',
      title: 'Lyrics',
      icon: '🎵',
      description: 'Song texts and lyrical composition',
      items: [
        {
          id: 'song-texts',
          title: 'Song Texts',
          subtitle: 'Lyrics from Musical Works',
          description: 'Lyrical content from musical works, exploring poetry in the context of composition and performance.',
          date: '2024',
          status: 'coming-soon',
          content: '/bibliotheke/lyrics/',
        },
      ],
    },

    criticism: {
      id: 'criticism',
      title: 'Literary Criticism',
      icon: '✏️',
      description: 'Critical analysis and literary essays',
      items: [
        {
          id: 'critical-essays',
          title: 'Critical Essays',
          subtitle: 'Literary Analysis and Interpretation',
          description: 'Analysis and interpretation of literary works, examining form, meaning, and cultural context.',
          date: '2024',
          status: 'coming-soon',
          content: '/bibliotheke/criticism/',
        },
      ],
    },
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
        frequency: 0.02, // 2% chance per frame
        intensity: 0.3,
      },
      ambient: {
        enabled: true,
        volume: 0.05,
        tracks: [
          {
            name: 'library-ambient',
            path: '/audio/ambient/bibliotheke-ambient.mp3',
            loop: true,
          },
        ],
      },
      morphing: {
        enabled: false, // No images in library
      },
      animation: {
        enabled: true,
        breathing: true,
        textDrift: true,
      },
    },
  },

  /**
   * Metadata for search engines and social sharing
   */
  metadata: {
    og: {
      title: 'BIBLIOTHEKE | ET CETER4',
      description: 'Poetry, prose, lyrics, literary criticism',
      image: '/img/og/bibliotheke-og.jpg',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'BIBLIOTHEKE | ET CETER4',
      description: 'Literary chamber: poetry, prose, lyrics, and critical essays',
      image: '/img/og/bibliotheke-og.jpg',
    },
  },

  /**
   * Navigation configuration
   */
  navigation: {
    backLink: '../index.html#menu',
    backText: 'Back to Naos',
    sectionNav: true,
    footerLinks: [
      { text: 'ETCETER4', href: '../index.html#landing' },
      { text: 'NAOS', href: '../index.html#menu' },
      { text: 'SITE MAP', href: '../sitemap.html' },
    ],
  },

  /**
   * Accessibility settings
   */
  accessibility: {
    storageKey: 'etceter4-bibliotheke-prefs',
    ariaLabels: {
      poetry: 'Poetry section',
      prose: 'Prose section',
      lyrics: 'Lyrics section',
      criticism: 'Literary criticism section',
    },
  },
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = bibliothekeConfig;
}
