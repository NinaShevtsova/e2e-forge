---
name: new-page-object
description: Adds a page object for one page of an application to an existing Playwright + TypeScript framework — explores the live page, writes the class in the project's own style, registers it in a fixture and its route in the URL map, and proves it works with a passing test. Use when asked to cover a new page, add a page object, or extend an existing E2E framework to another screen.
---

# Add a page object for one page

Takes one page of a running application and produces a page object that matches the project's
existing conventions, is reachable from tests, and is proven to work.

This is the skill that runs dozens of times over a project's life. Everything it does is derived
from two sources: the live page, and the project's own `CLAUDE.md`. Nothing is derived from
memory of how other projects do it.

## Where the generator's own files are

`rules/` is referenced below. **The generator root is the directory containing both `rules/` and
`templates/`** — two levels above the directory holding this `SKILL.md`. It is not the working
directory: this skill runs inside a target project, which is somewhere else entirely.

## Scope: one page per invocation

One page, one run. Not "cover the whole application".

Two reasons, both practical. Every page needs its own exploration, and batching them means
guessing at the later ones. And a review of six generated page objects at once is not a review —
defects pass through because attention runs out.

If asked for several pages, do them one at a time and say so.

## 1. Read the project before touching anything

The target project is the source of truth for style. Read, in this order:

1. Its **`CLAUDE.md`** — conventions, forbidden patterns, which test-id attribute exists (if any),
   whether the application is client-rendered.
2. **`.claude/rules/page-objects.md`, `locators.md` and `conventions.md` in the project.** Read
   them explicitly; do not rely on them arriving on their own. They carry `paths:` frontmatter and
   load automatically only once a matching file has been opened, which may be after the point
   where the class is already being written. A deliberate read costs one tool call and removes the
   dependency on that timing entirely.
3. The **exemplar page object** named in `CLAUDE.md`'s "copy the exemplars" section. This is what
   the new class must look like. Structure, ordering, naming, comment style — mirror it.
4. `src/config/urls.config.ts` — how routes are expressed.
5. The **fixture files** — which one this page belongs in, and how registration is written there.
6. `src/config/env.config.ts` — whether credentials exist for this application.

If the project has no `CLAUDE.md`, stop and say so. Without it there are no conventions to follow,
and the result would be this assistant's house style rather than the project's.

**This project and nothing else.** Other repositories on disk are not references, however similar
they look. A machine usually holds several test projects written by different teams, and a
neighbour may well carry the patterns these rules forbid — a positional `.first()`, a class-based
selector — which then arrive with an apparent justification. Where this project has no example of
what is needed, the model is in `rules/`, not in the folder next door.

**Check whether the page object already exists.** One screen, one class. If a class for this page
is already there, extend it with the missing methods instead of creating a second one — see the
next section, which narrows the job considerably.

## Extending an existing page object

Pages change after their class is written: a button appears, a form grows a field. The request
then names the new element — "the cart page has a new Save for later button" — and the work is an
extension, not a rebuild.

**The scope narrows to the new element.** Explore it, count its locator (the full step 5 rules
apply: count before writing, 1 for a single element, on two pages if it will ever prove
readiness), and add the getter and methods for it, following the same contract as the rest of the
class.

**Nothing that already exists is touched:**

- existing locators, actions and assertions stay exactly as they are — they may have been edited
  by hand for reasons not visible here
- `isLoaded()` is not revisited: the page still is what it was, it merely has one more control
- fixture registration, the URL map entry and the smoke spec already exist and stay as they are

**The four checks of step 8 still run in full** — typecheck, lint, the forbidden-pattern grep and
the smoke suite — because an edit to a shared class can break neighbours the new element never
touches.

**Report what was added**, method by method. The class changed, and whoever reviews the next
scenario needs to know the page object no longer matches what they last read.

## 2. Establish what page is wanted

From the request, determine:

- **Which page** — a URL, or a route name plus the base URL from the env config.
- **Whether it needs a session.** Ask if it is not obvious from `CLAUDE.md`.
- **Whether it needs prior state** — a cart page is empty until something is added, an order page
  does not exist until an order is placed.

