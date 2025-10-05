// eslint.config.cjs
const js = require('@eslint/js');
const tseslint = require('typescript-eslint');
const importPlugin = require('eslint-plugin-import');

module.exports = [
  // Ignore globs
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

  // JS recommended
  js.configs.recommended,

  // TypeScript recommended (type-checked)
  ...tseslint.configs.recommendedTypeChecked.map(cfg => ({
    ...cfg,
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ...cfg.languageOptions,
      parserOptions: {
        ...cfg.languageOptions?.parserOptions,
        // make sure this file exists
        project: ['./tsconfig.eslint.json'],
        tsconfigRootDir: __dirname,
      },
    },
  })),

  // Apply basic rules to JS/TS
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      import: importPlugin,
    },
    settings: {
      // let eslint-plugin-import resolve TS paths
      'import/resolver': {
        typescript: { alwaysTryTypes: true },
        node: { extensions: ['.js', '.jsx', '.ts', '.tsx'] },
      },
    },
    rules: {
      // stylistic & safety
      'no-unused-vars': 'off', // handled by TS
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],

      // import hygiene
      'import/order': [
        'warn',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            ['parent', 'sibling', 'index'],
            'object',
            'type',
          ],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/newline-after-import': ['warn', { count: 1 }],
      'import/no-unresolved': 'error',
    },
  },
];
