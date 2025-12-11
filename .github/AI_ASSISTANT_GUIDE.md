# AI Assistant Configuration for etceter4

This file provides context and guidelines for various AI coding assistants working with the etceter4 repository.

## Quick Reference

- **Project Type**: Static website with vanilla JavaScript
- **Language**: JavaScript (ES6+), HTML5, CSS3
- **Framework**: None (intentionally framework-free)
- **CSS Approach**: Utility-first with Tachyons
- **DOM Library**: jQuery 3.7+
- **Dev Tools**: ESLint, Prettier, Browser-sync
- **Target Browsers**: Modern browsers only (no IE8)

## Key Constraints

### DO

✅ Use jQuery for DOM manipulation  
✅ Use Tachyons utility classes for styling  
✅ Use ES6+ features (const, let, arrow functions, template literals)  
✅ Follow existing code patterns  
✅ Add comments for complex logic  
✅ Run `npm run lint` before committing  
✅ Format with Prettier (`npm run format`)  
✅ Keep code modular and organized  
✅ Consider performance for media-heavy sections  
✅ Test in multiple browsers

### DON'T

❌ Use `var` (always use `const` or `let`)  
❌ Add frameworks (React, Vue, Angular, etc.)  
❌ Use inline styles (except for JS-driven dynamic styles)  
❌ Style with IDs (IDs are for JS hooks only)  
❌ Commit secrets or API keys  
❌ Break existing functionality  
❌ Add unnecessary dependencies  
❌ Ignore linting errors  
❌ Remove working code without good reason  
❌ Target IE8 or older browsers

## Architecture Overview

### File Structure

```
Repository Root
├── .github/              # GitHub configuration
│   ├── copilot-instructions.md  # Detailed Copilot guidance
│   ├── CODEOWNERS       # Code ownership
│   └── workflows/       # CI/CD pipelines
├── .vscode/             # VS Code settings
│   ├── settings.json    # Editor configuration
│   └── extensions.json  # Recommended extensions
├── js/                  # JavaScript modules
│   ├── main.js          # App initialization & main logic
│   ├── page.js          # Page navigation system
│   ├── pageData.js      # Dynamic data loading
│   ├── diary.js         # Journal functionality
│   ├── images.js        # Image gallery
│   ├── ogod.js          # OGOD section logic
│   └── analytics.js     # Analytics tracking
├── css/                 # Stylesheets
│   ├── styles.css       # Custom styles
│   └── vendor/          # Third-party CSS (Tachyons)
├── img/                 # Images
├── audio/               # Audio files
├── video/               # Video files
├── ogod/                # OGOD section HTML
├── akademia/            # Academic content
└── index.html           # Main entry point
```

### Code Flow

1. **Initialization** (`main.js`)
   - Sets up jQuery document ready
   - Initializes all modules
   - Sets up event listeners
   - Loads initial data

2. **Page Navigation** (`page.js`)
   - Handles page transitions
   - Manages URL state
   - Loads page content
   - Updates UI state

3. **Data Management** (`pageData.js`)
   - Loads JSON configuration
   - Fetches dynamic content
   - Caches data
   - Handles errors

4. **Feature Modules**
   - `diary.js` - Journal entries
   - `images.js` - Gallery management
   - `ogod.js` - Deity system
   - `analytics.js` - Tracking

## Common Patterns

### DOM Manipulation

```javascript
// Pattern: Use jQuery for selection and manipulation
$(document).ready(function () {
  // Select elements
  const $element = $('#myElement');
  const $items = $('.item-class');

  // Modify elements
  $element.addClass('active');
  $element.css('color', 'red');

  // Event handling
  $element.on('click', function () {
    $(this).toggleClass('selected');
  });
});
```

### AJAX Requests

```javascript
// Pattern: Use jQuery AJAX for data loading
$.getJSON('path/to/data.json', function (data) {
  // Success callback
  processData(data);
}).fail(function (jqXHR, textStatus, errorThrown) {
  // Error handling
  console.error('Failed to load data:', errorThrown);
});
```

### Page Loading

