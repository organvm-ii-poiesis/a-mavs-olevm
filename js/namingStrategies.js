/**
 * @file Comprehensive naming strategies and conventions system
 * @author ET CETER4 Development Team
 */

"use strict";

/**
 * Naming convention types and their rules
 */
var NamingConventions = {
    // Case conversion patterns
    CAMEL_CASE: {
        name: "camelCase",
        pattern: /^[a-z][a-zA-Z0-9]*$/,
        transform: function(str) {
            return str.replace(/[\s\-_]+(.)?/g, function(_, c) {
                return c ? c.toUpperCase() : '';
            }).replace(/^(.)/, function(_, c) {
                return c.toLowerCase();
            });
        },
        example: "showNewSection"
    },
    
    PASCAL_CASE: {
        name: "PascalCase", 
        pattern: /^[A-Z][a-zA-Z0-9]*$/,
        transform: function(str) {
            return str.replace(/[\s\-_]+(.)?/g, function(_, c) {
                return c ? c.toUpperCase() : '';
            }).replace(/^(.)/, function(_, c) {
                return c.toUpperCase();
            });
        },
        example: "PageData"
    },
    
    SNAKE_CASE: {
        name: "snake_case",
        pattern: /^[a-z][a-z0-9_]*$/,
        transform: function(str) {
            return str.replace(/[\s\-]+/g, '_')
                     .replace(/([A-Z])/g, '_$1')
                     .toLowerCase()
                     .replace(/^_/, '');
        },
        example: "show_new_section"
    },
    
    KEBAB_CASE: {
        name: "kebab-case",
        pattern: /^[a-z][a-z0-9\-]*$/,
        transform: function(str) {
            return str.replace(/[\s_]+/g, '-')
                     .replace(/([A-Z])/g, '-$1')
                     .toLowerCase()
                     .replace(/^-/, '');
        },
        example: "show-new-section"
    },
    
    CONSTANT_CASE: {
        name: "CONSTANT_CASE",
        pattern: /^[A-Z][A-Z0-9_]*$/,
        transform: function(str) {
            return str.replace(/[\s\-]+/g, '_')
                     .replace(/([A-Z])/g, '_$1')
                     .toUpperCase()
                     .replace(/^_/, '');
        },
        example: "SHOW_NEW_SECTION"
    }
};

/**
 * Context-specific naming rules
 */
var NamingContexts = {
    FUNCTION: {
        convention: NamingConventions.CAMEL_CASE,
        prefixes: ["get", "set", "is", "has", "can", "should", "will", "init", "load", "show", "hide", "toggle", "emit", "handle", "process", "validate", "create", "update", "delete", "find", "search"],
        suffixes: ["Handler", "Callback", "Event", "Data", "Config", "Options", "State", "Element", "Page", "Section"],
        validate: function(name) {
            return this.convention.pattern.test(name);
        }
    },
    
    VARIABLE: {
        convention: NamingConventions.CAMEL_CASE,
        prefixes: ["is", "has", "can", "should", "will", "current", "selected", "active", "visible", "loading", "temp", "tmp", "cached"],
        suffixes: ["Data", "Config", "Options", "State", "Element", "Container", "Wrapper", "Index", "Count", "Total", "Length"],
        validate: function(name) {
            return this.convention.pattern.test(name);
        }
    },
    
    CONSTANT: {
        convention: NamingConventions.CONSTANT_CASE,
        prefixes: ["MAX", "MIN", "DEFAULT", "CONFIG", "API", "URL", "PATH"],
        suffixes: ["_CONFIG", "_DATA", "_OPTIONS", "_STATE", "_ELEMENT", "_CONTAINER"],
        validate: function(name) {
            return this.convention.pattern.test(name);
        }
    },
    
    CLASS_NAME: {
        convention: NamingConventions.KEBAB_CASE,
        prefixes: ["et-", "page-", "nav-", "content-", "image-", "audio-", "video-", "text-", "link-", "button-", "form-", "input-"],
        suffixes: ["-container", "-wrapper", "-element", "-component", "-section", "-page", "-item", "-list", "-grid"],
        validate: function(name) {
            return this.convention.pattern.test(name);
        }
    },
    
    ID: {
        convention: NamingConventions.CAMEL_CASE,
        prefixes: ["to", "from", "nav", "content", "main", "header", "footer", "sidebar"],
        suffixes: ["Page", "Section", "Container", "Button", "Link", "Image", "Video", "Audio", "Form", "Input"],
        validate: function(name) {
            return this.convention.pattern.test(name) || /^#[a-zA-Z][a-zA-Z0-9]*$/.test(name);
        }
    },
    
    PAGE_ID: {
        convention: NamingConventions.KEBAB_CASE,
        prefixes: ["#"],
        suffixes: ["-page", "-section"],
        validate: function(name) {
            return /^#[a-z][a-z0-9\-]*$/.test(name);
        }
    }
};

