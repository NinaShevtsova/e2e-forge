# Page objects

A page object encapsulates one screen: how to reach it, how to act on it, how to read from it, and
how to prove it loaded.

## Before creating one

**[invariant]** Check whether it already exists — search the pages folder and the fixture files.
Extend the existing class with the missing method rather than introducing a second page object for
the same screen. One screen, one class.

## Contract

**[invariant]** Extends the framework's abstract base class, which supplies `page`, `logger`,
navigation helpers and wait helpers.

**[invariant]** Declares no constructor of its own — the base class already takes `page` and builds
the logger.

**[invariant]** Locators are **private getters**; parameterised locators are **private methods**
returning `Locator`. A locator is never public and never returned from a method.

**[invariant]** Implements `isLoaded(): Promise<void>`, asserting on the elements that prove the
screen rendered. This is the readiness contract every fixture and spec relies on.

**[invariant]** A readiness locator must identify *this* page, not the site. The obvious
candidate — the site name, the header logo, the navbar brand — usually appears on every page, so
an `isLoaded()` built on it passes anywhere and proves nothing. The test stays green while
verifying only that the browser is somewhere on the application.

Before using an element as proof of readiness, count it on this page **and on a different page of
the same application**:

```ts
// on the target page
await page.getByRole('link', { name: 'Categories' }).count();   // 1
// on any other page of the same app
await page.getByRole('link', { name: 'Categories' }).count();   // 0 — good, it identifies
```

A match on both pages means the element is site-wide. Pick another. This check costs one script
and catches a defect that no amount of reading the markup reveals: the wrong choice looks
perfectly reasonable and its test passes.

**[invariant]** Navigates through the URL map, never a literal URL:

```ts
async open(): Promise<void> {
  await this.goto(Urls.checkout);
}
```

**[default]** Logs every state-changing action; getters and assertions stay silent:

```ts
async addToCart(name: string): Promise<void> {
  this.logger.info(`Adding to cart: ${name}`);
  await this.addToCartButton(name).click();
}
```

## Method contracts

**[invariant]** The prefix states what the method does and what it returns:

| Prefix | Returns | Purpose |
|---|---|---|
| verb — `open`, `addToCart`, `submit` | `Promise<void>` | Perform an action |
| `get*` | `Promise<string \| string[] \| number>` | Return plain data — never a `Locator` |
| `expect*` | `Promise<void>` | Assert internally |
| `isLoaded` | `Promise<void>` | Readiness contract |

**[default]** Both assertion styles are legitimate and coexist: a page object may assert internally
(`await cartPage.expectEmpty()`), and a spec may assert on returned data
(`expect(await cartPage.getTotal()).toContain('25.00')`). Use the first for UI state, the second
for values.

## File structure

**[default]** Group members with section separators in this order:

```ts
// ─── Locators ────────────────────────────────────────────────────────────────
// ─── Actions ─────────────────────────────────────────────────────────────────
// ─── Getters ─────────────────────────────────────────────────────────────────
// ─── Assertions ──────────────────────────────────────────────────────────────
```

**[invariant]** Every new page object is registered in a fixture. A page object no fixture exposes
cannot be reached from a test and is dead code.
