---
paths:
  - "**/*.ts"
---

# Conventions

## Nothing is hard-coded

**[invariant]** Every value below has exactly one home. A literal appearing in a page object or a
spec is a defect, because the same value will appear in three more places within a month.

| Value | Belongs in |
|---|---|
| URLs and routes | the URL map (`Urls.checkout`) |
| Base URL, credentials, environment flags | the env config, read from environment variables with defaults |
| Timeouts, viewport, retry counts | the test config (`TestConfig.timeouts.navigation`) |
| UI messages, option labels | the constants module (`Messages.CART_EMPTY`) |
| Test input data | the data folder, loaded through a typed loader |

**[invariant]** Credentials and tokens come from environment variables. A real secret is never
committed — defaults in config are for local demo accounts only.

## Imports

**[invariant]** Cross-folder imports go through the path aliases; relative paths are used only
within a single folder:

```ts
import { Urls } from '@config/urls.config';        // crossing folders — alias
import { BasePage } from './base.page';            // same folder — relative
```

There is exactly one way to import any given module. Mixed styles produce two spellings of the
same dependency and make moving a file a guessing game.

**[invariant]** The alias definitions live in `tsconfig.json` under `paths`, with targets written
relative (`["./src/pages/*"]`). Modern TypeScript rejects bare targets when `baseUrl` is absent,
and `baseUrl` itself is deprecated — so do not reintroduce it.

**[default]** Root-level config files (`playwright.config.ts`) keep relative imports: the test
runner loads them before alias resolution is active.

**[invariant]** Aliases are used or they are removed. A `paths` block that no import references is
dead configuration that misleads every reader who finds it.

## Naming

**[default]** A project may already name things differently. Follow the project.

| Kind | File | Symbol |
|---|---|---|
| Page object | `checkout-cart.page.ts` | `CheckoutCartPage` |
| Component | `sign-in-modal.component.ts` | `SignInModalComponent` |
| Fixture | `checkout.fixture.ts` | `CheckoutFixtures`, `test` |
| Spec | `checkout-cart.spec.ts` | — |
| Constants | `checkout-messages.ts` | `CheckoutMessages`, SCREAMING_SNAKE keys |

**[default]** Files are kebab-case with a role suffix; classes are PascalCase with a matching
suffix; fixture keys are camelCase matching the class they provide.

## Documentation

**[invariant]** JSDoc goes on everything a reader consumes without opening the implementation:

- every public page-object and component method — one line on what it does, `@param` per argument
- every exported helper and data loader
- every fixture key in the fixture type — it is the only documentation a spec sees
- every class — a short block naming the screen or widget it covers

**[default]** Private locator getters need no JSDoc; the name and the locator already say it.

**[invariant]** A non-obvious workaround carries a comment explaining **why**, not what. Without
the reason, the next person deletes it as dead weight and reintroduces the bug it prevented.

## TypeScript

**[invariant]** Strict mode on. No `any` in framework code — a typed page object is what makes
generated tests fail at compile time rather than at 2 a.m. in CI.

**[default]** Prefer explicit return types on public methods; they document intent and catch
accidental changes.
