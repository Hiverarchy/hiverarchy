import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;

/** Vite dev server for smoke tests (no API required for current specs). */
const webOrigin = process.env.PLAYWRIGHT_WEB_ORIGIN ?? 'http://127.0.0.1:5174';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI ? 'github' : 'list',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: webOrigin,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    ...devices['Desktop Chrome'],
  },
  webServer: {
    command: 'npm run dev:5174',
    url: webOrigin,
    /** In CI always start a fresh server so port 5174 is never stale. */
    reuseExistingServer: !isCI,
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
