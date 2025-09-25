/* eslint.config.cjs — flat config for ESLint v9 (CommonJS) */
module.exports = [
  { ignores: ['node_modules/**'] },

  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      parser: require.resolve('@typescript-eslint/parser'),
      parserOptions: {
        project: './tsconfig.json',
        ecmaFeatures: { jsx: true }
      }
    },

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

    settings: { react: { version: 'detect' } },
    env: { browser: true, node: true, es2024: true }
  },

  {
    files: ['app/api/**', 'utils/**'],
    rules: { 'no-console': 'off' }
  },

  {
    files: ['**/*.test.*', '**/__tests__/**'],
    env: { jest: true },
    rules: { '@typescript-eslint/no-explicit-any': 'off' }
  }
];
