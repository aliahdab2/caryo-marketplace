import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Caryo Marketplace E2E tests
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Test directory
  testDir: './e2e/tests',

  // Run tests in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Limit parallel workers on CI
  workers: process.env.CI ? 1 : parseInt(process.env.E2E_WORKERS || '4'),

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'playwright-report/results.json' }],
    ['list'],
  ],

  // Shared settings for all projects
  use: {
    // Base URL for navigation
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',

    // Collect trace on first retry
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',

    // Default timeout
    actionTimeout: parseInt(process.env.E2E_TIMEOUT || '30000'),

    // Navigation timeout
    navigationTimeout: parseInt(process.env.E2E_NAVIGATION_TIMEOUT || '60000'),
  },

  // Test projects for different browsers
  projects: [
    // Desktop browsers
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Mobile browsers
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // Local dev server configuration
  // Disabled for manual control - start servers manually with:
  // Backend: cd backend/caryo-backend && ./caryo.sh dev start
  // Frontend: cd frontend && npm run dev
  // webServer: [
  //   {
  //     command: 'npm run dev',
  //     url: 'http://localhost:3000',
  //     reuseExistingServer: !process.env.CI,
  //     timeout: 120 * 1000,
  //   },
  // ],

  // Global setup/teardown - runs health check and verifies test data
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',

  // Output folder for test artifacts
  outputDir: 'e2e/test-results',

  // Expect configuration
  expect: {
    // Maximum time expect() should wait for condition to be met
    timeout: 10000,
  },
});
