import { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Global setup for E2E tests
 * Runs once before all tests
 */
async function globalSetup(_config: FullConfig) {
  const apiUrl = process.env.E2E_API_URL || 'http://localhost:8080';
  
  console.log('🚀 E2E Global Setup Starting...');
  
  // Wait for backend to be ready
  await waitForBackend(apiUrl);
  
  // Seed test data if needed
  await seedTestData(apiUrl);
  
  // Setup Dealer Auth State
  await setupDealerAuth(apiUrl);
  
  // Setup User Auth State
  await setupUserAuth(apiUrl);
  
  console.log('✅ E2E Global Setup Complete');
}

// ... (existing helper functions)

/**
 * Setup User Auth State file
 * Logs in as user via NextAuth and saves cookies for tests to reuse
 */
async function setupUserAuth(_apiUrl: string) {
  console.log('🔐 Setting up User Auth State...');
  const authDir = path.join(__dirname, '.auth');
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  try {
    const { chromium } = await import('@playwright/test');
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000';

    await page.goto(`${baseURL}/auth/signin`);
    await page.waitForLoadState('domcontentloaded');

    await page.fill('#username', 'user');
    await page.fill('#password', 'Password123!');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to home or previous page
    await page.waitForTimeout(2000); 

    await context.storageState({ path: path.join(authDir, 'user-auth.json') });
    await browser.close();

    console.log('✅ User auth state saved to e2e/.auth/user-auth.json');
  } catch (error) {
    console.error(`⚠️ Failed to setup user auth: ${error}`);
  }
}

// ... (existing helper functions)

/**
 * Setup Dealer Auth State file
 * Logs in as dealer via NextAuth and saves cookies for tests to reuse
 */
async function setupDealerAuth(_apiUrl: string) {
  console.log('🔐 Setting up Dealer Auth State...');
  const authDir = path.join(__dirname, '.auth');
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  try {
    // Use Playwright to do a real browser login through NextAuth
    const { chromium } = await import('@playwright/test');
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000';

    // Navigate to sign-in page
    await page.goto(`${baseURL}/auth/signin`);
    await page.waitForLoadState('domcontentloaded');

    // Fill in login form using correct selectors (id-based)
    await page.fill('#username', 'dealer');
    await page.fill('#password', 'Dealer123!');

    // Click sign in button
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard (confirms login success)
    await page.waitForURL('**/dashboard**', { timeout: 30000 });

    // Save the authenticated state (includes NextAuth session cookies)
    await context.storageState({ path: path.join(authDir, 'dealer-auth.json') });

    await browser.close();

    console.log('✅ Dealer auth state saved to e2e/.auth/dealer-auth.json');
  } catch (error) {
    console.error(`⚠️ Failed to setup dealer auth: ${error}`);
    // Don't fail global setup, tests can try to login individually if this fails
  }
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
 * Seed test data for E2E tests
 * Creates listings, favorites, and messages if they don't exist
 */
async function seedTestData(apiUrl: string) {
  console.log('🌱 Seeding test data...');
  
  // 1. Login as test user to get token
  let token: string | null = null;
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
      const data = await loginResponse.json();
      token = data.token;
      console.log('✅ Test user verified (user/Password123!)');
    } else {
      console.log('⚠️ Test user login failed - backend may need to seed data');
      return;
    }
  } catch (error) {
    console.log(`⚠️ Could not verify test user: ${error}`);
    return;
  }

  // 2. Check if listings exist
  try {
    const listingsResponse = await fetch(`${apiUrl}/api/listings?page=0&size=1`);
    if (listingsResponse.ok) {
      const data = await listingsResponse.json();
      const hasListings = data.content?.length > 0 || data.totalElements > 0;
      
      if (hasListings) {
        console.log('✅ Test listings already exist');
        return;
      }
    }
  } catch (error) {
    console.log(`⚠️ Could not check listings: ${error}`);
  }

  // 3. Create test listings
  console.log('📝 Creating test listings...');
  
  const testListings = [
    {
      title: 'E2E Test - 2020 Toyota Camry',
      description: 'This is a test listing created by E2E tests. Well maintained vehicle.',
      make: 'toyota',
      model: 'camry',
      year: 2020,
      price: 25000,
      mileage: 50000,
      condition: 'USED',
      transmission: 'AUTOMATIC',
      fuelType: 'PETROL',
      bodyType: 'SEDAN',
      exteriorColor: 'WHITE',
      city: 'Damascus',
      status: 'ACTIVE',
    },
    {
      title: 'E2E Test - 2019 Honda Civic',
      description: 'Another test listing for E2E testing purposes.',
      make: 'honda',
      model: 'civic',
      year: 2019,
      price: 22000,
      mileage: 45000,
      condition: 'USED',
      transmission: 'AUTOMATIC',
      fuelType: 'PETROL',
      bodyType: 'SEDAN',
      exteriorColor: 'BLACK',
      city: 'Aleppo',
      status: 'ACTIVE',
    },
  ];

  for (const listing of testListings) {
    try {
      const createResponse = await fetch(`${apiUrl}/api/listings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(listing),
      });
      
      if (createResponse.ok) {
        console.log(`✅ Created: ${listing.title}`);
      } else {
        const error = await createResponse.text();
        console.log(`⚠️ Failed to create listing: ${error}`);
      }
    } catch (error) {
      console.log(`⚠️ Error creating listing: ${error}`);
    }
  }
  
  console.log('✅ Test data seeding complete');
}

export default globalSetup;