/**
 * Domain-specific naming patterns for ET CETER4
 */
var ETCETERNamingPatterns = {
    AUDIO_ELEMENTS: {
        prefixes: ["sound", "audio", "music", "track", "beat", "rhythm", "melody", "harmony"],
        suffixes: ["Player", "Control", "Volume", "Track", "Album", "Playlist"],
        context: NamingContexts.FUNCTION
    },
    
    VISUAL_ELEMENTS: {
        prefixes: ["vision", "visual", "image", "photo", "still", "video", "graphic", "art"],
        suffixes: ["Gallery", "Carousel", "Viewer", "Display", "Canvas", "Frame"],
        context: NamingContexts.FUNCTION
    },
    
    TEXT_ELEMENTS: {
        prefixes: ["word", "text", "story", "diary", "blog", "poem", "verse", "line"],
        suffixes: ["Editor", "Reader", "Writer", "Content", "Body", "Paragraph"],
        context: NamingContexts.FUNCTION
    },
    
    NAVIGATION: {
        prefixes: ["nav", "menu", "link", "button", "back", "forward", "up", "down"],
        suffixes: ["Navigation", "Menu", "Link", "Button", "Control", "Handler"],
        context: NamingContexts.FUNCTION
    }
};

/**
 * Name quality metrics and scoring
 */
var NamingQuality = {
    
    /**
     * Calculate readability score based on various factors
     */
    calculateReadability: function(name) {
        var score = 100;
        
        // Length penalty (too short or too long)
        if (name.length < 3) score -= 20;
        if (name.length > 30) score -= 10;
        
        // Abbreviation penalty
        var abbreviationCount = (name.match(/[a-z][A-Z]/g) || []).length;
        score -= abbreviationCount * 5;
        
        // Vowel ratio (better readability with good vowel distribution)
        var vowels = name.match(/[aeiouAEIOU]/g) || [];
        var vowelRatio = vowels.length / name.length;
        if (vowelRatio < 0.2 || vowelRatio > 0.6) score -= 10;
        
        return Math.max(0, score);
    },
    
    /**
     * Check contextual appropriateness
     */
    checkContext: function(name, context) {
        if (!context || !context.validate) return 50;
        return context.validate(name) ? 100 : 0;
    },
    
    /**
     * Calculate semantic meaning score
     */
    calculateSemantic: function(name, expectedMeaning) {
        if (!expectedMeaning) return 50;
        
        var score = 0;
        var nameLower = name.toLowerCase();
        var meaningLower = expectedMeaning.toLowerCase();
        
        // Direct match
        if (nameLower.includes(meaningLower) || meaningLower.includes(nameLower)) {
            score += 50;
        }
        
        // Partial word matches
        var nameWords = nameLower.split(/[^a-z0-9]+/);
        var meaningWords = meaningLower.split(/[^a-z0-9]+/);
        
        var matches = 0;
        meaningWords.forEach(function(meaningWord) {
            if (nameWords.some(function(nameWord) {
                return nameWord.includes(meaningWord) || meaningWord.includes(nameWord);
            })) {
                matches++;
            }
        });
        
        score += (matches / meaningWords.length) * 50;
        
        return Math.min(100, score);
    },
    
    /**
     * Overall name quality score
     */
    calculateOverallScore: function(name, context, expectedMeaning) {
        var readability = this.calculateReadability(name);
        var contextScore = this.checkContext(name, context);
        var semantic = this.calculateSemantic(name, expectedMeaning);
        
        return {
            overall: Math.round((readability * 0.3 + contextScore * 0.4 + semantic * 0.3)),
            readability: readability,
            context: contextScore,
            semantic: semantic
        };
    }
};

