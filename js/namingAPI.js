/**
 * @file Integration API for ET CETER4 naming system
 * @author ET CETER4 Development Team
 */

'use strict';

/**
 * Main API for the ET CETER4 naming system
 * Provides easy-to-use interface for the existing codebase
 */
// eslint-disable-next-line no-var
var ETCETERNaming = {
  // Initialize the naming engine
  engine: null,
  isInitialized: false,

  /**
   * Initialize the naming system
   */
  init(userProfile) {
    userProfile = userProfile || 'DEFAULT';
    this.engine = NameSearchEngine.initialize().setUserProfile(userProfile);
    this.isInitialized = true;

    return this;
  },

  /**
   * Quick name suggestion for common use cases
   */
  suggest(input, type, options) {
    if (!this.isInitialized) {
      this.init();
    }

    options = options || {};
    let context;

    // Map simple types to naming contexts
    switch (type) {
      case 'function':
        context = NamingContexts.FUNCTION;
        break;
      case 'variable':
        context = NamingContexts.VARIABLE;
        break;
      case 'page':
        context = NamingContexts.PAGE_ID;
        break;
      case 'class':
        context = NamingContexts.CLASS_NAME;
        break;
      case 'id':
        context = NamingContexts.ID;
        break;
      default:
        context = null; // Auto-detect
    }

    const result = this.engine.search(input, {
      context,
      maxResults: options.maxResults || 5,
      existingNames: options.existingNames,
    });

    return result.suggestions.map(s => {
      return s.name;
    });
  },

  /**
   * Get the best single suggestion
   */
  suggestBest(input, type, options) {
    const suggestions = this.suggest(input, type, options);
    return suggestions.length > 0 ? suggestions[0] : null;
  },

  /**
   * Validate an existing name
   */
  validate(name, expectedMeaning, type) {
    if (!this.isInitialized) {
      this.init();
    }

    const result = this.engine.validateName(name, expectedMeaning);
    return {
      isValid: result.score.overall >= 70,
      score: result.score.overall,
      issues: result.recommendations,
      suggestions:
        result.score.overall < 70
          ? this.suggest(expectedMeaning, type, { maxResults: 3 })
          : [],
    };
  },

  /**
   * Get improvement suggestions for existing name
   */
  improve(currentName, expectedMeaning, _type) {
    if (!this.isInitialized) {
      this.init();
    }

    const result = this.engine.getImprovementSuggestions(
      currentName,
      expectedMeaning
    );
    return {
      message: result.message,
      suggestions: result.suggestions.map(s => {
        return s.name;
      }),
      issues: result.issues,
    };
  },

  /**
   * Switch user profile
   */
  setProfile(profileName) {
    if (!this.isInitialized) {
      this.init();
    }

    this.engine.setUserProfile(profileName);
    return this;
  },

  /**
   * Analyze existing codebase naming patterns
   */
  analyzeCodebase() {
    if (!this.isInitialized) {
      this.init();
    }

    return this.engine.codeAnalysis;
  },

  /**
   * Apply naming conventions to existing ET CETER4 patterns
   */
  rollForwardExisting() {
    const suggestions = {};

    // Analyze existing _pID object
    if (typeof _pID !== 'undefined') {
      Object.keys(_pID).forEach(function (key) {
        const validation = this.validate(_pID[key], `${key} page`, 'page');
        if (!validation.isValid) {
          suggestions[key] = {
            current: _pID[key],
            suggestions: validation.suggestions,
            issues: validation.issues,
          };
        }
      }, this);
    }

    // Analyze existing function names in global scope
    const globalFunctions = this._extractGlobalFunctions();
    globalFunctions.forEach(function (funcName) {
      const validation = this.validate(funcName, funcName, 'function');
      if (!validation.isValid) {
        suggestions[funcName] = {
          current: funcName,
          suggestions: validation.suggestions,
          issues: validation.issues,
        };
      }
    }, this);

    return suggestions;
  },

  /**
   * Generate comprehensive naming guidelines for the project
   */
  generateGuidelines() {
    return {
      conventions: {
        functions: NamingContexts.FUNCTION.convention.example,
        variables: NamingContexts.VARIABLE.convention.example,
        pageIds: NamingContexts.PAGE_ID.convention.example,
        classNames: NamingContexts.CLASS_NAME.convention.example,
        constants: NamingContexts.CONSTANT.convention.example,
      },
      etceterPatterns: {
        audio: ETCETERNamingPatterns.AUDIO_ELEMENTS,
        visual: ETCETERNamingPatterns.VISUAL_ELEMENTS,
        text: ETCETERNamingPatterns.TEXT_ELEMENTS,
        navigation: ETCETERNamingPatterns.NAVIGATION,
      },
      userProfiles: Object.keys(UserPreferences),
      bestPractices: [
        'Use descriptive names that clearly indicate purpose',
        'Follow consistent casing conventions throughout the project',
        'Prefer full words over abbreviations for better readability',
        'Use domain-specific prefixes for ET CETER4 context (sound, vision, words, etc.)',
        'Keep function names action-oriented with verbs',
        'Use nouns for variables and data structures',
        'Follow the established patterns in the existing codebase',
      ],
    };
  },

  /**
   * Interactive naming assistant
   */
  assistant: {
    /**
     * Start interactive naming session
     */
    start() {
      if (typeof prompt !== 'undefined') {
        this._runInteractiveSession();
      } else {
        return this._createAPIMethods();
      }
    },

    /**
     * Get help for naming something
     */
    help(input, type) {
      const parent = ETCETERNaming;
      if (!parent.isInitialized) {
        parent.init();
      }

      const suggestions = parent.suggest(input, type, { maxResults: 5 });
      const result = parent.engine.search(input, { maxResults: 5 });

      return {
        suggestions,
        explanation: `Based on input '${input}' and context '${
          type || 'auto-detected'
        }'`,
        context: result.context.convention.name,
        userProfile: result.userPreferences,
      };
    },

    _runInteractiveSession() {
      let session = true;
      while (session) {
        const input = prompt('Naming Assistant> ');
        if (!input || input === 'exit') {
          session = false;
          continue;
        }

        if (input === 'help') {
          continue;
        }

        const parts = input.split(' ');
        const command = parts[0];
        const args = parts.slice(1);

        switch (command) {
          case 'suggest': {
            ETCETERNaming.suggest(args.join(' '), args[args.length - 1]);
            break;
          }
          case 'validate': {
            const name = args[0];
            const meaning = args.slice(1).join(' ');
            ETCETERNaming.validate(name, meaning);
            break;
          }
          case 'profile':
            ETCETERNaming.setProfile(args[0].toUpperCase());
            break;
          case 'analyze': {
            ETCETERNaming.analyzeCodebase();
            break;
          }
          default:
          // Unknown command
        }
      }
    },

    _createAPIMethods() {
      return {
        suggest(input, type) {
          return ETCETERNaming.suggest(input, type);
        },
        validate(name, meaning, type) {
          return ETCETERNaming.validate(name, meaning, type);
        },
        improve(name, meaning, type) {
          return ETCETERNaming.improve(name, meaning, type);
        },
      };
    },
  },

  /**
   * Extract global function names for analysis
   */
  _extractGlobalFunctions() {
    const functions = [];

    // Known ET CETER4 functions from the codebase
    const knownFunctions = [
      'showNewSection',
      'fadeInPage',
      'fadeOutPage',
      'replacePlaceholders',
      'appendImagesTo',
      'changeHeader',
      'changeFooter',
    ];

    // Add functions that exist in global scope
    if (typeof window !== 'undefined') {
      knownFunctions.forEach(funcName => {
        if (typeof window[funcName] === 'function') {
          functions.push(funcName);
        }
      });
    }

    return functions.concat(knownFunctions);
  },
};

