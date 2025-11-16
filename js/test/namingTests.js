/**
 * @file Comprehensive tests for naming strategies and search functionality
 * @author ET CETER4 Development Team
 */

'use strict';

// Test framework for browser environment
var TestFramework = {
  tests: [],
  results: [],

  describe: function (name, fn) {
    console.group('Testing: ' + name);
    fn();
    console.groupEnd();
  },

  it: function (description, fn) {
    try {
      fn();
      this.results.push({ description: description, status: 'PASS' });
      console.log('✓ ' + description);
    } catch (error) {
      this.results.push({
        description: description,
        status: 'FAIL',
        error: error.message,
      });
      console.error('✗ ' + description + ' - ' + error.message);
    }
  },

  expect: function (actual) {
    return {
      toBe: function (expected) {
        if (actual !== expected) {
          throw new Error('Expected ' + expected + ' but got ' + actual);
        }
      },
      toEqual: function (expected) {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
          throw new Error(
            'Expected ' +
              JSON.stringify(expected) +
              ' but got ' +
              JSON.stringify(actual)
          );
        }
      },
      toContain: function (expected) {
        if (actual.indexOf(expected) === -1) {
          throw new Error('Expected ' + actual + ' to contain ' + expected);
        }
      },
      toBeGreaterThan: function (expected) {
        if (actual <= expected) {
          throw new Error(
            'Expected ' + actual + ' to be greater than ' + expected
          );
        }
      },
      toBeLessThan: function (expected) {
        if (actual >= expected) {
          throw new Error(
            'Expected ' + actual + ' to be less than ' + expected
          );
        }
      },
      toMatch: function (pattern) {
        if (!pattern.test(actual)) {
          throw new Error(
            'Expected ' + actual + ' to match pattern ' + pattern
          );
        }
      },
    };
  },

  getSummary: function () {
    var passed = this.results.filter(function (r) {
      return r.status === 'PASS';
    }).length;
    var failed = this.results.filter(function (r) {
      return r.status === 'FAIL';
    }).length;

    return {
      total: this.results.length,
      passed: passed,
      failed: failed,
      results: this.results,
    };
  },
};

/**
 * Test the naming conventions
 */
function testNamingConventions() {
  TestFramework.describe('Naming Conventions', function () {
    TestFramework.it('should transform to camelCase correctly', function () {
      var result = NamingConventions.CAMEL_CASE.transform('show new section');
      TestFramework.expect(result).toBe('showNewSection');
    });

    TestFramework.it('should transform to PascalCase correctly', function () {
      var result = NamingConventions.PASCAL_CASE.transform('page data');
      TestFramework.expect(result).toBe('PageData');
    });

    TestFramework.it('should transform to snake_case correctly', function () {
      var result = NamingConventions.SNAKE_CASE.transform('showNewSection');
      TestFramework.expect(result).toBe('show_new_section');
    });

    TestFramework.it('should transform to kebab-case correctly', function () {
      var result = NamingConventions.KEBAB_CASE.transform('showNewSection');
      TestFramework.expect(result).toBe('show-new-section');
    });

    TestFramework.it('should validate patterns correctly', function () {
      TestFramework.expect(
        NamingConventions.CAMEL_CASE.pattern.test('showNewSection')
      ).toBe(true);
      TestFramework.expect(
        NamingConventions.CAMEL_CASE.pattern.test('ShowNewSection')
      ).toBe(false);
      TestFramework.expect(
        NamingConventions.PASCAL_CASE.pattern.test('PageData')
      ).toBe(true);
      TestFramework.expect(
        NamingConventions.SNAKE_CASE.pattern.test('show_new_section')
      ).toBe(true);
      TestFramework.expect(
        NamingConventions.KEBAB_CASE.pattern.test('show-new-section')
      ).toBe(true);
    });
  });
}

/**
 * Test the naming quality metrics
 */
