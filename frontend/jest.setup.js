// jest.setup.js
import '@testing-library/jest-dom';

// Suppress specific warnings and errors in tests
const originalWarn = console.warn;
console.warn = function(warning) {
  if (warning.includes('[DEP0040]') || warning.includes('punycode') || 
      warning.includes('i18next') || warning.includes('NO_I18NEXT_INSTANCE')) {
    return;
  }
  originalWarn.apply(console, arguments);
};

// Suppress specific console errors in tests
const originalError = console.error;
console.error = function(error) {
  // Suppress expected Google auth errors from tests
  if (error.includes('Google Sign-In Error') || 
      error.includes('Google Sign-In Exception') || 
      error.includes('Google authentication failed') ||
      error.includes('Authentication error')) {
    return;
  }
  originalError.apply(console, arguments);
};
