# Common Tasks for etceter4

This file documents common development tasks and workflows for GitHub Copilot Workspace and other AI assistants.

## Development Tasks

### Starting Development

**Task**: Start the development server
**Command**: `npm run dev`
**Expected**: Browser-sync starts at http://localhost:3000 with live reload
**Files Watched**: `*.html`, `css/*.css`, `js/*.js`

### Code Quality

**Task**: Check code with ESLint
**Command**: `npm run lint`
**Expected**: Displays any linting errors/warnings
**Auto-fix**: `npm run lint:fix`

**Task**: Format code with Prettier
**Command**: `npm run format`
**Expected**: All files formatted according to .prettierrc

**Task**: Check if code is formatted
**Command**: `npm run format:check`
**Expected**: Exit 0 if all files properly formatted

### Validation

**Task**: Validate package-lock.json integrity
**Command**: `npm run validate:package-lock`
**Expected**: Confirms package-lock matches package.json

### Full Pre-commit Check

**Task**: Run all checks before committing
**Commands**:

```bash
npm run lint
npm run format:check
npm run validate:package-lock
```

## Adding New Features

### Add New JavaScript Module

1. Create file in `/js/yourmodule.js`
2. Add to ESLint config in `eslint.config.js`
3. Include script tag in relevant HTML files
4. Initialize in `main.js` if needed
5. Test with `npm run lint`
6. Format with `npm run format`

**Example**:

```javascript
// js/yourmodule.js
(function () {
  'use strict';

  // Your module code here
  function init() {
    // Initialization logic
  }

  // Expose to global scope if needed
  window.YourModule = {
    init: init,
  };
})();
```

### Add New Page

1. Create HTML file in appropriate directory
2. Update navigation in `page.js` or relevant JS
3. Add page data to config files if dynamic
4. Test navigation and loading
5. Check responsive design

### Add New Styles

**For utility classes**: Use Tachyons classes in HTML
**For custom components**: Add to `css/styles.css`

```css
/* Custom component example */
.my-component {
  /* Only styles not achievable with utilities */
  animation: myAnimation 1s ease-in-out;
}
```

### Add Images

1. Place in `/img/category/` directory
2. Optimize for web (compress if large)
3. Update image config if using dynamic loading
4. Test loading in browser

### Add Audio/Video

1. Place in `/audio/` or `/video/` directory
2. Update media config files
3. Test playback in player
4. Verify file formats supported

## Maintenance Tasks

### Update Dependencies

**Task**: Check for updates
**Command**: `npm outdated`

**Task**: Update dependencies
**Command**: `npm update`

**Task**: Check for vulnerabilities
**Command**: `npm audit`

**Task**: Fix vulnerabilities
**Command**: `npm audit fix`

### Clean Up

**Task**: Remove node_modules
**Command**: `rm -rf node_modules`

**Task**: Fresh install
**Command**: `npm install`

**Task**: Clear cache
**Command**: `npm cache clean --force`

## Debugging Tasks

### Check for JavaScript Errors

1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for red error messages
4. Click on error to see stack trace

### Debug Specific Module

1. Add `debugger;` statement in code
2. Open DevTools
3. Reload page
4. Execution pauses at debugger
5. Step through code

### Check Network Requests

1. Open DevTools Network tab
2. Reload page
3. Check for failed requests (red)
4. Click on request to see details

### Verify CSS Applied

1. Open DevTools Elements tab
2. Select element
3. Check Styles panel
4. See which styles are applied/overridden

## Git Tasks

### Create Feature Branch

```bash
git checkout -b feature/feature-name
```

### Stage and Commit Changes

```bash
git add .
git commit -m "feat: descriptive message"
```

### Push to Remote

```bash
git push origin feature/feature-name
```

### Update from Master

```bash
git fetch origin
git rebase origin/master
```

## Testing Scenarios

### Test Page Navigation

1. Start dev server
2. Click all navigation links
3. Verify page loads correctly
4. Check browser console for errors
5. Test browser back/forward buttons

### Test Responsive Design

1. Start dev server
2. Open DevTools
3. Toggle device toolbar (Ctrl+Shift+M)
4. Test mobile sizes (320px, 375px, 414px)
5. Test tablet sizes (768px, 1024px)
6. Test desktop sizes (1280px, 1920px)

### Test Image Gallery

1. Navigate to image section
2. Click thumbnails
3. Verify full images load
4. Test navigation arrows
5. Test keyboard navigation
6. Check loading states

### Test Audio Player

1. Navigate to audio section
2. Click play button
3. Verify audio plays
4. Test pause/resume
5. Test volume control
6. Test track switching

