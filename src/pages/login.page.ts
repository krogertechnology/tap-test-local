import { expect, type Page } from '@playwright/test';

/**
 * LoginPage — encapsulates interactions with the Kroger CIAM login page.
 * The login page lives at login-stage.kroger.com after clicking "Sign In"
 * from the Kroger header.
 */
export default class LoginPage {
  constructor(public page: Page) {}

  // ── Actions ──────────────────────────────────────────────────────────────

  /**
   * Click the "Sign In" button in the Kroger header navigation.
   * This opens the dropdown; then clicks "Sign in" from the dropdown.
   */
  async clickSignInButton() {
    // Click the top-level "Sign In" button to open the dropdown
    await this.page.getByTestId('WelcomeButtonDesktop').click();
    // Then click "Sign in" from the dropdown list
    await this.page.getByTestId('WelcomeMenuButtonSignIn').click();
  }

  /**
   * Fill in the email address field on the login form.
   */
  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  /**
   * Fill in the password field on the login form.
   */
  async fillPassword(password: string) {
    await this.passwordInput.fill(password);
  }

  /**
   * Click the "Sign In" submit button on the login form.
   */
  async submitSignIn() {
    await this.signInButton.click();
  }

  /**
   * Full login flow: click header Sign In, fill credentials, submit.
   */
  async login(username: string, password: string) {
    await this.clickSignInButton();
    await this.fillEmail(username);
    await this.fillPassword(password);
    await this.submitSignIn();
  }

  /**
   * Assert that the user is logged in by checking for their name in the header.
   */
  async expectLoggedIn(userName: string) {
    await expect(this.page.getByRole('button', { name: new RegExp(userName, 'i') })).toBeVisible();
  }

  // ── Locators ─────────────────────────────────────────────────────────────

  /** Email address text input on the CIAM login form */
  get emailInput() {
    return this.page.getByRole('textbox', { name: 'Email Address' });
  }

  /** Password text input on the CIAM login form */
  get passwordInput() {
    return this.page.getByRole('textbox', { name: 'Password' });
  }

  /** "Sign In" submit button on the login form */
  get signInButton() {
    return this.page.getByRole('button', { name: 'Sign In' });
  }

  /** The "Sign In" header button that opens the dropdown */
  get headerSignInButton() {
    return this.page.getByTestId('WelcomeButtonDesktop');
  }
}