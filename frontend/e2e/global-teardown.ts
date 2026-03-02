import { FullConfig } from '@playwright/test';

/**
 * Global teardown for E2E tests
 * Runs once after all tests complete
 */
async function globalTeardown(_config: FullConfig) {
  console.log('🧹 E2E Global Teardown...');
  
  // Clean up test data if needed
  // For now, we keep test data between runs for debugging
  
  console.log('✅ E2E Global Teardown Complete');
}

export default globalTeardown;
