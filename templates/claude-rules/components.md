---
paths:
  - "src/components/**/*.ts"
---

# Component objects

A component object covers a reusable UI fragment that appears on more than one screen — a modal, a
header, a feedback widget, a cookie banner.

## When to create one

**[invariant]** The moment the same fragment is needed by a second page object. Duplicating the
same locators across two page objects is the failure this pattern exists to prevent.

## Contract

**[invariant]** A component **does not extend the page base class** — it has no URL of its own and
nothing to navigate to. It takes `page` in the constructor and builds its own logger.

**[invariant]** Every locator is scoped to the component's root element:

```ts
private get dialog() {
  return this.page.getByRole('dialog');
}

private get confirmButton() {
  return this.dialog.getByRole('button', { name: 'Confirm' });
}
```

Scoping is what makes the component safe to use on any screen: without it, a `Confirm` button
elsewhere on the page collides with the component's own.

**[invariant]** Exposes actions and `expect*` assertions. Never exposes `open()` — a component
appears as part of a screen, it is not navigated to.

**[invariant]** Registered in a fixture like a page object, so specs receive it by injection.

## Naming caution

**[default]** An assertion method named `isVisible()` that returns `Promise<void>` and asserts
internally reads like a boolean check but is not one. Prefer `expectVisible()` for new code; if a
project already uses `isVisible()` for this, keep its convention and note it in `CLAUDE.md`.
