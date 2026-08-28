# Architecture

## Pattern

**[invariant]** The framework uses **Page Object** for whole screens and **Component Object** for
reusable UI fragments that appear on several screens, with **fixtures providing dependency
injection** into tests. Tests describe behaviour; page objects hold every interaction detail.

## Layering

**[invariant]** Dependencies flow in one direction only:

```
tests/*.spec.ts
   └─> fixtures/          (dependency injection — the ONLY entry point for tests)
          └─> pages/, components/
                 └─> config/, constants/, utils/, data/
```

**[invariant]** A spec imports `test` and `expect` only from a fixture file, never from
`@playwright/test`.

**[invariant]** A spec never instantiates a page object and never touches `page` directly.

**[invariant]** A page object never imports another page object. If a flow spans two screens, the
spec orchestrates it by using two fixtures.

**[invariant]** Page objects and components own every selector. No selector appears anywhere else
— not in a spec, not in a helper, not in a config.

## Default folder layout

**[default]** A project may already use different names. Follow the project; record its actual
layout in `CLAUDE.md`.

```
src/pages/         one class per screen
src/components/    reusable fragments (modals, headers, widgets)
src/fixtures/      test fixtures, one file per domain
src/config/        env, urls, timeouts
src/constants/     UI strings and messages
src/utils/         logger, data loaders
tests/<area>/      specs grouped by area (smoke, auth, e2e, …)
data/              test input data
```

**[invariant]** An area is a **region of the application, never a single screen**. Sign-in,
registration and password recovery share one `auth/` folder; the checkout steps share one
`checkout/`. A folder per page produces one file per folder and turns the tree into a list —
`tests/registration/registration.spec.ts` carries no information the file name did not already
have.

**[default]** `smoke/` is the exception and holds the fast cross-application checks rather than
one subject, so a page's smoke test lives there while its scenarios live in the page's area.

## Splitting by sub-application

**[default]** When one product contains distinct sub-applications, give each its own page folder
and prefix both file and class names (`src/pages/checkout/checkout-cart.page.ts` →
`CheckoutCartPage`). Two screens with the same name in different sub-apps are different screens
and legitimately get separate classes.
