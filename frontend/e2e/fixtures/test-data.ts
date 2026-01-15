/**
 * Test Data for E2E Tests
 * 
 * Centralized test data to keep tests consistent and maintainable.
 */

export const testUser = {
  username: 'e2etest',
  email: process.env.E2E_TEST_USER_EMAIL || 'e2e-test@caryo.test',
  password: process.env.E2E_TEST_USER_PASSWORD || 'TestPassword123!',
  name: process.env.E2E_TEST_USER_NAME || 'E2E Test User',
  sellerTypeId: 1, // Private seller
  phone: '+966500000000',
  city: 'Riyadh',
};

export const dealerUser = {
  username: 'e2edealer',
  email: process.env.E2E_DEALER_EMAIL || 'e2e-dealer@caryo.test',
  password: process.env.E2E_DEALER_PASSWORD || 'DealerPass123!',
  name: process.env.E2E_DEALER_NAME || 'E2E Test Dealer',
  sellerTypeId: 2, // Dealer
  businessName: 'E2E Test Motors',
  businessPhone: '+966500000001',
};

export const testListing = {
  make: 'toyota',
  model: 'camry',
  year: '2020',
  mileage: '50000',
  condition: 'used',
  transmission: 'automatic',
  fuelType: 'petrol',
  title: 'E2E Test - 2020 Toyota Camry',
  description: 'This is a test listing created by E2E tests. Well maintained vehicle with full service history.',
  price: '25000',
  city: 'riyadh',
};

export const testMessage = {
  content: 'Hi, is this car still available? I am interested in scheduling a test drive.',
};

export const invalidCredentials = {
  email: 'invalid-user@test.com',
  password: 'WrongPassword123!',
};

export const urls = {
  home: '/',
  signIn: '/auth/signin',
  signUp: '/auth/signup',
  forgotPassword: '/auth/forgot-password',
  dashboard: '/dashboard',
  search: '/search',
  favorites: '/favorites',
  messages: '/dashboard/messages',
  createListing: '/dashboard/listings/new',
};
