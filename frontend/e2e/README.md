# E2E Tests

End-to-End tests for Caryo Marketplace using Playwright.

## Structure

```
e2e/
├── tests/              # Test spec files
│   ├── auth.spec.ts    # Authentication tests
│   ├── search.spec.ts  # Search & browse tests (coming)
│   └── ...
├── helpers/            # Reusable helper functions
│   ├── auth.ts         # Login/logout helpers
│   └── index.ts        # Export all helpers
├── fixtures/           # Test data & assets
│   └── test-car-image.jpg
├── global-setup.ts     # Runs before all tests
├── global-teardown.ts  # Runs after all tests
└── README.md           # This file
```

## Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI (interactive mode)
npm run test:e2e:ui

# Run headed (see browser)
npm run test:e2e:headed

# Run in debug mode
npm run test:e2e:debug

# View test report
npm run test:e2e:report
```

## Prerequisites

1. Install Playwright browsers:
   ```bash
   npx playwright install chromium
   ```

2. Start backend:
   ```bash
   cd backend/caryo-backend
   ./gradlew bootRun
   ```

3. Start frontend:
   ```bash
   cd frontend
   npm run dev
   ```

## Environment Variables

Create `.env.e2e.local` in the frontend folder:

```env
E2E_BASE_URL=http://localhost:3000
E2E_API_URL=http://localhost:8080
E2E_TEST_USER_EMAIL=e2e-test@caryo.test
E2E_TEST_USER_PASSWORD=TestPassword123!
E2E_DEALER_EMAIL=e2e-dealer@caryo.test
E2E_DEALER_PASSWORD=DealerPass123!
```

## Writing Tests

### Use helpers for common operations

```typescript
import { loginAsTestUser, logout } from '../helpers';

test('my test', async ({ page }) => {
  await loginAsTestUser(page);
  // ... test code
  await logout(page);
});
```

### Use data-testid for selectors

```typescript
// Good - stable selector
await page.getByTestId('listing-card').click();

// Avoid - fragile selector
await page.locator('.card-class').click();
```

## Test Plan

See [E2E_TEST_PLAN.md](/docs/testing/E2E_TEST_PLAN.md) for full test plan.
