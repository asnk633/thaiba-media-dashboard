/**
 * eslint.config.cjs — flat configuration for ESLint (Next + TypeScript + React)
 * - global: warn for console but allow warn/error/info
 * - overrides: disable no-console in server api + utils
 * - ignore unused vars/args starting with _
 */
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const reactPlugin = require('eslint-plugin-react');
const hooksPlugin = require('eslint-plugin-react-hooks');
const jsxA11yPlugin = require('eslint-plugin-jsx-a11y');
const prettierPlugin = require('eslint-plugin-prettier');

module.exports = [
  {
    ignores: ['.next/**', 'node_modules/**', 'dist/**'],
    languageOptions: {
      // parser and parserOptions belong under languageOptions.parserOptions for flat config
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2024,
        sourceType: 'module',
        ecmaFeatures: { jsx: true }
      }
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      react: reactPlugin,
      'react-hooks': hooksPlugin,
      'jsx-a11y': jsxA11yPlugin,
      prettier: prettierPlugin
    },
    settings: { react: { version: 'detect' } },
    rules: {
      // default policy: warn, but allow common console methods
      'no-console': ['warn', { allow: ['log','warn','error','info'] }],
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'prettier/prettier': 'warn'
    }
  },

  // Override: allow console in server/api files and in small utils
  {
    files: ['app/api/**/*.{js,ts,tsx}', 'utils/**/*.{js,ts}'],
    rules: {
      'no-console': 'off'
    }
  },

  // compiled / generated files (if you ever lint .next)
  {
    files: ['.next/**/*', '.next/**'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      'no-console': 'off'
    }
  }
];
