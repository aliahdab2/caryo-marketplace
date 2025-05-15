// jest.setup.js
import '@testing-library/jest-dom';

// Suppress Node.js punycode deprecation warning
const originalWarn = console.warn;
console.warn = function(warning) {
  if (warning.includes('[DEP0040]') || warning.includes('punycode')) {
    return;
  }
  originalWarn.apply(console, arguments);
};
