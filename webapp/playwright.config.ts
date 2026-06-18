import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration
 * Screenshots are saved to tests/screenshots/ after each test step.
 * HTML report is generated at playwright-report/index.html
 *
 * Run: npm run test:e2e
 * View report: npm run test:e2e:report
 */
export default defineConfig({
  // All E2E test files live here
  testDir: './tests/e2e',

  // Timeout per test
  timeout: 30_000,

  // Retry once on failure (for flaky network/render)
  retries: 1,

  // Run tests in parallel
  workers: 2,

  // Reporter: HTML (with screenshots) + console summary
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],

  use: {
    // Dev server URL
    baseURL: 'http://localhost:5173/e21-3yp-RAID/webapp',

    // Always take screenshot on test failure
    screenshot: 'on',

    // Record video on failure
    video: 'on-first-retry',

    // Trace on failure (helps debug)
    trace: 'on-first-retry',

    // Browser viewport — mobile-first since your app uses BottomNav
    viewport: { width: 390, height: 844 },
  },

  // Browser projects
  projects: [
    {
      name: 'Chromium Desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5'],
      },
    },
  ],

  // Screenshot output dir for our manual screenshots
  outputDir: 'tests/test-results',

//   // Start the dev server automatically before E2E tests run
//   webServer: {
//     command: 'npm run dev',
//     url: 'http://localhost:5173/e21-3yp-RAID/webapp',
//     reuseExistingServer: true,
//     timeout: 120_000,
//   },
// 
}
);
