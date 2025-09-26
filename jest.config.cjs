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
