# Contributing to etceter4

Thank you for your interest in contributing to etceter4! This guide will help you get started.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Submitting Changes](#submitting-changes)
- [AI Assistant Guidelines](#ai-assistant-guidelines)

## Code of Conduct

This project embraces creativity and experimentation. Please be respectful and constructive in all interactions.

## Getting Started

### Prerequisites

- **Node.js** 18+ and **npm** 9+
- **Git** for version control
- A modern code editor (VS Code recommended)

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/ivi374forivi/a-mavs-olevm.git
cd a-mavs-olevm

# Install dependencies
npm install

# Start development server
npm run dev
```

The development server will start at `http://localhost:3000` with live reload enabled.

## Development Workflow

### Branch Strategy

1. Create a feature branch from `master`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Make your changes
3. Test thoroughly
4. Submit a pull request

### Making Changes

#### Before You Code

1. Check existing issues or create a new one
2. Discuss major changes in an issue first
3. Understand the existing code structure
4. Review [BEGINNER_TUTORIAL.md](BEGINNER_TUTORIAL.md) if you're new to the project

#### While Coding

1. Follow the existing code style and patterns
2. Write clean, self-documenting code
3. Add comments for complex logic
4. Test your changes with `npm run dev`
5. Run linting frequently: `npm run lint`

#### Before Committing

```bash
# Format your code
npm run format

# Check linting
npm run lint

# Verify formatting
npm run format:check

# Validate package-lock.json
npm run validate:package-lock
```

All checks must pass before your PR can be merged.

## Coding Standards

### JavaScript Style

#### Preferred Patterns

```javascript
// Use const and let, never var
const userName = 'example';
let userCount = 0;

// Use arrow functions for callbacks
const filteredData = data.filter(item => item.active);

// Use template literals
const message = `Hello, ${userName}!`;

// Use destructuring
const { id, name } = user;
```

#### jQuery Usage

```javascript
// This project uses jQuery - embrace it!
$(document).ready(function () {
  $('#myElement').on('click', function () {
    $(this).addClass('active');
  });
});
```

#### Avoid

```javascript
// Don't use var
var oldStyle = 'bad';

// Don't use == (use === instead)
if (value == 5) {
}

// Don't modify globals unnecessarily
// (except where intentional for cross-file communication)
```

### CSS Style

#### Use Tachyons First

```html
<!-- Prefer utility classes -->
<div class="pa3 bg-blue white br3 shadow-2">Content here</div>
```

#### Custom CSS When Needed

```css
/* Component-specific styles in styles.css */
.custom-component {
  /* Properties that can't be achieved with utilities */
  animation: fadeIn 0.3s ease-in;
}
```

#### CSS Rules

- Classes for styling (never IDs)
- IDs only for JavaScript hooks
- No inline styles (except JS-driven dynamic styles)
- Mobile-first responsive design
- Modern browsers only (no IE8)

### HTML Style

```html
<!-- Use semantic HTML -->
<article class="blog-post">
  <header>
    <h1>Title</h1>
  </header>
  <section>
    <p>Content...</p>
  </section>
</article>

<!-- Include accessibility attributes -->
<button aria-label="Close dialog" class="close-btn">×</button>
```

### File Organization

```
New JavaScript files: /js/yourfile.js
New CSS files: /css/yourfile.css (prefer using styles.css)
New HTML pages: /appropriatedirectory/yourpage.html
Images: /img/category/yourimage.jpg
Audio: /audio/category/yourfile.mp3
Video: /video/category/yourfile.mp4
```

## Submitting Changes

### Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
feat: add new image gallery navigation
fix: correct audio player volume control
chore: update dependencies
docs: improve README installation steps
style: format code according to prettier rules
refactor: simplify page loading logic
```

### Pull Request Process

1. **Update your branch**:

   ```bash
   git fetch origin
   git rebase origin/master
   ```

2. **Ensure all checks pass**:
   - ESLint: `npm run lint`
   - Prettier: `npm run format:check`
   - Package lock: `npm run validate:package-lock`

3. **Create detailed PR description**:
   - What changes were made
   - Why they were necessary
   - How to test them
   - Screenshots for UI changes

4. **Wait for review**:
   - CI/CD checks must pass
   - Code review approval required
   - Address any feedback

5. **After merge**:
   - Changes automatically deploy to GitHub Pages
   - Delete your feature branch

### PR Review Checklist

- [ ] Code follows project style guide
- [ ] All linting checks pass
- [ ] No new security vulnerabilities introduced
- [ ] Changes are minimal and focused
- [ ] Documentation updated if needed
- [ ] No unrelated changes included
- [ ] Commit messages are clear and descriptive

## AI Assistant Guidelines

### For AI Coding Assistants (Copilot, etc.)

When suggesting code changes:

1. **Understand the Context**:
   - Read [`.github/copilot-instructions.md`](.github/copilot-instructions.md)
   - Review existing code patterns
   - Check project dependencies

2. **Match the Style**:
   - Use jQuery for DOM manipulation
   - Follow existing naming conventions
   - Maintain code structure consistency

3. **Be Security Conscious**:
   - Never suggest committing secrets
   - Flag potential XSS vulnerabilities
   - Check for dependency vulnerabilities

4. **Consider Performance**:
   - Optimize for media-heavy content
   - Suggest lazy loading where appropriate
   - Minimize unnecessary DOM operations

5. **Provide Complete Solutions**:
   - Include necessary imports/includes
   - Show how to test the changes
   - Consider edge cases

### For Human Developers Working with AI

1. **Review AI Suggestions Carefully**:
   - Don't blindly accept all suggestions
   - Test thoroughly
   - Ensure suggestions match project patterns

2. **Provide Context to AI**:
   - Reference relevant files
   - Explain the problem clearly
   - Specify constraints

3. **Iterate**:
   - Use AI for boilerplate
   - Refine suggestions to match project style
   - Add human judgment and creativity

## Testing Your Changes

### Manual Testing Checklist

- [ ] Start dev server: `npm run dev`
- [ ] Navigate to changed pages
- [ ] Test in different browsers (Chrome, Firefox, Safari)
- [ ] Test responsive design (mobile, tablet, desktop)
- [ ] Check browser console for errors
- [ ] Verify no broken links or images
- [ ] Test with browser extensions disabled

### Specific Feature Testing

#### JavaScript Changes

- Use browser DevTools console
- Check for JavaScript errors
- Verify event handlers work
- Test with different data inputs

#### CSS Changes

- Check responsive breakpoints
- Verify animations work smoothly
- Test color contrast for accessibility
- Ensure cross-browser compatibility

#### HTML Changes

- Validate HTML (can use W3C validator)
- Check semantic structure
- Verify accessibility with screen reader if possible
- Test keyboard navigation

## Common Issues & Solutions

### Linting Errors

```bash
# Auto-fix most issues
npm run lint:fix

# Format code
npm run format
```

### Package Lock Issues

```bash
# Regenerate package-lock.json
rm package-lock.json
npm install
```

### Development Server Issues

```bash
# Kill any processes using port 3000
lsof -ti:3000 | xargs kill -9

# Restart server
npm run dev
```

## Project Structure Reference

### Key Files

- `index.html` - Main entry point
- `js/main.js` - Application initialization
- `js/page.js` - Page navigation system
- `css/styles.css` - Custom styles
- `package.json` - Project dependencies and scripts
- `eslint.config.js` - Linting rules
- `.prettierrc` - Formatting rules

### Key Directories

- `/js/` - JavaScript modules
- `/css/` - Stylesheets (+ vendor CSS)
- `/img/` - Images and visual assets
- `/audio/` - Audio files and albums
- `/video/` - Video content
- `/ogod/` - OGOD section
- `/akademia/` - Academic content
- `.github/` - GitHub config (workflows, Copilot instructions)

## Additional Resources

- [README.md](README.md) - Main project documentation
- [SECURITY.md](SECURITY.md) - Security policies and guidelines
- [BEGINNER_TUTORIAL.md](BEGINNER_TUTORIAL.md) - Complete beginner's guide
- [EDGE_CASES.md](EDGE_CASES.md) - Known limitations and quirks
- [.github/copilot-instructions.md](.github/copilot-instructions.md) - AI assistant guidelines

## Questions?

- Check existing documentation first
- Search closed issues for similar problems
- Open a new issue with detailed information
- Be patient and respectful

## Thank You!

Your contributions help make etceter4 more interesting and engaging. We appreciate your time and creativity! 🎨✨
