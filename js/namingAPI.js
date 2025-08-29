/**
 * @file Integration API for ET CETER4 naming system
 * @author ET CETER4 Development Team
 */

"use strict";

/**
 * Main API for the ET CETER4 naming system
 * Provides easy-to-use interface for the existing codebase
 */
var ETCETERNaming = {
    
    // Initialize the naming engine
    engine: null,
    isInitialized: false,
    
    /**
     * Initialize the naming system
     */
    init: function(userProfile) {
        userProfile = userProfile || "DEFAULT";
        this.engine = NameSearchEngine.initialize().setUserProfile(userProfile);
        this.isInitialized = true;
        
        console.log("🎯 ET CETER4 Naming System initialized with profile:", userProfile);
        return this;
    },
    
    /**
     * Quick name suggestion for common use cases
     */
    suggest: function(input, type, options) {
        if (!this.isInitialized) this.init();
        
        options = options || {};
        var context;
        
        // Map simple types to naming contexts
        switch (type) {
            case "function":
                context = NamingContexts.FUNCTION;
                break;
            case "variable":
                context = NamingContexts.VARIABLE;
                break;
            case "page":
                context = NamingContexts.PAGE_ID;
                break;
            case "class":
                context = NamingContexts.CLASS_NAME;
                break;
            case "id":
                context = NamingContexts.ID;
                break;
            default:
                context = null; // Auto-detect
        }
        
        var result = this.engine.search(input, {
            context: context,
            maxResults: options.maxResults || 5,
            existingNames: options.existingNames
        });
        
        return result.suggestions.map(function(s) { return s.name; });
    },
    
    /**
     * Get the best single suggestion
     */
    suggestBest: function(input, type, options) {
        var suggestions = this.suggest(input, type, options);
        return suggestions.length > 0 ? suggestions[0] : null;
    },
    
    /**
     * Validate an existing name
     */
    validate: function(name, expectedMeaning, type) {
        if (!this.isInitialized) this.init();
        
        var result = this.engine.validateName(name, expectedMeaning);
        return {
            isValid: result.score.overall >= 70,
            score: result.score.overall,
            issues: result.recommendations,
            suggestions: result.score.overall < 70 ? this.suggest(expectedMeaning, type, { maxResults: 3 }) : []
        };
    },
    
    /**
     * Get improvement suggestions for existing name
     */
    improve: function(currentName, expectedMeaning, type) {
        if (!this.isInitialized) this.init();
        
        var result = this.engine.getImprovementSuggestions(currentName, expectedMeaning);
        return {
            message: result.message,
            suggestions: result.suggestions.map(function(s) { return s.name; }),
            issues: result.issues
        };
    },
    
    /**
     * Switch user profile
     */
    setProfile: function(profileName) {
        if (!this.isInitialized) this.init();
        
        this.engine.setUserProfile(profileName);
        console.log("👤 Switched to profile:", profileName);
        return this;
    },
    
    /**
     * Analyze existing codebase naming patterns
     */
    analyzeCodebase: function() {
        if (!this.isInitialized) this.init();
        
        return this.engine.codeAnalysis;
    },
    
    /**
     * Apply naming conventions to existing ET CETER4 patterns
     */
    rollForwardExisting: function() {
        var suggestions = {};
        
        // Analyze existing _pID object
        if (typeof _pID !== 'undefined') {
            Object.keys(_pID).forEach(function(key) {
                var validation = this.validate(_pID[key], key + " page", "page");
                if (!validation.isValid) {
                    suggestions[key] = {
                        current: _pID[key],
                        suggestions: validation.suggestions,
                        issues: validation.issues
                    };
                }
            }, this);
        }
        
        // Analyze existing function names in global scope
        var globalFunctions = this._extractGlobalFunctions();
        globalFunctions.forEach(function(funcName) {
            var validation = this.validate(funcName, funcName, "function");
            if (!validation.isValid) {
                suggestions[funcName] = {
                    current: funcName,
                    suggestions: validation.suggestions,
                    issues: validation.issues
                };
            }
        }, this);
        
        return suggestions;
    },
    
    /**
     * Generate comprehensive naming guidelines for the project
     */
    generateGuidelines: function() {
        return {
            conventions: {
                functions: NamingContexts.FUNCTION.convention.example,
                variables: NamingContexts.VARIABLE.convention.example,
                pageIds: NamingContexts.PAGE_ID.convention.example,
                classNames: NamingContexts.CLASS_NAME.convention.example,
                constants: NamingContexts.CONSTANT.convention.example
            },
            etceterPatterns: {
                audio: ETCETERNamingPatterns.AUDIO_ELEMENTS,
                visual: ETCETERNamingPatterns.VISUAL_ELEMENTS,
                text: ETCETERNamingPatterns.TEXT_ELEMENTS,
                navigation: ETCETERNamingPatterns.NAVIGATION
            },
            userProfiles: Object.keys(UserPreferences),
            bestPractices: [
                "Use descriptive names that clearly indicate purpose",
                "Follow consistent casing conventions throughout the project",
                "Prefer full words over abbreviations for better readability",
                "Use domain-specific prefixes for ET CETER4 context (sound, vision, words, etc.)",
                "Keep function names action-oriented with verbs",
                "Use nouns for variables and data structures",
                "Follow the established patterns in the existing codebase"
            ]
        };
    },
    
    /**
     * Interactive naming assistant
     */
    assistant: {
        
        /**
         * Start interactive naming session
         */
        start: function() {
            console.log("🤖 ET CETER4 Naming Assistant");
            console.log("Type 'help' for commands, 'exit' to quit");
            
            if (typeof prompt !== 'undefined') {
                this._runInteractiveSession();
            } else {
                console.log("Interactive mode requires a browser environment with prompt() support");
                return this._createAPIMethods();
            }
        },
        
        /**
         * Get help for naming something
         */
        help: function(input, type) {
            var parent = ETCETERNaming;
            if (!parent.isInitialized) parent.init();
            
            var suggestions = parent.suggest(input, type, { maxResults: 5 });
            var result = parent.engine.search(input, { maxResults: 5 });
            
            return {
                suggestions: suggestions,
                explanation: "Based on input '" + input + "' and context '" + (type || "auto-detected") + "'",
                context: result.context.convention.name,
                userProfile: result.userPreferences
            };
        },
        
        _runInteractiveSession: function() {
            var session = true;
            while (session) {
                var input = prompt("Naming Assistant> ");
                if (!input || input === "exit") {
                    session = false;
                    continue;
                }
                
                if (input === "help") {
                    console.log("Commands:");
                    console.log("  suggest <input> <type> - Get naming suggestions");
                    console.log("  validate <name> <meaning> - Validate existing name");
                    console.log("  profile <name> - Change user profile");
                    console.log("  analyze - Analyze current codebase");
                    console.log("  exit - Quit assistant");
                    continue;
                }
                
                var parts = input.split(" ");
                var command = parts[0];
                var args = parts.slice(1);
                
                switch (command) {
                    case "suggest":
                        var suggestions = ETCETERNaming.suggest(args.join(" "), args[args.length - 1]);
                        console.log("Suggestions:", suggestions);
                        break;
                    case "validate":
                        var name = args[0];
                        var meaning = args.slice(1).join(" ");
                        var validation = ETCETERNaming.validate(name, meaning);
                        console.log("Validation:", validation);
                        break;
                    case "profile":
                        ETCETERNaming.setProfile(args[0].toUpperCase());
                        break;
                    case "analyze":
                        var analysis = ETCETERNaming.analyzeCodebase();
                        console.log("Codebase Analysis:", analysis);
                        break;
                    default:
                        console.log("Unknown command. Type 'help' for available commands.");
                }
            }
        },
        
        _createAPIMethods: function() {
            return {
                suggest: function(input, type) {
                    return ETCETERNaming.suggest(input, type);
                },
                validate: function(name, meaning, type) {
                    return ETCETERNaming.validate(name, meaning, type);
                },
                improve: function(name, meaning, type) {
                    return ETCETERNaming.improve(name, meaning, type);
                }
            };
        }
    },
    
    /**
     * Extract global function names for analysis
     */
    _extractGlobalFunctions: function() {
        var functions = [];
        
        // Known ET CETER4 functions from the codebase
        var knownFunctions = [
            'showNewSection', 'fadeInPage', 'fadeOutPage', 'replacePlaceholders',
            'appendImagesTo', 'changeHeader', 'changeFooter'
        ];
        
        // Add functions that exist in global scope
        if (typeof window !== 'undefined') {
            knownFunctions.forEach(function(funcName) {
                if (typeof window[funcName] === 'function') {
                    functions.push(funcName);
                }
            });
        }
        
        return functions.concat(knownFunctions);
    }
};

