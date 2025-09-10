/**
 * Jest configuration for Translation Validator tests
 */
process.env.NODE_ENV = 'test';

module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/__tests__/*.test.js'
  ],
  collectCoverageFrom: [
    'validator.js',
    '!__tests__/**'
  ],
  coverageDirectory: '<rootDir>/coverage/translation',
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],
  setupFilesAfterEnv: [],
  testTimeout: 10000,
  verbose: true,
  // Mock console methods to reduce noise during testing
  setupFiles: [
    '<rootDir>/__tests__/setup.js'
  ],
  // Disable Babel transformation
  transform: {}
};
