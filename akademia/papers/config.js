─────┬──────────────────────────────────────────────────────────────────────────
     │ STDIN
─────┼──────────────────────────────────────────────────────────────────────────
   1 │ /**
   2 │  * Papers Configuration
   3 │  * Metadata and organization for academic research papers
   4 │  * Part of ETCETER4 Akademia Chamber
   5 │  */
   6 │ 
   7 │ const papersConfig = {
   8 │   // Academic research papers
   9 │   papers: [
  10 │     // Add papers here as they are completed
  11 │     // Example structure:
  12 │     // {
  13 │     //   id: 'paper-slug',
  14 │     //   title: 'Paper Title',
  15 │     //   author: 'Anthony James Padavano',
  16 │     //   date: '2025-01-15',
  17 │     //   abstract: 'Brief abstract...',
  18 │     //   keywords: ['keyword1', 'keyword2'],
  19 │     //   doi: 'optional-doi',
  20 │     //   published: false,
  21 │     //   file: '/akademia/papers/paper-file.html',
  22 │     //   pdf: '/akademia/papers/paper-file.pdf'
  23 │     // }
  24 │   ],
  25 │ 
  26 │   categories: [
  27 │     'Music Theory',
  28 │     'Sound Studies',
  29 │     'Digital Culture',
  30 │     'Technology & Art',
  31 │     'Creative Coding',
  32 │     'Philosophy',
  33 │     'Education',
  34 │     'Cultural Criticism',
  35 │     'Performance Studies',
  36 │     'Interdisciplinary Research',
  37 │   ],
  38 │ 
  39 │   // Get papers by category
  40 │   getByCategory: function (category) {
  41 │     return this.papers.filter(
  42 │       paper => paper.category === category && paper.published
  43 │     );
  44 │   },
  45 │ 
  46 │   // Get papers by keyword
  47 │   getByKeyword: function (keyword) {
  48 │     return this.papers.filter(
  49 │       paper => paper.keywords && paper.keywords.includes(keyword) && paper.published
  50 │     );
  51 │   },
  52 │ 
  53 │   // Get published papers
  54 │   getPublished: function () {
  55 │     return this.papers.filter(paper => paper.published);
  56 │   },
  57 │ 
  58 │   // Get recent papers
  59 │   getRecent: function (limit = 5) {
  60 │     return this.papers
  61 │       .filter(paper => paper.published)
  62 │       .sort((a, b) => new Date(b.date) - new Date(a.date))
  63 │       .slice(0, limit);
  64 │   },
  65 │ 
  66 │   // Get paper by slug
  67 │   getBySlug: function (slug) {
  68 │     return this.papers.find(paper => paper.id === slug);
  69 │   },
  70 │ };
  71 │ 
  72 │ // Export for use in other modules
  73 │ if (typeof module !== 'undefined' && module.exports) {
  74 │   module.exports = papersConfig;
  75 │ }
─────┴──────────────────────────────────────────────────────────────────────────
