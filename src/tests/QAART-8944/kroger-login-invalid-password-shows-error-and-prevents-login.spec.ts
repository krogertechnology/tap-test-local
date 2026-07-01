import { test, expect } from '@playwright/test';
import LoginPage from '@pages/login.page';
import { loadData } from '@utils/data-loader';

/**
 * The users.json shape is:
 * {
 *   "": {
 *     "vikram311991@gmail.com": "<resolved-password>"
 *   }
 * }
 */
interface UsersJson {
  [group: string]: {
    [email: string]: string;
  };
}

test.describe('Kroger Login - Invalid Password Shows Error and Prevents Login', () => {
  test('should display error message and remain on login page when invalid password is entered', async ({ page }) => {
    // Load test data from users.json
    const usersData = loadData<UsersJson>('users.json');
    const userEmail = 'vikram311991@gmail.com';

    // The invalid password — intentionally NOT the real password
    const invalidPassword = 'WrongPassword999!';

    const loginPage = new LoginPage(page);

    // Step 1: Navigate to the Kroger stage login page
    // Expected: Login page is displayed (login-stage.kroger.com with "Sign In" H1)
    await page.goto('/');
    await loginPage.clickSignInButton();
    await expect(page).toHaveURL(/login-stage\.kroger\.com/);
    await expect(loginPage.signInHeading).toBeVisible();

    // Step 2: Enter a valid email address into the login field
    // Expected: Email field is populated with the correct email address
    await loginPage.fillEmail(userEmail);
    await expect(loginPage.emailInput).toHaveValue(userEmail);

    // Step 3: Enter an invalid password into the password field
    // Expected: Password field is populated with the incorrect password
    await loginPage.fillPassword(invalidPassword);
    await expect(loginPage.passwordInput).toHaveValue(invalidPassword);

    // Step 4: Click the 'Sign In' button to submit the login form
    // Expected: Login form is submitted (network request sent to CIAM identity provider)
    await loginPage.submitSignIn();

    // Step 5: Verify that the system displays an error message indicating incorrect credentials
    // Expected: Error message appears: 'The email or password is incorrect. Please try again or click "Forgot password".'
    await expect(loginPage.errorAlert).toBeVisible();
    await expect(loginPage.errorAlert).toHaveText(
      'The email or password is incorrect. Please try again or click "Forgot password".'
    );

    // Step 6: Verify that the user is not logged in and remains on the login page
    // Expected: User stays on login-stage.kroger.com; account dashboard is not displayed
    await expect(page).toHaveURL(/login-stage\.kroger\.com/);
    await expect(loginPage.signInHeading).toBeVisible();
  });
});
