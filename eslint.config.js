import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    files: [
      'js/main.js',
      'js/page.js',
      'js/pageData.js',
      'js/images.js',
      'js/diary.js',
      'js/ogod.js',
      'js/analytics.js',
    ],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'script',
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        $: 'readonly',
        jQuery: 'readonly',
        ga: 'readonly',
        setInterval: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-undef': 'off', // Disabled because code uses global scope for cross-file communication
      'prefer-const': 'error',
      'no-var': 'error',
      'no-console': 'warn',
      'prefer-template': 'warn',
      'prefer-arrow-callback': 'warn',
      'object-shorthand': 'warn',
      'no-throw-literal': 'error',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
    },
  },
  {
    ignores: [
      'node_modules/**',
      'css/vendor/**',
      'js/vendor/**',
      'js/sketches/**',
      'dependencies/**',
      'js/legacy.js',
      'js/test/**',
    ],
  },
];
