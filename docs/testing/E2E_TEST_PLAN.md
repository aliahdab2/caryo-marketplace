# Caryo Marketplace - E2E Test Plan

## Overview

This document outlines the comprehensive End-to-End (E2E) testing strategy for Caryo Marketplace. E2E tests verify that complete user flows work correctly from the browser to the backend and back.

### Goals

1. **Confidence in Releases**: Catch integration bugs before deployment
2. **Critical Flow Protection**: Ensure core user journeys always work
3. **Regression Prevention**: Automated checks for every code change
4. **Cross-browser Verification**: Test on Chrome, Firefox, Safari, and mobile viewports

### Scope

| In Scope | Out of Scope |
|----------|--------------|
| Critical user flows | Visual regression testing |
| Authentication flows | Performance testing |
| Core CRUD operations | Load testing |
| Payment flows (when ready) | Accessibility testing (separate suite) |

---

## Tool Selection: Playwright

### Why Playwright?

| Feature | Playwright | Cypress |
|---------|------------|---------|
| Cross-browser | ✅ Chrome, Firefox, Safari, Edge | ⚠️ Limited Safari |
| Speed | ✅ Parallel by default | ❌ Sequential |
| TypeScript | ✅ Native | ✅ Supported |
| Auto-wait | ✅ Built-in | ✅ Built-in |
| Mobile emulation | ✅ Built-in | ⚠️ Limited |
| Network mocking | ✅ Built-in | ✅ Built-in |
| Test recording | ✅ Codegen | ✅ Studio |
| CI Integration | ✅ Excellent | ✅ Good |

### Installation

```bash
cd frontend
npm install -D @playwright/test
npx playwright install
```

---

## Test Environment

### Local Development

```bash
# Terminal 1: Start backend
cd backend/caryo-backend
./gradlew bootRun

# Terminal 2: Start frontend
cd frontend
npm run dev

# Terminal 3: Run E2E tests
cd frontend
npm run test:e2e
```

### Environment Variables

```env
# .env.test.local
E2E_BASE_URL=http://localhost:3000
E2E_API_URL=http://localhost:8080
E2E_TEST_USER_EMAIL=e2e-test@caryo.com
E2E_TEST_USER_PASSWORD=TestPassword123!
E2E_DEALER_EMAIL=e2e-dealer@caryo.com
E2E_DEALER_PASSWORD=DealerPass123!
```

### Test Data Requirements

| Data | Purpose | Created By |
|------|---------|------------|
| Test User Account | Login tests | Seed script |
| Dealer Account | Dealer flow tests | Seed script |
| Sample Listings (10+) | Search/browse tests | Seed script |
| Favorited Listings | Favorites tests | Test setup |

---

## Test Categories & Priority

### Priority 1: Critical (Must Have)

| ID | Flow | Steps | Est. Time |
|----|------|-------|-----------|
| AUTH-001 | User Login | 5 | 0.5 day |
| AUTH-002 | User Logout | 3 | 0.25 day |
| AUTH-003 | User Signup | 8 | 0.5 day |
| SEARCH-001 | Browse Listings | 4 | 0.5 day |
| LISTING-001 | View Listing Details | 3 | 0.25 day |

### Priority 2: High (Should Have)

| ID | Flow | Steps | Est. Time |
|----|------|-------|-----------|
| LISTING-002 | Create Listing (Wizard) | 15 | 1 day |
| FAV-001 | Add to Favorites | 4 | 0.25 day |
| FAV-002 | Remove from Favorites | 4 | 0.25 day |
| MSG-001 | Send Message to Seller | 6 | 0.5 day |

### Priority 3: Medium (Nice to Have)

| ID | Flow | Steps | Est. Time |
|----|------|-------|-----------|
| AUTH-004 | Password Reset | 6 | 0.5 day |
| DEALER-001 | Dealer Dashboard Access | 4 | 0.25 day |
| DEALER-002 | Upgrade Subscription | 8 | 0.5 day |
| SEARCH-002 | Advanced Filters | 6 | 0.5 day |
| LISTING-003 | Edit Listing | 10 | 0.5 day |

---

## Detailed Test Cases

### AUTH-001: User Login

**Priority:** Critical  
**Preconditions:** Test user exists in database

