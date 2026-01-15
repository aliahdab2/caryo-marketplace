import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for Sign In Page
 * Encapsulates all selectors and actions for the sign-in page
 */
export class SignInPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly forgotPasswordLink: Locator;
  readonly signUpLink: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.getByLabel(/username or email/i);
    this.passwordInput = page.locator('#password');
    this.submitButton = page.locator('form button[type="submit"]');
    this.forgotPasswordLink = page.getByRole('link', { name: /forgot|reset/i });
    this.signUpLink = page.getByRole('link', { name: /sign up|register|create account/i });
    this.errorMessage = page.getByRole('alert').or(page.getByText(/invalid|incorrect|failed|error/i));
  }

  async goto() {
    await this.page.goto('/auth/signin');
    await expect(this.usernameInput).toBeVisible();
  }

  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async expectError() {
    await expect(this.errorMessage).toBeVisible({ timeout: 15000 });
  }

  async expectSuccess() {
    await expect(this.page).toHaveURL(/dashboard|\/[a-z]{2}\/?$/);
  }

  async goToForgotPassword() {
    await this.forgotPasswordLink.click();
    await expect(this.page).toHaveURL(/forgot/);
  }

  async goToSignUp() {
    await this.signUpLink.click();
    await expect(this.page).toHaveURL(/signup|register/);
  }
}
