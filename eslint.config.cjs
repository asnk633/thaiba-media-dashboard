/* eslint.config.cjs — flat config for ESLint v9 (CommonJS)
   languageOptions.globals is used instead of "env". */
module.exports = [
  // ignore node_modules
  { ignores: ['node_modules/**'] },

  // main config
  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      parser: require.resolve('@typescript-eslint/parser'),
      parserOptions: {
        project: './tsconfig.json',
        ecmaFeatures: { jsx: true }
      },
      // Replace legacy "env" with explicit globals for files that expect browser/node globals
      globals: {
        // Browser-ish globals (readonly)
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        fetch: 'readonly',
        Headers: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',

        // Node-ish globals
        process: 'readonly',
        global: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',

        // Common JS/JS runtime
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        TextEncoder: 'readonly',
        TextDecoder: 'readonly'
      }
    },

    // plugins loaded via require for flat config
    plugins: {
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
      react: require('eslint-plugin-react'),
      'react-hooks': require('eslint-plugin-react-hooks'),
      'jsx-a11y': require('eslint-plugin-jsx-a11y'),
      prettier: require('eslint-plugin-prettier')
    },

    rules: {
      // TypeScript
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/ban-ts-comment': 'warn',

      // React/JSX/Prettier
      'prettier/prettier': 'warn',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'jsx-a11y/anchor-is-valid': 'off',

      // Basic project rules
      'no-console': ['warn', { allow: ['warn', 'error', 'info', 'log'] }]
    },

    settings: { react: { version: 'detect' } },

    // default env behavior (via globals above)
  },

  // Allow console in server/api files
  {
    files: ['app/api/**', 'utils/**'],
    rules: { 'no-console': 'off' }
  },

  // Test overrides
  {
    files: ['**/*.test.*', '**/__tests__/**'],
    languageOptions: {
      globals: { jest: 'readonly' }
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off'
    }
  }
];
