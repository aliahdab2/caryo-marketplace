// jest.config.mjs
const config = {
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: ['/node_modules/', '/.next/', '/e2e/'],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    'scripts/translation-tools/**/*.js',
    '!scripts/translation-tools/core/validator.js', // Exclude old monolithic file
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      statements: 25,
      branches: 25,
      functions: 25,
      lines: 25,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    // Handle module aliases
    '^@/(.*)$': '<rootDir>/src/$1',
    // Handle CSS imports (with CSS modules)
    '\\.module\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    // Handle CSS imports (without CSS modules)
    '\\.(css|less|scss|sass)$': '<rootDir>/__mocks__/styleMock.js',
    // Handle image imports
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },
  transform: {
    // Use babel-jest to transpile tests with the next/babel preset
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(jose|@panva|uuid|@auth|next-auth)/).+\\.m?js$',
    '^.+\\.module\\.(css|sass|scss)$',
  ],
};

export default config;