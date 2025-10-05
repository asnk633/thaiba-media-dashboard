// eslint.config.cjs
const globals = require('globals');
const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const importPlugin = require('eslint-plugin-import');

module.exports = [
  // 0) Global ignores
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'coverage/**',
      '.nyc_output/**',
      'dist/**',
      'build/**',
      'public/**',
      '.eslintcache',
    ],
  },

  // 1) Base (all JS/TS) — keep import noise low
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.es2021 },
    },
    plugins: { import: importPlugin },
    rules: {
      'import/order': 'off',
      'import/newline-after-import': 'off',
      'import/no-unresolved': 'off',
    },
  },

  // 2) TypeScript (no type-aware rules → no parserServices needed)
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: { '@typescript-eslint': tsPlugin },
    rules: {
      ...(tsPlugin.configs.recommended.rules || {}),

      // Practical TS rules
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'off',

      // Turn OFF strict/type-aware rules for now
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/await-thenable': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // 3) App/Components/Hooks/Lib — Next.js (browser + node globals)
  {
    files: [
      'app/**/*.{js,jsx,ts,tsx}',
      'components/**/*.{js,jsx,ts,tsx}',
      'hooks/**/*.{js,jsx,ts,tsx}',
      'lib/**/*.{js,jsx,ts,tsx}',
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      'no-undef': 'off',
      'no-console': 'off',
    },
  },

  // 4) Tests — Jest + DOM
  {
    files: ['__tests__/**/*.{js,jsx,ts,tsx}', 'jest.setup.ts'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.jest, ...globals.browser },
    },
    rules: { 'no-undef': 'off' },
  },

  // 5) API routes — allow _req/_res; Node + browser globals
  {
    files: ['app/api/**/*.{js,ts}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.node, ...globals.browser },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-undef': 'off',
    },
  },

  // 6a) Node **CJS** configs & scripts (require/module)
  {
    files: [
      '*.{config.js,config.cjs}',
      'babel.config.js',
      'create-env.js',
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'script', // CJS
      globals: { ...globals.node },
    },
    rules: { 'no-undef': 'off' },
  },

  // 6b) Node **ESM** configs & scripts (import/export)
  {
    files: [
      'next.config.js',               // if you use ESM here
      'scripts/**/*.{js,ts}',         // your script files that use import/export
      'utils/**/*.js',                // utils using ESM imports
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module', // ESM
      globals: { ...globals.node },
    },
    rules: { 'no-undef': 'off' },
  },
];
