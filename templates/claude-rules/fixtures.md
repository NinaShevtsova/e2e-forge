---
paths:
  - "src/fixtures/**/*.ts"
---

# Fixtures

Fixtures are the injection layer: they build page objects, prepare state, and hand both to the
test. They are also the only import path a spec is allowed to use.

## Structure

**[invariant]** A fixture file declares a typed fixture map, extends a base `test`, and re-exports
`expect` so a spec needs one import line:

```ts
export type CheckoutFixtures = {
  /** JSDoc on every key — it is the only documentation a spec sees. */
  cartPage: CartPage;
};

export const test = base.extend<CheckoutFixtures>({
  cartPage: async ({ page }: { page: Page }, use) => {
    await use(new CartPage(page));
  },
});

export { expect } from '@playwright/test';
```

**[invariant]** A domain fixture extends **the project's base fixture**, not `@playwright/test`
directly. Extending the wrong thing silently drops whatever the base fixture provides — log
capture, tracing hooks, shared setup — and the loss is invisible until something fails and the
diagnostics are missing.

**[invariant]** Every page object and component is registered in a fixture.

## Setup inside a fixture

**[default]** When a screen is only reachable after authentication or another precondition,
perform that flow **inside the fixture** and wait for the landing state before handing over the
page object. The spec then reads as pure behaviour, with no setup noise:

```ts
productsPage: async ({ page }, use) => {
  const login = new LoginPage(page);
  await login.open();
  await login.login(EnvConfig.testUserEmail, EnvConfig.testUserPassword);
  await page.waitForURL(Urls.products, { waitUntil: 'domcontentloaded' });
  await use(new ProductsPage(page));
},
```

**[default]** Cross-cutting behaviour that must apply to every test — capturing console errors,
attaching diagnostics — belongs in an **auto-use fixture** in the base file, so no spec has to
remember to opt in.

**[default]** Combining fixture sets is done with Playwright's `mergeTests`, not by copying
fixture definitions between files.

## Boundaries

**[invariant]** A fixture prepares and provides. It does not assert on behaviour under test — an
assertion in a fixture fails outside any test's context and produces a confusing report.

**[invariant]** No state is shared between fixtures through module-level variables. Each test gets
its own instances.
