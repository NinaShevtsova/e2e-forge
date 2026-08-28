---
paths:
  - "src/pages/**/*.ts"
  - "src/components/**/*.ts"
  - "tests/**/*.spec.ts"
---

# Assertions

## Use web-first assertions

**[invariant]** Assert through Playwright's web-first matchers. They retry until the condition
holds or the timeout expires, which is what makes a suite stable on a live application:

`toBeVisible` · `toBeHidden` · `toBeEnabled` · `toBeDisabled` · `toBeChecked` · `toHaveText` ·
`toContainText` · `toHaveValue` · `toHaveURL` · `toHaveTitle` · `toHaveCount` · `toHaveAttribute` ·
`toHaveClass`

```ts
await expect(this.confirmation).toBeVisible();
await expect(this.page).toHaveURL(Urls.orderComplete);
await expect(this.rows).toHaveCount(3);
```

## The trap to avoid

**[invariant]** Never assert on an already-resolved value where a web-first matcher exists:

```ts
expect(await locator.isVisible()).toBe(true);   // WRONG
await expect(locator).toBeVisible();            // right
```

The first form evaluates once, at whatever instant it runs. If the element is one frame from
appearing, the test fails — and it fails intermittently, which costs far more to diagnose than an
outright failure. The second form retries.

**[default]** Asserting on data returned by a page-object getter is fine, because it is a value
check rather than a UI-state check:

```ts
expect(await cartPage.getTotal()).toContain('25.00');
```

## No manual waiting

**[invariant]** No `waitForTimeout`, no `sleep`, no polling loops. A fixed pause is either too
short (flaky) or too long (slow), and usually both across a suite. Web-first assertions already
wait.

**[invariant]** No inline timeout numbers. When a specific wait genuinely needs a longer bound,
take it from the shared timeout config so the value has one home and one name.

## Assertion placement

**[default]** Two placements coexist. UI state is asserted inside the page object via an `expect*`
method, so the knowledge of what "loaded" or "empty" looks like stays with the screen. Values are
asserted in the spec, where the expected value belongs to the scenario.
