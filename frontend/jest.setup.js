// jest.setup.js
import 'jest-canvas-mock';
import '@testing-library/jest-dom';
import 'whatwg-fetch';
import './src/tests/mocks/i18n-mock.ts'; // Ensure this is loaded early

// Mock matchMedia
window.matchMedia = window.matchMedia || function() {
  return {
    matches: false,
    addListener: function() {},
    removeListener: function() {},
    addEventListener: function() {},
    removeEventListener: function() {},
    dispatchEvent: function() { return true; }
  };
};

// Global timeout for async operations in tests
jest.setTimeout(10000);

// Store the original console methods
const originalWarn = console.warn;
const originalError = console.error;

// Suppress console warnings in tests, but keep them for debugging
console.warn = function() {
  // Check if this is a test case involving favorite button
  if (arguments[0] && typeof arguments[0] === 'string' && arguments[0].includes('[FAVORITE]')) {
    // Let it through for test assertions
    return originalWarn.apply(console, arguments);
  }
  
  // Suppress React act warnings
  if (arguments[0] && typeof arguments[0] === 'string' && 
      arguments[0].includes('was not wrapped in act(...)')) {
    return;
  }
  
  return originalWarn.apply(console, arguments);
};

// Suppress specific console errors in tests
console.error = function() {
  // Suppress React act warnings
  if (arguments[0] && typeof arguments[0] === 'string' && 
      (arguments[0].includes('was not wrapped in act') || 
       arguments[0].includes('Warning: ReactDOM.render'))) {
    return;
  }
  
  return originalError.apply(console, arguments);
};
