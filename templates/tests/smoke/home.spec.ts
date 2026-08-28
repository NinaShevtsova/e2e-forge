// path: tests/smoke/home.spec.ts

import { test } from '@fixtures/base.fixture';

/**
 * First smoke test, created during framework setup.
 * Its job is to prove the whole chain works: config → fixture → page object →
 * live application. If this passes, the scaffold is sound.
 */
test.describe('Smoke › Home', () => {
  test('landing page loads', async ({ homePage }) => {
    await homePage.open();
    await homePage.isLoaded();
  });
});
