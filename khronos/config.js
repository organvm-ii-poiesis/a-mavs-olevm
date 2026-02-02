/**
 * KHRONOS Chamber Configuration
 * Timeline data structure for eras and milestones
 */

/* eslint-disable no-unused-vars */
const KHRONOS_CONFIG = {
  chamber: {
    id: 'khronos',
    name: 'KHRONOS',
    nameUpper: 'KHRONOS',
    subtitle: 'Historical archive, evolution tracking, milestones',
    description: 'A temporal archive documenting the evolution and key milestones of ETCETER4',
    color: '#4169E1',
    colorName: 'royal blue',
    wing: 'North',
    process: 'temporal navigation and historical context'
  },

  /**
   * ERAS - Major time periods in project history
   * Each era represents a significant phase of development
   */
  eras: [
    {
      id: 'era-genesis',
      name: 'Genesis',
      dateRange: '2022-01-01 to 2022-06-30',
      startYear: 2022,
      endYear: 2022,
      description: 'Initial conception and foundational architecture development. Establishment of the chamber system and core SPA infrastructure.',
      keyFocus: [
        'Chamber concept development',
        'Page class architecture',
        'Global scope pattern implementation',
        'Initial styling framework'
      ],
      color: '#87CEEB',
      status: 'completed'
    },
    {
      id: 'era-expansion',
      name: 'Expansion',
      dateRange: '2022-07-01 to 2023-06-30',
      startYear: 2022,
      endYear: 2023,
      description: 'Rapid expansion of chamber content and functionality. Addition of multimedia support and interactive elements.',
      keyFocus: [
        'Chamber content creation',
        'Audio integration (Howler.js)',
        'P5.js sketch integration',
        'Responsive design refinement'
      ],
      color: '#6495ED',
      status: 'completed'
    },
    {
      id: 'era-refinement',
      name: 'Refinement',
      dateRange: '2023-07-01 to 2024-06-30',
      startYear: 2023,
      endYear: 2024,
      description: 'Focus on code quality, accessibility, and performance optimization. Implementation of testing frameworks.',
      keyFocus: [
        'ESLint configuration',
        'Accessibility improvements',
        'Performance optimization',
        'Unit testing framework'
      ],
      color: '#4169E1',
      status: 'completed'
    },
    {
      id: 'era-integration',
      name: 'Integration',
      dateRange: '2024-07-01 to present',
      startYear: 2024,
      endYear: 2025,
      description: 'Integration of advanced technologies and experimental features. Living Pantheon system and AI-powered demonstrations.',
      keyFocus: [
        'Living Pantheon implementation',
        'Gemini AI integration',
        'Advanced shader systems',
        'CI/CD pipeline enhancement'
      ],
      color: '#00008B',
      status: 'active'
    }
  ],

  /**
   * MILESTONES - Specific events and achievements
   * Marked along the timeline with connecting lines
   */
  milestones: [
    {
      id: 'milestone-launch',
      name: 'Project Launch',
      date: '2022-01-15',
      timestamp: 1642252800000,
      category: 'launch',
      description: 'Official launch of ETCETER4 project with initial chamber framework',
      impact: 'high',
      tags: ['architecture', 'foundational']
    },
    {
      id: 'milestone-first-chamber',
      name: 'First Chamber Live',
      date: '2022-03-20',
      timestamp: 1647772800000,
      category: 'feature',
      description: 'Launch of the first fully-functional chamber with content and navigation',
      impact: 'high',
      tags: ['feature', 'content']
    },
    {
      id: 'milestone-audio-system',
      name: 'Audio System Integration',
      date: '2022-09-10',
      timestamp: 1662768000000,
      category: 'feature',
      description: 'Integration of Howler.js for advanced audio playback and synthesis',
      impact: 'medium',
      tags: ['audio', 'library']
    },
    {
      id: 'milestone-p5js-shaders',
      name: 'P5.js Shaders Implementation',
      date: '2023-02-14',
      timestamp: 1676332800000,
      category: 'feature',
      description: 'Addition of WebGL shader support for generative art visualizations',
      impact: 'medium',
      tags: ['graphics', 'webgl']
    },
    {
      id: 'milestone-ci-pipeline',
      name: 'CI/CD Pipeline Launch',
      date: '2023-08-22',
      timestamp: 1692662400000,
      category: 'infrastructure',
      description: 'Implementation of GitHub Actions for automated testing and deployment',
      impact: 'high',
      tags: ['devops', 'automation']
    },
    {
      id: 'milestone-living-pantheon',
      name: 'Living Pantheon System',
      date: '2024-03-10',
      timestamp: 1710086400000,
      category: 'feature',
      description: 'Introduction of the Living Pantheon system for dynamic content management',
      impact: 'high',
      tags: ['architecture', 'advanced']
    },
    {
      id: 'milestone-gemini-integration',
      name: 'Gemini AI Integration',
      date: '2024-11-01',
      timestamp: 1730419200000,
      category: 'feature',
      description: 'Integration of Google Gemini API for AI-powered interactive features',
      impact: 'high',
      tags: ['ai', 'experimental']
    },
    {
      id: 'milestone-khronos-chamber',
      name: 'Khronos Chamber Launch',
      date: '2025-02-02',
      timestamp: 1738454400000,
      category: 'feature',
      description: 'Launch of the Khronos temporal archive and timeline system',
      impact: 'medium',
      tags: ['timeline', 'history']
    }
  ],

  /**
   * Timeline visualization configuration
   * Settings for D3.js and vis.js integrations
   */
  visualization: {
    d3: {
      enabled: true,
      width: 'auto',
      height: 400,
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
      colors: ['#87CEEB', '#6495ED', '#4169E1', '#00008B'],
      interactions: ['hover', 'click', 'zoom']
    },
    vis: {
      enabled: true,
      height: 300,
      orientation: 'bottom',
      format: { majorLabels: 'YYYY', minorLabels: 'MMM DD' },
      moveable: true,
      zoomable: true,
      selectable: true
    }
  },

  /**
   * Styling configuration for timeline elements
   */
  styling: {
    eraCard: {
      borderClass: 'b--khronos',
      bgClass: 'bg-khronos--o-10',
      textClass: 'khronos-text',
      hoverEffect: 'glow-khronos'
    },
    milestoneMarker: {
      radius: 8,
      strokeWidth: 2,
      color: '#4169E1',
      activeColor: '#00008B',
      connectorColor: 'rgba(65, 105, 225, 0.4)'
    },
    timeline: {
      lineColor: 'rgba(65, 105, 225, 0.3)',
      lineWidth: 2,
      backgroundColor: 'rgba(65, 105, 225, 0.05)'
    }
  },

  /**
   * Navigation and interaction settings
   */
  navigation: {
    sections: ['eras', 'milestones'],
    defaultSection: 'eras',
    scrollBehavior: 'smooth',
    transitions: {
      duration: 300,
      easing: 'ease-in-out'
    }
  },

  /**
   * Data export and integration points
   */
  export: {
    formats: ['json', 'csv', 'ical'],
    includeMetadata: true,
    timestampFormat: 'ISO8601'
  }
};