function testNamingQuality() {
  TestFramework.describe('Naming Quality', function () {
    TestFramework.it('should calculate readability score', function () {
      var score1 = NamingQuality.calculateReadability('showNewSection');
      var score2 = NamingQuality.calculateReadability('x');
      var score3 = NamingQuality.calculateReadability(
        'thisIsAnExtremelyLongVariableNameThatShouldBeDiscouraged'
      );

      TestFramework.expect(score1).toBeGreaterThan(70);
      TestFramework.expect(score2).toBeLessThan(50);
      TestFramework.expect(score3).toBeLessThan(score1);
    });

    TestFramework.it('should check context appropriateness', function () {
      var score1 = NamingQuality.checkContext(
        'showNewSection',
        NamingContexts.FUNCTION
      );
      var score2 = NamingQuality.checkContext(
        'show-new-section',
        NamingContexts.FUNCTION
      );

      TestFramework.expect(score1).toBe(100);
      TestFramework.expect(score2).toBe(0);
    });

    TestFramework.it('should calculate semantic score', function () {
      var score1 = NamingQuality.calculateSemantic('showPage', 'show page');
      var score2 = NamingQuality.calculateSemantic('x', 'show page');

      TestFramework.expect(score1).toBeGreaterThan(80);
      TestFramework.expect(score2).toBeLessThan(30);
    });

    TestFramework.it('should calculate overall score', function () {
      var result = NamingQuality.calculateOverallScore(
        'showNewSection',
        NamingContexts.FUNCTION,
        'show new section'
      );

      TestFramework.expect(result.overall).toBeGreaterThan(70);
      TestFramework.expect(result.readability).toBeGreaterThan(0);
      TestFramework.expect(result.context).toBeGreaterThan(0);
      TestFramework.expect(result.semantic).toBeGreaterThan(0);
    });
  });
}

/**
 * Test the naming strategy engine
 */
function testNamingStrategy() {
  TestFramework.describe('Naming Strategy', function () {
    TestFramework.it('should generate suggestions', function () {
      var suggestions = NamingStrategy.generateSuggestions(
        'show page',
        NamingContexts.FUNCTION,
        { maxResults: 5 }
      );

      TestFramework.expect(suggestions.length).toBeGreaterThan(0);
      TestFramework.expect(suggestions[0]).toContain('name');
      TestFramework.expect(suggestions[0]).toContain('score');
    });

    TestFramework.it('should extract words correctly', function () {
      var words = NamingStrategy._extractWords('show-new_section page');
      TestFramework.expect(words).toEqual(['show', 'new', 'section', 'page']);
    });

    TestFramework.it('should remove duplicates', function () {
      var suggestions = [
        { name: 'test', score: { overall: 80 } },
        { name: 'test', score: { overall: 70 } },
        { name: 'other', score: { overall: 60 } },
      ];
      var result = NamingStrategy._removeDuplicates(suggestions);

      TestFramework.expect(result.length).toBe(2);
    });

    TestFramework.it('should validate existing names', function () {
      var result = NamingStrategy.validateName(
        'showNewSection',
        NamingContexts.FUNCTION,
        'show new section'
      );

      TestFramework.expect(result.overall).toBeGreaterThan(50);
    });
  });
}

/**
 * Test the fuzzy matcher
 */
function testFuzzyMatcher() {
  TestFramework.describe('Fuzzy Matcher', function () {
    TestFramework.it('should calculate Levenshtein distance', function () {
      var distance1 = FuzzyMatcher.levenshteinDistance('test', 'test');
      var distance2 = FuzzyMatcher.levenshteinDistance('test', 'tast');
      var distance3 = FuzzyMatcher.levenshteinDistance('test', 'best');

      TestFramework.expect(distance1).toBe(0);
      TestFramework.expect(distance2).toBe(1);
      TestFramework.expect(distance3).toBe(1);
    });

    TestFramework.it('should calculate similarity score', function () {
      var similarity1 = FuzzyMatcher.similarity('test', 'test');
      var similarity2 = FuzzyMatcher.similarity('test', 'tast');
      var similarity3 = FuzzyMatcher.similarity('test', 'xyz');

      TestFramework.expect(similarity1).toBe(100);
      TestFramework.expect(similarity2).toBeGreaterThan(50);
      TestFramework.expect(similarity3).toBeLessThan(50);
    });

    TestFramework.it('should find similar names', function () {
      var existingNames = ['showPage', 'hidePage', 'togglePage', 'loadData'];
      var similar = FuzzyMatcher.findSimilar('showPages', existingNames, 60);

      TestFramework.expect(similar.length).toBeGreaterThan(0);
      TestFramework.expect(similar[0].name).toBe('showPage');
    });
  });
}

/**
 * Test the context detector
 */
function testContextDetector() {
  TestFramework.describe('Context Detector', function () {
    TestFramework.it('should detect function context', function () {
      var context = ContextDetector.detectContext('show new page');
      TestFramework.expect(context).toBe(NamingContexts.FUNCTION);
    });

    TestFramework.it('should detect page ID context', function () {
      var context = ContextDetector.detectContext('diary page');
      TestFramework.expect(context).toBe(NamingContexts.PAGE_ID);
    });

    TestFramework.it('should detect class name context', function () {
      var context = ContextDetector.detectContext('button style');
      TestFramework.expect(context).toBe(NamingContexts.CLASS_NAME);
    });

    TestFramework.it('should categorize patterns', function () {
      var analysis = {
        caseDistribution: {},
        commonPrefixes: {},
        commonSuffixes: {},
      };
      ContextDetector._categorizePattern('showNewSection', analysis);

      TestFramework.expect(analysis.caseDistribution.camelCase).toBe(1);
    });
  });
}

