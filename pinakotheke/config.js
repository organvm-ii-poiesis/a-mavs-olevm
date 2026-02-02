/**
 * Pinakotheke Chamber Configuration
 * Art gallery chamber: photography, digital art, glitch, generative
 */

const PINAKOTHEKE_CONFIG = {
  chamber: 'pinakotheke',
  name: 'PINAKOTHEKE',
  subtitle: 'Photography, digital art, glitch, generative',
  description: 'A curated gallery of visual works spanning photography, digital art, glitch aesthetics, and generative art',
  primaryColor: '#FF00FF',
  backgroundColor: '#FFFFFF',
  wing: 'east', // Scholarship wing
  sections: ['photography', 'digital', 'glitch', 'generative'],

  // Gallery items with metadata
  items: [
    {
      id: 'photo_001',
      title: 'Untitled Study',
      category: 'Photography',
      section: 'photography',
      image: '../assets/placeholder-gallery-1.jpg',
      description: 'A study in light and form'
    },
    {
      id: 'photo_002',
      title: 'Landscape Series #2',
      category: 'Photography',
      section: 'photography',
      image: '../assets/placeholder-gallery-2.jpg',
      description: 'Part of the landscape series'
    },
    {
      id: 'photo_003',
      title: 'Portrait in Motion',
      category: 'Photography',
      section: 'photography',
      image: '../assets/placeholder-gallery-3.jpg',
      description: 'Capturing movement and presence'
    },
    {
      id: 'digital_001',
      title: 'Vector Realm',
      category: 'Digital Art',
      section: 'digital',
      image: '../assets/placeholder-gallery-4.jpg',
      description: 'Digital composition with vector forms'
    },
    {
      id: 'digital_002',
      title: 'Neon Nocturne',
      category: 'Digital Art',
      section: 'digital',
      image: '../assets/placeholder-gallery-5.jpg',
      description: 'Digital painting with neon aesthetics'
    },
    {
      id: 'digital_003',
      title: 'Synthetic Dreams',
      category: 'Digital Art',
      section: 'digital',
      image: '../assets/placeholder-gallery-6.jpg',
      description: 'Exploring digital synthesis'
    },
    {
      id: 'glitch_001',
      title: 'Corrupted Signal #1',
      category: 'Glitch Art',
      section: 'glitch',
      image: '../assets/placeholder-gallery-7.jpg',
      description: 'Intentional digital degradation'
    },
    {
      id: 'glitch_002',
      title: 'Data Decay',
      category: 'Glitch Art',
      section: 'glitch',
      image: '../assets/placeholder-gallery-8.jpg',
      description: 'Visual exploration of bit degradation'
    },
    {
      id: 'glitch_003',
      title: 'Error Aesthetics',
      category: 'Glitch Art',
      section: 'glitch',
      image: '../assets/placeholder-gallery-9.jpg',
      description: 'Beauty in system failures'
    },
    {
      id: 'generative_001',
      title: 'Algorithmic Bloom',
      category: 'Generative',
      section: 'generative',
      image: '../assets/placeholder-gallery-10.jpg',
      description: 'Generated with organic growth algorithms'
    },
    {
      id: 'generative_002',
      title: 'Recursive Patterns',
      category: 'Generative',
      section: 'generative',
      image: '../assets/placeholder-gallery-11.jpg',
      description: 'Self-similar forms at multiple scales'
    },
    {
      id: 'generative_003',
      title: 'Emergent Form',
      category: 'Generative',
      section: 'generative',
      image: '../assets/placeholder-gallery-12.jpg',
      description: 'Complexity arising from simple rules'
    }
  ],

  // Chamber metadata
  metadata: {
    type: 'gallery',
    wing: 'east',
    classification: 'scholarship',
    established: '2025',
    curator: 'ET CETER4',
    theme: 'Visual Arts and Digital Expression'
  }
};
