/**
 * Essays Configuration
 * Metadata and organization for academic essays
 * Part of ETCETER4 Akademia Chamber
 */

const essaysConfig = {
  // Example essay structure
  essays: [
    {
      id: 'example-essay-001',
      title:
        'The Digital Temple: Reflections on Web Architecture as Sacred Space',
      slug: 'digital-temple-web-architecture',
      author: 'Anthony James Padavano',
      date: '2025-01-15',
      updated: null,
      category: 'Digital Culture',
      tags: ['web design', 'architecture', 'philosophy', 'digital spaces'],
      abstract:
        'An exploration of how web architecture can embody sacred spatial principles, examining the Pantheon project as a case study in creating digital temples.',
      wordCount: 3500,
      readTime: '15 min',
      published: false, // Set to true when ready
      featured: false,
      file: '/akademia/essays/digital-temple-web-architecture.html',
      pdf: null, // Optional PDF version
      citations: [
        {
          style: 'APA',
          text: 'Padavano, A. J. (2025). The digital temple: Reflections on web architecture as sacred space. ET CETER4 Akademia.',
        },
        {
          style: 'MLA',
          text: 'Padavano, Anthony James. "The Digital Temple: Reflections on Web Architecture as Sacred Space." ET CETER4 Akademia, 2025.',
        },
      ],
    },
    // Add more essays here as they're created
  ],

  categories: [
    'Music Theory',
    'Sound Studies',
    'Digital Culture',
    'Technology & Art',
    'Creative Coding',
    'Philosophy',
    'Education',
    'Cultural Criticism',
    'Performance Studies',
    'Interdisciplinary Research',
  ],

  // Get essays by category
  getByCategory: function (category) {
    return this.essays.filter(
      essay => essay.category === category && essay.published
    );
  },

  // Get essays by tag
  getByTag: function (tag) {
    return this.essays.filter(
      essay => essay.tags.includes(tag) && essay.published
    );
  },

  // Get featured essays
  getFeatured: function () {
    return this.essays.filter(essay => essay.featured && essay.published);
  },

  // Get recent essays
  getRecent: function (limit = 5) {
    return this.essays
      .filter(essay => essay.published)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit);
  },

  // Get essay by slug
  getBySlug: function (slug) {
    return this.essays.find(essay => essay.slug === slug);
  },
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = essaysConfig;
}
