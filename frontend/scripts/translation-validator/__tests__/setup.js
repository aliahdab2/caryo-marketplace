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

// Mock fs for testing
const fs = require('fs');
const path = require('path');

// Store original methods
global.originalReadFileSync = fs.readFileSync;
global.originalWriteFileSync = fs.writeFileSync;
global.originalExistsSync = fs.existsSync;

// Mock methods for testing
fs.readFileSync = jest.fn((filePath, options) => {
  // Return mock data for test files
  if (filePath.includes('test-data')) {
    const mockData = {
      'sample-common.json': JSON.stringify({
        appName: 'Test App',
        welcome: 'Welcome'
      }),
      'sample-auth.json': JSON.stringify({
        login: 'Login',
        register: 'Register'
      })
    };

    const fileName = path.basename(filePath);
    if (mockData[fileName]) {
      return mockData[fileName];
    }
  }

  // For other files, call original method
  return global.originalReadFileSync(filePath, options);
});

fs.writeFileSync = jest.fn();
fs.existsSync = jest.fn(() => true);
