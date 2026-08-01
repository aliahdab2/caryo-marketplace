import { test, expect } from '@playwright/test';
import { loginAsTestUser, loginAsDealer, ensureLoggedOut, gotoSeededListing } from '../helpers';
import { urls, testMessage } from '../fixtures/test-data';

/**
 * These tests previously bailed out with `test.skip()` whenever the element
 * under test was not visible — a missing contact button, a modal that never
 * opened, a listing that 404'd. That made a broken messaging flow indis-
 * tinguishable from a passing one. Every such branch is now an assertion.
 *
 * The contact button is rendered unconditionally by SellerInfo, so "hidden
 * because it's your own listing" was never a real case.
 */
test.describe('Messaging', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedOut(page);
  });

  test.describe('MSG-001: Contact Seller', () => {
    test('contact seller button visible on listing', async ({ page }) => {
      await loginAsTestUser(page);
      await gotoSeededListing(page);

      await expect(page.getByTestId('contact-seller-button')).toBeVisible({ timeout: 10000 });
    });

    test('can open message form', async ({ page }) => {
      await loginAsTestUser(page);
      await gotoSeededListing(page);

      await page.getByTestId('contact-seller-button').click();

      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible({ timeout: 10000 });
      await expect(modal.locator('textarea')).toBeVisible({ timeout: 5000 });
    });

    test('can type and send message', async ({ page }) => {
      test.setTimeout(60000);

      await loginAsTestUser(page);
      await gotoSeededListing(page);

      await page.getByTestId('contact-seller-button').click();

      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible({ timeout: 10000 });

      const messageInput = modal.locator('textarea');
      await expect(messageInput).toBeVisible({ timeout: 5000 });
      await messageInput.fill(testMessage.content);

      const sendButton = modal.getByRole('button', { name: /send/i }).first();
      await expect(sendButton).toBeEnabled({ timeout: 5000 });
      await sendButton.click();

      // Sending must succeed: either the modal closes or success is confirmed.
      // An error message is a failure, not an acceptable outcome — the previous
      // version accepted it, so a permanently broken send still passed.
      const errorShown = page.getByText(/error|failed/i).first();
      await expect(errorShown).toBeHidden({ timeout: 10000 });

      await expect
        .poll(
          async () => {
            const modalGone = !(await modal.isVisible().catch(() => true));
            const successShown = await page
              .getByText(/sent|success|delivered/i)
              .first()
              .isVisible()
              .catch(() => false);
            return modalGone || successShown;
          },
          {
            timeout: 10000,
            message: 'Message send neither closed the dialog nor confirmed success',
          }
        )
        .toBe(true);
    });
  });

  test.describe('MSG-002: Messages Page', () => {
    test('can access messages page', async ({ page }) => {
      await loginAsDealer(page);
      await page.goto(urls.messages);

      await expect(page).toHaveURL(/leads|message/);
    });

    test('shows conversations or empty state', async ({ page }) => {
      await loginAsDealer(page);
      await page.goto(urls.messages);
      await page.waitForLoadState('load');
      await page.waitForTimeout(2000);

      // Either state is legitimate, but the page must render one of them —
      // a blank page is a failure.
      const conversations = page.getByTestId('conversation-item').first();
      const emptyState = page
        .getByText(/no messages|no conversations( yet)?|inbox empty|start a conversation/i)
        .first();

      await expect(conversations.or(emptyState)).toBeVisible({ timeout: 15000 });
    });

    test('opening a conversation shows the message thread', async ({ page }) => {
      await loginAsDealer(page);
      await page.goto(urls.messages);
      await page.waitForLoadState('load');
      await page.waitForTimeout(2000);

      const conversation = page.getByTestId('conversation-item').first();
      const emptyState = page
        .getByText(/no messages|no conversations( yet)?|inbox empty|start a conversation/i)
        .first();
      await expect(conversation.or(emptyState)).toBeVisible({ timeout: 15000 });

      // A test account with no conversations cannot exercise this flow. That is
      // a genuinely inapplicable scenario, so skipping is honest here — unlike
      // skipping because an element failed to render.
      const hasConversation = await conversation.isVisible().catch(() => false);
      test.skip(!hasConversation, 'Test account has no conversations to open');

      await conversation.click();

      // Previously `expect(hasMessageArea || true).toBe(true)` — a tautology
      // that could never fail.
      await expect(page.getByRole('textbox').first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('MSG-003: Unauthenticated Access', () => {
    test('messages page requires authentication', async ({ page }) => {
      await page.goto(urls.messages);
      await page.waitForLoadState('load');
      await page.waitForTimeout(2000);

      const redirectedToAuth = /signin|login|auth/.test(page.url());
      if (redirectedToAuth) return;

      const signInLink = page.getByRole('link', { name: /sign in|login/i }).first();
      const signInButton = page.getByRole('button', { name: /sign in|login/i }).first();
      await expect(signInLink.or(signInButton)).toBeVisible({ timeout: 10000 });
    });

    test('contact seller prompts login for unauthenticated user', async ({ page }) => {
      await gotoSeededListing(page);

      await page.getByTestId('contact-seller-button').click();

      // Must gate the anonymous user: either a sign-in prompt appears or the
      // browser lands on the sign-in page. Neither happening means anonymous
      // users can message sellers — exactly the regression worth catching, and
      // exactly what the old `test.skip()` swallowed.
      const dialog = page.locator('[role="dialog"]');
      const signInButton = page.getByRole('button', { name: /sign in/i }).first();

      const gated = await Promise.race([
        dialog
          .waitFor({ state: 'visible', timeout: 10000 })
          .then(() => true)
          .catch(() => false),
        signInButton
          .waitFor({ state: 'visible', timeout: 10000 })
          .then(() => true)
          .catch(() => false),
        page
          .waitForURL(/signin|login|auth/, { timeout: 10000 })
          .then(() => true)
          .catch(() => false),
      ]);

      expect(gated, 'Anonymous user was not prompted to sign in before messaging').toBe(true);
    });
  });

  test.describe('MSG-004: Message Validation', () => {
    test('cannot send empty message', async ({ page }) => {
      await loginAsTestUser(page);
      await gotoSeededListing(page);

      await page.getByTestId('contact-seller-button').click();

      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible({ timeout: 10000 });

      const sendButton = modal.getByRole('button', { name: /send/i }).first();
      await expect(sendButton).toBeVisible({ timeout: 5000 });

      // The modal prefills a default message; clear it so the empty case is
      // actually exercised. An empty message must disable the send button.
      // Under load, a clear() that lands before React hydrates never reaches
      // component state — retry until the disabled state actually follows.
      await expect(async () => {
        await modal.locator('textarea').clear();
        await expect(sendButton).toBeDisabled({ timeout: 1000 });
      }).toPass({ timeout: 15000 });
    });
  });
});
