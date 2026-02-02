/**
 * Pinakotheke Chamber Configuration
 * Art gallery chamber: photography, digital art, glitch, generative
 */

"use strict";

// eslint-disable-next-line no-unused-vars
const PINAKOTHEKE_CONFIG = {
  chamber: "pinakotheke",
  name: "PINAKOTHEKE",
  subtitle: "Photography, digital art, glitch, generative",
  description:
    "A curated gallery of visual works spanning photography, digital art, glitch aesthetics, and generative art",
  primaryColor: "#FF00FF",
  backgroundColor: "#FFFFFF",
  wing: "east",
  sections: ["photography", "digital", "glitch", "generative"],

  /**
   * Gallery items with metadata
   * Each item has thumbnail, fullImage, and descriptive info
   */
  items: [
    // Photography section
    {
      id: "photo_001",
      title: "Untitled Study I",
      category: "Photography",
      section: "photography",
      thumbnail: "../img/gallery/photography/study-1-thumb.jpg",
      image: "../img/gallery/photography/study-1-thumb.jpg",
      fullImage: "../img/gallery/photography/study-1.jpg",
      description:
        "A study in light and form. Exploring the interplay between shadow and illumination.",
      year: 2020,
      medium: "Digital photograph",
      tags: ["monochrome", "abstract", "light"],
    },
    {
      id: "photo_002",
      title: "Landscape Series #2",
      category: "Photography",
      section: "photography",
      thumbnail: "../img/gallery/photography/landscape-2-thumb.jpg",
      image: "../img/gallery/photography/landscape-2-thumb.jpg",
      fullImage: "../img/gallery/photography/landscape-2.jpg",
      description:
        "Part of an ongoing landscape series. Capturing fleeting moments of natural beauty.",
      year: 2019,
      medium: "Digital photograph",
      tags: ["landscape", "nature", "color"],
    },
    {
      id: "photo_003",
      title: "Portrait in Motion",
      category: "Photography",
      section: "photography",
      thumbnail: "../img/gallery/photography/portrait-motion-thumb.jpg",
      image: "../img/gallery/photography/portrait-motion-thumb.jpg",
      fullImage: "../img/gallery/photography/portrait-motion.jpg",
      description:
        "Capturing movement and presence through long exposure techniques.",
      year: 2021,
      medium: "Digital photograph, long exposure",
      tags: ["portrait", "motion", "experimental"],
    },
    {
      id: "photo_004",
      title: "Urban Geometry",
      category: "Photography",
      section: "photography",
      thumbnail: "../img/gallery/photography/urban-geometry-thumb.jpg",
      image: "../img/gallery/photography/urban-geometry-thumb.jpg",
      fullImage: "../img/gallery/photography/urban-geometry.jpg",
      description:
        "Architectural forms creating abstract patterns in urban environments.",
      year: 2022,
      medium: "Digital photograph",
      tags: ["architecture", "urban", "geometric"],
    },

    // Digital art section
    {
      id: "digital_001",
      title: "Vector Realm",
      category: "Digital Art",
      section: "digital",
      thumbnail: "../img/gallery/digital/vector-realm-thumb.jpg",
      image: "../img/gallery/digital/vector-realm-thumb.jpg",
      fullImage: "../img/gallery/digital/vector-realm.jpg",
      description:
        "Digital composition with vector forms exploring geometric possibilities.",
      year: 2021,
      medium: "Vector illustration",
      tags: ["vector", "geometric", "abstract"],
    },
    {
      id: "digital_002",
      title: "Neon Nocturne",
      category: "Digital Art",
      section: "digital",
      thumbnail: "../img/gallery/digital/neon-nocturne-thumb.jpg",
      image: "../img/gallery/digital/neon-nocturne-thumb.jpg",
      fullImage: "../img/gallery/digital/neon-nocturne.jpg",
      description:
        "Digital painting with neon aesthetics. Night scene with luminous elements.",
      year: 2022,
      medium: "Digital painting",
      tags: ["neon", "night", "cyberpunk"],
    },
    {
      id: "digital_003",
      title: "Synthetic Dreams",
      category: "Digital Art",
      section: "digital",
      thumbnail: "../img/gallery/digital/synthetic-dreams-thumb.jpg",
      image: "../img/gallery/digital/synthetic-dreams-thumb.jpg",
      fullImage: "../img/gallery/digital/synthetic-dreams.jpg",
      description:
        "Exploring digital synthesis and the boundary between organic and artificial.",
      year: 2023,
      medium: "Mixed digital media",
      tags: ["surreal", "synthesis", "dreamscape"],
    },
    {
      id: "digital_004",
      title: "Chromatic Shift",
      category: "Digital Art",
      section: "digital",
      thumbnail: "../img/gallery/digital/chromatic-shift-thumb.jpg",
      image: "../img/gallery/digital/chromatic-shift-thumb.jpg",
      fullImage: "../img/gallery/digital/chromatic-shift.jpg",
      description: "Color theory exploration through digital manipulation.",
      year: 2023,
      medium: "Digital painting",
      tags: ["color", "abstract", "gradient"],
    },

    // Glitch art section
    {
      id: "glitch_001",
      title: "Corrupted Signal #1",
      category: "Glitch Art",
      section: "glitch",
      thumbnail: "../img/gallery/glitch/corrupted-signal-1-thumb.jpg",
      image: "../img/gallery/glitch/corrupted-signal-1-thumb.jpg",
      fullImage: "../img/gallery/glitch/corrupted-signal-1.jpg",
      description:
        "Intentional digital degradation creating new visual narratives.",
      year: 2020,
      medium: "Databending",
      tags: ["databend", "corruption", "signal"],
    },
    {
      id: "glitch_002",
      title: "Data Decay",
      category: "Glitch Art",
      section: "glitch",
      thumbnail: "../img/gallery/glitch/data-decay-thumb.jpg",
      image: "../img/gallery/glitch/data-decay-thumb.jpg",
      fullImage: "../img/gallery/glitch/data-decay.jpg",
      description:
        "Visual exploration of bit degradation and information loss.",
      year: 2021,
      medium: "Hex editing, pixel sorting",
      tags: ["decay", "bits", "entropy"],
    },
    {
      id: "glitch_003",
      title: "Error Aesthetics",
      category: "Glitch Art",
      section: "glitch",
      thumbnail: "../img/gallery/glitch/error-aesthetics-thumb.jpg",
      image: "../img/gallery/glitch/error-aesthetics-thumb.jpg",
      fullImage: "../img/gallery/glitch/error-aesthetics.jpg",
      description: "Beauty in system failures. Embracing the unexpected.",
      year: 2022,
      medium: "Circuit bending, screen capture",
      tags: ["error", "system", "beauty"],
    },
    {
      id: "glitch_004",
      title: "Fragmented Memory",
      category: "Glitch Art",
      section: "glitch",
      thumbnail: "../img/gallery/glitch/fragmented-memory-thumb.jpg",
      image: "../img/gallery/glitch/fragmented-memory-thumb.jpg",
      fullImage: "../img/gallery/glitch/fragmented-memory.jpg",
      description: "Exploring digital memory corruption as artistic medium.",
      year: 2023,
      medium: "RAM manipulation, reconstruction",
      tags: ["memory", "fragment", "reconstruction"],
    },

    // Generative art section
    {
      id: "generative_001",
      title: "Algorithmic Bloom",
      category: "Generative",
      section: "generative",
      thumbnail: "../img/gallery/generative/algorithmic-bloom-thumb.jpg",
      image: "../img/gallery/generative/algorithmic-bloom-thumb.jpg",
      fullImage: "../img/gallery/generative/algorithmic-bloom.jpg",
      description:
        "Generated with organic growth algorithms. L-systems and branching logic.",
      year: 2021,
      medium: "p5.js, custom algorithm",
      tags: ["l-system", "organic", "growth"],
    },
    {
      id: "generative_002",
      title: "Recursive Patterns",
      category: "Generative",
      section: "generative",
      thumbnail: "../img/gallery/generative/recursive-patterns-thumb.jpg",
      image: "../img/gallery/generative/recursive-patterns-thumb.jpg",
      fullImage: "../img/gallery/generative/recursive-patterns.jpg",
      description:
        "Self-similar forms at multiple scales. Fractal geometry in code.",
      year: 2022,
      medium: "Processing, recursive functions",
      tags: ["fractal", "recursive", "self-similar"],
    },
    {
      id: "generative_003",
      title: "Emergent Form",
      category: "Generative",
      section: "generative",
      thumbnail: "../img/gallery/generative/emergent-form-thumb.jpg",
      image: "../img/gallery/generative/emergent-form-thumb.jpg",
      fullImage: "../img/gallery/generative/emergent-form.jpg",
      description:
        "Complexity arising from simple rules. Cellular automata visualization.",
      year: 2022,
      medium: "JavaScript, cellular automata",
      tags: ["emergence", "automata", "complexity"],
    },
    {
      id: "generative_004",
      title: "Flow Fields #7",
      category: "Generative",
      section: "generative",
      thumbnail: "../img/gallery/generative/flow-fields-7-thumb.jpg",
      image: "../img/gallery/generative/flow-fields-7-thumb.jpg",
      fullImage: "../img/gallery/generative/flow-fields-7.jpg",
      description:
        "Perlin noise driven particle systems. Part of the Flow Fields series.",
      year: 2023,
      medium: "p5.js, Perlin noise",
      tags: ["flow", "particles", "noise"],
    },
  ],

  /**
   * Lightbox settings
   */
  lightbox: {
    enabled: true,
    showCounter: true,
    showDescription: true,
    keyboardNavigation: true,
  },

  /**
   * Living Pantheon integration
   */
  livingPantheon: {
    enabled: true,
    systems: {
      morphing: {
        enabled: true,
        targetSelectors: [".gallery-item img"],
      },
      glitch: {
        enabled: true,
        frequency: 0.01,
      },
    },
  },

  /**
   * Chamber metadata
   */
  metadata: {
    type: "gallery",
    wing: "east",
    classification: "scholarship",
    established: "2025",
    curator: "ET CETER4",
    theme: "Visual Arts and Digital Expression",
  },
};
