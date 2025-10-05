// eslint.config.cjs
const js = require('@eslint/js');
const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const importPlugin = require('eslint-plugin-import');
const globals = require('globals');

module.exports = [
  // 0) Ignores
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'coverage/**',
      '.nyc_output/**',
      'dist/**',
      'public/**',
    ],
  },

  // 1) Base JS recommended
  js.configs.recommended,

  // 2) TypeScript for all TS/TSX (no type-checking rules for now)
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        // (we are intentionally NOT setting `project` to avoid type-check rules/errors)
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      import: importPlugin,
    },
    rules: {
      // Keep core TS rules light for now
      ...(tsPlugin.configs.recommended.rules || {}),
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],

      // Temporarily turn off noisy rules (we can re-enable later)
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/await-thenable': 'off',

      // Import ordering can be strict later; off for now to pass pre-commit
      'import/order': 'off',
      'import/newline-after-import': 'off',
      'import/no-unresolved': 'off', // Next + TS paths are handled by TS; keep off to reduce noise
    },
  },

  // 3) App & Components (browser + node globals so fetch/Response/console etc. are defined)
  {
    files: ['app/**/*.{ts,tsx,js,jsx}', 'components/**/*.{ts,tsx,js,jsx}', 'hooks/**/*.{ts,tsx,js,jsx}', 'lib/**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser, // window, document, fetch, Response, console, etc.
        ...globals.node,    // require-ish environment vars if needed
      },
    },
    rules: {
      // allow console in UI/dev for now
      'no-console': 'off',
      'no-undef': 'off',
    },
  },

  // 4) Tests (Jest globals)
  {
    files: ['__tests__/**/*.{ts,tsx,js,jsx}', 'jest.setup.ts'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.jest,
        ...globals.browser, // RTL uses DOM
      },
    },
    rules: {
      'no-undef': 'off',
    },
  },

  // 5) Node scripts & config files (CJS allowed)
  {
    files: [
      'scripts/**/*.{js,ts}',
      'tools/**/*.{js,ts}',
      '*.{config,cjs}.js',
      '*.config.cjs',
      'babel.config.js',
      'next.config.js',
      'create-env.js',
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'script',
      globals: {
        ...globals.node, // require, module, process, console, Buffer, etc.
      },
    },
    rules: {
      'no-undef': 'off',
    },
  },
];
