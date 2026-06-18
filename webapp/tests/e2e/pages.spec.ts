import { test, expect, type Page } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// Auth helper — bypasses Supabase login by injecting a mock session into
// localStorage so protected pages load without real credentials.
// ─────────────────────────────────────────────────────────────────────────────
async function injectMockSession(page: Page) {
  await page.addInitScript(() => {
    // Fake Supabase session key (matches the format Supabase uses)
    const mockSession = {
      access_token: 'mock-access-token-for-testing',
      refresh_token: 'mock-refresh-token',
      expires_in: 3600,
      token_type: 'bearer',
      user: {
        id: 'test-user-id',
        email: 'admin@railsafe.com',
        role: 'authenticated',
      },
    };
    // Supabase stores session under this key pattern
    const supabaseKey = Object.keys(localStorage).find(k => k.startsWith('sb-'));
    if (supabaseKey) {
      localStorage.setItem(supabaseKey, JSON.stringify({ currentSession: mockSession }));
    }
    // Also set the adminToken used in the app
    localStorage.setItem('adminToken', mockSession.access_token);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// E2E: Dashboard Page
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockSession(page);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('TC-DASH-01: Dashboard page loads and renders', async ({ page }) => {
    // 📸 Screenshot proof of dashboard loading
    await page.screenshot({
      path: 'tests/screenshots/dashboard-01-loaded.png',
      fullPage: true,
    });

    // Check page has content (not a blank/error page)
    const body = page.locator('body');
    await expect(body).not.toBeEmpty();
  });

  test('TC-DASH-02: Page title is visible', async ({ page }) => {
    // The Dashboard should have some recognizable heading
    const heading = page.locator('h1, h2, h3').first();
    await expect(heading).toBeVisible();

    // 📸 Screenshot proof
    await page.screenshot({
      path: 'tests/screenshots/dashboard-02-heading.png',
      fullPage: true,
    });
  });

  test('TC-DASH-03: Bottom navigation is present', async ({ page }) => {
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();

    // 📸 Screenshot showing nav bar
    await page.screenshot({
      path: 'tests/screenshots/dashboard-03-bottom-nav.png',
      fullPage: true,
    });
  });

  test('TC-DASH-04: Page does not show 404 error', async ({ page }) => {
    await expect(page.getByText('404')).not.toBeVisible();
    await expect(page.getByText('Page not found')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// E2E: Map Page
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Map Page', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockSession(page);
    await page.goto('/map');
    await page.waitForLoadState('networkidle');
  });

  test('TC-MAP-01: Map page loads without crashing', async ({ page }) => {
    // 📸 Screenshot proof
    await page.screenshot({
      path: 'tests/screenshots/map-01-loaded.png',
      fullPage: true,
    });
    const body = page.locator('body');
    await expect(body).not.toBeEmpty();
  });

  test('TC-MAP-02: Map page does not show 404', async ({ page }) => {
    await expect(page.getByText('Page not found')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// E2E: Reports Page
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Reports Page', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockSession(page);
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');
  });

  test('TC-RPT-01: Reports page loads successfully', async ({ page }) => {
    // 📸 Screenshot proof
    await page.screenshot({
      path: 'tests/screenshots/reports-01-loaded.png',
      fullPage: true,
    });
    const body = page.locator('body');
    await expect(body).not.toBeEmpty();
  });

  test('TC-RPT-02: Reports page has a heading', async ({ page }) => {
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();

    // 📸 Screenshot proof
    await page.screenshot({
      path: 'tests/screenshots/reports-02-heading.png',
      fullPage: true,
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// E2E: NotFound / 404 Page
// ─────────────────────────────────────────────────────────────────────────────

test.describe('404 Not Found Page', () => {
  test('TC-404-01: Navigating to unknown route shows 404', async ({ page }) => {
    await page.goto('/this-route-does-not-exist');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
    await expect(page.getByText(/Page not found/i)).toBeVisible();

    // 📸 Screenshot proof
    await page.screenshot({
      path: 'tests/screenshots/404-01-not-found-page.png',
      fullPage: true,
    });
  });

  test('TC-404-02: Return to Home link is clickable', async ({ page }) => {
    await page.goto('/this-route-does-not-exist');
    const link = page.getByRole('link', { name: /Return to Home/i });
    await expect(link).toBeVisible();

    // 📸 Screenshot proof
    await page.screenshot({
      path: 'tests/screenshots/404-02-home-link.png',
      fullPage: true,
    });
  });
});
