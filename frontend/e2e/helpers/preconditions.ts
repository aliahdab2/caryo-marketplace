import { expect, Locator, Page } from '@playwright/test';
import { urls } from '../fixtures/test-data';

/**
 * Preconditions for the E2E suite.
 *
 * These used to be written as `if (!visible) test.skip()`. That made the suite
 * report green whenever the thing under test was missing — a deleted contact
 * button, an empty search page, or a broken seed all read as "passed". A skip
 * is only honest when the scenario genuinely does not apply; a missing element
 * is the bug the test exists to catch.
 *
 * The suite runs against a seeded environment (global-setup.ts), so the seed
 * data below is a hard requirement. If it is absent, the run should fail loudly
 * with a message that says what to fix.
 */

/**
 * Navigate to the seeded listing and assert it actually rendered.
 *
 * Fails with an explicit message rather than letting each downstream assertion
 * time out on a 404 page.
 */
export async function gotoSeededListing(page: Page): Promise<void> {
  await page.goto(urls.listing);
  await page.waitForLoadState('networkidle');

  const notFound = await page
    .getByText(/not found|404/i)
    .first()
    .isVisible()
    .catch(() => false);

  expect(
    notFound,
    `Seeded listing ${urls.listing} did not load. The E2E environment must be ` +
      `seeded (DataInitializer) before this suite runs — check global-setup.ts ` +
      `and that the backend started with data initialisation enabled.`
  ).toBe(false);

  await expect(page.locator('main')).toBeVisible({ timeout: 10000 });
}

/**
 * Assert the messages page rendered real content: either a conversation item
 * or the empty state. A blank page is a failure, whichever role is logged in.
 *
 * Returns the first conversation-item locator so callers can branch on
 * whether the account actually has conversations to open.
 */
export async function expectMessagesPageRendered(page: Page): Promise<Locator> {
  const conversation = page.getByTestId('conversation-item').first();
  const emptyState = page
    .getByText(/no messages|no conversations( yet)?|inbox empty|start a conversation/i)
    .first();

  await expect(conversation.or(emptyState)).toBeVisible({ timeout: 15000 });
  return conversation;
}

/**
 * Assert the search results page has at least one listing to work with.
 *
 * An empty marketplace is a legitimate application state but not one this
 * suite can exercise, so it is treated as a seeding failure.
 */
export async function expectSearchHasResults(page: Page) {
  const listingLink = page
    .locator('a[href*="listing"]')
    .first()
    .or(page.getByRole('link', { name: /toyota|honda|nissan|hyundai/i }).first());

  await expect(
    listingLink,
    'Search returned no listings. The E2E environment must be seeded with at ' +
      'least one approved listing before this suite runs.'
  ).toBeVisible({ timeout: 15000 });

  return listingLink;
}
