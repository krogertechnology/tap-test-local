import { defineConfig, devices } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// The package is `"type": "module"`, so CommonJS `__dirname` is undefined.
// Derive an ESM-safe equivalent from `import.meta.url` so the path
// computations below work under Node ESM (GitHub Actions runner).
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// ---------------------------------------------------------------------------
// TAP_TEST_FILTER — manifest-driven, group-based selection.
//
// TAP writes a JSON manifest into the workspace at the path given by
// $TAP_TEST_FILTER. The manifest is an array of {file, title?, testCaseId}.
//
//   - `testIgnore` (file-level): every spec file that isn't in the manifest
//     is skipped before Playwright even loads it. This is O(file count) and
//     scales to 1000+ specs because Playwright never imports the excluded
//     files.
//
//   - `tap-test-filter.ts` (test-level): `skipIfNotInTapFilter()` runs in
//     each spec's `test.beforeEach` and skips individual `test()` blocks
//     whose title isn't in the manifest. O(1) per test (Set lookup).
//
// When `$TAP_TEST_FILTER` is unset (developer running `npx playwright test`
// locally), both filters short-circuit and every test runs as before.
// ---------------------------------------------------------------------------
const TEST_DIR = path.resolve(__dirname, 'src/tests');

function loadTapFilter(): { files: Set<string> } | null {
  const filterPath = process.env.TAP_TEST_FILTER;
  if (!filterPath) return null;

  try {
    const raw = fs.readFileSync(filterPath, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      console.warn(`[TAP] TAP_TEST_FILTER at ${filterPath} is not a JSON array — running all tests`);
      return null;
    }
    const files = new Set<string>();
    for (const entry of parsed) {
      if (entry && typeof entry.file === 'string' && entry.file.length > 0) {
        // Normalise to POSIX-style relative path; testIgnore matches the path
        // as Playwright reports it.
        files.add(entry.file.replace(/\\/g, '/'));
      }
    }
    console.log(
      `[TAP] TAP_TEST_FILTER active — ${files.size} spec file(s), ${parsed.length} test(s)`,
    );
    return { files };
  } catch (err) {
    console.warn(`[TAP] Failed to read TAP_TEST_FILTER at ${filterPath}: ${(err as Error).message}`);
    return null;
  }
}

const tapFilter = loadTapFilter();

/**
 * testIgnore predicate. Returns true when the given absolute spec path is
 * NOT listed in the manifest, so Playwright skips loading the file entirely.
 *
 * Without a filter, returns false (don't ignore anything).
 */
function shouldIgnoreSpec(testPath: string): boolean {
  if (!tapFilter) return false;

  // Compute the spec path relative to the test root and normalise separators.
  let rel = path.relative(TEST_DIR, testPath).replace(/\\/g, '/');
  // The manifest may store paths rooted at the repo (e.g. 'src/tests/foo.spec.ts')
  // OR rooted at testDir (e.g. 'foo.spec.ts'). Accept either; check both forms.
  const rootedAtRepo = path
    .relative(path.resolve(__dirname), testPath)
    .replace(/\\/g, '/');

  if (tapFilter.files.has(rel)) return false;
  if (tapFilter.files.has(rootedAtRepo)) return false;
  return true;
}

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
  // File-level filter — Playwright will not even load specs that aren't in
  // the TAP manifest. Always-on when TAP_TEST_FILTER is set; otherwise the
  // predicate returns false and every file runs.
  testIgnore: shouldIgnoreSpec,
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
