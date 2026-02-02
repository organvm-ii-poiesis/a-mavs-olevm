/**
 * @file Dynamic name search and suggestion engine with personalized preferences
 * @author ET CETER4 Development Team
 */

'use strict';

// Import dependencies if in Node.js environment
/* eslint-disable no-var */
if (typeof module !== 'undefined' && typeof require !== 'undefined') {
  var namingModule = require('./namingStrategies.js');
  var NamingConventions = namingModule.NamingConventions;
  var NamingContexts = namingModule.NamingContexts;
  var ETCETERNamingPatterns = namingModule.ETCETERNamingPatterns;
  var NamingQuality = namingModule.NamingQuality;
  var NamingStrategy = namingModule.NamingStrategy;
}
/* eslint-enable no-var */

/**
 * User preference profiles for personalized naming
 */
// eslint-disable-next-line no-var
var UserPreferences = {
  DEFAULT: {
    casePreference: 'camelCase',
    verbosity: 'medium', // "terse", "medium", "verbose"
    domainFocus: 'general', // "audio", "visual", "text", "navigation", "general"
    creativityLevel: 'balanced', // "conservative", "balanced", "creative"
    abbreviationTolerance: 'low', // "none", "low", "medium", "high"
  },

  DEVELOPER: {
    casePreference: 'camelCase',
    verbosity: 'terse',
    domainFocus: 'general',
    creativityLevel: 'conservative',
    abbreviationTolerance: 'medium',
  },

  ARTIST: {
    casePreference: 'kebab-case',
    verbosity: 'verbose',
    domainFocus: 'visual',
    creativityLevel: 'creative',
    abbreviationTolerance: 'low',
  },

  MUSICIAN: {
    casePreference: 'camelCase',
    verbosity: 'medium',
    domainFocus: 'audio',
    creativityLevel: 'creative',
    abbreviationTolerance: 'low',
  },

  WRITER: {
    casePreference: 'snake_case',
    verbosity: 'verbose',
    domainFocus: 'text',
    creativityLevel: 'creative',
    abbreviationTolerance: 'none',
  },
};

/**
 * Dynamic context detection based on existing codebase patterns
 */
// eslint-disable-next-line no-var
var ContextDetector = {
  /**
   * Analyze existing code to detect naming patterns and contexts
   */
  analyzeExistingCode() {
    const analysis = {
      detectedPatterns: {},
      commonPrefixes: {},
      commonSuffixes: {},
      caseDistribution: {},
      domainFocus: {},
    };

    // Analyze global variables and functions if available
    if (typeof window !== 'undefined') {
      this._analyzeGlobalScope(analysis);
    }

    // Analyze DOM elements
    if (typeof document !== 'undefined') {
      this._analyzeDOMElements(analysis);
    }

    return analysis;
  },

  /**
   * Detect the most appropriate context for a given input
   */
  detectContext(input, existingCodeAnalysis) {
    if (!input) {
      return NamingContexts.VARIABLE;
    }

    const inputLower = input.toLowerCase();
    const contextScores = {};

    // Check against ET CETER4 domain patterns
    Object.keys(ETCETERNamingPatterns).forEach(patternKey => {
      const pattern = ETCETERNamingPatterns[patternKey];
      let score = 0;

      pattern.prefixes.forEach(prefix => {
        if (inputLower.includes(prefix)) {
          score += 10;
        }
      });

      pattern.suffixes.forEach(suffix => {
        if (inputLower.includes(suffix.toLowerCase())) {
          score += 10;
        }
      });

      contextScores[patternKey] = score;
    });

    // Find highest scoring pattern
    const bestPattern = Object.keys(contextScores).reduce((a, b) => {
      return contextScores[a] > contextScores[b] ? a : b;
    });

    if (contextScores[bestPattern] > 0) {
      return ETCETERNamingPatterns[bestPattern].context;
    }

    // Fallback context detection based on input characteristics
    if (inputLower.includes('page') || inputLower.includes('section')) {
      return NamingContexts.PAGE_ID;
    }
    if (
      inputLower.includes('button') ||
      inputLower.includes('link') ||
      inputLower.includes('click')
    ) {
      return NamingContexts.FUNCTION;
    }
    if (inputLower.includes('class') || inputLower.includes('style')) {
      return NamingContexts.CLASS_NAME;
    }

    return NamingContexts.VARIABLE;
  },

  _analyzeGlobalScope(analysis) {
    // This would analyze window object in browser environment
    // For now, we'll simulate with known ET CETER4 patterns
    const knownPatterns = [
      'showNewSection',
      'fadeInPage',
      'replacePlaceholders',
      'currentPage',
      'adIsLoaded',
      'stillsCarousel',
      'Page',
      'Carousel',
      '_pID',
    ];

    knownPatterns.forEach(function (pattern) {
      this._categorizePattern(pattern, analysis);
    }, this);
  },

  _analyzeDOMElements(analysis) {
    if (!document.querySelectorAll) {
      return;
    }

    // Analyze IDs
    const elements = document.querySelectorAll('[id]');
    elements.forEach(function (element) {
      this._categorizePattern(element.id, analysis);
    }, this);

    // Analyze classes
    const classElements = document.querySelectorAll('[class]');
    classElements.forEach(function (element) {
      const classes = element.className.split(' ');
      classes.forEach(function (className) {
        if (className) {
          this._categorizePattern(className, analysis);
        }
      }, this);
    }, this);
  },

  _categorizePattern(pattern, analysis) {
    if (!pattern) {
      return;
    }

    // Detect case style
    if (/^[a-z][a-zA-Z0-9]*$/.test(pattern)) {
      analysis.caseDistribution.camelCase =
        (analysis.caseDistribution.camelCase || 0) + 1;
    } else if (/^[A-Z][a-zA-Z0-9]*$/.test(pattern)) {
      analysis.caseDistribution.PascalCase =
        (analysis.caseDistribution.PascalCase || 0) + 1;
    } else if (/^[a-z][a-z0-9_]*$/.test(pattern)) {
      analysis.caseDistribution.snake_case =
        (analysis.caseDistribution.snake_case || 0) + 1;
    } else if (/^[a-z][a-z0-9-]*$/.test(pattern)) {
      analysis.caseDistribution['kebab-case'] =
        (analysis.caseDistribution['kebab-case'] || 0) + 1;
    }

    // Extract prefixes and suffixes
    const words = pattern.split(/(?=[A-Z])|[-_]/);
    if (words.length > 1) {
      const prefix = words[0].toLowerCase();
      const suffix = words[words.length - 1].toLowerCase();

      analysis.commonPrefixes[prefix] =
        (analysis.commonPrefixes[prefix] || 0) + 1;
      analysis.commonSuffixes[suffix] =
        (analysis.commonSuffixes[suffix] || 0) + 1;
    }
  },
};

