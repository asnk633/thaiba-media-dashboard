/* eslint.config.cjs — ESLint v9 flat config
   - Base rules for JS/JSX
   - Typed linting enabled only for TS/TSX
   - No legacy `env`, uses languageOptions.globals
   - Console allowed in app/api/** and utils/** files
*/
module.exports = [
  { ignores: ['node_modules/**'] },

  // Base config (JS/JSX + common rules)
  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
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

    plugins: {
      react: require('eslint-plugin-react'),
      'react-hooks': require('eslint-plugin-react-hooks'),
      'jsx-a11y': require('eslint-plugin-jsx-a11y'),
      prettier: require('eslint-plugin-prettier')
    },

    rules: {
      'prettier/prettier': 'warn',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'jsx-a11y/anchor-is-valid': 'off',
      'no-console': ['warn', { allow: ['warn', 'error', 'info', 'log'] }]
    },

    settings: { react: { version: 'detect' } }
  },

  // TypeScript override: typed linting for TS/TSX only
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: require('@typescript-eslint/parser'),
      parserOptions: {
        project: './tsconfig.json',
        ecmaVersion: 2024,
        sourceType: 'module',
        ecmaFeatures: { jsx: true }
      }
    },
    plugins: {
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin')
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/ban-ts-comment': 'warn'
    }
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
