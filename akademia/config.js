─────┬──────────────────────────────────────────────────────────────────────────
     │ STDIN
─────┼──────────────────────────────────────────────────────────────────────────
   1 │ /**
   2 │  * Akademia Chamber Configuration
   3 │  * Defines content metadata, sections, and settings for the scholarly chamber
   4 │  * Part of ETCETER4 Pantheon Project
   5 │  *
   6 │  * Chamber Details:
   7 │  * - Name: AKADEMIA
   8 │  * - Subtitle: Essays, research, papers, and scholarly work
   9 │  * - Color: #00FFFF (cyan)
  10 │  * - Secondary Color: #E0F7FF (light cyan)
  11 │  */
  12 │ 
  13 │ 'use strict';
  14 │ 
  15 │ /**
  16 │  * Akademia configuration object
  17 │  * Contains metadata for essays, papers, tutorials, and research projects
  18 │  */
  19 │ const akademiaConfig = {
  20 │   chamberId: 'akademia',
  21 │   chamberName: 'AKADEMIA',
  22 │   chamberSubtitle: 'Essays, research, papers, and scholarly work',
  23 │   primaryColor: '#00FFFF',
  24 │   secondaryColor: '#E0F7FF',
  25 │ 
  26 │   /**
  27 │    * Section definitions for content organization
  28 │    */
  29 │   sections: {
  30 │     essays: {
  31 │       id: 'essays',
  32 │       title: 'Essays',
  33 │       icon: '📝',
  34 │       description: 'Long-form explorations of ideas, culture, and creative practice',
  35 │       items: [
  36 │         {
  37 │           id: 'digital-temple-web-architecture',
  38 │           title: 'The Digital Temple',
  39 │           subtitle: 'Reflections on Web Architecture as Sacred Space',
  40 │           description: 'An exploration of how web architecture can embody sacred spatial principles, examining the Pantheon project as a case study in creating digital temples.',
  41 │           date: '2025-01-15',
  42 │           status: 'draft',
  43 │           category: 'Digital Culture',
  44 │           tags: ['web design', 'architecture', 'philosophy', 'digital spaces'],
  45 │           wordCount: 3500,
  46 │           readTime: '15 min',
  47 │           content: '/akademia/essays/digital-temple-web-architecture.html',
  48 │         },
  49 │       ],
  50 │     },
  51 │ 
  52 │     papers: {
  53 │       id: 'papers',
  54 │       title: 'Papers',
  55 │       icon: '📄',
  56 │       description: 'Academic research papers and formal scholarly work',
  57 │       items: [],
  58 │     },
  59 │ 
  60 │     tutorials: {
  61 │       id: 'tutorials',
  62 │       title: 'Tutorials',
  63 │       icon: '🎓',
  64 │       description: 'Educational guides and teaching materials',
  65 │       items: [],
  66 │     },
  67 │ 
  68 │     research: {
  69 │       id: 'research',
  70 │       title: 'Research',
  71 │       icon: '🔬',
  72 │       description: 'Ongoing investigations and experimental studies',
  73 │       items: [],
  74 │     },
  75 │ 
  76 │     reviews: {
  77 │       id: 'reviews',
  78 │       title: 'Reviews',
  79 │       icon: '💭',
  80 │       description: 'Critical analysis of books, music, art, and ideas',
  81 │       items: [],
  82 │     },
  83 │   },
  84 │ 
  85 │   /**
  86 │    * Categories for organizing content
  87 │    */
  88 │   categories: [
  89 │     'Music Theory',
  90 │     'Sound Studies',
  91 │     'Digital Culture',
  92 │     'Technology & Art',
  93 │     'Creative Coding',
  94 │     'Philosophy',
  95 │     'Education',
  96 │     'Cultural Criticism',
  97 │     'Performance Studies',
  98 │     'Interdisciplinary Research',
  99 │   ],
 100 │ 
 101 │   /**
 102 │    * Helper methods for content retrieval
 103 │    */
 104 │ 
 105 │   // Get all items across all sections
 106 │   getAllItems: function () {
 107 │     const items = [];
 108 │     Object.keys(this.sections).forEach(sectionKey => {
 109 │       if (this.sections[sectionKey].items) {
 110 │         items.push(...this.sections[sectionKey].items);
 111 │       }
 112 │     });
 113 │     return items;
 114 │   },
 115 │ 
 116 │   // Get items by category
 117 │   getByCategory: function (category) {
 118 │     return this.getAllItems().filter(item => item.category === category);
 119 │   },
 120 │ 
 121 │   // Get items by tag
 122 │   getByTag: function (tag) {
 123 │     return this.getAllItems().filter(item => item.tags && item.tags.includes(tag));
 124 │   },
 125 │ 
 126 │   // Get items by section
 127 │   getBySection: function (sectionId) {
 128 │     return this.sections[sectionId]?.items || [];
 129 │   },
 130 │ 
 131 │   /**
 132 │    * Living Pantheon integration
 133 │    * Enables animated effects and ambient audio for the chamber
 134 │    */
 135 │   livingPantheon: {
 136 │     enabled: true,
 137 │     systems: {
 138 │       glitch: {
 139 │         enabled: true,
 140 │         frequency: 0.015, // 1.5% chance per frame
 141 │         intensity: 0.25,
 142 │       },
 143 │       ambient: {
 144 │         enabled: true,
 145 │         volume: 0.04,
 146 │         tracks: [
 147 │           {
 148 │             name: 'akademia-ambient',
 149 │             path: '/audio/ambient/akademia-ambient.mp3',
 150 │             loop: true,
 151 │           },
 152 │         ],
 153 │       },
 154 │       morphing: {
 155 │         enabled: false, // No images in academic chamber
 156 │       },
 157 │       animation: {
 158 │         enabled: true,
 159 │         breathing: true,
 160 │         textDrift: true,
 161 │       },
 162 │     },
 163 │   },
 164 │ 
 165 │   /**
 166 │    * Metadata for search engines and social sharing
 167 │    */
 168 │   metadata: {
 169 │     og: {
 170 │       title: 'AKADEMIA | ET CETER4',
 171 │       description: 'Essays, research, papers, and scholarly work',
 172 │       image: '/img/og/akademia-og.jpg',
 173 │       type: 'website',
 174 │     },
 175 │     twitter: {
 176 │       card: 'summary_large_image',
 177 │       title: 'AKADEMIA | ET CETER4',
 178 │       description: 'Scholarly chamber: essays, papers, research, and tutorials',
 179 │       image: '/img/og/akademia-og.jpg',
 180 │     },
 181 │   },
 182 │ 
 183 │   /**
 184 │    * Navigation configuration
 185 │    */
 186 │   navigation: {
 187 │     backLink: '../index.html#menu',
 188 │     backText: 'Back to Naos',
 189 │     sectionNav: true,
 190 │     footerLinks: [
 191 │       { text: 'ETCETER4', href: '../index.html#landing' },
 192 │       { text: 'NAOS', href: '../index.html#menu' },
 193 │       { text: 'SITE MAP', href: '../sitemap.html' },
 194 │     ],
 195 │   },
 196 │ 
 197 │   /**
 198 │    * Accessibility settings
 199 │    */
 200 │   accessibility: {
 201 │     storageKey: 'etceter4-akademia-prefs',
 202 │     ariaLabels: {
 203 │       essays: 'Essays section',
 204 │       papers: 'Academic papers section',
 205 │       tutorials: 'Tutorials section',
 206 │       research: 'Research section',
 207 │       reviews: 'Reviews and criticism section',
 208 │     },
 209 │   },
 210 │ };
 211 │ 
 212 │ // Export for use in other modules
 213 │ if (typeof module !== 'undefined' && module.exports) {
 214 │   module.exports = akademiaConfig;
 215 │ }
─────┴──────────────────────────────────────────────────────────────────────────