On state: this skill describes the page as it finds it. It does not click through a flow to
manufacture state — that is a test scenario, and inventing one blind produces fiction. If the page
only shows an empty state, model the empty state, and say plainly in the report which parts of the
page could not be seen and what would be needed to reach them.

## 3. Reach the page

Write `explore.mjs` in the target project root.

**Without a session**, navigate directly:

```js
await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });
```

**With a session**, log in first. Take the steps from the project's existing login page object —
read its source and use the same locators, so the script and the framework agree:

```js
await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
await page.getByPlaceholder('Username').fill(process.env.TEST_USER_LOGIN);
await page.getByPlaceholder('Password').fill(process.env.TEST_USER_PASSWORD);
await page.getByRole('button', { name: 'Login' }).click();
await page.waitForURL('**/<landing route after login>', { timeout: 15000 });
await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });
```

**Confirm you actually got through.** An application that refuses access does not necessarily
redirect — many render a denial in place, leaving the URL unchanged. Comparing URLs is not enough.
Print the page text and read it:

```js
console.log('URL  :', page.url());
console.log('TEXT :', (await page.locator('body').innerText()).trim().slice(0, 200));
```

Text like "you can only access this when you are logged in", or a login form where the page
content was expected, means you are still outside. Stop and report it — do not describe the
denial page as if it were the target.

### If the project uses a test-id attribute

A standalone `.mjs` script does **not** read `playwright.config.ts`, so `getByTestId` falls back to
the default `data-testid` and silently matches nothing. Every check returns zero, and the obvious
conclusion — "this application has no test ids" — would be wrong.

Whenever `CLAUDE.md` records a non-default attribute, set it in the script:

```js
import { chromium, selectors } from '@playwright/test';

selectors.setTestIdAttribute('data-test');
```

## 4. Explore the page

Use the same wait sequence as framework setup — `networkidle`, then wait for body text. One alone
is not enough: on a client-rendered application the body fills before rendering finishes, and a
snapshot taken between those two moments is missing most of the page.

Enumerate what a page object will need:

```js
for (const h of await page.getByRole('heading').all())
  console.log('HEADING:', (await h.textContent())?.trim());
for (const b of await page.getByRole('button').all()) {
  const t = (await b.textContent())?.trim();
  console.log('BUTTON:', t || (await b.getAttribute('value')) || '(no label)');
}
for (const t of await page.getByRole('textbox').all())
  console.log('TEXTBOX: label=', await t.getAttribute('aria-label'),
              'placeholder=', await t.getAttribute('placeholder'));
for (const s of await page.getByRole('combobox').all())
  console.log('SELECT:', await s.textContent());
for (const c of await page.getByRole('checkbox').all())
  console.log('CHECKBOX:', await c.getAttribute('name'));
for (const l of (await page.getByRole('link').all()).slice(0, 30))
  console.log('LINK:', (await l.textContent())?.trim(), '->', await l.getAttribute('href'));
for (const d of await page.getByRole('dialog').all())
  console.log('DIALOG:', (await d.textContent())?.trim().slice(0, 80));
console.log('--- PAGE TEXT ---');
console.log((await page.locator('body').innerText()).trim().slice(0, 3000));
```

Delete `explore.mjs` when its output has been used.

## 5. Count every locator before writing it

Decide the whole set of locators the page object will hold, then count them all in one script.
The browser is already open and the script already written for the readiness check below — adding
the rest costs a few lines, and it is the difference between a locator that is known to work and
one that merely looks right.

```js
const c = async (label, loc) => console.log(label.padEnd(40), await loc.count());

await c('nameInput',            page.getByLabel('Name'));                     // expect 1
await c('submitButton',         page.locator('form').getByRole('button', { name: 'Submit' }));
await c('productCards',         page.getByTestId('inventory-item'));          // expect > 0
await c('colourRadio("Red")',   page.getByRole('radio', { name: 'Red' }));    // expect 1
```

