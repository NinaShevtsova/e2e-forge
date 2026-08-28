// path: src/fixtures/base.fixture.ts

import { test as base, Page, TestInfo } from '@playwright/test';
import { HomePage } from '@pages/home.page';

/**
 * Fixtures available to every spec.
 * Import `test` and `expect` from this file instead of from @playwright/test.
 *
 * Register each new page object here — a page object no fixture exposes cannot
 * be reached from a test.
 */
export type BaseFixtures = {
  /** Auto-use fixture: attaches browser console errors and failed responses to the report. */
  logCapture: void;
  /** Pre-instantiated HomePage bound to the current page */
  homePage: HomePage;
};

export const test = base.extend<BaseFixtures>({
  logCapture: [
    async ({ page }: { page: Page }, use: () => Promise<void>, testInfo: TestInfo) => {
      const consoleLogs: string[] = [];
      const networkErrors: string[] = [];

      page.on('console', (msg) => {
        const type = msg.type();
        if (type === 'error' || type === 'warning') {
          consoleLogs.push(`[${type.toUpperCase()}] ${msg.text()}`);
        }
      });

      page.on('response', (response) => {
        if (response.status() >= 400) {
          networkErrors.push(
            `[${response.status()}] ${response.request().method()} ${response.url()}`,
          );
        }
      });

      await use();

      if (consoleLogs.length > 0 || networkErrors.length > 0) {
        const sections: string[] = [];
        if (consoleLogs.length > 0) {
          sections.push(`=== BROWSER CONSOLE ERRORS/WARNINGS ===\n${consoleLogs.join('\n')}`);
        }
        if (networkErrors.length > 0) {
          sections.push(`=== NETWORK ERRORS (4xx/5xx) ===\n${networkErrors.join('\n')}`);
        }
        await testInfo.attach('browser-logs', {
          body: sections.join('\n\n'),
          contentType: 'text/plain',
        });
      }
    },
    { auto: true },
  ],

  homePage: async ({ page }: { page: Page }, use: (p: HomePage) => Promise<void>) => {
    await use(new HomePage(page));
  },
});

export { expect } from '@playwright/test';
