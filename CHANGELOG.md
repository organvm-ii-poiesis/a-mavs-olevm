# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- ISC LICENSE file in repository root
- `.config/` directory for centralized tooling configuration
- SUPPORT.md for community support guidance
- GitHub Project board for roadmap tracking
- Unit tests for core SPA navigation (Page class, pageData configuration)
- Accessibility testing with @axe-core/playwright (WCAG 2.1 AA)
- HTML validation with html-validate
- Mermaid.js navigation architecture diagram in README
- Quick-start one-liner in README
- CI badge dashboard in README
- Memory leak fixes for intervals and event handlers in ogod.js, sketch.js, images.js, diary.js
- Error boundaries and try/catch blocks in animation callbacks and p5.js sketches
- Accessibility improvements:
  - Fixed link hover states for proper contrast
  - Added aria-live region for page transition announcements
  - Increased touch target sizes to 44px minimum
  - Added iframe titles for screen readers
  - Fixed malformed HTML in OGOD.html
- SEO enhancements:
  - Open Graph meta tags on all pages
  - Twitter Card meta tags on all pages
  - Canonical URLs
  - Standardized lang attributes to en-US
- Developer experience improvements:
  - Added .nvmrc for Node version management
  - Added husky and lint-staged for pre-commit hooks
  - Added commitlint for conventional commit messages
  - Added GitHub issue templates and PR template
  - Added validate script to package.json
  - Enhanced .gitignore with IDE and build directories

### Changed

- Relocated tooling configs (ESLint, Prettier, Vitest, Playwright, etc.) from root to `.config/`
- Updated package.json scripts to reference `.config/` paths
- Updated VS Code settings for new config locations
- Updated CI workflow for relocated config files
- Split CI workflow into unit tests, E2E tests, and accessibility tests
- Added accessibility testing job to CI pipeline
- Security headers:
  - Content Security Policy (CSP) headers
  - Strict-Transport-Security (HSTS) enabled
  - Referrer-Policy header
  - Permissions-Policy header
- Documentation:
  - API documentation (docs/API.md)
  - This changelog

### Changed

- Converted Carousel from constructor function to ES6 class
- Updated var declarations to const/let in sketch.js
- Fixed loose equality operators (== to ===)
- Removed autoplay from OGOD audio, made controls visible
- Replaced inline onClick handlers with event listeners in loophole.html
- Fixed deprecated document.body.background usage in loophole.js

### Fixed

- Service worker Promise rejection handling
- P5.js instance race conditions during canvas transitions
- Carousel touch handlers now properly namespaced for cleanup
- Audio player now checks loadFailed flag before playing
- Gallery event listener accumulation on rapid page revisits

## [3.0.0] - 2017-02-07

### Added

- Complete site redesign with SPA architecture
- Custom page navigation system
- P5.js generative art canvases
- OGOD visual album experience

## [2.0.0] - 2016

### Added

- Responsive design
- Mobile menu
- Social media integration

## [1.0.0] - Initial Release

### Added

- Initial website launch
- Basic page structure
- Music and content sections
