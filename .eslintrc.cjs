/**
 * Canonical .eslintrc.cjs created by helper:
 * - includes next/core-web-vitals + prettier at end of extends
 * - default: warn for console (allow warn,error,info)
 * - overrides: turn off no-console for app/api & utils
 * - ignore unused args that start with _
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
    'next/core-web-vitals',
    'prettier'
  ],
  settings: {
    react: { version: 'detect' }
  },
  rules: {
    // default policy: warn on console but allow common methods
    'no-console': ['warn', { allow: ['log','warn','error','info'] }],
    // ignore unused function args/vars that start with underscore
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }]
  },
  overrides: [
    {
      // allow console inside server-side API code and utils
      files: ['app/api/**/*.{js,ts,tsx}', 'utils/**/*.{js,ts}'],
      rules: {
        'no-console': 'off'
      }
    },
    {
      // compiled / generated files (if you ever lint .next)
      files: ['.next/**/*', '.next/**'],
      rules: {
        '@typescript-eslint/no-unused-vars': 'off',
        'no-console': 'off'
      }
    }
  ]
};