/**
 * Test the name search engine
 */
function testNameSearchEngine() {
  TestFramework.describe('Name Search Engine', function () {
    TestFramework.it('should initialize with default preferences', function () {
      var engine = NameSearchEngine.initialize();
      TestFramework.expect(engine.userPreferences.casePreference).toBe(
        'camelCase'
      );
    });

    TestFramework.it('should set user profile', function () {
      var engine = NameSearchEngine.initialize().setUserProfile('DEVELOPER');
      TestFramework.expect(engine.userPreferences.verbosity).toBe('terse');
    });

    TestFramework.it('should update preferences', function () {
      var engine = NameSearchEngine.initialize().updatePreferences({
        verbosity: 'verbose',
      });
      TestFramework.expect(engine.userPreferences.verbosity).toBe('verbose');
    });

    TestFramework.it('should search for suggestions', function () {
      var engine = NameSearchEngine.initialize();
      var result = engine.search('show page', { maxResults: 5 });

      TestFramework.expect(result.suggestions).toContain('length');
      TestFramework.expect(result.context).toContain('convention');
      TestFramework.expect(result.suggestions.length).toBeGreaterThan(0);
    });

    TestFramework.it('should validate names', function () {
      var engine = NameSearchEngine.initialize();
      var result = engine.validateName('showNewSection', 'show new section');

      TestFramework.expect(result.score.overall).toBeGreaterThan(50);
      TestFramework.expect(result.context).toContain('convention');
    });

    TestFramework.it('should provide improvement suggestions', function () {
      var engine = NameSearchEngine.initialize();
      var result = engine.getImprovementSuggestions('x', 'show new section');

      TestFramework.expect(result.suggestions.length).toBeGreaterThan(0);
      TestFramework.expect(result.message).toContain('Consider');
    });

    TestFramework.it('should detect case style', function () {
      var engine = NameSearchEngine.initialize();

      TestFramework.expect(engine._detectCase('showNewSection')).toBe(
        'camelCase'
      );
      TestFramework.expect(engine._detectCase('ShowNewSection')).toBe(
        'PascalCase'
      );
      TestFramework.expect(engine._detectCase('show_new_section')).toBe(
        'snake_case'
      );
      TestFramework.expect(engine._detectCase('show-new-section')).toBe(
        'kebab-case'
      );
    });

    TestFramework.it('should apply user preferences to context', function () {
      var engine = NameSearchEngine.initialize().updatePreferences({
        casePreference: 'snake_case',
      });
      var context = engine._applyUserPreferences(NamingContexts.FUNCTION);

      TestFramework.expect(context.convention).toBe(
        NamingConventions.SNAKE_CASE
      );
    });
  });
}

/**
 * Test ET CETER4 specific naming patterns
 */
function testETCETERPatterns() {
  TestFramework.describe('ET CETER4 Naming Patterns', function () {
    TestFramework.it('should recognize audio patterns', function () {
      var audioPattern = ETCETERNamingPatterns.AUDIO_ELEMENTS;
      TestFramework.expect(audioPattern.prefixes).toContain('sound');
      TestFramework.expect(audioPattern.prefixes).toContain('music');
      TestFramework.expect(audioPattern.suffixes).toContain('Player');
    });

    TestFramework.it('should recognize visual patterns', function () {
      var visualPattern = ETCETERNamingPatterns.VISUAL_ELEMENTS;
      TestFramework.expect(visualPattern.prefixes).toContain('vision');
      TestFramework.expect(visualPattern.prefixes).toContain('image');
      TestFramework.expect(visualPattern.suffixes).toContain('Gallery');
    });

    TestFramework.it('should recognize text patterns', function () {
      var textPattern = ETCETERNamingPatterns.TEXT_ELEMENTS;
      TestFramework.expect(textPattern.prefixes).toContain('word');
      TestFramework.expect(textPattern.prefixes).toContain('diary');
      TestFramework.expect(textPattern.suffixes).toContain('Editor');
    });

    TestFramework.it('should recognize navigation patterns', function () {
      var navPattern = ETCETERNamingPatterns.NAVIGATION;
      TestFramework.expect(navPattern.prefixes).toContain('nav');
      TestFramework.expect(navPattern.prefixes).toContain('menu');
      TestFramework.expect(navPattern.suffixes).toContain('Navigation');
    });
  });
}

/**
 * Test user preferences functionality
 */
