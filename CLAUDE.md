# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ETCETER4 is a static artistic website with a custom SPA architecture. No build step - JavaScript runs directly in the browser using global scope for cross-file communication.

## Commands

```bash
npm run dev              # Start dev server at localhost:3000 (browser-sync with hot reload)
npm run lint             # Run ESLint on core JS files
npm run lint:fix         # Auto-fix ESLint issues
npm run format           # Format all files with Prettier
npm run format:check     # Check formatting
npm run validate:package-lock  # Validate package-lock.json consistency
npm audit                # Security audit
```

## Architecture

### Page-Based SPA with Global Scope

The site uses a custom navigation system without a framework. Code intentionally uses **global scope** for cross-file communication (ESLint `no-undef` is disabled).

**Core files:**

- `js/page.js` - Page class with state management, navigation logic, and global `currentPage`
- `js/pageData.js` - Page tree configuration defining all pages and their relationships
- `js/main.js` - Application entry point and document ready handler

**Page Class** (`js/page.js`):

```javascript
class Page {
  constructor({ id, tier, upLinks, downLinks, initialize, load }) {
    // id: HTML element ID (e.g., "#menu")
    // tier: Navigation hierarchy level (1-4, higher = deeper)
    // upLinks: Parent page IDs (for back navigation)
    // downLinks: Child page IDs (for forward navigation)
  }
  static findPage(pageId) {
    /* lookup in global pages array */
  }
}
```

**Navigation flow:**

```
Tier 1: #landing → Tier 2: #menu → Tier 3: #sound, #vision, #words → Tier 4: #stills, #diary, #video
```

**Key globals** (shared across files):

- `currentPage` - Currently active Page instance
- `pages` - Array of all Page instances
- `showNewSection(pageId)` - Navigate to a page with fade animation

### Libraries

- jQuery 3.7+ for DOM manipulation
- Velocity.js for animations (fadeIn/fadeOut transitions)
- P5.js for generative art sketches
- Howler.js for audio
- Tachyons CSS for utility-first styling

### Content Loading

- Static HTML pages with JavaScript-controlled visibility
- iframes for isolated content (Bandcamp embeds, etc.)
- Lazy loading for images via `replacePlaceholders()`

## Code Patterns

### JavaScript Style (enforced by ESLint)

- Use `const`/`let`, never `var`
- Always use `===` and `!==`
- Always use curly braces for blocks
- Prefer arrow functions for callbacks
- Prefer template literals over concatenation

### Naming Conventions

- **Functions:** `verbNoun` pattern (e.g., `showNewSection`, `fadeInPage`, `loadPageData`)
- **Booleans:** `is`/`has`/`can` prefix (e.g., `isLoading`, `hasAllData`, `isVisible`)
- **Page IDs:** `#kebab-case` (e.g., `#landing`, `#sound`, `#stills`)
- **CSS classes:** Tachyons utilities + custom `prefix-modifier` (e.g., `et-page-container`)

### Global Scope Pattern

When adding new functionality that needs cross-file access:

1. Declare at file top level (not inside functions)
2. Document with JSDoc comment
3. Check for existing globals to avoid conflicts

## Deployment

- **Vercel:** Auto-deploys on push. Preview URLs for branches: `etceter4-git-{branch}.vercel.app`
- **GitHub Pages:** Deploys from `main`/`master` via GitHub Actions
- CI runs: lint → format check → security audit → deploy

## File Structure

Key directories:

- `js/` - Core application logic and vendor libraries
- `css/` - Stylesheets (Tachyons in `vendor/`)
- `labyrinth/` - Diary entry HTML pages (MMDDYY.html format)
- `ogod/` - OGOD visual album assets
- `akademia/` - Academic content and CV system
