import { defineConfig, devices } from '@playwright/test';

// Dynamic configuration from TAP
const selectedBrowsers: string[] = JSON.parse(process.env.TAP_BROWSERS || '["chromium"]');
const workerCount = parseInt(process.env.TAP_WORKERS || '1', 10);
const testTimeout = parseInt(process.env.TAP_TIMEOUT || '30000', 10);
const testRetries = parseInt(process.env.TAP_RETRIES || '0', 10);
const actionTimeout = parseInt(process.env.TAP_ACTION_TIMEOUT || '0', 10);
const navigationTimeout = parseInt(process.env.TAP_NAVIGATION_TIMEOUT || '0', 10);
const expectTimeout = parseInt(process.env.TAP_EXPECT_TIMEOUT || '30000', 10);
const globalTimeout = parseInt(process.env.TAP_GLOBAL_TIMEOUT || '0', 10);

const browserDeviceMap: Record<string, string> = {
  chromium: 'Desktop Chrome',
  firefox: 'Desktop Firefox',
  webkit: 'Desktop Safari',
};

// "Maximize" is per-browser — there is no cross-browser flag.
//   - Chromium: launch with --start-maximized + viewport: null
//   - Firefox: launch with -width/-height (no equivalent of --start-maximized);
//     pair with a large viewport so the page reflects the window size
//   - WebKit: no launch flag for window size; the only knob is viewport. Use
//     a large explicit viewport so the rendered area is full-screen-ish.
function browserUseSettings(browser: string) {
  if (browser === 'firefox') {
    return {
      viewport: { width: 1920, height: 1080 },
      launchOptions: { args: ['-width=1920', '-height=1080'] },
    };
  }
  if (browser === 'webkit') {
    return {
      viewport: { width: 1920, height: 1080 },
      launchOptions: { args: [] },
    };
  }
  // chromium (default)
  return {
    viewport: null,
    launchOptions: { args: ['--start-maximized'] },
    // `local-network-access` is a Chromium-only permission. Firefox / WebKit
    // throw "Unknown permission: local-network-access" from browser.newContext
    // if it appears in the shared `use:` block, so we scope it per-project.
    permissions: ['local-network-access'],
  };
}

const projects = selectedBrowsers.map((browser) => ({
  name: browser,
  use: {
    ...devices[browserDeviceMap[browser] || 'Desktop Chrome'],
    deviceScaleFactor: undefined,
    ...browserUseSettings(browser),
  },
}));

export default defineConfig({
  testDir: './src/tests',
  fullyParallel: workerCount > 1,
  forbidOnly: !!process.env.CI,
  retries: testRetries,
  workers: workerCount,
  timeout: testTimeout,
  globalTimeout: globalTimeout || undefined,
  expect: {
    timeout: expectTimeout,
  },
  reporter: [
    ['json', { outputFile: 'results.json' }],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
    // TAP reporter — only loaded during TAP-managed executions (when EXECUTION_ID is set)
    ...(process.env.EXECUTION_ID ? [['./tap-reporter.ts', {
      executionId: process.env.EXECUTION_ID,
      apiUrl: process.env.TAP_API_URL,
      apiKey: process.env.TAP_API_KEY
    }] as const] : []),
  ],
  use: {
    baseURL: process.env.TAP_BASE_URL || undefined,
    ignoreHTTPSErrors: true,
    // NOTE: `permissions` is intentionally NOT set here. `local-network-access`
    // is Chromium-only and is applied per-project above; Firefox/WebKit reject
    // unknown permissions at browser.newContext time.
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    actionTimeout: actionTimeout || undefined,
    navigationTimeout: navigationTimeout || undefined,
  },
  // Ensure test artifacts are output to the default directory
  outputDir: 'test-results',
  projects,
});
