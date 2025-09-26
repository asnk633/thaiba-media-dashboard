/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

  // Pick up both __tests__ and *.test / *.spec files
  testMatch: [
    '<rootDir>/**/__tests__/**/*.(test|spec).[jt]s?(x)',
    '<rootDir>/**/*.(test|spec).[jt]s?(x)'
  ],

  // Support "@/..." imports
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  },

  // Only measure what matters right now
  collectCoverageFrom: [
    'components/**/*.{ts,tsx}',
    'app/lib/**/*.{ts,tsx}',
    'app/**/page.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**'
  ],
  coveragePathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/coverage/',
    '<rootDir>/app/api/' // ignore API routes for now
  ],

  // Gentle defaults so CI stays green while we grow tests
  coverageThreshold: {
    global: { branches: 5, functions: 8, lines: 8, statements: 8 }
  }
};
