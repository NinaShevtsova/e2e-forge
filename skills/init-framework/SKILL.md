---
name: init-framework
description: Scaffolds a new Playwright + TypeScript E2E test framework from scratch for a given web application — folders, base classes, config, fixtures, first page object, first passing test, and the project's CLAUDE.md. Use when a project has no test framework yet, or when asked to create, bootstrap, or set up E2E test automation.
---

# Initialise an E2E test framework

Creates a working framework where none existed. "Working" means verified, not plausible: it
compiles, it lints, and one real test passes against the live application.

## Where the generator's own files are

`templates/` and `rules/` are referenced throughout. **The generator root is the directory that
contains both of them** — it is two levels above the directory holding this `SKILL.md`
(`skills/init-framework/`). Do not assume it is the session's working directory: this
skill is often invoked while the working directory is elsewhere, because its whole job is to
create a framework somewhere else.

If the location is unclear, find `rules/page-objects.md` and take the directory above `rules/`.

## Order matters

Exploration comes **before** slot substitution. Several values — how a page proves it loaded,
which test-id attribute the app uses, sometimes even the credentials — can only be learned by
opening the application. Filling slots first forces guessing; filling them after exploration does
not.

```
ask → copy → install → explore → fill slots → verify → write CLAUDE.md
```

## 1. Ask the user

Ask in one message and wait. These cannot be discovered by looking at the app:

| Question | Used for |
|---|---|
| Where should the framework be created? (path) | target directory |
| What is the application's base URL? | the `baseUrl` value, and the address exploration starts from |
| Short description of the application | the project description |
| Does testing require login? If so, which credentials? | env config defaults |

Derive the project name from the target directory unless the user gives one.

Do not ask which test-id attribute the app uses, or what the landing page looks like. Those are
discovered in step 4 — asking invites a wrong answer from memory when a script can establish the
fact in seconds.

Never invent credentials. If login is needed and the user has none, continue — step 4 may find
them published on the page itself (practice sites often do this). If it does not, scaffold
without auth and say so plainly.

If the target directory already contains a Playwright framework, stop. An existing project needs
its conventions extracted, not overwritten.

## 2. Copy the scaffold

Create the target directory and copy `templates/` into it, then rename:

- `package.json.template` → `package.json`
- `gitignore.template` → `.gitignore`
- `CLAUDE.md.template` → do not copy; it is an assembly manifest used in step 7

Fill a slot as soon as its value is known. `{{PROJECT_NAME}}` and `{{PROJECT_DESCRIPTION}}` come
from step 1 and must be substituted **before** the install in step 3 — npm copies the project name
into `package-lock.json`, and a placeholder written there survives every later substitution pass.

Every other slot waits for step 5, once the application has been seen.

## 3. Install the toolchain

```bash
npm install -D @playwright/test typescript @types/node eslint @eslint/js typescript-eslint
```

```bash
npx playwright install chromium
```

Never pin versions in the template. Letting npm resolve current ones is deliberate — a project
created a year from now must not start on stale dependencies. The cost is that a future toolchain
release can invalidate the config, which is exactly what step 6 exists to catch.

## 4. Explore the live application

Write `explore.mjs` in the target directory:

```js
import { chromium } from '@playwright/test';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(process.argv[2], { waitUntil: 'domcontentloaded' });

// A client-rendered app has an empty DOM at domcontentloaded. Wait for the
// network to settle, then for the body to actually contain something —
// otherwise this snapshot describes a blank shell, not the real page.
try {
  await page.waitForLoadState('networkidle', { timeout: 15000 });
} catch {
  // Sites that poll never reach networkidle; fall through to the text check.
}
try {
  await page.waitForFunction(() => document.body.innerText.trim().length > 0, {
    timeout: 15000,
  });
} catch {
  console.log('WARNING: page body is still empty after waiting.');
}

console.log('TITLE:', await page.title());

for (const h of await page.getByRole('heading').all()) {
  console.log('HEADING:', (await h.textContent())?.trim());
}
for (const b of await page.getByRole('button').all()) {
  // Buttons built as <input type="submit"> carry their label in `value`,
  // not in text content. Read both or such buttons come back blank.
  const text = (await b.textContent())?.trim();
  console.log('BUTTON:', text || (await b.getAttribute('value')) || '(no label)');
}
for (const t of await page.getByRole('textbox').all()) {
  console.log('TEXTBOX: placeholder=', await t.getAttribute('placeholder'));
}
for (const l of await page.getByRole('link').all()) {
  console.log('LINK:', (await l.textContent())?.trim(), '->', await l.getAttribute('href'));
}

// Which test-id attribute does this application use, if any?
const attrs = await page.evaluate(() => {
  const found = {};
  for (const el of document.querySelectorAll('*')) {
    for (const a of el.attributes) {
      if (a.name.startsWith('data-')) found[a.name] = (found[a.name] ?? 0) + 1;
    }
  }
  return found;
});
console.log('DATA-ATTRIBUTES:', JSON.stringify(attrs));

console.log('--- PAGE TEXT ---');
console.log((await page.locator('body').innerText()).trim().slice(0, 2000));

await browser.close();
```

