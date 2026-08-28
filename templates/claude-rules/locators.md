---
paths:
  - "src/pages/**/*.ts"
  - "src/components/**/*.ts"
---

# Locators

A locator should describe what a user perceives, not how the markup happens to be arranged today.
Markup changes with every redesign; roles and labels do not.

## CSS selectors are forbidden

**[invariant]** No CSS selectors. Not class-based, not structural, not "just this once".

Never write:

- class-based — `.item-list > div`, `span.title-bold`, `.panel-body`
- structural — `+ input`, `> div`, `:nth-child()`, `locator('..')`
- `page.$()`, `page.$$()`, `waitForSelector`, XPath

A utility class is a styling hook. The day someone switches it for another, every test
built on it fails — and fails in a way that looks like a product bug.

## Priority order

**[invariant]** Work down this list; move to the next level only when the one above genuinely
cannot express the element.

1. **`getByRole('button', { name: 'Submit' })`** — the default choice. Doubles as an
   accessibility check: if the role is missing, that is usually a real defect.
2. **`getByLabel('Email')`** — form fields.
3. **`getByText(Messages.CART_EMPTY)`** — messages and static copy, with the text taken from the
   constants module rather than inlined.
4. **`getByTestId('checkout-summary')`** — when semantics genuinely cannot identify the element,
   **and the application is under your team's control**.
5. **`getByPlaceholder` / `getByTitle` / `getByAltText`** — narrow cases where nothing above fits.

## Rules for getByTestId

**[invariant]** A test id only works if the attribute actually exists in the application. Never
propose it for a third-party site, a vendor product, or any app your team cannot change — there,
the honest answer is to stop and ask.

**[default]** Where the app is yours, requesting a `data-testid` from the developers is the correct
resolution to an unreachable element, and it is preferable to inventing a fragile workaround.

**[default]** Playwright looks for `data-testid` by default. Teams often use `data-test`,
`data-qa` or `data-cy` instead — set `testIdAttribute` in the Playwright config once, and
`getByTestId` follows the team's convention everywhere.

**[invariant]** A test id is an identity handle, not a description. It never replaces a role
locator that already works, and it must not carry state or position (`row-3-active` is a bug
waiting to happen).

## When nothing fits

**[invariant]** Stop. Do not fall back to CSS and do not improvise. Report which element resists
and let a human decide — the answer is normally a test id added to the application, or an
explicitly approved exception recorded in the project's `CLAUDE.md`.

An approved exception list, if a project needs one, is **closed**: entries are added by human
decision, never widened unilaterally. Two exceptions occur often enough to expect them:

| Locator | Why no accessible alternative exists |
|---|---|
| `input[type="file"]` | File inputs are visually hidden and expose no accessible name |
| `form` as a **scoping container** | An unnamed `<form>` exposes no role, and a page may hold two identical Submit buttons |

## Disambiguation

**[invariant]** `exact: true` whenever a name is a prefix of another name on the same screen:

```ts
this.page.getByRole('heading', { name: 'Order', exact: true });  // not 'Order Summary'
```

**[invariant]** Narrow by an accessible container rather than guessing:

```ts
this.page.getByRole('dialog').getByRole('button', { name: 'Delete' });
```

**[invariant]** Filter list rows by their content, never by index — index locators break the
moment sort order or data changes:

```ts
this.rows.filter({ has: this.page.getByRole('link', { name, exact: true }) });
```

**[default]** Case-insensitive regex is fine for button and link names: `/^sign in$/i`.
