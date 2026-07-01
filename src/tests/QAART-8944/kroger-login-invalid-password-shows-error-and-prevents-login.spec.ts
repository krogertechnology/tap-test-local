import { test, expect } from '@playwright/test';
import { loadData } from '@utils/data-loader';
import { skipIfNotInTapFilter } from '@utils/tap-test-filter';
import LoginPage from '@pages/login.page';

/**
 * users.json shape:
 * {
 *   "": {
 *     "vikram311991@gmail.com": "ENV:VIKRAM311991_GMAIL_COM"
 *   }
 * }
 */
interface UsersData {
  '': Record<string, string>;
}

test.describe('Kroger Login - Invalid Password Shows Error and Prevents Login', () => {
  test.beforeEach(({ }, testInfo) => skipIfNotInTapFilter(testInfo));

  test('Invalid password shows error and prevents login', async ({ page }) => {
    // ── Load credentials from users.json ────────────────────────────────────
    const users = loadData<UsersData>('users.json');
    const email = 'vikram311991@gmail.com';
    // Deliberately use an incorrect password — not the real one from users.json
    const invalidPassword = 'WrongPassword999!';

    const loginPage = new LoginPage(page);

    // ── Step 1: Navigate to the Kroger stage login page ──────────────────────
    // Action: Go to homepage, click Sign In header button, then click dropdown Sign in item.
    // Expected: Login page is displayed with heading "Sign In" and form fields.
    await page.goto('/');
    await loginPage.clickSignInButton();
    await loginPage.clickSignInMenuItem();

    // Verify we are now on the CIAM login page
    await expect(page).toHaveTitle(/Sign In/i);
    await expect(loginPage.signInHeading).toBeVisible();

    // ── Step 2: Enter a valid email address into the login field ─────────────
    // Action: Fill the Email Address field with the registered user's email.
    // Expected: Email field is populated with the correct email address.
    await loginPage.fillEmail(email);

    await expect(loginPage.emailInput).toHaveValue(email);

    // ── Step 3: Enter an invalid password into the password field ────────────
    // Action: Fill the Password field with an incorrect password.
    // Expected: Password field is populated (displayed as masked dots in the UI).
    await loginPage.fillPassword(invalidPassword);

    // Confirm the field has a non-empty value (masked, but filled)
    await expect(loginPage.passwordInput).not.toHaveValue('');
    // Confirm the underlying input type is "password" (masked display)
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');

    // ── Step 4: Click the 'Sign In' button to submit the login form ──────────
    // Action: Click the Sign In submit button.
    // Expected: Login form is submitted and the server responds.
    await loginPage.submitSignIn();

    // ── Step 5: Verify error message is displayed ────────────────────────────
    // Action: (Observation only) — verify the ARIA alert is injected after failed login.
    // Expected: Error message states credentials are incorrect.
    await expect(loginPage.errorAlert).toBeVisible();
    await expect(loginPage.errorAlert).toContainText(
      'The email or password is incorrect'
    );

    // ── Step 6: Verify the user is not logged in and remains on the login page ─
    // Action: (Observation only) — verify the URL and heading confirm the login page persists.
    // Expected: User stays on the login page; no redirect to account dashboard.
    await expect(page).toHaveURL(/login-stage\.kroger\.com/);
    await expect(loginPage.signInHeading).toBeVisible();
    // Confirm no logged-in account areas are visible
    await expect(
      page.getByRole('heading', { name: /dashboard|my account|welcome/i })
    ).not.toBeVisible();
  });
});
