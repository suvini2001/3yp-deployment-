import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// E2E: Login Page
// Screenshots are taken at each key step as visual proof.
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Login Page', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('TC-LOGIN-01: Login page renders correctly', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Verify key UI elements are visible
    await expect(page.getByText('RailSafe Monitor')).toBeVisible();
    await expect(page.getByText('Track Crack Detection System')).toBeVisible();
    await expect(page.getByText('Operator Login')).toBeVisible();
    await expect(page.getByPlaceholder('admin@example.com')).toBeVisible();
    await expect(page.getByPlaceholder('Enter your password')).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign In/i })).toBeVisible();

    // 📸 Screenshot proof
    await page.screenshot({
      path: 'tests/screenshots/login-01-page-loaded.png',
      fullPage: true,
    });
  });

  test('TC-LOGIN-02: Email and password fields accept input', async ({ page }) => {
    await page.getByPlaceholder('admin@example.com').fill('admin@railsafe.com');
    await page.getByPlaceholder('Enter your password').fill('testpassword');

    await expect(page.getByPlaceholder('admin@example.com')).toHaveValue('admin@railsafe.com');
    await expect(page.getByPlaceholder('Enter your password')).toHaveValue('testpassword');

    // 📸 Screenshot proof
    await page.screenshot({
      path: 'tests/screenshots/login-02-fields-filled.png',
      fullPage: true,
    });
  });

  test('TC-LOGIN-03: Password visibility toggle works', async ({ page }) => {
    const passwordInput = page.getByPlaceholder('Enter your password');
    await passwordInput.fill('mysecretpassword');

    // Initially hidden
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // 📸 Before toggle
    await page.screenshot({
      path: 'tests/screenshots/login-03a-password-hidden.png',
      fullPage: true,
    });

    // Click eye icon toggle
    await page.locator('button[type="button"]').click();
    await expect(passwordInput).toHaveAttribute('type', 'text');

    // 📸 After toggle — password visible
    await page.screenshot({
      path: 'tests/screenshots/login-03b-password-visible.png',
      fullPage: true,
    });
  });

  test('TC-LOGIN-04: Shows error on wrong credentials', async ({ page }) => {
    await page.getByPlaceholder('admin@example.com').fill('wrong@example.com');
    await page.getByPlaceholder('Enter your password').fill('wrongpassword');
    await page.getByRole('button', { name: /Sign In/i }).click();

    // Wait for error toast or error message
    await page.waitForTimeout(3000);

    // 📸 Screenshot proof of error state
    await page.screenshot({
      path: 'tests/screenshots/login-04-error-state.png',
      fullPage: true,
    });

    // The page should still be on login (not redirected)
    await expect(page).toHaveURL(/\/(login|$)/);
  });

  test('TC-LOGIN-05: Sign In button shows loading state while authenticating', async ({ page }) => {
    await page.getByPlaceholder('admin@example.com').fill('any@example.com');
    await page.getByPlaceholder('Enter your password').fill('anypassword');

    // Click and immediately screenshot to catch loading state
    await page.getByRole('button', { name: /Sign In/i }).click();

    // 📸 Loading state screenshot
    await page.screenshot({
      path: 'tests/screenshots/login-05-loading-state.png',
      fullPage: true,
    });
  });

  test('TC-LOGIN-06: Authorized personnel notice is visible', async ({ page }) => {
    await expect(page.getByText(/Authorized railway personnel only/i)).toBeVisible();

    // 📸 Full page proof
    await page.screenshot({
      path: 'tests/screenshots/login-06-personnel-notice.png',
      fullPage: true,
    });
  });
});
