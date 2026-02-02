# Contributing to ETCETER4

Thank you for your interest in contributing to ETCETER4! This guide will help you get started and understand our unique temple architecture.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Project Architecture](#project-architecture)
  - [Chamber System](#chamber-system)
  - [Living Pantheon](#living-pantheon)
  - [Media Infrastructure](#media-infrastructure)
- [Code Style](#code-style)
- [Adding a New Chamber](#adding-a-new-chamber)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Common Issues & Solutions](#common-issues--solutions)
- [Resources](#resources)

## Code of Conduct

This project embraces creativity and experimentation. Please be respectful and constructive in all interactions. ETCETER4 is a sacred digital temple—treat contributions with reverence and intention.

## Getting Started

### Prerequisites

- **Node.js** 18+ and **npm** 9+
- **Git** for version control
- A modern code editor (VS Code recommended)
- Familiarity with HTML, CSS, and JavaScript (ES6+)

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/4-b100m/etceter4.git
cd etceter4

# Install dependencies
npm install

# Start development server
npm run dev
```

The development server will start at `http://localhost:3000` with live reload enabled.

Visit the console and open your browser's DevTools to see any messages. The application uses global variables for cross-file communication, which is intentional and documented.

## Project Architecture

### Overview

ETCETER4 is a **static SPA (Single Page Application)** with a custom navigation system. No build step—JavaScript runs directly in the browser. This design prioritizes independence and artistic control.

**Key files:**

- `index.html` - Main entry point
- `js/main.js` - Application initialization
- `js/page.js` - Page navigation system (Page class)
- `js/pageData.js` - Page tree configuration
- `js/config.js` - Global configuration object
- `css/styles.css` - Custom styles
- `css/chamber-colors.css` - Chamber-specific color variables

### Navigation Hierarchy

```
Landing (Tier 1)
  ↓
Menu (Tier 2) [Portal to all chambers]
  ├─ Words, Sound, Vision, Info (Core sections)
  ├─ East Wing (Scholarship)
  │   ├─ Akademia
  │   ├─ Bibliotheke
  │   └─ Pinakotheke
  ├─ West Wing (Discourse)
  │   ├─ Agora
  │   ├─ Symposion
  │   └─ Oikos
  ├─ South Wing (Performance)
  │   ├─ Odeion
  │   └─ Theatron
  └─ North Wing (Process)
      ├─ Ergasterion
      └─ Khronos
```

### Global Scope Pattern

This project intentionally uses global scope for cross-file communication. This is not an anti-pattern here—it's architectural:

```javascript
// In js/main.js or pageData.js
let currentPage;     // Currently active Page instance
let pages = [];      // All Page instances
let pages.menu;      // Quick access to specific pages
let pages.akademia;

// Navigate via global function
function showNewSection(pageId) {
  // Handle page transition
}

// Called from anywhere in the application
showNewSection('#akademia');
```

**Why?** No module bundling = pure browser scope. Cross-file communication happens naturally. It's transparent, debuggable, and aligns with ETCETER4's philosophy of artistic independence.

### The Page Class

Location: `js/page.js`

```javascript
class Page {
  constructor({ id, tier, upLinks, downLinks, initialize, load }) {
    this.id = id; // HTML element ID (e.g., "#menu")
    this.tier = tier; // Navigation hierarchy level (1-4)
    this.upLinks = upLinks; // Parent page IDs (for back nav)
    this.downLinks = downLinks; // Child page IDs (for forward nav)
    this.initialize = initialize; // Called on first load
    this.load = load; // Called on subsequent loads
  }

  static findPage(pageId) {
    return pages.find(p => p.id === pageId);
  }
}
```

Each page is instantiated in `pageData.js` with its navigation relationships defined.

---

## Chamber System

### What is a Chamber?

A **chamber** is a distinct content area within the Pantheon, each serving a specific cultural and artistic function. Like the rooms of an ancient Greek temple, each chamber has its own purpose, aesthetic, and content type.

### The 15 Chambers

| #   | Chamber        | Function                         | Status    | Wing  |
| --- | -------------- | -------------------------------- | --------- | ----- |
| 1   | Museum         | Preservation of historical work  | ✅ Active | Core  |
| 2   | Mausoleum      | Memorial to completed projects   | ✅ Active | Core  |
| 3   | Labyrinth      | Exploratory diary with fragments | ✅ Active | Core  |
| 4   | Choral Chamber | Music and sound                  | ✅ Active | Core  |
| 5   | Atelier        | Creative workspace               | ✅ Active | Core  |
| 6   | Akademia       | Scholarship and essays           | 🔨 Design | East  |
| 7   | Agora          | Political discourse              | ✅ Active | West  |
| 8   | Theatron       | Performance recordings           | 🔨 Design | South |
| 9   | Odeion         | Music hall and albums            | 🔨 Design | South |
| 10  | Bibliotheke    | Literary archive                 | 🔨 Design | East  |
| 11  | Pinakotheke    | Visual art gallery               | 🔨 Design | East  |
| 12  | Symposion      | Dialogues and interviews         | 🔨 Design | West  |
| 13  | Ergasterion    | Laboratory and experiments       | ✅ Active | North |
| 14  | Oikos          | Personal reflections             | 🔨 Design | West  |
| 15  | Khronos        | Timeline and archive             | 🔨 Design | North |

See `PANTHEON_ARCHITECTURE.md` for detailed specifications of each chamber.

### Chamber Colors

Each chamber has a primary color and optional secondary color defined in `js/config.js`:

```javascript
ETCETER4_CONFIG.chambers = {
  akademia: {
    name: 'AKADEMIA',
    subtitle: 'Essays, research, theoretical writings',
    color: '#00FFFF', // Primary color
    wing: 'east',
  },
  // ... more chambers
};
```

CSS variables are auto-generated and available as:

- `--chamber-akademia-color`
- `--chamber-akademia-secondary-color` (if defined)

---

## Living Pantheon

### Overview

The **Living Pantheon** is a generative system that brings the site to life through subtle, pervasive interactions:

- **Glitches**: 2% probability of random visual glitches every 5 seconds
- **Morphing Images**: Photos transition → glitch → abstract over 60 seconds
- **Ambient Sound**: 5% volume background audio that changes per chamber
- **Breathing Animation**: Subtle scale pulsing on marked elements
- **Text Drift**: Gentle position movement on text elements

Location: `js/living-pantheon/` and `js/config.js` (`ETCETER4_CONFIG.livingPantheon`)

### Configuration

All Living Pantheon features are configurable in `js/config.js`:

```javascript
ETCETER4_CONFIG.livingPantheon = {
  enabled: true,

  glitch: {
    enabled: true,
    frequency: 0.02, // 2% chance per check
    checkInterval: 5000, // Every 5 seconds
    duration: { min: 50, max: 200 },
    excludeSelectors: ['.no-glitch', 'input', 'button'],
  },

  morphing: {
    enabled: true,
    transitionDuration: 60000, // 60 seconds
    targetSelectors: ['.morph-image'],
  },

  ambient: {
    enabled: true,
    baseVolume: 0.05, // 5% volume
    chamberSpecific: true,
    chamberTracks: {
      akademia: 'audio/ambient/scholarly-hum.mp3',
      // ... more chambers
    },
  },

  animation: {
    breathing: { enabled: true /* ... */ },
    textDrift: { enabled: true /* ... */ },
  },

  accessibility: {
    respectReducedMotion: true,
    allowUserToggle: true,
  },
};
```

### Using Living Pantheon Features

#### Glitch Effects

To enable random glitching on an element:

```html
<!-- This element will glitch randomly -->
<div>Some text</div>

<!-- This element will NOT glitch -->
<div class="no-glitch">Protected content</div>
```

#### Morphing Images

```html
<!-- This image will morph through visual effects -->
<img class="morph-image" src="photo.jpg" alt="morphing photo" />
```

#### Breathing Animation

```html
<!-- This element will scale in/out gently -->
<section class="breathing">
  <h2>Breathing Content</h2>
</section>
```

#### Text Drift

```html
<!-- This text will drift slightly -->
<p class="drifting-text">Floating words...</p>
```

#### Ambient Sounds

Ambient sounds are loaded per chamber automatically. To add ambient sound to a new chamber, configure it in `ETCETER4_CONFIG.livingPantheon.ambient.chamberTracks`.

### Accessibility

The Living Pantheon respects user preferences:

- **prefers-reduced-motion**: All animations disable automatically
- **User Toggle**: localStorage key `etceter4-living-pantheon-enabled`
- **Keyboard Shortcut**: Ctrl+Shift+L to toggle

---

## Media Infrastructure

### Self-Hosted Media

ETCETER4 is transitioning to self-hosted media to maintain independence from external platforms.

#### Audio

- **Location**: `audio/` directory and Cloudflare R2 (future)
- **Player**: Howler.js (custom audio player)
- **Formats**: MP3 (universal), FLAC (high quality)
- **Features**: Waveform visualization, playlists, offline caching

Configuration in `ETCETER4_CONFIG.media.audio`

#### Video

- **Location**: `video/` directory
- **Player**: Video.js or custom player
- **Formats**: MP4 (H.264) for broad compatibility
- **Features**: Multiple quality options, subtitles, thumbnails

Configuration in `ETCETER4_CONFIG.media.video`

#### Albums

All albums are configured in `ETCETER4_CONFIG.media.albums`:

```javascript
albums: {
  ogod: {
    id: 'ogod',
    title: 'OGOD',
    year: 2015,
    trackCount: 29,
    coverArt: {
      large: 'audio/albums/ogod/cover-1200.jpg',
      medium: 'audio/albums/ogod/cover-600.jpg',
      small: 'audio/albums/ogod/cover-300.jpg',
    },
    hasLyrics: true,
    hasStems: true,
  },
  // ... more albums
};
```

---

## Code Style

### JavaScript

**Principles:**

- Use `const` and `let`, never `var`
- Always use `===` and `!==` (strict equality)
- Use arrow functions for callbacks
- Use template literals, not string concatenation
- Use destructuring when appropriate
- Keep functions small and focused

**Naming Conventions:**

- **Functions**: `verbNoun` pattern
  - `showNewSection()`, `fadeInPage()`, `loadContent()`
  - Avoid: `show()`, `load()` (too generic)
- **Variables**: `camelCase`
  - `currentPage`, `userCount`, `isVisible`
- **Constants**: `UPPER_SNAKE_CASE`
  - `MAX_RETRIES`, `DEFAULT_VOLUME`
- **Page IDs**: `#kebab-case`
  - `#landing`, `#akademia`, `#east-wing`
- **CSS Classes**: Tachyons utilities + `prefix-modifier`
  - `et-page-container`, `chamber-header`
- **Boolean variables**: `is`/`has`/`can` prefix
  - `isLoading`, `hasError`, `canNavigate`

**Example:**

```javascript
// Good: Clear intent, descriptive names
const currentPage = Page.findPage('#akademia');
const isNavigating = true;

function fadeInNewPage(pageElement) {
  $(pageElement).velocity('fadeIn', { duration: 500 });
}

// Avoid: Vague names, wrong equality
var cur = pages[0];
if (nav == true) {
  // ...
}
```

### CSS

**Utility-First Approach:**

Use Tachyons for layout and spacing:

```html
<!-- Good: Tachyons utilities -->
<div class="pa3 bg-blue white br3 shadow-2">Content</div>

<!-- Avoid: Semantic classes (use only for custom styles) -->
<div class="my-card">Content</div>
```

**Custom CSS:**

Create custom CSS only for:

- Component-specific animations
- Styles that can't be achieved with utilities
- Chamber-specific themes
- Complex layouts

Store in:

- `css/styles.css` - Global custom styles
- `css/chamber-colors.css` - Chamber color variables
- `{chamber}/css/{chamber}.css` - Chamber-specific styles

**CSS Rules:**

- Use classes for styling (never IDs)
- Use IDs only for JavaScript hooks
- No inline styles (use JS for dynamic styling)
- Mobile-first responsive design
- Modern browsers only (no IE8 compatibility)

**Example:**

```css
/* Good: Component styles */
.et-nav-button {
  transition: all 0.3s ease;
  animation: glow 1s infinite;
}

/* Avoid: ID selectors, overly specific */
#my-button {
  color: red !important;
}
```

### HTML

**Semantic HTML:**

```html
<!-- Good: Semantic structure -->
<article class="chamber-content">
  <header>
    <h1>Title</h1>
  </header>
  <section>
    <p>Content...</p>
  </section>
</article>

<!-- Avoid: Div soup -->
<div class="article">
  <div class="header">
    <div class="h1">Title</div>
  </div>
  <div class="section">
    <div class="p">Content...</div>
  </div>
</div>
```

**Accessibility:**

```html
<!-- Include aria-label for icon buttons -->
<button aria-label="Close dialog" class="close-btn">×</button>

<!-- Use proper heading hierarchy -->
<h1>Page Title</h1>
<h2>Section Title</h2>
<h3>Subsection Title</h3>

<!-- Include alt text for images -->
<img src="photo.jpg" alt="Description of image content" />

<!-- Use semantic form labels -->
<label for="search-input">Search:</label>
<input id="search-input" type="text" />
```

---

## Adding a New Chamber

### Step-by-Step Guide

#### 1. Plan Your Chamber

Before coding, document your chamber:

- **Name**: Greek name and English translation
- **Function**: What content it holds
- **Color scheme**: Primary and secondary colors
- **Wing**: Which part of the temple (East, West, South, North)
- **Content structure**: How content will be organized
- **Required features**: Navigation, filtering, etc.

#### 2. Create Directory Structure

```bash
# Create the chamber directory
mkdir -p my-chamber/css
mkdir -p my-chamber/js
touch my-chamber/index.html
touch my-chamber/config.js
touch my-chamber/css/my-chamber.css
touch my-chamber/js/my-chamber.js
touch my-chamber/README.md
```

#### 3. Create Configuration File

Edit `my-chamber/config.js`:

```javascript
/**
 * @file config.js
 * @description Configuration for MY-CHAMBER
 */

const MY_CHAMBER_CONFIG = {
  chamber: {
    id: 'my-chamber',
    name: 'MY CHAMBER',
    subtitle: 'Brief description',
    color: '#FF00FF', // Primary color
    secondaryColor: '#000000', // Optional
    wing: 'east', // east, west, south, north
  },

  sections: [
    {
      id: 'overview',
      label: 'Overview',
      icon: 'icon-name',
    },
    // ... more sections
  ],

  tags: [
    { id: 'tag1', label: 'Tag 1', color: '#FF00FF' },
    // ... more tags
  ],

  content: {
    items: [
      {
        id: 'item-1',
        title: 'Item Title',
        date: '2026-02-02',
        section: 'overview',
        tags: ['tag1'],
        excerpt: 'Short summary',
        content: 'Full content or path to file',
      },
      // ... more items
    ],
  },

  ui: {
    showTags: true,
    showDates: true,
    showSections: true,
    defaultSection: 'overview',
  },

  animations: {
    transitionDuration: 300,
    filterFadeDuration: 200,
  },

  accessibility: {
    respectReducedMotion: true,
    keyboardShortcuts: true,
  },
};
```

#### 4. Create HTML Page

Edit `my-chamber/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MY CHAMBER | ETCETER4</title>

    <!-- Existing project styles -->
    <link rel="stylesheet" href="../css/vendor/tachyons/tachyons.min.css" />
    <link rel="stylesheet" href="../css/styles.css" />
    <link rel="stylesheet" href="../css/chamber-colors.css" />

    <!-- Chamber-specific styles -->
    <link rel="stylesheet" href="css/my-chamber.css" />
  </head>
  <body>
    <!-- Main chamber content -->
    <div id="my-chamber" class="chamber-container">
      <header class="chamber-header">
        <h1 class="chamber-title">MY CHAMBER</h1>
        <p class="chamber-subtitle">Brief description</p>
      </header>

      <!-- Navigation/Sections -->
      <nav class="chamber-nav" aria-label="Chamber sections">
        <button class="section-button" data-section="overview">Overview</button>
        <!-- ... more buttons -->
      </nav>

      <!-- Content -->
      <main class="chamber-content">
        <!-- Content sections rendered here -->
      </main>

      <!-- Back button -->
      <button id="back-button" class="back-button" aria-label="Back to menu">
        ← Back
      </button>
    </div>

    <!-- Configuration and logic -->
    <script src="config.js"></script>
    <script src="js/my-chamber.js"></script>
  </body>
</html>
```

#### 5. Create JavaScript Logic

Edit `my-chamber/js/my-chamber.js`:

```javascript
/**
 * @file my-chamber.js
 * @description UI functionality for MY-CHAMBER
 */

class MyChamberfunctionality {
  constructor() {
    this.chamberEl = $('#my-chamber');
    this.contentEl = this.chamberEl.find('.chamber-content');
    this.navButtons = this.chamberEl.find('.section-button');
    this.currentSection = MY_CHAMBER_CONFIG.ui.defaultSection;

    this.init();
  }

  init() {
    this.renderContent();
    this.attachEventListeners();
    this.setupAccessibility();
  }

  renderContent() {
    // Render initial content based on currentSection
    const items = MY_CHAMBER_CONFIG.content.items.filter(
      item => item.section === this.currentSection
    );

    const html = items
      .map(item => `<div class="content-item">${item.title}</div>`)
      .join('');

    this.contentEl.html(html);
  }

  attachEventListeners() {
    this.navButtons.on('click', event => {
      const section = $(event.currentTarget).data('section');
      this.switchSection(section);
    });

    $('#back-button').on('click', () => {
      showNewSection('#menu'); // Navigate back to menu
    });
  }

  switchSection(section) {
    this.currentSection = section;

    // Fade out, update, fade in
    this.contentEl.velocity('fadeOut', {
      duration: MY_CHAMBER_CONFIG.animations.filterFadeDuration,
      complete: () => {
        this.renderContent();
        this.contentEl.velocity('fadeIn', {
          duration: MY_CHAMBER_CONFIG.animations.transitionDuration,
        });
      },
    });

    // Update active button
    this.navButtons.removeClass('active');
    this.navButtons.filter(`[data-section="${section}"]`).addClass('active');
  }

  setupAccessibility() {
    // Add ARIA labels and keyboard shortcuts
    this.navButtons.attr('role', 'button');
  }
}

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new MyChamberfunctionality();
  });
} else {
  new MyChamberfunctionality();
}
```

#### 6. Create Styling

Edit `my-chamber/css/my-chamber.css`:

```css
/* MY-CHAMBER specific styles */

.chamber-container {
  padding: 2rem;
  background: linear-gradient(
    135deg,
    var(--chamber-my-chamber-color) 0%,
    #000 100%
  );
  min-height: 100vh;
}

.chamber-header {
  text-align: center;
  margin-bottom: 3rem;
}

.chamber-title {
  font-size: 3rem;
  color: var(--chamber-my-chamber-color);
  text-transform: uppercase;
  letter-spacing: 0.2em;
}

.chamber-subtitle {
  color: rgba(255, 255, 255, 0.7);
  font-size: 1.2rem;
}

.chamber-nav {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  justify-content: center;
  flex-wrap: wrap;
}

.section-button {
  padding: 0.75rem 1.5rem;
  border: 2px solid var(--chamber-my-chamber-color);
  background: transparent;
  color: var(--chamber-my-chamber-color);
  cursor: pointer;
  transition: all 0.3s ease;
}

.section-button:hover,
.section-button.active {
  background: var(--chamber-my-chamber-color);
  color: #000;
}

.chamber-content {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
}

.content-item {
  padding: 1.5rem;
  border: 1px solid var(--chamber-my-chamber-color);
  background: rgba(0, 0, 0, 0.5);
  color: white;
}

.back-button {
  position: fixed;
  bottom: 2rem;
  left: 2rem;
  padding: 0.75rem 1.5rem;
  background: var(--chamber-my-chamber-color);
  color: #000;
  border: none;
  cursor: pointer;
  font-weight: bold;
}
```

#### 7. Register in pageData.js

Edit `js/pageData.js` to add your new chamber:

```javascript
// Add to _pID object
const _pID = {
  // ... existing pages
  myChamber: '#my-chamber',
};

// Add to pages array
pages.myChamber = new Page({
  id: _pID.myChamber,
  tier: 3,
  upLinks: [_pID.menu, _pID.eastWing], // Adjust based on wing
  downLinks: [],
  initialize() {
    // Load configuration if needed
    $.cachedScript('my-chamber/config.js').done(() => {
      // Configuration loaded
    });
  },
});
```

Also add to the appropriate wing page's `downLinks`:

```javascript
// In the eastWing page configuration
pages.eastWing = new Page({
  // ...
  downLinks: [
    _pID.akademia,
    _pID.bibliotheke,
    _pID.myChamber, // Add here
  ],
});
```

#### 8. Update Configuration

Add your chamber to `js/config.js`:

```javascript
ETCETER4_CONFIG.chambers = {
  // ... existing chambers
  myChamber: {
    name: 'MY CHAMBER',
    subtitle: 'Brief description',
    color: '#FF00FF',
    secondaryColor: '#000000',
    wing: 'east',
  },
};
```

#### 9. Create Documentation

Edit `my-chamber/README.md`:

```markdown
# MY CHAMBER

Brief description of the chamber.

## Overview

Longer description of purpose, content, and features.

## Structure
```

my-chamber/
├── index.html # Main page
├── config.js # Configuration
├── css/
│ └── my-chamber.css
├── js/
│ └── my-chamber.js
└── README.md # This file

```

## Features

- Feature 1
- Feature 2
- Feature 3

## Configuration

Edit `config.js` to customize content, colors, and behavior.

## Content Metadata

Each item includes:
- id: Unique identifier
- title: Display title
- date: Creation date
- section: Which section it belongs to
- tags: For filtering
- excerpt: Short summary
```

#### 10. Test Your Chamber

```bash
# Start development server
npm run dev

# Run linting
npm run lint

# Fix lint issues
npm run lint:fix

# Run tests
npm run test
```

Navigate to your chamber and test:

- Section navigation
- Styling and layout
- Responsiveness (mobile, tablet, desktop)
- Keyboard navigation
- Screen reader compatibility
- Living Pantheon effects (glitch, breathing, etc.)

---

## Testing

### Manual Testing

Before submitting a PR, test your changes thoroughly:

**Navigation:**

- [ ] Can navigate to your new content
- [ ] Can navigate back to menu
- [ ] Back button works correctly
- [ ] Links don't break

**Styling:**

- [ ] Consistent with ETCETER4 aesthetic
- [ ] Responsive on mobile, tablet, desktop
- [ ] Chamber colors apply correctly
- [ ] No broken images or missing assets

**Accessibility:**

- [ ] Keyboard navigation works (Tab, Enter, Esc)
- [ ] Screen reader compatible
- [ ] Color contrast meets WCAG standards
- [ ] Skip links functional

**Performance:**

- [ ] Page loads quickly
- [ ] Animations are smooth (60fps)
- [ ] No console errors
- [ ] Memory usage reasonable

### Unit Tests

```bash
# Run unit tests
npm run test:unit

# Watch mode (re-run on file changes)
npm run test:unit:watch

# With coverage report
npm run test:unit:coverage
```

Write tests for:

- New functions
- Configuration parsing
- Navigation logic
- State management

Example test file: `tests/unit/my-chamber.spec.js`

```javascript
import { describe, it, expect } from 'vitest';
import MyChamberfunctionality from '../../my-chamber/js/my-chamber.js';

describe('MyChamberfunctionality', () => {
  it('should initialize correctly', () => {
    // Test setup and initialization
  });

  it('should switch sections', () => {
    // Test section switching logic
  });

  it('should render content items', () => {
    // Test content rendering
  });
});
```

### E2E Tests

```bash
# Run E2E tests (headless)
npm run test

# Run with browser visible
npm run test:headed

# Run UI (interactive)
npm run test:ui
```

Example test file: `tests/e2e/my-chamber.spec.js`

```javascript
import { test, expect } from '@playwright/test';

test.describe('MY CHAMBER', () => {
  test('should navigate to chamber', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.click('text=Menu');
    await page.click('text=MY CHAMBER');
    await expect(page.locator('#my-chamber')).toBeVisible();
  });

  test('should switch sections', async ({ page }) => {
    await page.goto('http://localhost:3000/#my-chamber');
    await page.click('button[data-section="overview"]');
    // Assert section changed
  });
});
```

### Accessibility Tests

```bash
# Run accessibility tests
npm run test:a11y
```

Uses Axe Core for automated accessibility scanning.

### Validation

```bash
# Run all checks
npm run validate

# ESLint
npm run lint

# Prettier formatting
npm run format:check

# Package lock validation
npm run validate:package-lock

# HTML validation
npm run validate:html
```

---

## Pull Request Process

### Before You Submit

1. **Update your branch**:

   ```bash
   git fetch origin
   git rebase origin/master
   ```

2. **Run all checks**:

   ```bash
   npm run validate
   npm run test:all
   ```

3. **Format your code**:

   ```bash
   npm run format
   ```

4. **Commit with clear messages**:
   ```bash
   git add .
   git commit -m "feat: add my chamber to pantheon"
   ```

### PR Description Template

```markdown
## Description

Brief description of what this PR does.

## Changes

- Change 1
- Change 2
- Change 3

## Testing

How to test these changes:

- [ ] Manual test steps
- [ ] Unit tests added/updated
- [ ] E2E tests added/updated

## Checklist

- [ ] Code follows style guide
- [ ] ESLint passes (`npm run lint`)
- [ ] Prettier passes (`npm run format:check`)
- [ ] Unit tests pass (`npm run test:unit`)
- [ ] E2E tests pass (`npm run test`)
- [ ] A11y tests pass (`npm run test:a11y`)
- [ ] No new console errors
- [ ] Documentation updated
- [ ] CHANGELOG.md updated (if applicable)
- [ ] No unrelated changes included

## Type of Change

- [ ] New feature (adds new chamber or functionality)
- [ ] Bug fix (fixes broken behavior)
- [ ] Enhancement (improves existing feature)
- [ ] Documentation (docs only, no code changes)
- [ ] Refactoring (code cleanup, no behavior change)

## Related Issues

Fixes #123
Related to #456
```

### What We Look For

- **Code Quality**: Follows project style and patterns
- **Tests**: All checks pass, new tests for new features
- **Documentation**: Updated if needed, clear commit messages
- **Accessibility**: WCAG 2.1 AA compliant
- **Performance**: No regressions, optimized where possible
- **Security**: No vulnerabilities, no secrets committed

### After Merge

- Changes automatically deploy to staging
- Monitor for errors in production
- Be available for follow-up questions

---

## Common Issues & Solutions

### Linting Errors

```bash
# See what eslint finds
npm run lint

# Auto-fix most issues
npm run lint:fix

# Format with prettier
npm run format
```

### Development Server Issues

```bash
# Kill any process using port 3000
lsof -ti:3000 | xargs kill -9

# Clear browser cache
# DevTools → Application → Clear storage

# Restart server
npm run dev
```

### Page Not Loading

1. Check browser console for errors
2. Check that page is registered in `pageData.js`
3. Verify HTML file exists and path is correct
4. Clear browser cache and reload

### Styling Not Applied

1. Check CSS file is linked in HTML
2. Verify Tachyons classes are spelled correctly
3. Check CSS specificity (you might need `!important` temporarily)
4. Clear browser cache
5. Check for typos in chamber color variables

### Navigation Not Working

1. Check that `showNewSection()` is called with correct page ID
2. Verify page ID matches entry in `_pID` and `pageData.js`
3. Check console for JavaScript errors
4. Verify jQuery is loaded

### Performance Issues

```bash
# Check bundle size
npm run build:analyze

# Profile in DevTools
# DevTools → Performance → Start recording

# Check for unoptimized images
# Use WebP with fallback
```

---

## Resources

### Project Documentation

- **[PANTHEON_ARCHITECTURE.md](PANTHEON_ARCHITECTURE.md)** - Complete temple system
- **[BEGINNER_TUTORIAL.md](BEGINNER_TUTORIAL.md)** - Detailed walkthrough
- **[EDGE_CASES.md](EDGE_CASES.md)** - Known quirks and limitations
- **[CLAUDE.md](CLAUDE.md)** - Project setup and conventions
- **[README.md](README.md)** - Main project information

### Chamber Documentation

Each chamber has a README:

- `agora/README.md` - Agora chamber documentation
- `ergasterion/README.md` - Workshop chamber documentation
- (Create for new chambers)

### External References

**JavaScript:**

- [JavaScript ES6+ Guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide)
- [jQuery Documentation](https://api.jquery.com/)
- [Velocity.js](http://velocityjs.org/)

**CSS:**

- [Tachyons CSS](https://tachyons.io/)
- [CSS Grid](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout)
- [Flexbox](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Flexible_Box_Layout)

**Accessibility:**

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Accessible Rich Internet Applications (ARIA)](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM](https://webaim.org/)

**Testing:**

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)

---

## Commit Message Guidelines

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add akademia chamber with essay system
fix: correct navigation back button in chambers
docs: update CONTRIBUTING.md with chamber guide
style: format code with prettier
refactor: simplify page loading logic
chore: update dependencies
test: add tests for chamber configuration
```

Format: `<type>: <subject>`

**Types:**

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Code style (formatting, missing semicolons, etc.)
- `refactor` - Code refactoring
- `perf` - Performance improvement
- `test` - Adding or updating tests
- `chore` - Build, deps, config changes

---

## Questions?

- Check documentation first
- Search existing issues
- Open a new issue with details
- Be patient and respectful

---

## Thank You!

Your contributions help transform ETCETER4 from a static archive into a **living cultural institution**. Whether you're adding chambers, fixing bugs, or improving documentation, your work matters.

Like a builder adding to an ancient temple, each contribution shapes the structure and spirit of this digital Pantheon.

🏛️ _Welcome to the temple. We're glad you're here._ 🏛️

---

**Last Updated**: February 2, 2026
**Version**: 2.0
**Maintainers**: ETCETER4 Team
