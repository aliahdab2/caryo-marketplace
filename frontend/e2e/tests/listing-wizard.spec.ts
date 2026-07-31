import { test, expect, Page } from '@playwright/test';
import { loginAsTestUser, ensureLoggedOut } from '../helpers';
import { urls } from '../fixtures/test-data';

/**
 * Listing wizard E2E — walks the real 4-step wizard sequentially
 * (Vehicle Identity → Vehicle Details → Content & Media → Pricing & Contact).
 * Steps cannot be jumped to: each requires the previous one to be completed,
 * so every test walks up to the step it asserts on.
 */

/** Wait for a native select's options to load from the API, then pick the first real one */
async function selectFirstRealOption(page: Page, selector: string) {
  const el = page.locator(selector);
  await expect(el).toBeVisible({ timeout: 15000 });
  await expect
    .poll(async () => el.locator('option').count(), { timeout: 20000 })
    .toBeGreaterThan(1);
  await el.selectOption({ index: 1 });
}

async function clickNext(page: Page) {
  await page.getByRole('button', { name: /^next$/i }).first().click();
  await page.waitForTimeout(800);
}

async function openWizard(page: Page) {
  await page.goto(urls.createListing);
  await page.waitForLoadState('load');
  await expect(page.locator('#make')).toBeVisible({ timeout: 20000 });
}

async function completeStep1(page: Page) {
  await selectFirstRealOption(page, '#make');
  await selectFirstRealOption(page, '#model');
  await selectFirstRealOption(page, '#year');
  await clickNext(page);
  await expect(page.locator('#mileage')).toBeVisible({ timeout: 15000 });
}

async function completeStep2(page: Page) {
  await page.locator('#mileage').fill('50000');
  // Optional selects on this step — pick a value when present
  for (const sel of ['#transmission', '#fuelType', '#condition']) {
    const el = page.locator(sel);
    if (await el.isVisible().catch(() => false)) {
      const options = await el.locator('option').count();
      if (options > 1) await el.selectOption({ index: 1 });
    }
  }
  await clickNext(page);
  await expect(page.locator('input[name="title"]')).toBeVisible({ timeout: 15000 });
}

async function completeStep3(page: Page) {
  await page.locator('input[name="title"]').fill('E2E Test Car Listing');
  await page
    .locator('textarea[name="description"]')
    .fill('Automated end-to-end test listing description with enough detail to satisfy validation rules.');
  // Step 3 requires at least one image (step3Schema refine) — target the
  // image input specifically; a separate video input also exists
  await page
    .locator('input[type="file"][accept="image/*"]')
    .setInputFiles('e2e/fixtures/test-car.png');
  // the preview grid renders a per-image remove button once the file registers
  await expect(page.getByRole('button', { name: /remove image 1/i })).toBeVisible({ timeout: 15000 });
  await clickNext(page);
  // UX quirk worth a product look: the first Next click right after image
  // processing is sometimes swallowed even though validation passes
  if (!(await page.locator('#price').isVisible().catch(() => false))) {
    await clickNext(page);
  }
  await expect(page.locator('#price')).toBeVisible({ timeout: 15000 });
}