Expectations: exactly 1 for a single element; more than 0 for a list — never a fixed number, since
content changes and a hard count becomes a false failure tomorrow; 1 for a parameterised locator
given a real value.

Anything returning 0, or more than expected, is wrong. Fix it here, while the page is in front of
you — not later inside a failing scenario, where the same defect costs a diagnosis of whether the
locator, the test or the application is at fault.

**A count proves uniqueness, not correctness.** A locator can return 1 and still point at the
wrong element — a `Submit` scoped to the wrong container matches exactly one thing. The count rules
out ambiguity; reading the page decides identity.

### The readiness locator additionally needs two pages

`isLoaded()` must prove *this* page rendered, not that the browser is somewhere on the site.

Choose by the rule in `rules/page-objects.md`: a heading that names the page; failing that,
elements unique to this page; failing that, the page title.

**Then count it on a second page of the same application.** The obvious choice — a site name, a
navbar brand, a logo — is usually present everywhere, and a readiness check built on it passes on
every page while proving nothing:

```js
console.log('on target page:', await page.getByRole('link', { name: 'Categories' }).count());
console.log('on another page:', await other.getByRole('link', { name: 'Categories' }).count());
```

A match on both means the element is site-wide. Pick another and count again.

## 6. Write the page object

Follow `rules/page-objects.md`, `rules/locators.md` and `rules/conventions.md`, and mirror the
project's exemplar. In brief: extends the project's base class, no constructor, private getters
for locators, `open()` through the URL map, mandatory `isLoaded()`, actions logged, `get*`
returning data, `expect*` asserting internally, section separators in the project's order.

Locators come **only from what the exploration printed.** Never from what a page like this usually
contains.

### What methods to write

Derive them from the page's affordances, not from imagination:

| Found on the page | Becomes |
|---|---|
| A button or link that changes state | An action method, logged |
| A form field | A `fill*`/`select*` action — and nothing else |
| A repeated row or card | A parameterised private locator plus a `get*Names()`-style getter |
| Data the application produced | A `get*` returning a string, array or number |
| A message the page can show | An `expect*` method, with the text in `src/constants/` |
| Navigation away from the page | An action; the destination gets its own page object later |

Do not write a method the page cannot perform. A page object with methods for a flow that does not
exist is worse than a small one — it is a promise the code cannot keep.

### Getters: only for what the application produced

Write a getter **only for data the application itself produced or transformed** — a list of
products, a total, an order number, a value the page filled in on its own.

**Never for a value the test typed in.** A test that called `fillEmail('a@b.c')` already knows the
email; reading it back checks that the browser can store a string, not that the application works.
The single exception is when the application transforms the input — trims it, changes its case —
and that transformation is what the assertion is about.

If you cannot name the assertion that would call the getter, do not write it. An unused method is
not spare capacity: it is dead code that implies a test which does not exist, and one more place
to update when the field moves.

This rule exists because the softer wording it replaced — "a getter if a test would read it back"
— asked for a prediction about tests that had not been written yet. Two independent runs both
resolved that uncertainty the same wrong way, adding a `getEmail()` nobody calls.

### Wrap the page's one obvious flow in a composite method

When a page exists to complete a single task — fill this form and submit it — add one method that
performs the whole thing, alongside the individual steps:

```ts
/**
 * Complete the registration form and submit it.
 * @param name - Full name
 * @param email - Email address
 * @param password - Password, entered into both fields
 */
async register(name: string, email: string, password: string): Promise<void> {
  await this.fillName(name);
  await this.fillEmail(email);
  await this.fillPassword(password);
  await this.fillConfirmPassword(password);
  await this.submit();
}
```

`rules/specs.md` requires it: a sequence of steps repeated across tests belongs in one named
method, not copied into every spec. Without the composite, every positive test rewrites the same
five lines, and the DRY rule is broken by the page object rather than by the specs.

Three constraints:

- **The composite calls the step methods**, it does not repeat their locators. One place to change
  when a field moves.
- **Keep the step methods.** Negative tests exist precisely to leave one field empty or wrong, and
  they need the granular calls. The composite serves the happy path; it does not replace anything.