/**
 * Convenience shortcuts for common operations
 */

// Quick function name suggestion
function suggestFunctionName(description) {
  return ETCETERNaming.suggestBest(description, 'function');
}

// Quick variable name suggestion
function suggestVariableName(description) {
  return ETCETERNaming.suggestBest(description, 'variable');
}

// Quick page ID suggestion
function suggestPageId(description) {
  return ETCETERNaming.suggestBest(description, 'page');
}

// Quick class name suggestion
function suggestClassName(description) {
  return ETCETERNaming.suggestBest(description, 'class');
}

// Validate any name quickly
function validateName(name, description, type) {
  return ETCETERNaming.validate(name, description, type);
}

/**
 * Enhanced Page constructor that uses naming suggestions
 */
function createNamedPage(description, config) {
  config = config || {};

  // Auto-generate ID if not provided
  if (!config.id) {
    config.id = suggestPageId(description);
  }

  // Validate the ID
  const validation = validateName(config.id, description, 'page');
  if (!validation.isValid) {
    console.warn(
      `Page ID '${config.id}' may not follow best practices:`,
      validation.issues
    );
  }

  return new Page(config);
}

/**
 * Enhanced function naming helper
 */
function createNamedFunction(description, fn, _context) {
  const suggestedName = suggestFunctionName(description);

  // For debugging/development, attach the suggested name
  if (fn && typeof fn === 'function') {
    fn.suggestedName = suggestedName;
    fn.description = description;
  }

  return {
    suggestedName,
    function: fn,
    validation: validateName(suggestedName, description, 'function'),
  };
}

// Auto-initialize on load
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    // Initialize with ARTIST profile as default for ET CETER4
    ETCETERNaming.init('ARTIST');
  });
}

// Export for testing and external use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ETCETERNaming,
    suggestFunctionName,
    suggestVariableName,
    suggestPageId,
    suggestClassName,
    validateName,
    createNamedPage,
    createNamedFunction,
  };
}