#### Steps

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/auth/signin` | Login page loads |
| 2 | Verify page elements | Username, password fields, submit button visible |
| 3 | Enter valid username | Field accepts input |
| 4 | Enter valid password | Field accepts input (masked) |
| 5 | Click "Sign In" button | Loading state shown |
| 6 | Wait for redirect | Redirected to `/dashboard` or `/` |
| 7 | Verify logged in state | User avatar/name in header |

#### Test Code

```typescript
test('AUTH-001: User can login with valid credentials', async ({ page }) => {
  // Step 1: Navigate
  await page.goto('/auth/signin');
  
  // Step 2: Verify elements
  await expect(page.getByLabel(/username or email/i)).toBeVisible();
  await expect(page.getByLabel(/password/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  
  // Step 3-4: Enter credentials
  await page.getByLabel(/username or email/i).fill(process.env.E2E_TEST_USER_EMAIL!);
  await page.getByLabel(/password/i).fill(process.env.E2E_TEST_USER_PASSWORD!);
  
  // Step 5: Submit
  await page.getByRole('button', { name: /sign in/i }).click();
  
  // Step 6-7: Verify redirect and logged in state
  await expect(page).toHaveURL(/dashboard|\/$/);
  await expect(page.getByTestId('user-avatar')).toBeVisible();
});
```

#### Negative Tests

```typescript
test('AUTH-001-NEG-1: Shows error for invalid credentials', async ({ page }) => {
  await page.goto('/auth/signin');
  await page.getByLabel(/username or email/i).fill('invalid@test.com');
  await page.getByLabel(/password/i).fill('wrongpassword');
  await page.getByRole('button', { name: /sign in/i }).click();
  
  await expect(page.getByText(/invalid credentials|incorrect/i)).toBeVisible();
  await expect(page).toHaveURL(/signin/);
});

test('AUTH-001-NEG-2: Shows validation for empty fields', async ({ page }) => {
  await page.goto('/auth/signin');
  await page.getByRole('button', { name: /sign in/i }).click();
  
  await expect(page.getByText(/required/i)).toBeVisible();
});
```

---

### AUTH-002: User Logout

**Priority:** Critical  
**Preconditions:** User is logged in

#### Steps

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Start from logged-in state | User avatar visible |
| 2 | Click user menu/avatar | Dropdown opens |
| 3 | Click "Logout" | Loading state |
| 4 | Wait for redirect | Redirected to home or login |
| 5 | Verify logged out | Login button visible, no avatar |

#### Test Code

```typescript
test('AUTH-002: User can logout', async ({ page }) => {
  // Setup: Login first
  await loginAsTestUser(page);
  
  // Step 2: Open user menu
  await page.getByTestId('user-menu-trigger').click();
  
  // Step 3: Click logout
  await page.getByRole('menuitem', { name: /logout|sign out/i }).click();
  
  // Step 4-5: Verify logged out
  await expect(page).toHaveURL(/\/$|signin/);
  await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();
});
```

---

### AUTH-003: User Signup

**Priority:** Critical  
**Preconditions:** Email not already registered

#### Steps

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/auth/signup` | Signup page loads |
| 2 | Fill name field | Accepts input |
| 3 | Fill email field | Accepts valid email |
| 4 | Fill password field | Shows strength indicator |
| 5 | Fill confirm password | Matches password |
| 6 | Accept terms checkbox | Checkbox checked |
| 7 | Click "Create Account" | Loading state |
| 8 | Verify success | Success message or redirect |

#### Test Code

```typescript
test('AUTH-003: New user can signup', async ({ page }) => {
  const uniqueEmail = `e2e-${Date.now()}@test.caryo.com`;
  
  await page.goto('/auth/signup');
  
  await page.getByLabel(/name/i).fill('E2E Test User');
  await page.getByLabel(/email/i).fill(uniqueEmail);
  await page.getByLabel(/^password$/i).fill('SecurePass123!');
  await page.getByLabel(/confirm password/i).fill('SecurePass123!');
  await page.getByLabel(/terms/i).check();
  
  await page.getByRole('button', { name: /create account|sign up/i }).click();
  
  // Verify success (either message or redirect)
  await expect(
    page.getByText(/verification email|account created|welcome/i)
  ).toBeVisible({ timeout: 10000 });
});
```

---

### SEARCH-001: Browse Listings

**Priority:** Critical  
**Preconditions:** At least 5 listings exist

#### Steps

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/search` or `/` | Page loads |
| 2 | Verify listings displayed | At least 1 listing card visible |
| 3 | Click on a listing card | Navigate to listing details |
| 4 | Verify listing page | Title, price, images visible |

#### Test Code

```typescript
test('SEARCH-001: User can browse and view listings', async ({ page }) => {
  await page.goto('/search');
  
  // Wait for listings to load
  await expect(page.getByTestId('listing-card').first()).toBeVisible();
  
  // Count listings
  const listingCount = await page.getByTestId('listing-card').count();
  expect(listingCount).toBeGreaterThan(0);
  
  // Click first listing
  await page.getByTestId('listing-card').first().click();
  
  // Verify listing page
  await expect(page).toHaveURL(/listing\/\d+/);
  await expect(page.getByTestId('listing-title')).toBeVisible();
  await expect(page.getByTestId('listing-price')).toBeVisible();
});
```

---

### LISTING-002: Create Listing (Wizard)

**Priority:** High  
**Preconditions:** User logged in as dealer or verified user

#### Steps

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to listing creation | Wizard Step 1 visible |
| 2 | Select make | Models dropdown populates |
| 3 | Select model | Field populated |
| 4 | Select year | Field populated |
| 5 | Click Next | Move to Step 2 |
| 6 | Fill vehicle details | All required fields |
| 7 | Click Next | Move to Step 3 |
| 8 | Add title and description | Fields populated |
| 9 | Upload at least 1 image | Image preview shown |
| 10 | Click Next | Move to Step 4 |
| 11 | Set price | Price field populated |
| 12 | Select location | Location shown |
| 13 | Click Submit/Publish | Listing created |
| 14 | Verify success | Redirect to listing or success message |

#### Test Code

```typescript
test('LISTING-002: User can create a new listing', async ({ page }) => {
  await loginAsTestUser(page);
  await page.goto('/dashboard/listings/new');
  
  // Step 1: Vehicle Identity
  await page.getByLabel(/make/i).selectOption('toyota');
  await page.getByLabel(/model/i).selectOption('camry');
  await page.getByLabel(/year/i).selectOption('2020');
  await page.getByRole('button', { name: /next/i }).click();
  
  // Step 2: Vehicle Details
  await page.getByLabel(/mileage/i).fill('50000');
  await page.getByLabel(/condition/i).selectOption('used');
  await page.getByLabel(/transmission/i).selectOption('automatic');
  await page.getByLabel(/fuel type/i).selectOption('petrol');
  await page.getByRole('button', { name: /next/i }).click();
  
  // Step 3: Description & Media
  await page.getByLabel(/title/i).fill('2020 Toyota Camry - Excellent Condition');
  await page.getByLabel(/description/i).fill('Well maintained vehicle with full service history.');
  
  // Upload image
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles('./e2e/fixtures/test-car-image.jpg');
  await expect(page.getByTestId('image-preview')).toBeVisible();
  await page.getByRole('button', { name: /next/i }).click();
  
  // Step 4: Pricing & Location
  await page.getByLabel(/price/i).fill('25000');
  await page.getByLabel(/city/i).selectOption('riyadh');
  
  // Submit
  await page.getByRole('button', { name: /publish|create|submit/i }).click();
  
  // Verify success
  await expect(page.getByText(/listing created|success/i)).toBeVisible({ timeout: 15000 });
});
```

---

### FAV-001: Add to Favorites

**Priority:** High  
**Preconditions:** User logged in, listing exists

#### Test Code

```typescript
test('FAV-001: User can add listing to favorites', async ({ page }) => {
  await loginAsTestUser(page);
  await page.goto('/search');
  
  // Find and click first listing
  await page.getByTestId('listing-card').first().click();
  
  // Click favorite button
  await page.getByTestId('favorite-button').click();
  
  // Verify favorited state
  await expect(page.getByTestId('favorite-button')).toHaveAttribute('data-favorited', 'true');
  
  // Navigate to favorites page
  await page.goto('/favorites');
  
  // Verify listing appears in favorites
  await expect(page.getByTestId('listing-card')).toBeVisible();
});
```

---

### MSG-001: Send Message to Seller

**Priority:** High  
**Preconditions:** User logged in, listing exists

#### Test Code

```typescript
test('MSG-001: User can send message to seller', async ({ page }) => {
  await loginAsTestUser(page);
  await page.goto('/search');
  
  // Open a listing
  await page.getByTestId('listing-card').first().click();
  
  // Click contact seller
  await page.getByRole('button', { name: /contact|message/i }).click();
  
  // Type message
  await page.getByLabel(/message/i).fill('Hi, is this car still available?');
  
  // Send
  await page.getByRole('button', { name: /send/i }).click();
  
  // Verify sent
  await expect(page.getByText(/message sent|success/i)).toBeVisible();
});
```

---

## Test Utilities & Helpers

### Helper Functions

```typescript
// e2e/helpers/auth.ts
import { Page } from '@playwright/test';

export async function loginAsTestUser(page: Page) {
  await page.goto('/auth/signin');
  await page.getByLabel(/username or email/i).fill(process.env.E2E_TEST_USER_EMAIL!);
  await page.getByLabel(/password/i).fill(process.env.E2E_TEST_USER_PASSWORD!);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/dashboard|\/$/);
}

export async function loginAsDealer(page: Page) {
  await page.goto('/auth/signin');
  await page.getByLabel(/username or email/i).fill(process.env.E2E_DEALER_EMAIL!);
  await page.getByLabel(/password/i).fill(process.env.E2E_DEALER_PASSWORD!);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/dashboard/);
}

