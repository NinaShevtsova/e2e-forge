# Specs

A spec states behaviour. Every detail of how that behaviour is performed lives in a page object.

## Shape

**[invariant]** Every spec looks like this — `test` from a fixture file, page objects arriving by
destructuring, no `page`, no `new`:

```ts
import { test, expect } from '@fixtures/checkout.fixture';

test('empty cart shows a message', async ({ cartPage }) => {
  await cartPage.open();
  await cartPage.expectEmpty();
});
```

## Titles

**[invariant]** A test title states the expected behaviour, so a failure line is readable without
opening the file. Lowercase, no "should", no ticket ids:

- `add product to cart from catalog`
- `shows error for an unregistered email`

**[default]** `describe` titles group by area and by polarity: `'Checkout › Cart'` for hierarchy,
`'Login — negative'` for polarity. Separator characters are a project choice — follow whatever the
project already uses.

## Setup

**[default]** Shared navigation and preconditions go in `test.beforeEach`.

**[default]** A teardown hook is only needed for state created outside the browser — an
API-seeded record, an uploaded file. Playwright discards the browser context after every test, so
UI state needs no manual cleanup.

## Keep specs DRY

**[invariant]** If two tests repeat a sequence of steps, that sequence belongs in a page object or
component method. A multi-step flow becomes one named method — `login(email, password)` wraps
fill, fill, click.

**[invariant]** Repetition across *cases* of the same behaviour is a data-driven loop, not
copy-paste. Load the cases at module scope and build the title from the case:

```ts
for (const { email, password, scenario, expectedError } of invalidUsers) {
  test(`shows error for ${scenario}`, async ({ loginPage }) => {
    await loginPage.login(email, password);
    await loginPage.expectErrorMessage(expectedError);
  });
}
```

**[default]** Helper functions used by more than one spec live in the utils module with JSDoc, not
copied between spec files.

## Discipline

**[invariant]** One behaviour per test. A test asserting five unrelated things reports one failure
and hides the other four.

**[invariant]** No conditional assertions. An assertion inside `if` or `try` is an assertion that
can silently not run — the test then passes while verifying nothing.

**[invariant]** Never weaken or delete an assertion to make a test pass.
