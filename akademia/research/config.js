─────┬──────────────────────────────────────────────────────────────────────────
     │ STDIN
─────┼──────────────────────────────────────────────────────────────────────────
   1 │ /**
   2 │  * Research Configuration
   3 │  * Metadata and organization for research projects and investigations
   4 │  * Part of ETCETER4 Akademia Chamber
   5 │  */
   6 │ 
   7 │ const researchConfig = {
   8 │   // Research projects and investigations
   9 │   projects: [
  10 │     // Add research projects here as they are initiated
  11 │     // Example structure:
  12 │     // {
  13 │     //   id: 'project-slug',
  14 │     //   title: 'Research Project Title',
  15 │     //   description: 'Project description and objectives',
  16 │     //   author: 'Anthony James Padavano',
  17 │     //   started: '2025-01-15',
  18 │     //   status: 'ongoing', // ongoing, completed, paused
  19 │     //   category: 'Digital Culture',
  20 │     //   tags: ['tag1', 'tag2'],
  21 │     //   published: false,
  22 │     //   file: '/akademia/research/project-file.html',
  23 │     //   methodology: 'Brief description of approach',
  24 │     //   keywords: ['keyword1', 'keyword2']
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
  41 │   statuses: ['ongoing', 'completed', 'paused', 'planning'],
  42 │ 
  43 │   // Get projects by category
  44 │   getByCategory: function (category) {
  45 │     return this.projects.filter(
  46 │       project => project.category === category && project.published
  47 │     );
  48 │   },
  49 │ 
  50 │   // Get projects by status
  51 │   getByStatus: function (status) {
  52 │     return this.projects.filter(
  53 │       project => project.status === status && project.published
  54 │     );
  55 │   },
  56 │ 
  57 │   // Get projects by tag
  58 │   getByTag: function (tag) {
  59 │     return this.projects.filter(
  60 │       project => project.tags && project.tags.includes(tag) && project.published
  61 │     );
  62 │   },
  63 │ 
  64 │   // Get published projects
  65 │   getPublished: function () {
  66 │     return this.projects.filter(project => project.published);
  67 │   },
  68 │ 
  69 │   // Get ongoing projects
  70 │   getOngoing: function () {
  71 │     return this.projects.filter(project => project.status === 'ongoing' && project.published);
  72 │   },
  73 │ 
  74 │   // Get project by slug
  75 │   getBySlug: function (slug) {
  76 │     return this.projects.find(project => project.id === slug);
  77 │   },
  78 │ };
  79 │ 
  80 │ // Export for use in other modules
  81 │ if (typeof module !== 'undefined' && module.exports) {
  82 │   module.exports = researchConfig;
  83 │ }
─────┴──────────────────────────────────────────────────────────────────────────
