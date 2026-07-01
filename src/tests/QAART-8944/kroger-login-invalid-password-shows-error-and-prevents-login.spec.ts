import { test, expect } from '@playwright/test';
import { loadData } from '@utils/data-loader';
import { skipIfNotInTapFilter } from '@utils/tap-test-filter';
import KrogerLoginPage from '@pages/kroger-login.page';

type UsersData = {
  '': Record<string, string>;
};

test.describe('Kroger Login - Invalid Password Shows Error and Prevents Login', () => {

  test.beforeEach(({}, testInfo) => skipIfNotInTapFilter(testInfo));

  test('should display error and remain on login page when invalid password is entered', async ({ page }) => {
    const users = loadData<UsersData>('users.json');
    const email = 'vikram311991@gmail.com';
    const invalidPassword = 'WrongPassword999!';

    const loginPage = new KrogerLoginPage(page);

    // Step 1: Navigate to the Kroger stage login page
    // Expected: Login page is displayed — title reads "Sign In - Kroger" and Sign In heading is visible
    await loginPage.goto();
    await loginPage.expectSignInPageVisible();

    // Step 2: Enter a valid email address into the login field
    // Expected: Email field is populated with the correct email address
    await loginPage.fillEmail(email);
    await expect(loginPage.emailInput).toHaveValue(email);

    // Step 3: Enter an invalid password into the password field
    // Expected: Password field is populated with the incorrect password
    await loginPage.fillPassword(invalidPassword);
    await expect(loginPage.passwordInput).toHaveValue(invalidPassword);

    // Step 4: Click the 'Sign In' button to submit the login form
    // Expected: Login form is submitted (page stays on Sign In page)
    await loginPage.clickSignIn();

    // Step 5: Verify that the system displays an error message indicating incorrect username or password
    // Expected: Error message appears: "The email or password is incorrect. Please try again or click "Forgot password"."
    await loginPage.expectErrorMessage('The email or password is incorrect');

    // Step 6: Verify that the user is not logged in and remains on the login page
    // Expected: User stays on the login page; account dashboard or any logged-in area is not displayed
    await expect(page).toHaveTitle('Sign In - Kroger');
    await expect(loginPage.signInHeading).toBeVisible();
    await expect(page).toHaveURL(/login-stage\.kroger\.com/);
  });

});