test.describe('Listing Wizard', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedOut(page);
  });

  test.describe('LISTING-001: Access Create Listing', () => {
    test('can access create listing page when logged in', async ({ page }) => {
      await loginAsTestUser(page);
      await openWizard(page);

      await expect(page).toHaveURL(/new|create/);
      await expect(page.getByText(/vehicle identity/i).first()).toBeVisible();
    });

    test('redirects to login when not authenticated', async ({ page }) => {
      await page.goto(urls.createListing);
      await expect(page).toHaveURL(/signin|login/);
    });
  });

  test.describe('LISTING-002: Step 1 - Vehicle Identity', () => {
    test('shows make, model, year fields', async ({ page }) => {
      await loginAsTestUser(page);
      await openWizard(page);

      await expect(page.locator('#make')).toBeVisible();
      await expect(page.locator('#model')).toBeVisible();
      await expect(page.locator('#year')).toBeVisible();
    });

    test('selecting a make populates models', async ({ page }) => {
      await loginAsTestUser(page);
      await openWizard(page);

      await selectFirstRealOption(page, '#make');
      // model options load after the make is chosen
      await expect
        .poll(async () => page.locator('#model option').count(), { timeout: 20000 })
        .toBeGreaterThan(1);
    });

    test('completing step 1 advances to vehicle details', async ({ page }) => {
      test.setTimeout(60000);
      await loginAsTestUser(page);
      await openWizard(page);

      await completeStep1(page);
      await expect(page.getByText(/step 2 of 4/i).first()).toBeVisible();
    });
  });

  test.describe('LISTING-003: Step 2 - Vehicle Details', () => {
    test('step 2 shows vehicle details fields', async ({ page }) => {
      test.setTimeout(60000);
      await loginAsTestUser(page);
      await openWizard(page);
      await completeStep1(page);

      await expect(page.locator('#mileage')).toBeVisible();
      await expect(page.locator('#transmission').or(page.locator('#fuelType')).first()).toBeVisible();
    });
  });

  test.describe('LISTING-004: Step 3 - Description & Media', () => {
    test('step 3 shows title, description, and image upload', async ({ page }) => {
      test.setTimeout(90000);
      await loginAsTestUser(page);
      await openWizard(page);
      await completeStep1(page);
      await completeStep2(page);

      await expect(page.locator('input[name="title"]')).toBeVisible();
      await expect(page.locator('textarea[name="description"]')).toBeVisible();
      // The file input hides behind a styled dropzone — DOM presence is the check
      expect(await page.locator('input[type="file"]').count()).toBeGreaterThan(0);
    });
  });

  test.describe('LISTING-005: Step 4 - Pricing & Contact', () => {
    test('step 4 shows price field and submit button', async ({ page }) => {
      test.setTimeout(120000);
      await loginAsTestUser(page);
      await openWizard(page);
      await completeStep1(page);
      await completeStep2(page);
      await completeStep3(page);

      await expect(page.locator('#price')).toBeVisible();
      await expect(
        page.getByRole('button', { name: /submit|publish|create listing/i }).first()
      ).toBeVisible();
    });
  });

  test.describe('LISTING-006: Navigation', () => {
    test('can navigate back to previous step', async ({ page }) => {
      test.setTimeout(60000);
      await loginAsTestUser(page);
      await openWizard(page);
      await completeStep1(page);

      const backButton = page.getByRole('button', { name: /back|previous/i }).first();
      await expect(backButton).toBeVisible();
      await backButton.click();
      await expect(page.locator('#make')).toBeVisible({ timeout: 10000 });
    });

    test('step indicators show progress', async ({ page }) => {
      await loginAsTestUser(page);
      await openWizard(page);

      await expect(page.getByText(/step 1 of 4/i).first()).toBeVisible();
    });
  });

  test.describe('LISTING-007: Validation', () => {
    test('empty step 1 does not advance', async ({ page }) => {
      await loginAsTestUser(page);
      await openWizard(page);

      await clickNext(page);
      // Still on step 1: make select remains, step 2's mileage does not appear
      await expect(page.locator('#make')).toBeVisible();
      await expect(page.locator('#mileage')).not.toBeVisible();
    });
  });

  test.describe('LISTING-008: Auto-save (Draft)', () => {
    test('shows auto-save indicator', async ({ page }) => {
      await loginAsTestUser(page);
      await openWizard(page);

      // ListingWizard renders the indicator on the create route (autoSave
      // defaults to true) — its disappearance is a regression
      await expect(page.getByText(/saving|saved|draft/i).first()).toBeVisible({ timeout: 15000 });
    });
  });
});