export async function logout(page: Page) {
  await page.getByTestId('user-menu-trigger').click();
  await page.getByRole('menuitem', { name: /logout/i }).click();
  await page.waitForURL(/\/$|signin/);
}
```

### Test Fixtures

```typescript
// e2e/fixtures/test-data.ts
export const testUser = {
  email: process.env.E2E_TEST_USER_EMAIL!,
  password: process.env.E2E_TEST_USER_PASSWORD!,
  name: 'E2E Test User',
};

export const testListing = {
  make: 'toyota',
  model: 'camry',
  year: '2020',
  price: '25000',
  title: 'E2E Test Listing',
  description: 'Created by E2E test suite',
};
```

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  e2e:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: caryo_test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      
      - name: Install dependencies
        working-directory: frontend
        run: npm ci
      
      - name: Install Playwright Browsers
        working-directory: frontend
        run: npx playwright install --with-deps
      
      - name: Setup Java
        uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'zulu'
      
      - name: Start Backend
        working-directory: backend/caryo-backend
        run: |
          ./gradlew bootRun &
          sleep 30  # Wait for backend to start
        env:
          SPRING_PROFILES_ACTIVE: test
      
      - name: Start Frontend
        working-directory: frontend
        run: |
          npm run build
          npm start &
          sleep 10
        env:
          NODE_ENV: test
      
      - name: Run E2E Tests
        working-directory: frontend
        run: npm run test:e2e
        env:
          E2E_BASE_URL: http://localhost:3000
          E2E_API_URL: http://localhost:8080
      
      - name: Upload Test Results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: frontend/playwright-report/
          retention-days: 7
```

