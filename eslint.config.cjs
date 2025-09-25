/* eslint.config.cjs — flat config for ESLint v9 (CommonJS)
   Uses module objects (require(...)) for parser & plugins. */
module.exports = [
  { ignores: ['node_modules/**'] },

  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      // parser must be the module object, not a path string
      parser: require('@typescript-eslint/parser'),
      parserOptions: {
        project: './tsconfig.json',
        ecmaFeatures: { jsx: true }
      },
      // Replace legacy "env" with explicit globals for files that expect browser/node globals
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        fetch: 'readonly',
        Headers: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        process: 'readonly',
        global: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        TextEncoder: 'readonly',
        TextDecoder: 'readonly'
      }
    },

    // plugins must be the plugin modules for flat config
    plugins: {
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
      react: require('eslint-plugin-react'),
      'react-hooks': require('eslint-plugin-react-hooks'),
      'jsx-a11y': require('eslint-plugin-jsx-a11y'),
      prettier: require('eslint-plugin-prettier')
    },

    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/ban-ts-comment': 'warn',

      'prettier/prettier': 'warn',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'jsx-a11y/anchor-is-valid': 'off',

      'no-console': ['warn', { allow: ['warn', 'error', 'info', 'log'] }]
    },

    settings: { react: { version: 'detect' } }
  },

  // Allow console in server/api files
  {
    files: ['app/api/**', 'utils/**'],
    rules: { 'no-console': 'off' }
  },

  // Test overrides
  {
    files: ['**/*.test.*', '**/__tests__/**'],
    languageOptions: { globals: { jest: 'readonly' } },
    rules: { '@typescript-eslint/no-explicit-any': 'off' }
  }
];
