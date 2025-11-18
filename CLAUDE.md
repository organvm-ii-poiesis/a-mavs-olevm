# CLAUDE.md - AI Assistant Guide for ETCETER4

> Comprehensive guide for AI assistants working on the ETCETER4 codebase

**Last Updated:** 2025-11-18
**Repository:** [ivi374forivi/a-mavs-olevm](https://github.com/ivi374forivi/a-mavs-olevm)
**Version:** 1.0.0

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Repository Structure](#repository-structure)
3. [Technology Stack](#technology-stack)
4. [Core Architecture](#core-architecture)
5. [Development Workflow](#development-workflow)
6. [Coding Standards](#coding-standards)
7. [Key Files Reference](#key-files-reference)
8. [Common Development Tasks](#common-development-tasks)
9. [Testing and Quality Assurance](#testing-and-quality-assurance)
10. [Deployment](#deployment)
11. [Important Notes for AI Assistants](#important-notes-for-ai-assistants)
12. [Resources and Documentation](#resources-and-documentation)

---

## Project Overview

### What is ETCETER4?

**ETCETER4 - The Pantheon** is a multi-dimensional artistic platform built on classical architectural principles. It serves as the digital home for artist/composer ET CETER4 (Anthony James Padavano), operating across four professional facets:

1. **ACADEMIC** - Researcher, scholar, theorist
2. **PROFESSOR** - Teacher, mentor, curriculum designer
3. **DESIGNER** - Visual designer, UX/UI, web design
4. **ARTIST** - Composer, multimedia artist, experimental creator

### The Five Pillars Architecture

The site is structured as a complete **PANTHEON** - a sacred temple complex with five core pillars:

1. **MUSEUM (μουσεῖον)** - Preservation of artistic journey from 2010-present
2. **MAUSOLEUM (μαυσωλεῖον)** - Sacred spaces for completed work (albums, OGOD monument)
3. **LABYRINTH (λαβύρινθος)** - Non-linear navigation and exploration
4. **CHORAL CHAMBER (χορός)** - Music compositions and audio experiments
5. **ATELIER (Workshop)** - Active creation and work-in-progress

### Design Philosophy

Inspired by Radiohead's Kid A era websites (2000-2003), this digital temple features:

- **Living Architecture** - Constant subtle motion and animation
- **Non-linear Navigation** - Multiple pathways through content, hash-based routing
- **Breathing Temple** - Generative, unpredictable elements
- **Hidden Discoveries** - Easter eggs and secret paths
- **Atmospheric Sound** - Ambient audio integration
- **Glitch Aesthetics** - Controlled chaos and layers of mystery

### Project Type

- **Static website** - No backend server, runs entirely in browser
- **Single Page Application (SPA)** - Custom page-based navigation system
- **Zero build step** - Direct JavaScript, no transpilation required
- **Self-hosted assets** - Minimal CDN dependencies

---

## Repository Structure

```
/home/user/a-mavs-olevm/
├── index.html                      # Main entry point (temple entrance)
│
├── css/                            # Stylesheets
│   ├── styles.css                 # Main custom styles
│   ├── audioPlayer.css            # Audio player styling
│   ├── videoPlayer.css            # Video player styling
│   └── vendor/tachyons/           # Tachyons CSS framework
│
├── js/                            # JavaScript modules
│   ├── main.js                    # Core application logic & document ready
│   ├── page.js                    # Page class & navigation system
│   ├── pageData.js                # Page configuration & tree structure
│   ├── images.js                  # Image handling & lazy loading
│   ├── diary.js                   # Labyrinth diary entries
│   ├── ogod.js                    # OGOD visual album logic
│   ├── audioPlayer.js             # Custom audio player (Howler.js)
│   ├── videoPlayer.js             # Custom video player
│   ├── analytics.js               # Analytics integration
│   ├── namingStrategies.js        # Naming convention system
│   ├── nameSearch.js              # Name search engine
│   ├── namingAPI.js               # Naming API wrapper
│   ├── sketch.js                  # P5.js sketch entry point
│   ├── sketches/                  # P5.js generative art sketches
│   ├── test/                      # Test files
│   │   ├── namingTests.js         # Naming system tests (40+ cases)
│   │   └── tests.js               # General tests
│   └── vendor/                    # Third-party libraries
│       ├── jquery-3.7.1.min.js
│       ├── velocity.min.js
│       ├── p5.min.js
│       └── howler.min.js
│
├── akademia/                      # Academic chamber (6th pillar)
│   ├── cv/                        # Interactive CV system
│   │   └── index.html             # Faceted CV with shareable URLs
│   ├── essays/                    # Long-form academic essays
│   │   └── config.js              # Essay metadata
│   └── README.md                  # Academic content guidelines
│
├── img/                           # Visual assets
│   ├── photos/                    # Photography
│   └── icons/                     # Icon assets
│
├── audio/                         # Sound files
│   ├── albums/                    # Album directories
│   │   └── config.js              # Album metadata
│   └── README.md                  # Audio infrastructure docs
│
├── video/                         # Video content
│   └── config.js                  # Video metadata
│
├── labyrinth/                     # Diary entry HTML pages
│   └── *.html                     # Date-based entries (MMDDYY.html)
│
├── ogod/                          # OGOD Monument files
│   ├── bgimages/                  # Background images
│   └── ogodtracks/                # OGOD audio tracks
│
├── fonts/                         # Custom typography
├── html/                          # Additional HTML pages
├── json/                          # JSON configuration
│   └── pages.json                 # Page metadata
├── docs/                          # Documentation
├── designs/                       # Design assets
├── scripts/                       # Build/validation scripts
│   └── validate-package-lock.js
│
├── .github/                       # GitHub configuration
│   └── workflows/
│       └── ci-cd.yml              # CI/CD pipeline
│
└── [Configuration Files]
    ├── package.json               # NPM dependencies and scripts
    ├── vercel.json                # Vercel deployment config
    ├── eslint.config.js           # ESLint flat config (ES2024)
    ├── .prettierrc                # Prettier formatting rules
    ├── .htaccess                  # Apache security headers
    └── .gitignore                 # Git exclusions
```

---

## Technology Stack

### Frontend Core

- **HTML5** - Semantic markup, accessible structure
- **CSS3** - Modern styling with custom properties
- **JavaScript ES6+** - Modern JavaScript (ES2024 target)
- **No build tools** - Direct browser execution

### CSS Framework

- **Tachyons** - Utility-first CSS framework
  - Used for rapid prototyping and responsive design
  - Custom styles in `css/styles.css` for component-specific needs
  - No IE8 support - modern browsers only

### JavaScript Libraries

- **jQuery 3.7+** - DOM manipulation, AJAX, event handling
- **Velocity.js 2.0+** - High-performance animations
- **P5.js** - Generative art and creative coding sketches
- **Howler.js** - Audio player (in development)
- **Video.js** - Video player (planned)

### Development Tools

- **ESLint 9.14.0** - Code linting with @eslint/js
- **Prettier 3.3.3** - Code formatting
- **Browser-sync 3.0.3** - Development server with hot reload

### Deployment

- **Primary:** Vercel - Automatic branch previews, global CDN
- **Secondary:** GitHub Pages - Official public deployment
- **CI/CD:** GitHub Actions - Automated testing and deployment

### Version Requirements

- **Node.js:** >=18.0.0
- **NPM:** >=9.0.0

---

## Core Architecture

### Application Pattern: Custom Page-Based SPA

The site uses a **custom Single Page Application** architecture without frameworks like React or Vue. Navigation is handled through a hierarchical page system.

### Key Architectural Components

#### 1. Page Class (`js/page.js`)

Modern ES6 class that manages individual pages:

```javascript
class Page {
  constructor(pID, _hash, _tier, _upLinks, _downLinks, _iFrames, _pageDescription) {
    this.pID = pID;           // Page ID (e.g., "landing")
    this._hash = _hash;       // URL hash (e.g., "#landing")
    this._tier = _tier;       // Navigation hierarchy level (0-3)
    this._upLinks = _upLinks; // Parent page IDs
    this._downLinks = _downLinks; // Child page IDs
    this._iFrames = _iFrames; // iframe content sources
    this._pageDescription = _pageDescription; // Page description

    // State tracking
    this.isVisible = false;
    this.isInitialized = false;
    this.isLoading = false;
    this.isActive = false;
  }

  // Core methods
  initialize() { /* ... */ }
  load() { /* ... */ }
  initPage() { /* ... */ }

  // Static lookup
  static findPage(identifier) { /* ... */ }
}
```

**Key Features:**
- State management (visibility, initialization, loading)
- Hierarchical navigation (tier-based, upLinks/downLinks)
- Lifecycle methods (initialize → load → initPage)
- Static lookup methods

#### 2. Page Tree (`js/pageData.js`)

Centralized configuration defining all pages:

```javascript
const pageTree = [
  new Page("landing", "#landing", 0, [], ["menu"], [], "Landing page"),
  new Page("menu", "#menu", 1, ["landing"], ["sound", "vision", "words"], [], "Main menu"),
  new Page("sound", "#sound", 2, ["menu"], ["albums"], ["audio/index.html"], "Sound pillar"),
  // ... more pages
];
```

**Navigation Flow:**
```
Tier 0: #landing (entrance)
   ↓
Tier 1: #menu (main navigation)
   ↓
Tier 2: #sound, #vision, #words (pillars)
   ↓
Tier 3: #albums, #diary, #ogod (content)
```

#### 3. Hash-Based Routing

Navigation uses URL hash fragments:

```javascript
// URL: https://etceter4.com/#sound
window.addEventListener('hashchange', () => {
  const hash = window.location.hash;
  const page = Page.findPage(hash);
  if (page) {
    page.load();
  }
});
```

#### 4. Global Scope Communication

**Important:** Code uses global scope for cross-file communication:

```javascript
// Declared in one file, used in another
let currentPage = null;         // Current active page
let adIsLoaded = false;         // Ad loading state
const pageTree = [ /* ... */ ]; // Page definitions
```

ESLint `no-undef` rule is disabled to support this pattern.

### Module Organization

Each feature has its own module:

- **audioPlayer.js** - Custom audio player with Howler.js
- **videoPlayer.js** - Custom video player
- **images.js** - Image handling with lazy loading
- **diary.js** - Labyrinth diary entries
- **ogod.js** - OGOD visual album
- **namingStrategies.js** - Naming convention system
- **analytics.js** - Google Analytics integration

### Content Loading Strategy

- **Static HTML** - Main pages are pre-rendered HTML
- **iframe injection** - Content loaded via iframes for isolation
- **Lazy loading** - Images loaded on demand
- **AJAX** - Dynamic content fetched as needed

---

## Development Workflow

### Initial Setup

```bash
# Clone repository
git clone https://github.com/ivi374forivi/a-mavs-olevm.git
cd a-mavs-olevm

# Install dependencies
npm install

# Start development server
npm run dev
```

Development server runs at `http://localhost:3000` with hot reloading.

### NPM Scripts

```bash
npm run dev                     # Start dev server (browser-sync)
npm run lint                    # Run ESLint on core JS files
npm run lint:fix                # Auto-fix ESLint issues
npm run format                  # Format all files with Prettier
npm run format:check            # Check if files are formatted
npm run validate:package-lock   # Validate package-lock.json consistency
```

### Git Workflow

#### Branch Strategy

- **main/master** - Production branch (GitHub Pages deployment)
- **Feature branches** - `feature/description` or `claude/session-id`
- **Preview branches** - `preview/description` (for stakeholder review)

#### Creating Features

```bash
# Create feature branch
git checkout -b feature/new-audio-player
git push -u origin feature/new-audio-player

# Make changes
git add .
git commit -m "Add new audio player with Howler.js"
git push

# Open PR when ready
# GitHub Actions runs: lint → format check → security audit
```

#### Branch Previews (Vercel)

Every branch automatically gets a preview URL:

```
Format: https://etceter4-git-branch-name.vercel.app
Example: https://etceter4-git-feature-audio-player.vercel.app
```

Perfect for sharing work with stakeholders before merging.

### Development Best Practices

1. **Always run linter before committing:**
   ```bash
   npm run lint && npm run format:check
   ```

2. **Test in multiple browsers:**
   - Chrome/Edge (primary)
   - Firefox
   - Safari (if available)

3. **Check console for errors:**
   - Open DevTools Console
   - Look for JavaScript errors
   - Check Network tab for failed requests

4. **Use browser-sync for testing:**
   - Changes auto-reload
   - Test on mobile devices via network IP

5. **Follow existing patterns:**
   - Look at similar code before writing new features
   - Maintain consistency with current architecture

---

## Coding Standards

### JavaScript Conventions

#### ESLint Rules (enforced)

```javascript
// eslint.config.js highlights:
{
  ecmaVersion: 2024,
  rules: {
    'no-var': 'error',              // Use let/const, never var
    'prefer-const': 'error',        // Use const when variable isn't reassigned
    'eqeqeq': 'error',             // Always use === and !==
    'curly': 'error',              // Always use braces for blocks
    'no-console': 'warn',          // Warn on console.log (remove in production)
    'prefer-template': 'warn',     // Use template literals over concatenation
    'prefer-arrow-callback': 'warn' // Use arrow functions for callbacks
  }
}
```

#### Variable Naming

**Pattern:** `descriptiveNoun` or `adjectiveNoun`

```javascript
// Good
const currentPage = Page.findPage('#menu');
const isLoading = false;
const userData = { name: 'ET CETER4' };
const selectedTrack = null;

// Bad
const cp = Page.findPage('#menu');      // Too terse
const loading = false;                  // Unclear type (use isLoading)
const data = { name: 'ET CETER4' };    // Too generic
```

**Boolean Prefixes:**
- `is` - State: isVisible, isInitialized, isLoading
- `has` - Possession: hasAudio, hasVideo, hasChildren
- `can` - Ability: canPlay, canNavigate
- `should` - Conditional: shouldAutoplay, shouldPreload
- `will` - Future: willLoad, willNavigate

**State Prefixes:**
- `current` - Currently active: currentPage, currentTrack
- `selected` - User selection: selectedAlbum, selectedEssay
- `active` - Active state: activeLink, activeSection

#### Function Naming

**Pattern:** `verbNoun` or `verbObject`

```javascript
// Good
function showNewSection(sectionId) { /* ... */ }
function loadPageData(pageId) { /* ... */ }
function validateUserInput(input) { /* ... */ }
function initializeAudioPlayer() { /* ... */ }

// Bad
function show(sectionId) { /* ... */ }        // Missing noun
function pageData(pageId) { /* ... */ }       // Missing verb
function validate(input) { /* ... */ }        // Too generic
function audioPlayerInit() { /* ... */ }      // Wrong order
```

**Common Verb Prefixes:**
- `get` - Retrieve data: getPageById, getCurrentUser
- `set` - Assign data: setCurrentPage, setVolume
- `is/has/can` - Boolean checks: isVisible, hasAudio, canPlay
- `init` - Initialize: initPage, initAudioPlayer
- `load` - Load resources: loadPageData, loadAudio
- `show/hide` - Visibility: showSection, hideModal
- `toggle` - Switch state: toggleMenu, togglePlay
- `handle` - Event handlers: handleClick, handleKeyPress
- `render` - Display: renderPage, renderGallery

#### Class Naming

**Pattern:** `PascalCase` for classes

```javascript
// Good
class Page { /* ... */ }
class AudioPlayer { /* ... */ }
class NameSearchEngine { /* ... */ }

// Bad
class page { /* ... */ }
class audioPlayer { /* ... */ }
```

#### Constants

**Pattern:** `CONSTANT_CASE` for true constants (though not heavily used in this codebase)

```javascript
const MAX_VOLUME = 100;
const DEFAULT_FADE_DURATION = 1000;
const API_ENDPOINT = 'https://api.example.com';
```

### HTML Conventions

#### Page IDs

**Pattern:** `#entity` or `#entity-type` (kebab-case with # prefix)

```html
<!-- Good -->
<div id="landing"></div>
<div id="menu-page"></div>
<div id="sound"></div>
<div id="diary-entry"></div>

<!-- Bad -->
<div id="landingPage"></div>  <!-- camelCase not used for IDs -->
<div id="menu_page"></div>    <!-- snake_case not used -->
<div id="SOUND"></div>        <!-- UPPERCASE not used -->
```

#### CSS Classes

**Pattern:** Tachyons utilities + custom `prefix-entity-modifier` (kebab-case)

```html
<!-- Good: Tachyons utilities -->
<div class="pa3 ma2 bg-black white"></div>

<!-- Good: Custom classes -->
<div class="et-page-container"></div>
<button class="nav-button-active"></button>
<section class="audio-player-controls"></section>

<!-- Bad: Mixing conventions -->
<div class="etPageContainer"></div>      <!-- camelCase not used -->
<div class="nav_button_active"></div>    <!-- snake_case not used -->
```

### CSS Conventions

#### File Organization

```css
/* styles.css structure: */

/* 1. CSS Custom Properties (variables) */
:root {
  --primary-color: #000000;
  --secondary-color: #ffffff;
}

/* 2. Reset/Base styles */
* { box-sizing: border-box; }

/* 3. Layout components */
.et-page-container { /* ... */ }

/* 4. UI components */
.nav-button { /* ... */ }

/* 5. Media queries at the end */
@media (max-width: 768px) { /* ... */ }
```

#### Utility-First Approach

Prefer Tachyons utilities for common styling:

```html
<!-- Good: Use Tachyons for common patterns -->
<div class="pa3 ma2 flex items-center justify-between"></div>

<!-- Only use custom CSS for unique components -->
<div class="et-pantheon-temple-entrance"></div>
```

### File Naming Conventions

```
JavaScript:  camelCase        (audioPlayer.js, pageData.js)
HTML:        lowercase/kebab  (index.html, naming-demo.html)
CSS:         kebab-case       (styles.css, audio-player.css)
Docs:        UPPERCASE.md     (README.md, SECURITY.md, CLAUDE.md)
Diary:       MMDDYY.html      (040615.html, 112318.html)
```

### Prettier Configuration

```json
{
  "singleQuote": true,
  "semi": true,
  "tabWidth": 2,
  "useTabs": false,
  "printWidth": 80,
  "endOfLine": "lf",
  "trailingComma": "es5",
  "arrowParens": "always",
  "overrides": [
    {
      "files": ["*.html", "*.css"],
      "options": { "printWidth": 120 }
    }
  ]
}
```

### Domain-Specific Naming (ET CETER4)

#### Audio Elements

**Prefixes:** sound, audio, music, track, beat, rhythm, melody, harmony

```javascript
const soundControlVolume = 0.8;
const audioTrackPlayer = new AudioPlayer();
const musicAlbumList = ['album1', 'album2'];
```

#### Visual Elements

**Prefixes:** vision, visual, image, photo, still, video, graphic, art

```javascript
const imageGalleryViewer = document.querySelector('.gallery');
const visualDisplayCanvas = document.getElementById('canvas');
const photoCollectionData = loadPhotos();
```

#### Text Elements

**Prefixes:** word, text, story, diary, blog, poem, verse, line

```javascript
const textEditorContent = document.querySelector('.editor');
const diaryReaderView = initDiaryReader();
const storyNavigationLinks = document.querySelectorAll('.story-link');
```

#### Navigation

**Prefixes:** nav, menu, link, button, back, forward, up, down

```javascript
const navMenuControl = document.querySelector('.nav-menu');
const backButtonHandler = () => window.history.back();
const menuLinkActive = document.querySelector('.menu-link.active');
```

---

## Key Files Reference

### Critical JavaScript Files

#### `js/main.js`
**Purpose:** Application entry point and initialization

**Key Responsibilities:**
- Document ready handler
- Initial page load
- Global event listeners
- Third-party library initialization

**Important Globals:**
- `currentPage` - Currently active page instance
- `adIsLoaded` - Ad loading state tracking

#### `js/page.js`
**Purpose:** Page class definition and navigation logic

**Key Methods:**
- `constructor()` - Initialize page instance
- `initialize()` - Set up page structure
- `load()` - Load page content
- `initPage()` - Initialize page-specific functionality
- `findPage(identifier)` - Static lookup method

**State Properties:**
- `isVisible` - Page visibility state
- `isInitialized` - Initialization status
- `isLoading` - Loading status
- `isActive` - Active state

#### `js/pageData.js`
**Purpose:** Page tree configuration

**Structure:**
```javascript
const pageTree = [
  new Page(pID, hash, tier, upLinks, downLinks, iFrames, description),
  // ... all pages defined here
];
```

**Navigation Tiers:**
- Tier 0: Landing page
- Tier 1: Main menu
- Tier 2: Pillar pages (Sound, Vision, Words)
- Tier 3: Content pages (Albums, Diary, etc.)

#### `js/images.js`
**Purpose:** Image handling and lazy loading

**Features:**
- Lazy loading implementation
- Image optimization
- Responsive image handling

#### `js/namingStrategies.js`
**Purpose:** Naming convention system

**Key Features:**
- Multiple case conventions (camelCase, PascalCase, kebab-case, etc.)
- Context-aware suggestions (functions, variables, page IDs, CSS classes)
- Domain-specific patterns (audio, visual, text, navigation)
- Quality scoring system

**Usage:**
```javascript
ETCETERNaming.init('DEVELOPER'); // or 'ARTIST', 'MUSICIAN', 'WRITER'
const suggestions = ETCETERNaming.suggest('show new page', 'function');
// Returns: ["showNewPage", "displayNewPage", "renderPage", ...]
```

See `NAMING_SYSTEM.md` for comprehensive documentation.

### Configuration Files

#### `package.json`
**Dependencies:** None (static site)
**DevDependencies:** browser-sync, eslint, prettier

**Critical Scripts:**
- `dev` - Development server
- `lint` - Code quality checks
- `format` - Code formatting

#### `eslint.config.js`
**Format:** Flat config (ESLint 9+)
**Target:** ES2024

**Key Settings:**
- `no-undef: 'off'` - Disabled (global scope communication)
- `prefer-const: 'error'` - Enforced
- `no-var: 'error'` - Enforced

#### `vercel.json`
**Purpose:** Vercel deployment configuration

**Key Features:**
- Static build configuration
- Security headers (CSP, X-Frame-Options, etc.)
- Cache-Control headers (1 year for static assets)

#### `.htaccess`
**Purpose:** Apache server configuration

**Features:**
- Comprehensive Content Security Policy
- Security headers (DENY frames, nosniff, XSS protection)
- Gzip compression
- Cache expiration rules

### Documentation Files

#### `README.md`
Primary documentation covering:
- Project overview and philosophy
- Quick start guide
- Technology stack
- Project structure
- Development guidelines

#### `NAMING_SYSTEM.md`
Comprehensive naming conventions:
- Exhaustive naming strategies
- Dynamic name search engine
- User preference profiles
- 40+ test cases

#### `VERCEL_DEPLOYMENT.md`
Vercel deployment guide:
- Initial setup
- Branch preview workflow
- Production deployment
- Shareable URL strategies

#### `SECURITY.md`
Security documentation (if exists):
- Security headers
- Content Security Policy
- Dependency management
- Vulnerability reporting

#### `TASK_COMPLETION_SUMMARY.md`
Recent work summary:
- Branch cleanup analysis
- Pull request status
- Identified issues
- Recommended actions

---

## Common Development Tasks

### Adding a New Page

1. **Define page in `js/pageData.js`:**

```javascript
const pageTree = [
  // ... existing pages
  new Page(
    "newPage",                    // pID
    "#new-page",                  // hash
    2,                            // tier (0-3)
    ["menu"],                     // upLinks (parent pages)
    [],                           // downLinks (child pages)
    ["content/new.html"],         // iFrames
    "New page description"        // description
  ),
];
```

2. **Create HTML content:**

```html
<!-- html/new.html or inline in index.html -->
<div id="new-page" class="page" style="display: none;">
  <h1>New Page Title</h1>
  <p>Content here...</p>
</div>
```

3. **Add navigation link:**

```html
<a href="#new-page">New Page</a>
```

4. **Test:**
- Navigate to `http://localhost:3000/#new-page`
- Verify page loads
- Check navigation links (up/down)
- Test on mobile

### Adding Audio Content

1. **Place audio file:**
```
audio/albums/album-name/track.mp3
```

2. **Update config:**
```javascript
// audio/albums/config.js
const albums = [
  {
    id: 'album-name',
    title: 'Album Title',
    tracks: [
      { title: 'Track Name', file: 'track.mp3' }
    ]
  }
];
```

3. **Use audio player:**
```javascript
// In audioPlayer.js or custom code
const player = new AudioPlayer();
player.load('audio/albums/album-name/track.mp3');
player.play();
```

### Adding Documentation

1. **Create markdown file:**
```bash
touch NEW_GUIDE.md
```

2. **Follow naming convention:**
- ALL_CAPS.md for main docs
- kebab-case.md for supplementary docs

3. **Add to main README:**
```markdown
## Documentation

- [NEW_GUIDE.md](NEW_GUIDE.md) - Description of new guide
```

4. **Format with Prettier:**
```bash
npm run format
```

### Modifying Styles

1. **Check if Tachyons utility exists:**
```html
<!-- Use existing utilities when possible -->
<div class="pa3 bg-black white"></div>
```

2. **Add custom CSS only if needed:**
```css
/* css/styles.css */
.custom-component {
  /* Unique styling here */
}
```

3. **Test responsive behavior:**
```css
/* Mobile-first approach */
.custom-component {
  padding: 1rem;
}

@media (min-width: 768px) {
  .custom-component {
    padding: 2rem;
  }
}
```

### Working with P5.js Sketches

1. **Create sketch file:**
```javascript
// js/sketches/mySketch.js
function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(220);
  // Drawing code
}
```

2. **Load in HTML:**
```html
<script src="js/vendor/p5.min.js"></script>
<script src="js/sketches/mySketch.js"></script>
```

3. **Add to page:**
```html
<div id="sketch-container"></div>
```

### Running Tests

1. **Naming system tests:**
```bash
# In browser: Open naming-demo.html
# Click "Run Naming System Tests"
```

2. **Manual testing checklist:**
- [ ] All links work
- [ ] Navigation (back/forward) works
- [ ] Page loads without errors
- [ ] Mobile responsive
- [ ] Audio/video plays (if applicable)
- [ ] Images load correctly
- [ ] No console errors

---

## Testing and Quality Assurance

### Automated Testing

#### ESLint
```bash
npm run lint        # Check for issues
npm run lint:fix    # Auto-fix issues
```

**Files Checked:**
- js/main.js
- js/page.js
- js/pageData.js
- js/images.js
- js/diary.js
- js/ogod.js
- js/analytics.js

**Files Ignored:**
- node_modules/**
- css/vendor/**
- js/vendor/**
- js/sketches/**
- js/test/**

#### Prettier
```bash
npm run format:check   # Check formatting
npm run format         # Auto-format all files
```

**File Types:**
- JavaScript (*.js)
- CSS (*.css)
- HTML (*.html)
- Markdown (*.md)

#### Security Audit
```bash
npm audit             # Check for vulnerabilities
npm audit fix         # Auto-fix vulnerabilities
```

**Goal:** Zero known vulnerabilities

### Manual Testing

#### Browser Testing

**Primary Browsers:**
- Chrome/Edge (Chromium) - Primary development target
- Firefox - Secondary target
- Safari - iOS/macOS testing

**Testing Checklist:**
- [ ] Page loads without errors
- [ ] All navigation links work
- [ ] Hash routing works (#landing, #menu, #sound, etc.)
- [ ] Images load and display correctly
- [ ] Audio plays (if applicable)
- [ ] Animations perform smoothly
- [ ] No console errors
- [ ] Mobile responsive (use DevTools device emulation)

#### Mobile Testing

**Devices to Test:**
- iPhone (Safari)
- Android (Chrome)
- Tablet (iPad, Android tablet)

**Test Scenarios:**
- Touch navigation
- Viewport sizing
- Image loading on slow connections
- Audio controls on mobile
- Orientation changes (portrait/landscape)

#### Performance Testing

**Metrics to Check:**
- First Contentful Paint (FCP) < 1.5s
- Largest Contentful Paint (LCP) < 2.5s
- Time to Interactive (TTI) < 3.0s
- No layout shifts (CLS = 0)

**Tools:**
- Chrome DevTools Lighthouse
- WebPageTest.org
- Vercel Analytics (when deployed)

### Continuous Integration (GitHub Actions)

**CI/CD Pipeline Stages:**

1. **Lint and Format Check**
   - Run ESLint
   - Check Prettier formatting
   - Validate package-lock.json

2. **Security Audit**
   - Run `npm audit`
   - Fail if critical vulnerabilities found

3. **Deploy** (only on main/master)
   - Deploy to GitHub Pages
   - Exclude dev files

**Trigger:** Push or Pull Request to main/master

**View Results:**
- GitHub Actions tab in repository
- PR checks show status

---

## Deployment

### Deployment Targets

#### 1. Vercel (Primary - Preview Deployments)

**Setup:**
1. Connect GitHub account at [vercel.com](https://vercel.com)
2. Import repository
3. Configure: Framework Preset = "Other", Root = "./", No build command

**Automatic Deployments:**
- **Production:** Deploys from `main` or `master` branch
  - URL: `etceter4.vercel.app` or custom domain
- **Preview:** Every branch gets a preview URL
  - Format: `etceter4-git-branch-name.vercel.app`

**Use Cases:**
- Share work with stakeholders before merging
- Test changes in production-like environment
- Get feedback on feature branches

**Configuration:** `/home/user/a-mavs-olevm/vercel.json`

#### 2. GitHub Pages (Secondary - Official Public Site)

**Setup:**
- Automatically configured via GitHub Actions
- Deploys from `gh-pages` branch

**URL:** Based on GitHub Pages settings
- Likely: `https://[username].github.io/a-mavs-olevm/`

**Deployment Trigger:** Push to `main` or `master` branch

**Configuration:** `.github/workflows/ci-cd.yml`

### Deployment Workflow

#### For Feature Development

```bash
# 1. Create feature branch
git checkout -b feature/new-audio-player
git push -u origin feature/new-audio-player

# 2. Vercel automatically deploys
# Get preview URL from Vercel dashboard or GitHub PR comments

# 3. Share preview URL with stakeholders
# Example: https://etceter4-git-feature-new-audio-player.vercel.app

# 4. Make changes based on feedback
git add .
git commit -m "Update audio player based on feedback"
git push

# 5. Vercel auto-updates preview URL

# 6. When approved, merge to main
# Open PR on GitHub → Merge when CI passes

# 7. Production deployment happens automatically
# Both Vercel and GitHub Pages update
```

#### For Hotfixes

```bash
# 1. Create hotfix branch
git checkout -b hotfix/audio-bug
git push -u origin hotfix/audio-bug

# 2. Fix issue
git add .
git commit -m "Fix audio player initialization bug"
git push

# 3. Test on preview URL
# Verify fix works

# 4. Merge quickly to main
# Skip lengthy review if urgent

# 5. Production deploys automatically
```

### Pre-Deployment Checklist

Before merging to main/master:

- [ ] All tests pass locally (`npm run lint && npm run format:check`)
- [ ] No console errors in browser
- [ ] Tested on multiple browsers (Chrome, Firefox, Safari)
- [ ] Mobile responsive verified
- [ ] Images optimized and loading correctly
- [ ] Audio/video working (if applicable)
- [ ] No broken links
- [ ] Security audit clean (`npm audit`)
- [ ] Preview URL reviewed and approved

### Post-Deployment Verification

After deployment to production:

- [ ] Visit production URL
- [ ] Test critical user paths (navigation, audio, forms)
- [ ] Check for console errors
- [ ] Verify images load
- [ ] Test on mobile device
- [ ] Check Google Analytics (if monitoring traffic)

### Rollback Procedure

#### Vercel Rollback

1. Go to Vercel Dashboard → Deployments
2. Find previous working deployment
3. Click "..." menu → "Promote to Production"
4. Previous version is now live

#### GitHub Pages Rollback

```bash
# Revert the commit
git revert <commit-hash>
git push origin main

# Or reset to previous commit (use with caution)
git reset --hard <previous-commit-hash>
git push --force origin main
```

### Environment-Specific Configuration

**Development:**
- Local server: `http://localhost:3000`
- Hot reload enabled
- Source maps available
- Console logs visible

**Preview (Vercel):**
- Preview URL: `https://etceter4-git-branch.vercel.app`
- Production-like environment
- HTTPS enabled
- Security headers applied

**Production:**
- Vercel: `https://etceter4.vercel.app`
- GitHub Pages: Custom domain or GitHub.io
- CDN enabled
- Optimized caching
- Full security headers

---

## Important Notes for AI Assistants

### Understanding the Global Scope Pattern

This codebase **intentionally uses global scope** for cross-file communication:

```javascript
// Global variables declared in different files
let currentPage = null;         // main.js
const pageTree = [ /* ... */ ]; // pageData.js

// Used across multiple files
function someFunction() {
  currentPage.load(); // Accessing global from main.js
}
```

**Why ESLint `no-undef` is disabled:**
- Cross-file communication without module bundler
- Legacy architectural decision
- Works reliably in browser environment

**When working with globals:**
1. Check existing global declarations before creating new ones
2. Document globals at the top of files
3. Be aware of potential naming conflicts
4. Consider prefixing globals with project namespace (e.g., `ET_currentPage`)

### No Build Step Philosophy

This project **does not use a build step** (no Webpack, Vite, Parcel, etc.):

**Implications:**
- Write code that runs directly in browsers
- No JSX, TypeScript transpilation, or module bundling
- Use `<script>` tags for loading JavaScript
- Modern browsers support ES6+ natively

**Benefits:**
- Simpler deployment (just static files)
- Faster development (no build time)
- Easier debugging (no source maps needed)

**When adding features:**
- Ensure browser compatibility (ES6+ is fine)
- Avoid features requiring transpilation
- Use CDN libraries or vendor folder for dependencies

### Working with the Pantheon Architecture

The site uses **architectural metaphors extensively**:

**Greek/Classical Terms:**
- MUSEUM (μουσεῖον) - Preservation
- MAUSOLEUM (μαυσωλεῖον) - Honor/memorials
- LABYRINTH (λαβύρινθος) - Exploration
- CHORAL CHAMBER (χορός) - Sound/music
- ATELIER - Active creation

**When adding features:**
- Understand which pillar/chamber it belongs to
- Use appropriate naming (sound-, vision-, word- prefixes)
- Respect the architectural metaphor
- Consult existing documentation for context

### Naming System Integration

This project has a **sophisticated naming system**:

```javascript
// Initialize with user profile
ETCETERNaming.init('DEVELOPER'); // or 'ARTIST', 'MUSICIAN', 'WRITER'

// Get naming suggestions
const suggestions = ETCETERNaming.suggest('show new page', 'function');
// Returns: ["showNewPage", "displayNewPage", "renderPage", ...]

// Validate existing names
const validation = ETCETERNaming.validate('btn', 'navigation button', 'variable');
// Returns: { isValid: false, suggestions: [...] }
```

**When to use:**
- Naming new functions, variables, classes
- Renaming existing code
- Ensuring consistency with project conventions

**See:** `NAMING_SYSTEM.md` for full documentation

### Security Considerations

This codebase has **strong security posture**:

**Security Headers Applied:**
- Content-Security-Policy (CSP)
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block

**When adding features:**
1. **No inline scripts/styles** - Violates CSP
2. **Use SRI for CDN resources** - Subresource Integrity hashes
3. **Sanitize user input** - If adding forms or user-generated content
4. **Check dependencies** - Run `npm audit` before committing
5. **Review .htaccess changes** - Security headers in Apache config

**Goal:** Maintain zero known vulnerabilities

### AI-Specific Development Patterns

#### When Analyzing Code

1. **Check multiple files** - Global scope means related code is scattered
2. **Understand the page lifecycle** - initialize → load → initPage
3. **Look for tier-based navigation** - Pages have hierarchical relationships
4. **Trace hash-based routing** - URL changes trigger page loads

#### When Adding Features

1. **Follow existing patterns** - Look at similar code first
2. **Use naming conventions** - Consult `NAMING_SYSTEM.md`
3. **Test across browsers** - Chrome, Firefox, Safari minimum
4. **Update documentation** - Keep CLAUDE.md and README.md in sync
5. **Run linter** - `npm run lint && npm run format:check`

#### When Refactoring

1. **Preserve global scope** - Don't break cross-file communication
2. **Maintain backwards compatibility** - Hash URLs should still work
3. **Test extensively** - No unit tests, so manual testing is critical
4. **Document changes** - Update relevant .md files

#### When Debugging

1. **Check browser console** - Most errors are JavaScript runtime errors
2. **Verify hash routing** - Ensure hash changes trigger page loads
3. **Inspect page state** - Use `Page.findPage(hash)` in console
4. **Check network tab** - Verify assets load correctly

### Working with Documentation

This repository is **heavily documented**:

**Before making changes:**
1. Read `README.md` - Project overview
2. Read `CLAUDE.md` - This file (AI assistant guide)
3. Check `NAMING_SYSTEM.md` - Naming conventions
4. Review `TASK_COMPLETION_SUMMARY.md` - Recent work context

**When adding features:**
1. Update `README.md` if user-facing
2. Update `CLAUDE.md` if architecture changes
3. Create new .md files for complex features
4. Keep documentation in sync with code

**Documentation philosophy:**
- Explain **why**, not just **what**
- Provide examples and code snippets
- Link related documentation
- Keep it concise but comprehensive

---

## Resources and Documentation

### Internal Documentation

#### Architecture & Philosophy
- `README.md` - Main project documentation
- `PANTHEON_ARCHITECTURE.md` - Temple structure (if exists)
- `LIVING_PANTHEON_GENERATIVE.md` - Breathing architecture concepts (if exists)

#### Development Guides
- `CLAUDE.md` - This file (AI assistant guide)
- `NAMING_SYSTEM.md` - Comprehensive naming conventions
- `VERCEL_DEPLOYMENT.md` - Vercel deployment guide
- `SETUP_CHECKLIST.md` - Initial setup guide
- `BEGINNER_TUTORIAL.md` - Tutorial for beginners

#### Process & Workflow
- `TASK_COMPLETION_SUMMARY.md` - Recent work summary
- `BRANCH_CLEANUP_ANALYSIS.md` - Branch management analysis
- `PR9_CONFLICT_RESOLUTION_GUIDE.md` - PR conflict resolution

#### Reference Documentation
- `SECURITY.md` - Security guidelines (if exists)
- `EDGE_CASES.md` - Known limitations
- `LIVE_PREVIEW_GUIDE.md` - Live preview setup
- `SESSION_SUMMARY_*.md` - Historical session summaries

### External Resources

#### Technologies
- **Tachyons CSS:** https://tachyons.io/
- **jQuery Documentation:** https://api.jquery.com/
- **Velocity.js:** http://velocityjs.org/
- **P5.js:** https://p5js.org/reference/
- **Howler.js:** https://howlerjs.com/

#### Tools
- **ESLint:** https://eslint.org/docs/latest/
- **Prettier:** https://prettier.io/docs/en/
- **Browser-sync:** https://browsersync.io/docs/

#### Deployment
- **Vercel Documentation:** https://vercel.com/docs
- **GitHub Pages:** https://docs.github.com/en/pages
- **GitHub Actions:** https://docs.github.com/en/actions

### Quick Reference Commands

```bash
# Development
npm install                      # Install dependencies
npm run dev                      # Start dev server (localhost:3000)

# Code Quality
npm run lint                     # Check JavaScript code
npm run lint:fix                 # Auto-fix linting issues
npm run format                   # Format all files
npm run format:check             # Check formatting
npm run validate:package-lock    # Validate dependencies

# Testing
npm audit                        # Security audit
# Open naming-demo.html          # Run naming system tests

# Git Workflow
git checkout -b feature/name     # Create feature branch
git push -u origin feature/name  # Push and set upstream
git add . && git commit -m "msg" # Stage and commit
git push                         # Push changes
# Open PR on GitHub              # Create pull request

# Deployment
# Vercel: Automatic on push
# GitHub Pages: Automatic on main/master push
```

### Contact and Support

**Repository:** [ivi374forivi/a-mavs-olevm](https://github.com/ivi374forivi/a-mavs-olevm)

**For Issues:**
- Check existing documentation first
- Review `EDGE_CASES.md` for known limitations
- Check browser console for errors
- Verify all linters pass

**For Questions:**
- Consult this guide (CLAUDE.md)
- Check relevant .md files
- Review code comments in key files
- Examine similar existing features

---

## Version History

**Version 1.0.0** (2025-11-18)
- Initial CLAUDE.md creation
- Comprehensive codebase analysis
- Development workflow documentation
- Coding standards established
- Key files reference added
- Common tasks documented
- Testing and deployment guides
- AI-specific notes and considerations

---

## Conclusion

This guide provides a comprehensive overview of the ETCETER4 codebase for AI assistants. The project is a unique artistic platform with strong architectural principles, security-first approach, and extensive documentation.

**Key Takeaways:**

1. **Pantheon Architecture** - Understand the five pillars and classical metaphors
2. **No Build Step** - Write code that runs directly in browsers
3. **Global Scope** - Intentional cross-file communication pattern
4. **Naming Conventions** - Use the sophisticated naming system
5. **Security First** - Maintain zero vulnerabilities and strong headers
6. **Documentation Heavy** - Keep docs in sync with code
7. **Vercel Previews** - Every branch gets a shareable URL
8. **Living Temple** - Generative, breathing, non-linear experience

When in doubt, **refer to existing patterns**, **consult documentation**, and **test extensively** across browsers.

Happy coding! 🏛️✨

---

*This document is maintained by AI assistants working on the ETCETER4 project.*
*Last updated: 2025-11-18*
