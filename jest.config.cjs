/** @type {import('jest').Config} */
const nextJest = require('next/jest');

const createJestConfig = nextJest({ dir: './' });

const customJestConfig = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testMatch: [
    '<rootDir>/**/__tests__/**/*.(test|spec).[jt]s?(x)',
    '<rootDir>/**/*.(test|spec).[jt]s?(x)'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  },
  // --- Coverage settings ---
  collectCoverage: true,
  collectCoverageFrom: [
    'app/**/*.{ts,tsx,js,jsx}',
    'components/**/*.{ts,tsx,js,jsx}',
    'utils/**/*.{ts,tsx,js,jsx}'
  ],
  coverageReporters: ['text', 'lcov']
};

module.exports = createJestConfig(customJestConfig);
const customJestConfig = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testMatch: [
    '<rootDir>/**/__tests__/**/*.(test|spec).[jt]s?(x)',
    '<rootDir>/**/*.(test|spec).[jt]s?(x)',
  ],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },

  // ▶ collect only app components/libs (adjust as you like)
  collectCoverageFrom: [
    'components/**/*.{ts,tsx}',
    'app/lib/**/*.{ts,tsx}',
    'app/**/page.{ts,tsx}',     // if you want page components
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coveragePathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/coverage/',
    '<rootDir>/app/api/',       // ignore API routes for now
  ],

  // (Optional) gentle thresholds to keep drift in check
  coverageThreshold: {
    global: { branches: 5, functions: 8, lines: 8, statements: 8 },
  },
}