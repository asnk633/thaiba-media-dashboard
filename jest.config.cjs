/** @type {import('jest').Config} */
const nextJest = require('next/jest');

const createJestConfig = nextJest({ dir: './' });

const customJestConfig = {
  testEnvironment: 'jest-environment-jsdom',
  // Add jest-dom + any custom matchers
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  // Pick up both __tests__ and *.test / *.spec files
  testMatch: [
    '<rootDir>/**/__tests__/**/*.(test|spec).[jt]s?(x)',
    '<rootDir>/**/*.(test|spec).[jt]s?(x)'
  ],
  moduleNameMapper: {
    // If you use import aliases like "@/components/.."
    '^@/(.*)$': '<rootDir>/$1'
  }
};

module.exports = createJestConfig(customJestConfig);
