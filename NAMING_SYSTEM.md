# ET CETER4 Naming System

A comprehensive naming strategies and dynamic name search system for the ET CETER4 project, providing personalized naming suggestions based on user preferences and project context.

## Features

### 🎯 Exhaustive Naming Strategies
- **Multiple Case Conventions**: camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE
- **Context-Aware Suggestions**: Functions, variables, page IDs, CSS classes, constants
- **Domain-Specific Patterns**: Audio, visual, text, and navigation naming patterns tailored for ET CETER4
- **Quality Scoring**: Readability, context appropriateness, and semantic meaning evaluation

### 🔍 Dynamic Name Search Engine
- **Intelligent Context Detection**: Automatically determines the best naming context
- **Fuzzy Matching**: Finds similar existing names and suggests improvements
- **Personalized Preferences**: User profiles for different roles (Developer, Artist, Musician, Writer)
- **Real-time Suggestions**: Generate multiple naming options with quality scores

### 👤 User Preference Profiles
- **Developer**: Terse, conservative naming focused on functionality
- **Artist**: Creative, visual-focused with kebab-case preference
- **Musician**: Audio-domain focused with creative naming
- **Writer**: Text-focused with verbose, descriptive names
- **Default**: Balanced approach suitable for general use

### 🧪 Comprehensive Testing
- **40+ Test Cases**: Covering all major functionality
- **Browser Integration**: Works seamlessly in both Node.js and browser environments
- **Live Testing Interface**: Interactive demo with real-time feedback

## Quick Start

### Basic Usage

```javascript
// Initialize the naming system
ETCETERNaming.init('ARTIST'); // or 'DEVELOPER', 'MUSICIAN', 'WRITER', 'DEFAULT'

// Get naming suggestions
const suggestions = ETCETERNaming.suggest("show new page", "function");
console.log(suggestions); // ["showNewPage", "displayNewPage", "renderPage", ...]

// Validate existing names
const validation = ETCETERNaming.validate("btn", "navigation button", "variable");
console.log(validation.isValid); // false
console.log(validation.suggestions); // ["navigationButton", "navBtn", ...]

// Get improvement suggestions
const improvements = ETCETERNaming.improve("x", "show new section");
console.log(improvements.suggestions); // ["showNewSection", "displaySection", ...]
```

### Advanced Usage

```javascript
// Use the full search engine for detailed results
const engine = NameSearchEngine.initialize().setUserProfile('MUSICIAN');
const result = engine.search('sound control volume', {
    context: NamingContexts.FUNCTION,
    maxResults: 5,
    existingNames: ['playSound', 'stopSound']
});

console.log(result.suggestions); // Detailed suggestions with scores and explanations
console.log(result.similar); // Similar existing names found
```

## File Structure

```
js/
├── namingStrategies.js    # Core naming conventions and strategies
├── nameSearch.js          # Search engine and user preferences
├── namingAPI.js          # High-level API and integration helpers
└── test/
    └── namingTests.js    # Comprehensive test suite
naming-demo.html          # Interactive demo interface
```

## Naming Conventions

### Functions
- **Pattern**: `verbNoun` or `verbObject`
- **Examples**: `showNewSection`, `loadPageData`, `validateUserInput`
- **Prefixes**: get, set, is, has, can, should, will, init, load, show, hide, toggle

### Variables
- **Pattern**: `descriptiveNoun` or `adjectiveNoun`
- **Examples**: `currentPage`, `isLoading`, `userData`
- **Prefixes**: is, has, can, should, will, current, selected, active

### Page IDs
- **Pattern**: `#entity` or `#entity-type`
- **Examples**: `#landing`, `#menu`, `#diary-page`
- **Convention**: kebab-case with # prefix

### CSS Classes
- **Pattern**: `prefix-entity-modifier`
- **Examples**: `et-page-container`, `nav-button-active`
- **Convention**: kebab-case with meaningful prefixes

## ET CETER4 Domain Patterns

### Audio Elements
- **Prefixes**: sound, audio, music, track, beat, rhythm, melody, harmony
- **Suffixes**: Player, Control, Volume, Track, Album, Playlist
- **Example**: `soundControlVolume`, `audioTrackPlayer`

### Visual Elements
- **Prefixes**: vision, visual, image, photo, still, video, graphic, art
- **Suffixes**: Gallery, Carousel, Viewer, Display, Canvas, Frame
- **Example**: `imageGalleryViewer`, `visualDisplayCanvas`

### Text Elements
- **Prefixes**: word, text, story, diary, blog, poem, verse, line
- **Suffixes**: Editor, Reader, Writer, Content, Body, Paragraph
- **Example**: `textEditorContent`, `diaryReaderView`

### Navigation
- **Prefixes**: nav, menu, link, button, back, forward, up, down
- **Suffixes**: Navigation, Menu, Link, Button, Control, Handler
- **Example**: `navMenuControl`, `backButtonHandler`

## Integration with Existing Code

The naming system automatically analyzes existing ET CETER4 code patterns and provides suggestions for improvement:

```javascript
// Analyze current codebase
const analysis = ETCETERNaming.analyzeCodebase();

// Get suggestions for existing names
const rollForward = ETCETERNaming.rollForwardExisting();
console.log(rollForward); // Suggestions for improving current names
```

## Demo Interface

Open `naming-demo.html` in a browser to access the interactive demo featuring:

- **User Profile Selection**: Switch between different user types
- **Name Search & Suggestions**: Real-time naming suggestions
- **Name Validation**: Validate existing names with scoring
- **Name Improvement**: Get suggestions for improving poor names
- **Code Analysis**: Analyze existing codebase patterns
- **Guidelines**: View comprehensive naming guidelines
- **Live Testing**: Run the complete test suite

## API Reference

### ETCETERNaming (Main API)

- `init(userProfile)` - Initialize with user profile
- `suggest(input, type, options)` - Get name suggestions
- `suggestBest(input, type, options)` - Get single best suggestion
- `validate(name, expectedMeaning, type)` - Validate existing name
- `improve(currentName, expectedMeaning, type)` - Get improvement suggestions
- `setProfile(profileName)` - Switch user profile
- `analyzeCodebase()` - Analyze existing code patterns
- `rollForwardExisting()` - Get suggestions for existing names

### Convenience Functions

- `suggestFunctionName(description)` - Quick function name suggestion
- `suggestVariableName(description)` - Quick variable name suggestion
- `suggestPageId(description)` - Quick page ID suggestion
- `suggestClassName(description)` - Quick class name suggestion
- `validateName(name, description, type)` - Quick validation

### Enhanced Constructors

- `createNamedPage(description, config)` - Create Page with naming validation
- `createNamedFunction(description, fn, context)` - Create function with naming suggestions

## Testing

Run the test suite:

```bash
# In Node.js
node -e "require('./js/test/namingTests.js').runAllTests()"

# In browser
# Open naming-demo.html and click "Run Naming System Tests"
```

## Best Practices

1. **Use descriptive names** that clearly indicate purpose
2. **Follow consistent casing** conventions throughout the project
3. **Prefer full words** over abbreviations for better readability
4. **Use domain-specific prefixes** for ET CETER4 context (sound, vision, words, etc.)
5. **Keep function names action-oriented** with verbs
6. **Use nouns for variables** and data structures
7. **Follow established patterns** in the existing codebase

## Browser Compatibility

- Modern browsers with ES5+ support
- Node.js for server-side usage
- No external dependencies required

## License

Part of the ET CETER4 project. See main project license for details.