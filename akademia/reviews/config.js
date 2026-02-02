─────┬──────────────────────────────────────────────────────────────────────────
     │ STDIN
─────┼──────────────────────────────────────────────────────────────────────────
   1 │ /**
   2 │  * Reviews Configuration
   3 │  * Metadata and organization for critical analysis and reviews
   4 │  * Part of ETCETER4 Akademia Chamber
   5 │  */
   6 │ 
   7 │ const reviewsConfig = {
   8 │   // Critical reviews of books, music, art, and ideas
   9 │   reviews: [
  10 │     // Add reviews here as they are published
  11 │     // Example structure:
  12 │     // {
  13 │     //   id: 'review-slug',
  14 │     //   title: 'Review: Work Title',
  15 │     //   subject: 'Actual Work Being Reviewed',
  16 │     //   author: 'Anthony James Padavano',
  17 │     //   date: '2025-01-15',
  18 │     //   type: 'book', // book, album, film, artwork, idea
  19 │     //   category: 'Cultural Criticism',
  20 │     //   rating: 8.5, // 0-10 scale
  21 │     //   tags: ['tag1', 'tag2'],
  22 │     //   published: false,
  23 │     //   file: '/akademia/reviews/review-file.html',
  24 │     //   summary: 'Brief summary of the review',
  25 │     //   keywords: ['keyword1', 'keyword2']
  26 │     // }
  27 │   ],
  28 │ 
  29 │   types: ['book', 'album', 'film', 'artwork', 'idea', 'conference', 'exhibition'],
  30 │ 
  31 │   categories: [
  32 │     'Music Theory',
  33 │     'Sound Studies',
  34 │     'Digital Culture',
  35 │     'Technology & Art',
  36 │     'Creative Coding',
  37 │     'Philosophy',
  38 │     'Education',
  39 │     'Cultural Criticism',
  40 │     'Performance Studies',
  41 │     'Interdisciplinary Research',
  42 │   ],
  43 │ 
  44 │   // Get reviews by type
  45 │   getByType: function (type) {
  46 │     return this.reviews.filter(
  47 │       review => review.type === type && review.published
  48 │     );
  49 │   },
  50 │ 
  51 │   // Get reviews by category
  52 │   getByCategory: function (category) {
  53 │     return this.reviews.filter(
  54 │       review => review.category === category && review.published
  55 │     );
  56 │   },
  57 │ 
  58 │   // Get reviews by tag
  59 │   getByTag: function (tag) {
  60 │     return this.reviews.filter(
  61 │       review => review.tags && review.tags.includes(tag) && review.published
  62 │     );
  63 │   },
  64 │ 
  65 │   // Get published reviews
  66 │   getPublished: function () {
  67 │     return this.reviews.filter(review => review.published);
  68 │   },
  69 │ 
  70 │   // Get reviews above rating threshold
  71 │   getByRating: function (minRating = 7) {
  72 │     return this.reviews.filter(
  73 │       review => review.rating && review.rating >= minRating && review.published
  74 │     );
  75 │   },
  76 │ 
  77 │   // Get recent reviews
  78 │   getRecent: function (limit = 5) {
  79 │     return this.reviews
  80 │       .filter(review => review.published)
  81 │       .sort((a, b) => new Date(b.date) - new Date(a.date))
  82 │       .slice(0, limit);
  83 │   },
  84 │ 
  85 │   // Get review by slug
  86 │   getBySlug: function (slug) {
  87 │     return this.reviews.find(review => review.id === slug);
  88 │   },
  89 │ };
  90 │ 
  91 │ // Export for use in other modules
  92 │ if (typeof module !== 'undefined' && module.exports) {
  93 │   module.exports = reviewsConfig;
  94 │ }
─────┴──────────────────────────────────────────────────────────────────────────