function testUserPreferences() {
  TestFramework.describe('User Preferences', function () {
    TestFramework.it('should have default preferences', function () {
      var defaults = UserPreferences.DEFAULT;
      TestFramework.expect(defaults.casePreference).toBe('camelCase');
      TestFramework.expect(defaults.verbosity).toBe('medium');
    });

    TestFramework.it('should have developer profile', function () {
      var dev = UserPreferences.DEVELOPER;
      TestFramework.expect(dev.verbosity).toBe('terse');
      TestFramework.expect(dev.creativityLevel).toBe('conservative');
    });

    TestFramework.it('should have artist profile', function () {
      var artist = UserPreferences.ARTIST;
      TestFramework.expect(artist.domainFocus).toBe('visual');
      TestFramework.expect(artist.creativityLevel).toBe('creative');
    });

    TestFramework.it('should have musician profile', function () {
      var musician = UserPreferences.MUSICIAN;
      TestFramework.expect(musician.domainFocus).toBe('audio');
      TestFramework.expect(musician.creativityLevel).toBe('creative');
    });

    TestFramework.it('should have writer profile', function () {
      var writer = UserPreferences.WRITER;
      TestFramework.expect(writer.domainFocus).toBe('text');
      TestFramework.expect(writer.abbreviationTolerance).toBe('none');
    });
  });
}

/**
 * Integration tests for the complete system
 */
function testIntegration() {
  TestFramework.describe('Integration Tests', function () {
    TestFramework.it('should work end-to-end for audio context', function () {
      var engine = NameSearchEngine.initialize().setUserProfile('MUSICIAN');
      var result = engine.search('sound control volume', { maxResults: 3 });

      TestFramework.expect(result.suggestions.length).toBeGreaterThan(0);

      // Should contain audio-related suggestions
      var hasAudioSuggestion = result.suggestions.some(function (s) {
        return (
          s.name.toLowerCase().includes('sound') ||
          s.name.toLowerCase().includes('audio') ||
          s.name.toLowerCase().includes('volume')
        );
      });
      TestFramework.expect(hasAudioSuggestion).toBe(true);
    });

    TestFramework.it('should work end-to-end for visual context', function () {
      var engine = NameSearchEngine.initialize().setUserProfile('ARTIST');
      var result = engine.search('image gallery display', { maxResults: 3 });

      TestFramework.expect(result.suggestions.length).toBeGreaterThan(0);

      // Should use kebab-case for artist profile
      var hasKebabCase = result.suggestions.some(function (s) {
        return s.name.includes('-');
      });
      TestFramework.expect(hasKebabCase).toBe(true);
    });

    TestFramework.it(
      'should provide consistent results across calls',
      function () {
        var engine = NameSearchEngine.initialize();
        var result1 = engine.search('show page');
        var result2 = engine.search('show page');

        TestFramework.expect(result1.suggestions.length).toBe(
          result2.suggestions.length
        );
        TestFramework.expect(result1.suggestions[0].name).toBe(
          result2.suggestions[0].name
        );
      }
    );
  });
}

/**
 * Run all tests
 */
function runAllTests() {
  console.log('🧪 Running ET CETER4 Naming System Tests');
  console.log('==========================================');

  testNamingConventions();
  testNamingQuality();
  testNamingStrategy();
  testFuzzyMatcher();
  testContextDetector();
  testNameSearchEngine();
  testETCETERPatterns();
  testUserPreferences();
  testIntegration();

  var summary = TestFramework.getSummary();

  console.log('\n📊 Test Summary');
  console.log('===============');
  console.log('Total tests: ' + summary.total);
  console.log('Passed: ' + summary.passed + ' ✓');
  console.log('Failed: ' + summary.failed + ' ✗');

  if (summary.failed > 0) {
    console.log('\n❌ Failed tests:');
    summary.results
      .filter(function (r) {
        return r.status === 'FAIL';
      })
      .forEach(function (result) {
        console.log('  - ' + result.description + ': ' + result.error);
      });
  } else {
    console.log('\n🎉 All tests passed!');
  }

  return summary;
}

// Auto-run tests if this file is loaded directly
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', function () {
    runAllTests();
  });
}

// Export for testing frameworks
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    TestFramework: TestFramework,
    runAllTests: runAllTests,
    testNamingConventions: testNamingConventions,
    testNamingQuality: testNamingQuality,
    testNamingStrategy: testNamingStrategy,
    testFuzzyMatcher: testFuzzyMatcher,
    testContextDetector: testContextDetector,
    testNameSearchEngine: testNameSearchEngine,
    testETCETERPatterns: testETCETERPatterns,
    testUserPreferences: testUserPreferences,
    testIntegration: testIntegration,
  };
}
