// path: playwright.config.ts

import { defineConfig, devices } from '@playwright/test';
import { EnvConfig } from './src/config/env.config';
import { TestConfig } from './src/config/test.config';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,

  reporter: [
    ['html', { outputFolder: 'reports/html', open: 'never' }],
    ['json', { outputFile: 'reports/test-results/results.json' }],
    ['list'],
  ],

  use: {
    baseURL: EnvConfig.baseUrl,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    headless: true,
    actionTimeout: TestConfig.timeouts.action,
    navigationTimeout: TestConfig.timeouts.navigation,
  },

  // Chromium only: fastest engine, most stable, and the one Playwright's
  // tooling targets first. Add another project only when a real requirement
  // calls for cross-browser coverage.
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: TestConfig.viewport },
    },
  ],

  outputDir: 'reports/test-results',
});