```bash
node explore.mjs <BASE_URL>
```

Delete `explore.mjs` once its output has been used.

If the site is unreachable, stop and report it. Never fabricate page facts to keep the run moving.

### What to take from the output

**The test-id attribute.** If `DATA-ATTRIBUTES` shows a test-id-like attribute (`data-test`,
`data-qa`, `data-cy`, `data-testid`), note which one and how widely it is used. Anything other
than `data-testid` needs `testIdAttribute: '<attr>'` in the `use` block of
`playwright.config.ts`, or `getByTestId` will silently match nothing.

**How the landing page proves it loaded.** Choose by this rule, in order — do not assume:

1. **A heading that names the page.** Use it if one exists. Beware the trap: a large, bold site
   name is often a `<div>`, not a heading. Only what appeared under `HEADING:` is a real heading.
2. **Elements unique to this page.** When there is no naming heading — common on apps whose
   landing page is a login screen — assert on the elements that identify it: the credential
   fields and the submit button, the main table, the primary action.
3. **The page title**, via `toHaveURL`/`toHaveTitle`. Weakest option, because a title can be set
   before the page renders. Use only when nothing else identifies the page.

**Credentials, if published.** Practice sites frequently print valid logins on the page. If
`PAGE TEXT` contains them, use them rather than scaffolding without auth.

**Routes.** Record the links seen. They become the first entries in `urls.config.ts` and the page
inventory for later work.

## 5. Fill the slots

Now every value is known. Replace across the copied files:

| Slot | Value |
|---|---|
| `{{PROJECT_NAME}}`, `{{PROJECT_DESCRIPTION}}` | from step 1 |
| `{{BASE_URL}}` | from step 1 |
| `{{TEST_USER_LOGIN}}`, `{{TEST_USER_PASSWORD}}` | from step 1, or discovered in step 4; empty strings if the app needs no login |
| `{{HOME_LOCATORS}}` | the private locator getters chosen in step 4 |
| `{{HOME_READINESS}}` | the `isLoaded()` body asserting on those locators |

`isLoaded()` must never be left empty — it is the readiness contract every later page object and
fixture depends on.

Follow the framework's import rule while writing these: cross-folder imports use the path aliases
(`@config/*`, `@fixtures/*`, `@pages/*`), relative paths only within one folder.

After this step no `{{` may remain anywhere in the target directory.

## 6. Verify

All three must pass. A failure here is a real finding about the templates, not a nuisance:

```bash
npx tsc --noEmit
```

```bash
npx eslint .
```

```bash
npx playwright test tests/smoke/home.spec.ts
```

If the smoke test fails on the readiness locator, return to step 4 and read the page again. Never
weaken the assertion to make it pass.

If `tsc` rejects a compiler option, the template's config has aged out of the current TypeScript
release. Fix the option in the generator's template — not only in this project — or the next
generated project inherits the same failure.

## 7. Write the project's instructions — two parts

The project gets a short `CLAUDE.md` **and** a `.claude/rules/` directory. Both are required; one
without the other misses the point.

`CLAUDE.md` is loaded into context at the start of every session, so it stays under 200 lines: a
longer file consumes context and measurably reduces how reliably its instructions are followed. It
carries only what every task needs. The detailed craft rules go to `.claude/rules/`, each file
scoped with `paths:` frontmatter so it loads when Claude opens a file it governs.

