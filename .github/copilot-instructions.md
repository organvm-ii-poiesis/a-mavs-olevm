# GitHub Copilot Instructions for etceter4

## Project Overview

This is **etceter4.com** - a creative multimedia website featuring experimental sounds, words, and images. The site is a web labyrinth designed for artistic exploration.

## Technology Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **CSS Framework**: Tachyons (utility-first CSS)
- **JavaScript Libraries**: jQuery 3.7+, Velocity.js 2.0+
- **Development Tools**: ESLint 9.x, Prettier 3.x, Browser-sync 3.x
- **CI/CD**: GitHub Actions
- **Deployment**: GitHub Pages & Vercel

## Project Structure

```
etceter4/
├── css/                 # Stylesheets
│   ├── styles.css      # Main custom styles
│   └── vendor/         # Third-party CSS (Tachyons, etc.)
├── js/                 # JavaScript modules
│   ├── main.js         # Main application logic & initialization
│   ├── page.js         # Page navigation & management
│   ├── pageData.js     # Dynamic page data loading
│   ├── diary.js        # Diary/journal functionality
│   ├── images.js       # Image gallery management
│   ├── ogod.js         # OGOD section logic
│   ├── analytics.js    # Analytics tracking
│   └── vendor/         # Third-party JS
├── img/                # Images and visual assets
├── audio/              # Audio files and albums
├── video/              # Video content
├── ogod/               # OGOD section HTML files
├── akademia/           # Academic/essays section
└── index.html          # Main entry point
```

## Coding Standards & Best Practices

### JavaScript

- **ES6+ Features**: Use modern JavaScript (const/let, arrow functions, template literals)
- **No var**: Always prefer `const` and `let` over `var`
- **Modules**: Code is organized as scripts (not ES modules) for browser compatibility
- **Global Scope**: Some variables use global scope for cross-file communication (intentional design)
- **jQuery**: Heavy use of jQuery for DOM manipulation - this is intentional
- **Comments**: Add comments for complex logic, but keep code self-documenting where possible

### CSS Architecture

- **Utility-First**: Primary approach uses Tachyons utility classes
- **Component Styles**: Custom components in `styles.css`
- **No Inline Styles**: Avoid inline CSS except for JS-driven dynamic styles
- **IDs for Hooks**: IDs are reserved for JavaScript hooks, not for styling
- **Classes for Styles**: Always use classes to describe visual styles
- **Responsive Design**: Design for modern browsers, no IE8 support

### HTML

- **Semantic HTML**: Use appropriate semantic elements
- **Accessibility**: Include proper ARIA labels and roles where needed
- **Classes Over IDs**: Use classes for styling, IDs for JS hooks only

### Git Workflow

- **Branch Strategy**: Create feature branches from `master`
- **Commit Messages**: Use conventional commit format (feat:, fix:, chore:, etc.)
- **Pull Requests**: All changes require passing CI checks (lint, format, security audit)
- **Dependencies**: Managed via Dependabot, reviewed before merging

## Development Workflow

### Getting Started

```bash
npm install              # Install dependencies
npm run dev             # Start development server at localhost:3000
```

### Before Committing

```bash
npm run lint            # Check code with ESLint
npm run format          # Format code with Prettier
npm run format:check    # Verify formatting
npm run validate:package-lock  # Validate package-lock.json
```

### CI/CD Pipeline

1. **Linting & Formatting** - ESLint and Prettier checks
2. **Package Lock Validation** - Dependency integrity
3. **Security Audit** - `npm audit` for vulnerabilities
4. **Deploy** - Automatic deployment to GitHub Pages on main/master

## Code Patterns to Follow

### Page Initialization

```javascript
// Pattern used in main.js
$(document).ready(function () {
  // Initialize components
  // Set up event listeners
  // Load initial data
});
```

### Dynamic Content Loading

```javascript
// Pattern used in pageData.js
$.getJSON('path/to/data.json', function (data) {
  // Process and render data
});
```

### Navigation & Page Management

```javascript
// Pattern used in page.js
function loadPage(pageId) {
  // Clear current content
  // Load new content
  // Update state
}
```

## Special Sections

### OGOD (Ontological God of Deities)

- Interactive deity/pantheon system
- Located in `/ogod/` directory
- Complex naming and generation logic

### Akademia

- Essays and academic content
- CV/portfolio section
- Located in `/akademia/` directory

### Audio/Video

- Album and media players
- Custom player implementations
- Config files for media metadata

## Security Guidelines

- **No Secrets**: Never commit API keys, tokens, or credentials
- **CSP**: Content Security Policy is strict - test external resources
- **Dependencies**: Keep dependencies updated via Dependabot
- **Audits**: Zero tolerance for known vulnerabilities

## Testing

- Manual testing via `npm run dev`
- Visual verification of UI changes
- Cross-browser testing for modern browsers
- No automated test suite currently (future enhancement)

## Common Tasks

### Adding New JavaScript

1. Create file in `/js/` directory
2. Add to ESLint config in `eslint.config.js`
3. Include script tag in HTML where needed
4. Test with `npm run lint`

### Adding New CSS

1. Prefer Tachyons utilities when possible
2. Add custom styles to `css/styles.css`
3. Use meaningful class names
4. Test responsiveness

### Adding New Pages

1. Create HTML file in appropriate directory
2. Update navigation in relevant JS files
3. Add page data to config files if dynamic
4. Test page loading and navigation

## AI Assistant Guidelines

When providing code suggestions:

1. **Match Existing Style**: Follow the patterns already in the codebase
2. **jQuery First**: Use jQuery for DOM manipulation (it's already loaded)
3. **Utility CSS**: Suggest Tachyons classes before custom CSS
4. **No Breaking Changes**: Maintain backward compatibility
5. **Test Suggestions**: Consider how to test the suggested changes
6. **Security Aware**: Flag potential security issues
7. **Performance**: Consider performance implications, especially for media-heavy sections

## Known Patterns & Quirks

- **Global Variables**: Some intentional global scope usage for cross-file communication
- **No Build Step**: This is a static site, no webpack/bundler needed
- **Legacy Code**: Some older patterns coexist with modern code
- **Experimental**: Site embraces experimental and artistic approaches
- **No Framework**: Intentionally framework-free (no React, Vue, etc.)

## Resources

- [README.md](../README.md) - Main documentation
- [SECURITY.md](../SECURITY.md) - Security policies
- [BEGINNER_TUTORIAL.md](../BEGINNER_TUTORIAL.md) - Complete beginner's guide
- [EDGE_CASES.md](../EDGE_CASES.md) - Known limitations

## Support

For questions or issues, refer to the main README or open a GitHub issue.