---

## Playwright Configuration

```typescript
// frontend/playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'playwright-report/results.json' }],
  ],
  
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
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
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

---

## Maintenance Guidelines

### Best Practices

1. **Use data-testid**: Add `data-testid` attributes for reliable element selection
2. **Avoid flaky selectors**: Don't use CSS classes or dynamic IDs
3. **Use page objects**: Create reusable page classes for complex pages
4. **Keep tests independent**: Each test should run in isolation
5. **Clean up test data**: Delete created data after tests

### When to Update Tests

| Trigger | Action |
|---------|--------|
| UI text changes | Update text matchers |
| New required field | Update form fill steps |
| Flow changes | Update step sequence |
| New feature | Add new test case |

### Flaky Test Policy

1. Investigate immediately when a test becomes flaky
2. Add explicit waits if timing-related
3. Use `toBeVisible()` before interactions
4. Consider test isolation issues

---

## Timeline

| Week | Tasks | Days |
|------|-------|------|
| 1 | Setup Playwright, AUTH tests | 2 |
| 1 | SEARCH-001, LISTING-001 | 1 |
| 2 | LISTING-002 (wizard) | 1.5 |
| 2 | FAV tests, MSG tests | 1 |
| 2 | CI integration, documentation | 0.5 |

**Total: ~6 days**

---

## Success Criteria

- [ ] All Priority 1 tests passing
- [ ] All Priority 2 tests passing
- [ ] Tests run in CI on every PR
- [ ] < 5% flaky test rate
- [ ] Test run time < 10 minutes

---

## Appendix: Required data-testid Attributes

Add these to components for reliable testing:

| Component | Attribute |
|-----------|-----------|
| User avatar/menu | `data-testid="user-menu-trigger"` |
| User avatar | `data-testid="user-avatar"` |
| Listing card | `data-testid="listing-card"` |
| Listing title | `data-testid="listing-title"` |
| Listing price | `data-testid="listing-price"` |
| Favorite button | `data-testid="favorite-button"` |
| Image preview | `data-testid="image-preview"` |
