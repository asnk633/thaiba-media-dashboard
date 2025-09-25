module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2024,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  env: { browser: true, node: true, es2024: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
    'next/core-web-vitals',
  ],
  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'prettier'],
  settings: { react: { version: 'detect' } },
  rules: {
    'prettier/prettier': ['warn'],
    'react/react-in-jsx-scope': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
  },
  ignorePatterns: ['.next/', 'node_modules/', 'dist/', 'out/'],
};
