import { expect, type Page } from '@playwright/test';

export default class KrogerLoginPage {
  constructor(public page: Page) {}

  // ---- Locators ----

  get emailInput() {
    return this.page.getByRole('textbox', { name: 'Email Address' });
  }

  get passwordInput() {
    return this.page.getByRole('textbox', { name: 'Password' });
  }

  get signInButton() {
    return this.page.getByRole('button', { name: 'Sign In' });
  }

  get errorAlert() {
    return this.page.getByRole('alert');
  }

  get signInHeading() {
    return this.page.getByRole('heading', { name: 'Sign In', level: 1 });
  }

  // ---- Actions ----

  async goto() {
    await this.page.goto('/signin');
  }

  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  async fillPassword(password: string) {
    await this.passwordInput.fill(password);
  }

  async clickSignIn() {
    await this.signInButton.click();
  }

  async expectSignInPageVisible() {
    await expect(this.page).toHaveTitle('Sign In - Kroger');
    await expect(this.signInHeading).toBeVisible();
  }

  async expectErrorMessage(text: string) {
    await expect(this.errorAlert).toBeVisible();
    await expect(this.errorAlert).toContainText(text);
  }
}