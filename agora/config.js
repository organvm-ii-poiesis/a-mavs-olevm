/**
 * AGORA Chamber Configuration
 * West Wing - Discourse and Public Assembly
 * Political commentary, manifestos, and social critique
 */

const AGORA_CONFIG = {
  // Chamber identification
  chamber: {
    id: 'agora',
    name: 'AGORA',
    subtitle: 'Political commentary, manifestos, social critique',
    description: 'The public assembly speaks. Discourse shapes discourse.',
    wing: 'West',
    wingTheme: 'discourse'
  },

  // Visual theming
  theme: {
    primary: '#DC143C',      // Crimson Red
    secondary: '#000000',    // Black
    accent: '#8B0000',       // Dark Red
    light: '#FF69B4',        // Light variant (not used for agora)
    gradient: 'linear-gradient(135deg, #DC143C, #8B0000)',
    darkMode: true           // Bold, high-contrast theme
  },

  // Chamber sections
  sections: {
    feed: {
      id: 'feed',
      label: 'CHRONOLOGICAL FEED',
      contentId: 'feed-section',
      description: 'Timeline of all content, newest first'
    },
    commentary: {
      id: 'commentary',
      label: 'COMMENTARY',
      contentId: 'commentary-section',
      description: 'Sharp analysis and critical perspectives'
    },
    manifestos: {
      id: 'manifestos',
      label: 'MANIFESTOS',
      contentId: 'manifestos-section',
      description: 'Declarations of position and principle'
    }
  },

  // Content metadata and filtering
  content: {
    // Available tags for filtering
    tags: [
      { id: 'all', label: 'ALL', description: 'All content' },
      { id: 'politics', label: 'POLITICS', description: 'Political analysis' },
      { id: 'society', label: 'SOCIETY', description: 'Social critique' },
      { id: 'ideology', label: 'IDEOLOGY', description: 'Ideological examination' },
      { id: 'power', label: 'POWER', description: 'Power structures and dynamics' },
      { id: 'justice', label: 'JUSTICE', description: 'Justice and equity' },
      { id: 'discourse', label: 'DISCOURSE', description: 'Language and dialogue' }
    ],

    // Chronological order (newest first)
    items: [
      {
        id: 'paradox-representation',
        title: 'The Paradox of Democratic Representation',
        date: '2026-02-02',
        section: 'feed',
        topic: 'POLITICS',
        tags: ['politics', 'society', 'discourse'],
        excerpt: 'How systems designed to amplify the many end up silencing the singular voice. A meditation on plurality, consent, and the tyranny of the majority.'
      },
      {
        id: 'power-narrative',
        title: 'Power as Narrative Architecture',
        date: '2026-02-01',
        section: 'feed',
        topic: 'IDEOLOGY',
        tags: ['ideology', 'power'],
        excerpt: 'The stories we tell ourselves become the structures we live within. An examination of how ideology manifests through language, symbols, and social institutions.'
      },
      {
        id: 'violence-silence',
        title: 'On the Violence of Silence',
        date: '2026-01-31',
        section: 'feed',
        topic: 'JUSTICE',
        tags: ['justice', 'society', 'discourse'],
        excerpt: 'What is not spoken becomes normalized. A critical investigation into the ethics of visibility, voice, and the political act of witnessing.'
      },
      {
        id: 'spectacle-transparency',
        title: 'The Spectacle of Transparency',
        date: '2026-01-30',
        section: 'commentary',
        topic: 'DISCOURSE',
        tags: ['politics', 'discourse'],
        excerpt: 'On institutional visibility, surveillance, and the paradox of perfect information. Transparency as an ideal has become transparency as a tool of control.',
        content: 'Transparency as an ideal has become transparency as a tool of control. Institutions parade their openness while data flows in unmarked channels. A commentary on the distinction between revelation and confession.'
      },
      {
        id: 'authority-aesthetic',
        title: 'Authority and the Aesthetic',
        date: '2026-01-29',
        section: 'commentary',
        topic: 'POWER',
        tags: ['power', 'ideology'],
        excerpt: 'How design, gesture, and form legitimize power. The architecture of authority is aesthetic before it is legal.',
        content: 'The architecture of authority is aesthetic before it is legal. Consider the marble halls, the formal dress, the ceremonial language. These are not ornamental—they are fundamental to how power maintains itself in the realm of perception and feeling.'
      },
      {
        id: 'manifesto-comfort',
        title: 'A Manifesto Against Comfort',
        date: '2026-02-02',
        section: 'manifestos',
        topic: 'IDEOLOGY',
        tags: ['ideology'],
        excerpt: 'We refuse the ease of the familiar. We declare: discomfort is prerequisite to thought.',
        content: 'We refuse the ease of the familiar. We declare: discomfort is prerequisite to thought. Complacency is the enemy of justice. The comfortable do not revolutionize; they preserve. Therefore: embrace the friction. Seek the contradiction. Stay in the question until the answer burns.'
      },
      {
        id: 'manifesto-critique',
        title: 'On the Necessity of Critique',
        date: '2026-02-01',
        section: 'manifestos',
        topic: 'JUSTICE',
        tags: ['justice', 'society'],
        excerpt: 'Critique is love in its most rigorous form. To examine, to question, to demand better—this is not destruction but reconstruction.',
        content: 'Critique is love in its most rigorous form. To examine, to question, to demand better—this is not destruction but reconstruction. We manifest: criticism is care. Let the structures that fail us fall. Let the language that constrains us dissolve. From the rubble, new speech. From the silence, new sound.'
      }
    ]
  },

  // UI/UX Configuration
  ui: {
    // Section navigation buttons
    showSectionNav: true,
    sectionButtonClass: 'section-btn',

    // Tag filtering
    showTagFilter: true,
    tagFilterClass: 'agora-tag-filter',

    // Item display
    itemCardClass: 'chamber-card agora',
    itemMetaClass: 'agora-item-meta',

    // Typography emphasis
    boldHeadings: true,
    trackingAmount: 'tracked-tight'
  },

  // Features and behaviors
  features: {
    // Chronological feed with newest first
    chronologicalReverse: true,

    // Tag filtering support
    tagFiltering: true,

    // Section navigation
    sectionNavigation: true,

    // Live filtering
    liveFilter: true,

    // Smooth transitions
    smoothTransitions: true,

    // Accessible focus management
    focusManagement: true
  },

  // Typography configuration
  typography: {
    // Font stack (using Futura from site)
    family: 'futura',

    // Weight for emphasis
    headingWeight: 'fw9',
    bodyWeight: 'fw4',

    // Letter spacing (tracked classes)
    headingTracking: 'tracked-mega',
    bodyTracking: 'tracked'
  },

  // Animation and transitions
  animation: {
    sectionTransition: 300,    // ms - fade between sections
    filterTransition: 200,     // ms - filter item visibility
    hoverTransition: 200       // ms - card hover effects
  },

  // Content organization
  organization: {
    // Default section on load
    defaultSection: 'feed',

    // Item ordering
    orderByDate: true,
    dateOrder: 'descending',

    // Grouping
    groupBySection: true
  },

  // Accessibility
  accessibility: {
    skipLinksEnabled: true,
    ariaLabelsEnabled: true,
    keyboardNavigation: true,
    focusIndicators: true
  },

  // Living Pantheon integration
  livingPantheon: {
    enabled: true,
    chamber: 'agora',
    color: '#DC143C',
    storeHistory: true
  }
};

// Export for use in other scripts
window.AGORA_CONFIG = AGORA_CONFIG;