- **One page, one composite.** Name it for the outcome — `register`, `login`, `checkout` — not for
  the mechanics. Do not chain across pages: a flow spanning two screens is orchestrated by the
  spec through two fixtures, per `rules/architecture.md`.

A page that offers no single obvious task — a catalogue, a dashboard, a settings screen with
independent controls — gets no composite. Inventing one there produces a method nobody calls.

## 7. Wire it in

A page object no fixture exposes is unreachable and therefore dead code. Three edits, all required:

- **Fixture** — add the typed key with its JSDoc line and the instantiation. Use the domain
  fixture if the project has one for this area, otherwise the base fixture. If the page needs
  authentication, the login belongs in the fixture, not in each spec.
- **`urls.config.ts`** — add the route. Parameterised routes are written as functions.
- **`src/constants/`** — any user-visible text the page object asserts on.

## 8. Prove it works

Write a minimal spec that opens the page and asserts readiness — the same shape as the framework's
first smoke test:

```ts
import { test } from '@fixtures/base.fixture';

test.describe('Smoke › Cart', () => {
  test('cart page loads', async ({ cartPage }) => {
    await cartPage.open();
    await cartPage.isLoaded();
  });
});
```

Then run all four. Every one must pass:

```bash
npx tsc --noEmit
```

```bash
npx eslint .
```

```bash
npx playwright test tests/smoke/<name>.spec.ts
```

```bash
grep -nE "waitForTimeout|page\.\\\$|:nth-child|\.nth\(|\.locator\(['\"]\.\.['\"]\)|\.locator\(['\"][.#]|\.locator\(['\"][^'\"]*[>+~]|xpath=" src/pages/<name>.page.ts
```

The quote class `['\"]` is not decoration. An earlier version of this pattern matched single
quotes only, and a file written with double quotes passed the check with a `locator("..")` and a
class selector sitting in plain sight.

The grep must print nothing. It exists because a forbidden selector is **invisible to the other
three checks**: `locator('..')` is valid TypeScript, a valid Playwright call, and its test passes.
It is banned for breaking on the next markup change, months later, in a way that looks like a
product bug. Nothing downstream will catch it — not a type check, not a lint, not a scenario.

Two limits to keep in mind:

- It is a backstop for the most common violations, **not** a substitute for reading the diff
  against `rules/forbidden.md`, which remains the authority. Hard-coded message text, a locator
  chosen by position, a getter returning a `Locator` — none of these are greppable.
- Update the pattern whenever a ban is added to the rules, or the two quietly drift apart.

The two approved CSS exceptions do not match these patterns: `locator('form')` and
`locator('input[type="file"]')` begin with neither a dot nor a hash and contain no combinator.

If the smoke test fails on a locator, return to step 4 and read the page again. Never weaken the
assertion, never add a wait, never mark the test as expected-to-fail. A failing readiness check
means the locator is wrong, not that the page is slow.

This spec proves the page object is wired correctly. It is not coverage — scenarios are a separate
job.

## 9. Report

State plainly:

- which files were created and which were edited
- which readiness locator was chosen, and the counts that justified it
- that typecheck, lint, the forbidden-pattern grep and the smoke test passed

Separate what was verified from what was not. The smoke test proves the page opens and the fixture
wiring holds — nothing more. Action and getter methods are written from the exploration but are not
exercised by this skill; their behaviour is established when scenarios are written. Say so. Do not
call the page object "working" on the strength of a green run that only executed `isLoaded()`.
- what the page offers that is worth covering next — forms, validation, list operations
- anything that could not be seen, and what state would be needed to see it

Do not commit unless asked.

## Rules for this skill

- Every locator comes from the exploration output. Nothing is recalled, nothing is assumed.
- Every claim about the page is verified by running, not by remembering. A count is one line of
  script; a wrong locator is an hour of debugging later.
- The project's `CLAUDE.md` outranks these instructions wherever they differ. It describes the
  project; this file describes the method.
- If the page cannot be reached, or an element cannot be located without a forbidden selector,
  stop and report. Do not improvise a workaround.
- One page per invocation.