```javascript
// Pattern: Load and display page content
function loadPage(pageId) {
  // Clear current content
  $('#content').empty();

  // Load new content
  $.get(`pages/${pageId}.html`, function (html) {
    $('#content').html(html);
    // Initialize page-specific functionality
    initPageFeatures();
  });
}
```

### Event Handling

```javascript
// Pattern: Use event delegation for dynamic content
$(document).on('click', '.dynamic-button', function (e) {
  e.preventDefault();
  const $button = $(this);
  const data = $button.data('info');
  handleButtonClick(data);
});
```

## Styling Guidelines

### Tachyons Utility Classes

```html
<!-- Use utility classes for common styles -->
<div class="pa3 bg-blue white br3 shadow-2">
  <h1 class="f2 fw7 mb3">Title</h1>
  <p class="f5 lh-copy">Content text</p>
</div>
```

### Custom CSS (styles.css)

```css
/* Only add custom CSS when utilities aren't sufficient */
.custom-animation {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
```

## Testing Approach

Since there's no automated test suite:

1. **Manual Testing**
   - Start dev server: `npm run dev`
   - Test in browser at localhost:3000
   - Check browser console for errors
   - Test across different browsers

2. **Visual Testing**
   - Verify UI changes
   - Check responsive design
   - Test animations
   - Verify media loading

3. **Functionality Testing**
   - Click all interactive elements
   - Test navigation
   - Verify data loading
   - Check error states

## AI-Specific Guidance

### When Suggesting Code

1. **Check Existing Implementations**
   - Look at similar features first
   - Match the existing style
   - Reuse patterns that work

2. **Consider the Context**
   - Is jQuery available? (Yes, always)
   - What libraries are loaded?
   - What's the page structure?

3. **Provide Complete Solutions**
   - Include HTML if needed
   - Show CSS/classes required
   - Include necessary JS imports
   - Explain how to test

4. **Security First**
   - Sanitize user input
   - Use HTTPS for external resources
   - Don't expose sensitive data
   - Follow CSP rules

### When Debugging

1. **Gather Context**
   - What's the error message?
   - Which file/line?
   - What user action triggered it?
   - Browser console output?

2. **Check Common Issues**
   - jQuery selector correct?
   - Element exists in DOM?
   - Event handler attached?
   - Data loaded successfully?

3. **Suggest Fixes**
   - Minimal changes
   - Explain why it fixes the issue
   - Show how to verify the fix
   - Consider edge cases

### When Refactoring

1. **Don't Break Functionality**
   - Test before and after
   - Keep the same API
   - Maintain backward compatibility

2. **Improve Incrementally**
   - Small, focused changes
   - One thing at a time
   - Document changes

3. **Follow Standards**
   - Match project style
   - Use existing patterns
   - Keep consistency

## Common Scenarios

### Adding a New Feature

1. Plan the feature scope
2. Identify affected files
3. Write the code following patterns
4. Add necessary HTML/CSS
5. Test thoroughly
6. Update documentation if needed

### Fixing a Bug

1. Reproduce the bug
2. Identify root cause
3. Write minimal fix
4. Test fix works
5. Check for side effects
6. Document if complex

### Updating Dependencies

1. Check for breaking changes
2. Update package.json
3. Run `npm install`
4. Test all functionality
5. Run `npm audit`
6. Update code if needed

## Resources for AI Assistants

- [`.github/copilot-instructions.md`](.github/copilot-instructions.md) - Detailed Copilot guidance
- [`CONTRIBUTING.md`](CONTRIBUTING.md) - Contribution guidelines
- [`README.md`](README.md) - Project overview
- [`SECURITY.md`](SECURITY.md) - Security policies
- [`package.json`](package.json) - Dependencies and scripts
- [`eslint.config.js`](eslint.config.js) - Linting rules
- [`.prettierrc`](.prettierrc) - Formatting rules

## Support

If you encounter issues or need clarification:

1. Check documentation first
2. Review similar implementations in the codebase
3. Ask for human guidance
4. Report unclear instructions

---

**Remember**: The goal is to help developers efficiently while maintaining code quality and project consistency. When in doubt, prioritize safety, simplicity, and matching existing patterns.