/**
 * Fuzzy string matching for name suggestions
 */
// eslint-disable-next-line no-var
var FuzzyMatcher = {
  /**
   * Calculate Levenshtein distance between two strings
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  },

  /**
   * Calculate similarity score (0-100)
   */
  similarity(str1, str2) {
    const maxLength = Math.max(str1.length, str2.length);
    if (maxLength === 0) {
      return 100;
    }

    const distance = this.levenshteinDistance(str1, str2);
    return Math.round(((maxLength - distance) / maxLength) * 100);
  },

  /**
   * Find similar existing names
   */
  findSimilar(input, existingNames, threshold) {
    threshold = threshold || 70;
    const results = [];

    existingNames.forEach(function (name) {
      const score = this.similarity(input.toLowerCase(), name.toLowerCase());
      if (score >= threshold) {
        results.push({
          name,
          similarity: score,
        });
      }
    }, this);

    return results.sort((a, b) => {
      return b.similarity - a.similarity;
    });
  },
};

/**
 * Main name search engine
 */
// eslint-disable-next-line no-var
var NameSearchEngine = {
  userPreferences: UserPreferences.DEFAULT,
  codeAnalysis: null,

  /**
   * Initialize the search engine with user preferences
   */
  initialize(preferences) {
    this.userPreferences = Object.assign(
      {},
      UserPreferences.DEFAULT,
      preferences || {}
    );
    this.codeAnalysis = ContextDetector.analyzeExistingCode();
    return this;
  },

  /**
   * Set user preference profile
   */
  setUserProfile(profileName) {
    if (UserPreferences[profileName]) {
      this.userPreferences = Object.assign({}, UserPreferences[profileName]);
    }
    return this;
  },

  /**
   * Update specific preferences
   */
  updatePreferences(preferences) {
    this.userPreferences = Object.assign(this.userPreferences, preferences);
    return this;
  },

  /**
   * Search for name suggestions based on input and context
   */
  search(input, options) {
    options = options || {};

    if (!input || typeof input !== 'string') {
      return { suggestions: [], similar: [], context: null };
    }

    // Detect or use provided context
    let context =
      options.context ||
      ContextDetector.detectContext(input, this.codeAnalysis);

    // Apply user preferences to context
    context = this._applyUserPreferences(context);

    // Generate suggestions using naming strategy
    let suggestions = NamingStrategy.generateSuggestions(input, context, {
      maxResults: options.maxResults || 10,
      includeCombined: this.userPreferences.creativityLevel !== 'conservative',
    });

    // Apply preference-based filtering and scoring
    suggestions = this._applyPreferenceFiltering(suggestions, input);

    // Find similar existing names if provided
    let similar = [];
    if (options.existingNames && options.existingNames.length > 0) {
      similar = FuzzyMatcher.findSimilar(input, options.existingNames, 60);
    }

    return {
      suggestions,
      similar,
      context,
      userPreferences: this.userPreferences,
      analysis: this.codeAnalysis,
    };
  },

  /**
   * Validate and score existing name
   */
  validateName(name, expectedMeaning, context) {
    context =
      context ||
      ContextDetector.detectContext(expectedMeaning, this.codeAnalysis);
    let score = NamingStrategy.validateName(name, context, expectedMeaning);

    // Apply preference-based adjustments
    score = this._adjustScoreForPreferences(score, name);

    return {
      score,
      context,
      recommendations: this._generateRecommendations(name, score, context),
    };
  },

  /**
   * Get recommendations for improving an existing name
   */
  getImprovementSuggestions(currentName, expectedMeaning) {
    const validation = this.validateName(currentName, expectedMeaning);

    if (validation.score.overall >= 80) {
      return { message: 'Name is already well-formed', suggestions: [] };
    }

    const suggestions = this.search(expectedMeaning, {
      context: validation.context,
      maxResults: 5,
    });

    return {
      message: 'Consider these alternatives:',
      suggestions: suggestions.suggestions,
      issues: validation.recommendations,
    };
  },

  /**
   * Apply user preferences to naming context
   */
  _applyUserPreferences(context) {
    const customContext = Object.assign({}, context);

    // Apply case preference
    switch (this.userPreferences.casePreference) {
      case 'camelCase':
        customContext.convention = NamingConventions.CAMEL_CASE;
        break;
      case 'PascalCase':
        customContext.convention = NamingConventions.PASCAL_CASE;
        break;
      case 'snake_case':
        customContext.convention = NamingConventions.SNAKE_CASE;
        break;
      case 'kebab-case':
        customContext.convention = NamingConventions.KEBAB_CASE;
        break;
    }

    // Adjust prefixes/suffixes based on verbosity
    if (this.userPreferences.verbosity === 'terse') {
      customContext.prefixes = customContext.prefixes.slice(0, 3);
      customContext.suffixes = customContext.suffixes.slice(0, 3);
    } else if (this.userPreferences.verbosity === 'verbose') {
      // Keep all prefixes/suffixes
    }

    return customContext;
  },

  /**
   * Filter and score suggestions based on user preferences
   */
  _applyPreferenceFiltering(suggestions, originalInput) {
    const self = this;

    return suggestions
      .map(suggestion => {
        const adjustedScore = self._adjustScoreForPreferences(
          suggestion.score,
          suggestion.name
        );

        return {
          name: suggestion.name,
          score: adjustedScore,
          type: suggestion.type,
          explanation: self._generateExplanation(suggestion, originalInput),
        };
      })
      .filter(suggestion => {
        // Filter out suggestions that don't meet abbreviation tolerance
        if (self.userPreferences.abbreviationTolerance === 'none') {
          return suggestion.name.length >= originalInput.length * 0.7;
        }
        return true;
      })
      .sort((a, b) => {
        return b.score.overall - a.score.overall;
      });
  },

  /**
   * Adjust score based on user preferences
   */
  _adjustScoreForPreferences(score, name) {
    const adjustedScore = Object.assign({}, score);

    // Adjust for case preference match
    const expectedCase = this.userPreferences.casePreference;
    const actualCase = this._detectCase(name);
    if (expectedCase === actualCase) {
      adjustedScore.overall += 10;
    } else {
      adjustedScore.overall -= 5;
    }

    // Adjust for abbreviation tolerance
    const hasAbbreviations = /[a-z][A-Z]/.test(name);
    if (
      hasAbbreviations &&
      this.userPreferences.abbreviationTolerance === 'none'
    ) {
      adjustedScore.overall -= 20;
    }

    // Ensure score stays within 0-100 range
    adjustedScore.overall = Math.max(0, Math.min(100, adjustedScore.overall));

    return adjustedScore;
  },

  /**
   * Detect case style of a name
   */
  _detectCase(name) {
    if (NamingConventions.CAMEL_CASE.pattern.test(name)) {
      return 'camelCase';
    }
    if (NamingConventions.PASCAL_CASE.pattern.test(name)) {
      return 'PascalCase';
    }
    if (NamingConventions.SNAKE_CASE.pattern.test(name)) {
      return 'snake_case';
    }
    if (NamingConventions.KEBAB_CASE.pattern.test(name)) {
      return 'kebab-case';
    }
    if (NamingConventions.CONSTANT_CASE.pattern.test(name)) {
      return 'CONSTANT_CASE';
    }
    return 'mixed';
  },

  /**
   * Generate explanation for why a suggestion was made
   */
  _generateExplanation(suggestion, originalInput) {
    const explanation = [];

    explanation.push(`Generated ${suggestion.type} variant`);

    if (suggestion.score.semantic > 80) {
      explanation.push('Strong semantic match with input');
    }

    if (suggestion.score.context > 90) {
      explanation.push('Follows naming conventions perfectly');
    }

    if (suggestion.score.readability > 85) {
      explanation.push('Highly readable');
    }

    return explanation.join('. ');
  },

  /**
   * Generate recommendations for improving a name
   */
  _generateRecommendations(name, score, context) {
    const recommendations = [];

    if (score.context < 70) {
      recommendations.push(
        `Consider following ${context.convention.name} convention`
      );
    }

    if (score.readability < 70) {
      recommendations.push(
        'Improve readability by avoiding abbreviations or using more descriptive words'
      );
    }

    if (score.semantic < 70) {
      recommendations.push('Make the name more descriptive of its purpose');
    }

    return recommendations;
  },
};

// Export for testing and external use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    UserPreferences,
    ContextDetector,
    FuzzyMatcher,
    NameSearchEngine,
  };
}
