import { FullConfig } from '@playwright/test';

/**
 * Global setup for E2E tests
 * Runs once before all tests
 */
async function globalSetup(config: FullConfig) {
  const apiUrl = process.env.E2E_API_URL || 'http://localhost:8080';
  
  console.log('🚀 E2E Global Setup Starting...');
  
  // Wait for backend to be ready
  await waitForBackend(apiUrl);
  
  // Seed test data if needed
  await seedTestData(apiUrl);
  
  console.log('✅ E2E Global Setup Complete');
}

/**
 * Wait for backend health check to pass
 */
async function waitForBackend(apiUrl: string, maxRetries = 30, retryInterval = 2000) {
  const healthUrl = `${apiUrl}/actuator/health`;
  
  console.log(`⏳ Waiting for backend at ${healthUrl}...`);
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(healthUrl);
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'UP') {
          console.log('✅ Backend is healthy');
          return;
        }
      }
    } catch (error) {
      // Backend not ready yet
    }
    
    if (i < maxRetries - 1) {
      console.log(`   Retry ${i + 1}/${maxRetries}...`);
      await new Promise(resolve => setTimeout(resolve, retryInterval));
    }
  }
  
  throw new Error(`Backend at ${apiUrl} did not become healthy within ${maxRetries * retryInterval / 1000}s`);
}

/**
 * Verify test data exists
 * Test users are created by backend DataInitializer:
 * - user / Password123!
 * - admin / Admin123!
 * - dealer / Dealer123!
 */
async function seedTestData(apiUrl: string) {
  console.log('🌱 Verifying test data...');
  
  // Test users are created by backend DataInitializer
  // Just verify the regular test user can login
  try {
    const loginResponse = await fetch(`${apiUrl}/api/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'user',
        password: 'Password123!',
      }),
    });
    
    if (loginResponse.ok) {
      console.log('✅ Test user verified (user/Password123!)');
    } else {
      console.log('⚠️ Test user login failed - backend may need to seed data');
      console.log('   Run: ./autotrader.sh dev start --rebuild');
    }
  } catch (error) {
    console.log(`⚠️ Could not verify test user: ${error}`);
  }
}

export default globalSetup;