### 7a. Copy the scoped rules

Copy `templates/claude-rules/*.md` into `<project>/.claude/rules/`. They already carry the correct
`paths:` frontmatter. Then, in each copied file:

- strip every `[invariant]` and `[default]` tag — by now each default is a settled fact about this
  project, and the tags are noise to a reader
- drop sentences addressed to the generator rather than to this project ("a project may already
  name things differently, follow the project")
- replace the neutral placeholder examples with real ones from the code just generated

Keep every explanation of **why** a rule exists. A bare rule is followed less reliably than one
whose cost of violation is stated. Trim repetition, never reasoning.

These files are committed with the project. They must not reference the generator.

### 7b. Assemble CLAUDE.md

Read `templates/CLAUDE.md.template` and follow the assembly notes inside it. Inline only the two
rules files it names — `architecture.md` and `forbidden.md` — and fill every slot from what is now
known:

- `{{COMMANDS_TABLE}}` — from the scripts in `package.json`
- `{{FOLDER_LAYOUT}}` — the directories that actually exist
- `{{TEST_AREAS}}` — the test folders in use and what belongs in each. A fresh project has only
  `smoke/`, so name it and state how the next area is chosen: an area is a region of the
  application — `auth/`, `checkout/`, `settings/` — never one screen. Leaving this to be inferred
  invites a folder per page, which turns the tree into a list of one-file directories.
- `{{EXEMPLARS_TABLE}}` — `src/pages/home.page.ts` for page objects,
  `src/fixtures/base.fixture.ts` for fixtures, `tests/smoke/home.spec.ts` for specs
- `{{CONFIG_PATHS_TABLE}}` — the real config module paths
- `{{TEST_ID_NOTE}}` — which attribute this app uses and how it is configured; say plainly if the
  app has none, so nobody reaches for `getByTestId` where it cannot work
- `{{TEST_COMMAND}}`, `{{TYPECHECK_COMMAND}}` — `npx playwright test`, `npm run typecheck`
- `{{KNOWN_BROKEN_SECTION}}` — omit; every script was verified in step 6
- `{{DEVIATIONS_LIST}}` — `None. This project was generated from verified templates. Record
  deviations here as they appear.` Keep the surrounding rule text so the first piece of debt has
  somewhere to go.

Replace the neutral examples inside the inlined rules with real ones from the code just generated.

**Check the length before writing.** If the assembled file exceeds 200 lines, something belongs in
`.claude/rules/` that was inlined here instead. Move it rather than trimming the reasoning out of
what remains.

### Verify every project-specific claim before writing it

A statement about this application — "these two headings collide", "this field has no label",
"the submit button is the only one on the page" — is a claim about live markup, and writing it
from memory of the exploration output produces confident, plausible, wrong text. Assembly is
where invented justifications get in.

Check each such claim by running it. Write a throwaway script that counts what the locator
actually matches:

```js
console.log('name "Feedback", no exact:',
  await page.getByRole('heading', { name: 'Feedback' }).count());
console.log('with exact:',
  await page.getByRole('heading', { name: 'Leave Feedback', exact: true }).count());
```

Use the same wait sequence as the explorer — `networkidle` followed by the body-text check. One
of them alone is not enough: on a client-rendered app the body fills before the page finishes
rendering, and a count taken between those two moments comes back zero.

A claim that does not survive checking is removed, not reworded. Prefer no example over a wrong
one: a false statement in `CLAUDE.md` is read as fact by every later session.

Write the result as `CLAUDE.md` in the project root, without the assembly-notes comment block.

## 8. Report

State what was created, that the three checks passed, which readiness strategy was chosen and
why, and which routes found in step 4 are worth covering next. Do not commit anything unless the
user asks.

## Rules for this skill

- Verified, not assumed. Every step that a command can check is checked by running it.
- Never fabricate a locator, a heading, or a credential. If something cannot be discovered, stop
  and ask.
- Copy templates rather than writing their contents from memory — they are the contract every
  later skill depends on.
- A defect found during a run belongs in the generator's templates or rules, not only in the
  project being generated. Otherwise the next project repeats it.
