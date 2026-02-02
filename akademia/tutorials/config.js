─────┬──────────────────────────────────────────────────────────────────────────
     │ STDIN
─────┼──────────────────────────────────────────────────────────────────────────
   1 │ /**
   2 │  * Tutorials Configuration
   3 │  * Metadata and organization for educational guides and tutorials
   4 │  * Part of ETCETER4 Akademia Chamber
   5 │  */
   6 │ 
   7 │ const tutorialsConfig = {
   8 │   // Educational guides and teaching materials
   9 │   tutorials: [
  10 │     // Add tutorials here as they are created
  11 │     // Example structure:
  12 │     // {
  13 │     //   id: 'tutorial-slug',
  14 │     //   title: 'Tutorial Title',
  15 │     //   description: 'What you will learn',
  16 │     //   author: 'Anthony James Padavano',
  17 │     //   date: '2025-01-15',
  18 │     //   category: 'Creative Coding',
  19 │     //   difficulty: 'intermediate', // beginner, intermediate, advanced
  20 │     //   duration: '30 min',
  21 │     //   tags: ['tag1', 'tag2'],
  22 │     //   published: false,
  23 │     //   file: '/akademia/tutorials/tutorial-file.html',
  24 │     //   topics: ['HTML', 'CSS', 'JavaScript']
  25 │     // }
  26 │   ],
  27 │ 
  28 │   categories: [
  29 │     'Music Theory',
  30 │     'Sound Studies',
  31 │     'Digital Culture',
  32 │     'Technology & Art',
  33 │     'Creative Coding',
  34 │     'Philosophy',
  35 │     'Education',
  36 │     'Cultural Criticism',
  37 │     'Performance Studies',
  38 │     'Interdisciplinary Research',
  39 │   ],
  40 │ 
  41 │   difficulties: ['beginner', 'intermediate', 'advanced'],
  42 │ 
  43 │   // Get tutorials by category
  44 │   getByCategory: function (category) {
  45 │     return this.tutorials.filter(
  46 │       tutorial => tutorial.category === category && tutorial.published
  47 │     );
  48 │   },
  49 │ 
  50 │   // Get tutorials by difficulty
  51 │   getByDifficulty: function (difficulty) {
  52 │     return this.tutorials.filter(
  53 │       tutorial => tutorial.difficulty === difficulty && tutorial.published
  54 │     );
  55 │   },
  56 │ 
  57 │   // Get tutorials by tag
  58 │   getByTag: function (tag) {
  59 │     return this.tutorials.filter(
  60 │       tutorial => tutorial.tags && tutorial.tags.includes(tag) && tutorial.published
  61 │     );
  62 │   },
  63 │ 
  64 │   // Get published tutorials
  65 │   getPublished: function () {
  66 │     return this.tutorials.filter(tutorial => tutorial.published);
  67 │   },
  68 │ 
  69 │   // Get recent tutorials
  70 │   getRecent: function (limit = 5) {
  71 │     return this.tutorials
  72 │       .filter(tutorial => tutorial.published)
  73 │       .sort((a, b) => new Date(b.date) - new Date(a.date))
  74 │       .slice(0, limit);
  75 │   },
  76 │ 
  77 │   // Get tutorial by slug
  78 │   getBySlug: function (slug) {
  79 │     return this.tutorials.find(tutorial => tutorial.id === slug);
  80 │   },
  81 │ };
  82 │ 
  83 │ // Export for use in other modules
  84 │ if (typeof module !== 'undefined' && module.exports) {
  85 │   module.exports = tutorialsConfig;
  86 │ }
─────┴──────────────────────────────────────────────────────────────────────────
