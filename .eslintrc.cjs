/**
 * ESLint CommonJS config for Next.js + TypeScript + React
 *
 * - allow console in API/server and utils files
 * - treat unused vars that start with '_' as allowed
 */
module.exports = {
  root: true,
  ignorePatterns: ['.next/**', 'node_modules/**', 'dist/**'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2024,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
    project: './tsconfig.json'
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'jsx-a11y'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'prettier'
  ],
  settings: { react: { version: 'detect' } },

  rules: {
    // prefer the TS rule for unused vars; allow leading underscores
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { "varsIgnorePattern": "^_", "argsIgnorePattern": "^_" }],
    // warn on console by default
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
  },

  overrides: [
    // server / API files: allow console (they are backend)
    {
      files: ['app/api/**/*.{js,ts,jsx,tsx}', 'utils/**/*.{js,ts}'],
      rules: {
        'no-console': 'off'
      }
    },
    // compiled / generated files (if you ever lint .next or .next/server)
    {
      files: ['.next/**/*', '.next/**'],
      rules: {
        // lax rules for generated code
        '@typescript-eslint/no-unused-vars': 'off',
        'no-console': 'off'
      }
    }
  ]
};
