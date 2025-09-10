/**
 * Jest setup for Translation Validator tests
 */

// This file contains Jest setup code only, no actual tests
// The test suites are in the individual test files

// Mock console methods to reduce noise during testing
global.console = {
  ...console,
  // Keep log and error for debugging when needed
  // log: jest.fn(),
  // error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
};

// Mock process.argv for CLI tests
global.originalArgv = process.argv;

// Set up test environment variables
process.env.NODE_ENV = 'test';

// Note: fs mocking is now done per-test-file to avoid global conflicts
// Individual test files that need fs mocking should include it at the top:
// jest.mock('fs', () => ({ ... }));