/**
 * Main naming strategy engine
 */
var NamingStrategy = {
    
    /**
     * Generate name suggestions based on input and context
     */
    generateSuggestions: function(input, context, options) {
        options = options || {};
        var suggestions = [];
        
        if (!input || !context) return suggestions;
        
        var baseWords = this._extractWords(input);
        var contextPrefixes = context.prefixes || [];
        var contextSuffixes = context.suffixes || [];
        
        // Generate base suggestions
        baseWords.forEach(function(baseWord) {
            // Plain transformation
            suggestions.push({
                name: context.convention.transform(baseWord),
                score: NamingQuality.calculateOverallScore(context.convention.transform(baseWord), context, input),
                type: "base"
            });
            
            // With prefixes
            contextPrefixes.forEach(function(prefix) {
                var name = context.convention.transform(prefix + " " + baseWord);
                suggestions.push({
                    name: name,
                    score: NamingQuality.calculateOverallScore(name, context, input),
                    type: "prefixed"
                });
            });
            
            // With suffixes
            contextSuffixes.forEach(function(suffix) {
                var name = context.convention.transform(baseWord + " " + suffix);
                suggestions.push({
                    name: name,
                    score: NamingQuality.calculateOverallScore(name, context, input),
                    type: "suffixed"
                });
            });
            
            // With both prefix and suffix
            if (options.includeCombined) {
                contextPrefixes.forEach(function(prefix) {
                    contextSuffixes.forEach(function(suffix) {
                        var name = context.convention.transform(prefix + " " + baseWord + " " + suffix);
                        suggestions.push({
                            name: name,
                            score: NamingQuality.calculateOverallScore(name, context, input),
                            type: "combined"
                        });
                    });
                });
            }
        });
        
        // Sort by score and remove duplicates
        suggestions = this._removeDuplicates(suggestions);
        suggestions.sort(function(a, b) { return b.score.overall - a.score.overall; });
        
        // Apply length limit
        var maxResults = options.maxResults || 10;
        return suggestions.slice(0, maxResults);
    },
    
    /**
     * Validate existing name against context
     */
    validateName: function(name, context, expectedMeaning) {
        return NamingQuality.calculateOverallScore(name, context, expectedMeaning);
    },
    
    /**
     * Extract meaningful words from input string
     */
    _extractWords: function(input) {
        if (!input) return [];
        
        return input.toLowerCase()
                   .replace(/[^a-z0-9\s\-_]/g, ' ')
                   .split(/[\s\-_]+/)
                   .filter(function(word) { return word.length > 0; });
    },
    
    /**
     * Remove duplicate suggestions
     */
    _removeDuplicates: function(suggestions) {
        var seen = {};
        return suggestions.filter(function(suggestion) {
            if (seen[suggestion.name]) return false;
            seen[suggestion.name] = true;
            return true;
        });
    }
};

// Export for testing and external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        NamingConventions: NamingConventions,
        NamingContexts: NamingContexts,
        ETCETERNamingPatterns: ETCETERNamingPatterns,
        NamingQuality: NamingQuality,
        NamingStrategy: NamingStrategy
    };
}