// jest.config.cjs
/** @type {import('jest').Config} */
module.exports = {
  // Use jsdom for simulating a browser environment
  testEnvironment: 'jsdom',
  
  // Setup files to run before each test environment is set up
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  
  // How to transform files: use babel-jest for TS, TSX, JS, and JSX
  transform: { '^.+\\.(ts|tsx|js|jsx)$': 'babel-jest' },
  
  // List of file extensions Jest should look for
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // ✅ Map the alias "@/..." -> "<rootDir>/..."
  // This is crucial for resolving absolute paths defined in your tsconfig.json
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',

    // (optional) Mock out styles when imported in components
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },

  // === Coverage Configuration ===
  
  // Enable coverage collection
  collectCoverage: true,
  
  // Specify which files to include in coverage reports
  // Updated to focus only on currently tested UI components and lib/utils.
  collectCoverageFrom: [
    'components/ui/{button,card,badge,input,textarea,label}.tsx',
    'lib/utils.ts'
  ],
  
  // Ignore coverage for standard build/system directories
  coveragePathIgnorePatterns: ['/node_modules/', '/.next/', '/dist/', '/coverage/'],
  
  // Set required minimum coverage thresholds globally
  coverageThreshold: {
    global: { statements: 60, branches: 50, functions: 60, lines: 60 },
  },
};
