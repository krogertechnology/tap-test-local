import { expect, type Page } from '@playwright/test';

/**
 * LoginPage — encapsulates interactions with the Kroger CIAM login page
 * hosted on login-stage.kroger.com (Azure B2C).
 *
 * Navigation flow from the homepage:
 *   1. Click the "Sign In" header button (data-testid="WelcomeButtonDesktop")
 *   2. Click the "Sign in" dropdown item (data-testid="WelcomeMenuButtonSignIn")
 *   → Browser redirects to login-stage.kroger.com
 */
export default class LoginPage {
  constructor(public page: Page) {}

  // ── Actions ──────────────────────────────────────────────────────────────

  /**
   * Click the "Sign In" button in the homepage header to open the dropdown.
   */
  async clickSignInButton() {
    await this.headerSignInButton.click();
  }

  /**
   * Click the "Sign in" item in the dropdown to navigate to the login page.
   */
  async clickSignInMenuItem() {
    await this.headerSignInMenuItem.click();
  }

  /**
   * Fill the Email Address input field.
   */
  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  /**
   * Fill the Password input field.
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
   * Full login flow: fill email, fill password, then submit.
   */
  async login(email: string, password: string) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.submitSignIn();
  }

  /**
   * Assert that the login page has loaded with the Sign In heading.
   */
  async expectLoginPageLoaded() {
    await expect(this.page).toHaveTitle(/Sign In/i);
    await expect(this.signInHeading).toBeVisible();
  }

  /**
   * Assert that the invalid-credentials error alert is visible.
   */
  async expectInvalidCredentialsError() {
    await expect(this.errorAlert).toBeVisible();
    await expect(this.errorAlert).toContainText('The email or password is incorrect');
  }

  /**
   * Assert that the page has NOT redirected away from the login domain
   * (i.e. login was unsuccessful).
   */
  async expectStillOnLoginPage() {
    await expect(this.page).toHaveURL(/login-stage\.kroger\.com/);
    await expect(this.signInHeading).toBeVisible();
  }

  // ── Locators ─────────────────────────────────────────────────────────────

  /** "Sign In" button in the main site header (data-testid="WelcomeButtonDesktop") */
  get headerSignInButton() {
    return this.page.getByTestId('WelcomeButtonDesktop');
  }

  /** "Sign in" item in the account dropdown (data-testid="WelcomeMenuButtonSignIn") */
  get headerSignInMenuItem() {
    return this.page.getByTestId('WelcomeMenuButtonSignIn');
  }

  /** Email Address text input on the CIAM login form */
  get emailInput() {
    return this.page.getByRole('textbox', { name: 'Email Address' });
  }

  /** Password text input on the CIAM login form (type="password", but ARIA role is textbox) */
  get passwordInput() {
    return this.page.getByRole('textbox', { name: 'Password' });
  }

  /** "Sign In" submit button on the CIAM login form */
  get signInButton() {
    return this.page.getByRole('button', { name: 'Sign In' });
  }

  /** "Sign In" h1 heading on the CIAM login page */
  get signInHeading() {
    return this.page.getByRole('heading', { name: 'Sign In', level: 1 });
  }

  /** ARIA alert injected after a failed login attempt */
  get errorAlert() {
    return this.page.getByRole('alert');
  }
}