/**
 * Convenience shortcuts for common operations
 */

// Quick function name suggestion
function suggestFunctionName(description) {
    return ETCETERNaming.suggestBest(description, "function");
}

// Quick variable name suggestion  
function suggestVariableName(description) {
    return ETCETERNaming.suggestBest(description, "variable");
}

// Quick page ID suggestion
function suggestPageId(description) {
    return ETCETERNaming.suggestBest(description, "page");
}

// Quick class name suggestion
function suggestClassName(description) {
    return ETCETERNaming.suggestBest(description, "class");
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
    var validation = validateName(config.id, description, "page");
    if (!validation.isValid) {
        console.warn("Page ID '" + config.id + "' may not follow best practices:", validation.issues);
        console.log("Consider these alternatives:", validation.suggestions);
    }
    
    return new Page(config);
}

/**
 * Enhanced function naming helper
 */
function createNamedFunction(description, fn, context) {
    var suggestedName = suggestFunctionName(description);
    
    console.log("💡 Suggested function name for '" + description + "': " + suggestedName);
    
    // For debugging/development, attach the suggested name
    if (fn && typeof fn === 'function') {
        fn.suggestedName = suggestedName;
        fn.description = description;
    }
    
    return {
        suggestedName: suggestedName,
        function: fn,
        validation: validateName(suggestedName, description, "function")
    };
}

// Auto-initialize on load
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        // Initialize with ARTIST profile as default for ET CETER4
        ETCETERNaming.init('ARTIST');
        
        // Log naming guidelines
        console.group("🎨 ET CETER4 Naming Guidelines");
        var guidelines = ETCETERNaming.generateGuidelines();
        console.log("Conventions:", guidelines.conventions);
        console.log("ET CETER4 Patterns:", guidelines.etceterPatterns);
        console.log("Best Practices:", guidelines.bestPractices);
        console.groupEnd();
        
        // Analyze existing code and suggest improvements
        console.group("🔍 Existing Code Analysis");
        var suggestions = ETCETERNaming.rollForwardExisting();
        if (Object.keys(suggestions).length > 0) {
            console.log("Consider improving these names:", suggestions);
        } else {
            console.log("✅ All existing names follow good practices!");
        }
        console.groupEnd();
    });
}

// Export for testing and external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ETCETERNaming: ETCETERNaming,
        suggestFunctionName: suggestFunctionName,
        suggestVariableName: suggestVariableName,
        suggestPageId: suggestPageId,
        suggestClassName: suggestClassName,
        validateName: validateName,
        createNamedPage: createNamedPage,
        createNamedFunction: createNamedFunction
    };
}