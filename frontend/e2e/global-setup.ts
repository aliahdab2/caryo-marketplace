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