### Test OGOD Section

1. Navigate to OGOD
2. Test deity generation
3. Verify naming system works
4. Check pantheon display
5. Test interactive elements

## Performance Tasks

### Check Load Time

1. Open DevTools Network tab
2. Disable cache
3. Hard reload (Ctrl+Shift+R)
4. Check "Load" time at bottom
5. Look for slow resources

### Optimize Images

**Task**: Compress images
**Tools**: ImageOptim, TinyPNG, Squoosh
**Target**: < 200KB for most images

### Check Bundle Size

Currently no bundling, but monitor:

- Total CSS size
- Total JS size
- Number of HTTP requests

### Lazy Load Images

For many images, consider lazy loading:

```html
<img data-src="image.jpg" class="lazyload" />
```

## Deployment Tasks

### Deploy to GitHub Pages

Automatic on push to master/main via GitHub Actions

**Manual verification**:

1. Push to master
2. Check Actions tab in GitHub
3. Wait for workflow to complete
4. Visit live site

### Deploy to Vercel

Automatic deployment configured

**Check deployment**:

1. Push changes
2. Vercel bot comments on PR/commit
3. Click preview link
4. Verify changes

## Troubleshooting Common Issues

### Port 3000 Already in Use

```bash
lsof -ti:3000 | xargs kill -9
npm run dev
```

### ESLint Errors After Update

```bash
rm -rf node_modules
rm package-lock.json
npm install
npm run lint
```

### Prettier Formatting Issues

```bash
npm run format
git add .
git commit -m "style: format code with prettier"
```

### Package Lock Out of Sync

```bash
rm package-lock.json
npm install
npm run validate:package-lock
```

### Git Merge Conflicts

1. Open conflicted file
2. Look for `<<<<<<<`, `=======`, `>>>>>>>` markers
3. Resolve manually or use merge tool
4. Remove conflict markers
5. `git add <file>`
6. `git commit`

## AI Assistant Task Patterns

### When User Says "Fix the styling"

1. Ask which element/page
2. Check current styles
3. Identify issue (layout, colors, spacing)
4. Suggest Tachyons classes first
5. Add custom CSS only if needed
6. Test in browser

### When User Says "Add a feature"

1. Understand requirements
2. Identify affected files
3. Check for similar existing features
4. Write code following patterns
5. Test thoroughly
6. Update documentation

### When User Says "Debug this error"

1. Get error message
2. Get steps to reproduce
3. Check browser console
4. Identify root cause
5. Suggest minimal fix
6. Explain why fix works

### When User Says "Optimize performance"

1. Measure current performance
2. Identify bottlenecks
3. Suggest specific optimizations:
   - Lazy loading
   - Image optimization
   - Code minification
   - Caching strategies
4. Implement changes
5. Measure improvement

## Quick Reference Commands

```bash
# Development
npm run dev                  # Start dev server
npm run lint                 # Check linting
npm run lint:fix            # Fix linting issues
npm run format              # Format code
npm run format:check        # Check formatting
npm run validate:package-lock  # Validate dependencies

# Package management
npm install                 # Install dependencies
npm update                  # Update dependencies
npm audit                   # Security check
npm audit fix              # Fix vulnerabilities
npm outdated               # Check for updates

# Git
git status                 # Check status
git add .                  # Stage all changes
git commit -m "msg"        # Commit changes
git push                   # Push to remote
git pull                   # Pull from remote
git checkout -b name       # New branch
```

## File Templates

### New JavaScript Module Template

```javascript
/**
 * Module: [Module Name]
 * Description: [What this module does]
 */
(function () {
  'use strict';

  // Private variables
  const config = {
    // Configuration options
  };

  // Private functions
  function privateFunction() {
    // Implementation
  }

  // Public API
  function init() {
    // Initialization logic
  }

  function publicFunction() {
    // Public functionality
  }

  // Expose public API
  window.ModuleName = {
    init: init,
    publicFunction: publicFunction,
  };
})();
```

### New HTML Page Template

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Page Title - etceter4</title>
    <link rel="stylesheet" href="/css/vendor/tachyons/tachyons.min.css" />
    <link rel="stylesheet" href="/css/styles.css" />
  </head>
  <body class="bg-near-white dark-gray">
    <header class="pa3">
      <!-- Header content -->
    </header>

    <main class="pa3">
      <!-- Main content -->
    </main>

    <footer class="pa3">
      <!-- Footer content -->
    </footer>

    <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
    <script src="/js/main.js"></script>
  </body>
</html>
```

---

This task reference helps AI assistants understand common workflows and provide better assistance for etceter4 development.
