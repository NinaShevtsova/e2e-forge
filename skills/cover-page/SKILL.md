---
name: cover-page
description: Writes and verifies the test scenarios for one page that already has a page object — probes the live application to learn its real behaviour and messages, proposes a coverage matrix for approval, writes the specs, runs them, and triages every failure as either a test defect or an application bug. Use when asked to cover a page with tests, add scenarios, or write specs for an existing page object.
---

# Cover one page with scenarios

Turns a page object into tests. The page object says what the page can do; this skill establishes
what the page actually does, and pins that behaviour down in specs.

## Where the generator's own files are

`rules/` is referenced below. **The generator root is the directory containing both `rules/` and
`templates/`** — two levels above the directory holding this `SKILL.md`. It is not the working
directory: this skill runs inside a target project.

## What makes this skill different — and dangerous

The two skills before this one described what exists; their output could be checked mechanically.
This one writes **claims about behaviour**, and a wrong claim that passes is worse than no test at
all: it reports safety where there is none, and nobody looks again.

Three consequences run through every step below.

**Behaviour is learned by running, never by reasoning.** The text of a validation message, the URL
after a successful submit, whether a field trims whitespace — none of that is deducible from
markup. Probe it, read what came back, and write down what you saw.

**Deciding what to test is not this skill's call.** The page shows which inputs exist; it does not
show which failures would hurt. Propose, then stop and let a human decide.

**A failing test is information, not an obstacle.** The one thing never to do is adjust the
assertion until the run turns green.

## Scope: one page per invocation

One page, one spec file. Scenarios that end on another page are fine — the spec takes two fixtures
and orchestrates, per `rules/architecture.md` — but the behaviour under test belongs to this page.

## 1. Read what already exists

1. The project's **`CLAUDE.md`** — spec conventions, describe-title format, where data and
   constants live, the forbidden list.
2. **`.claude/rules/specs.md`, `assertions.md`, `isolation.md` and `conventions.md` in the
   project.** Read them explicitly; do not wait for them to arrive on their own. They carry
   `paths:` frontmatter and load automatically only once a matching file has been opened, which
   may be after the point where specs are already being written. A deliberate read costs one tool
   call and removes the dependency on that timing.
3. The **page object** for this page. Its public methods are the entire test surface: actions are
   what a scenario can do, `get*` are what it can read, `expect*` are what it can assert.
4. The **exemplar spec** named in `CLAUDE.md`.
5. **Any spec that already covers this page.** List every scenario already there before writing
   anything — see "Adding to existing coverage" below.

If the page has no page object, stop: run `new-page-object` first. Writing scenarios against
locators invented here would put selectors in specs, which the architecture forbids.

### Conventions come from the target project alone

Style is taken from **this project's `CLAUDE.md` and the exemplars named in it** — nothing else.
Other repositories on disk are not references, however similar they look and however conveniently
they sit in the next folder.

A working machine usually holds several test projects side by side, written by different teams,
sometimes for different frameworks. Borrowing a pattern from one of them imports conventions that
may contradict this project's own, and the damage is quiet: the code compiles, the tests pass, and
the project slowly acquires a second style that nobody chose. A neighbour may also carry the very
patterns these rules forbid — a positional `.first()`, a class-based selector, a locator matching
any text on the page — and copying them arrives with an apparent justification: *the other project
does it this way*.

**When the target project has no example of the pattern needed** — a data-driven loop, a typed
data loader — the model is in `rules/`, which describes each technique in general form for exactly
this situation. Reaching for a neighbouring codebase is the wrong answer to a reasonable question.

## 2. Probe the live application

This is the step the previous skill was forbidden to take. Perform the actions and record what the
application answers.

Write a throwaway `probe.mjs`. For a form, at minimum:

- submit it empty, and record every validation message that appears, verbatim
- submit it with one field wrong at a time — a malformed email, too short a password — and record
  each message
- submit it valid, and record the success message, the resulting URL, and anything new on screen

Record text **exactly as rendered**, including punctuation and capitalisation. A message copied
approximately produces a test that fails for the wrong reason.

Probe each rule **on its own**, not only in combination. An empty form shows every message at once,
but that does not establish which message a single omitted field produces — the application may
answer differently. Fill everything, remove one field, submit, repeat. Writing a per-field test
from a shows-everything observation invents a mapping nobody verified.

**After a state-changing action, record the controls, not just the text.** Enumerate the roles
present in the new state — buttons, links, headings — and compare them with what was there before.
A control that exists only after the action is part of that state's behaviour and is as testable
as any message.

### When the action produces no response at all

Nothing changed on screen after a submit. **Find out why. Do not conclude that the application has
no rule for this input** — that conclusion writes off a whole class of scenarios on an assumption.

Four causes, all common, and they call for different responses:

```js
console.log('submit disabled :', await submitButton.isDisabled());
console.log('valid to browser:', await form.evaluate((f) => f.checkValidity()));
console.log('first invalid   :', await form.evaluate((f) => f.querySelector(':invalid')?.name));
page.on('request', (r) => console.log('request sent:', r.method(), r.url()));
```

**The submit control is disabled** until the form is valid. Widespread in internal and
enterprise interfaces. There is nothing to bypass: the scenario is that the control stays
disabled, and that is what the test asserts.

**A request left but the application showed nothing.** A 401, a CORS rejection, a 500 swallowed
by the client. That is a defect worth reporting, not a rule to encode.

**The message rendered outside what was inspected** — at the top of a long page, in a corner
toast, inside a collapsed panel. Widen the search before concluding anything.

**The browser blocked the submission with its own validation.** This happens only under one
specific combination: a real `<form>`, submitted the native way through a `type="submit"` control,
with HTML5 constraints on the fields (`required`, `type="email"`, `pattern`, `min`, `minlength`).
The browser refuses and shows a bubble the DOM does not contain, so the application's own
validator never runs and its message is unreachable through the interface.

It is common in server-rendered and older applications, and rare in current single-page ones,
which usually intercept submission or omit `<form>` entirely — some frameworks even set
`novalidate` themselves. `checkValidity()` returning false with a disabled-looking page and no
network request is the signature.

To reach the application's own message, switch native validation off and submit in one synchronous
evaluation, so the framework cannot re-render the form and restore it in between:

```js
await form.evaluate((f) => {
  f.noValidate = true;
  f.querySelector('button[type="submit"]')?.click();
});
```

If that reveals a message, the application does validate, and the scenario is real — but it needs
a page-object method for the bypass, which is a deliberate addition to propose, not to make
silently.

### Safety rules for probing

**Generate anything that must be unique.** A probe that registers an account uses a timestamped
address, never a fixed one, or the second run collides with the first and the failure looks like
an application bug.

**Never perform an irreversible action on your own initiative.** Placing an order, deleting a
record, sending a message to a real recipient, spending money, changing a password — stop and ask.
On a practice site these are harmless; on a real application they are not, and this skill cannot
tell the difference from the markup.

**Report what the probe changed.** If it created three accounts, say so, so the human can clean up.

## 3. Propose the coverage matrix, then stop

Produce a table and wait for approval. Do not write a single spec before it comes back.

| # | Scenario | Type | What it asserts |
|---|---|---|---|
| 1 | submits successfully with valid data | positive | success message, resulting URL |
| 2 | shows an error when the email is missing | negative | exact message observed in step 2 |
| 3 | rejects a malformed email | negative | exact message observed in step 2 |
| 4 | accepts the maximum allowed length | boundary | no error |

Derive rows only from what the probe actually observed. A row for a rule the application did not
demonstrate is a guess.

### Where rows come from

Work through all five sources, not only the first two. A matrix built from messages alone misses
whole classes of behaviour:

1. **The successful path** — what the application does when everything is right.
2. **Each validation rule** — probed individually, one field at a time.
3. **Boundaries** — the longest accepted value, the shortest, zero, a duplicate of something that
   must be unique. Only if the probe established the rule.
4. **State transitions** — for every control that appeared only after an action, a scenario for
   what it does and where it leads. A probe hunting for text finds messages and misses new
   buttons: the message is loud, the changed screen is not.
5. **Rendering completeness** — that every control the page object knows about is actually
   present. This overlaps with `isLoaded()` and is worth proposing rather than assuming: keep
   `isLoaded()` lean enough to identify the page, and let a separate test carry the full inventory,
   or let the reviewer drop the row if the readiness check already covers enough.

**Expect the human to change this table**, and say so when presenting it. The page shows which
inputs exist; it does not show which failures matter to this business. Cases added by the reviewer
are not corrections of a mistake — they are the half of the work this skill cannot do.

### Say which rows become one loop

Rows that differ only in their input and their expected message become **one data-driven loop**
with the cases in `data/` — never one test each. That is required by `rules/specs.md`, and it is
decided here, not later.

List them individually all the same: the reviewer has to see each case to strike one out, and a
row saying "validates required fields" hides six decisions behind one word. Then mark the group
explicitly — *"rows 3–8 → one data-driven loop, cases in `data/`"*.

Without that note a table of six rows reads as six separate tests, and the reviewer discovers the
actual shape only when the specs are already written. The grouping is part of the proposal, not an
implementation detail to reveal afterwards.

Write only the approved rows. If a row is struck out, it is not written, and not quietly kept for
later.

## 4. Turn observed messages into named assertions

The page object from `new-page-object` carries a generic `expectMessage(text)` placeholder,
because the texts were unknown then. Now they are known.

- Put each observed message in `src/constants/` as a named constant.
- Add a named assertion to the page object for each — `expectEmailRequiredError()`,
  `expectRegistrationSucceeded()` — each asserting on its constant.
- Leave the generic method only if something still needs it.

This keeps message text out of specs, as `rules/conventions.md` requires. A spec that hard-codes a
validation string breaks the moment the wording changes, in a place nobody thinks to look — and
the same string is usually asserted in three other specs that all break together.

## 5. Write the specs

Follow `rules/specs.md` and the project's exemplar. In short: `test`/`expect` from a fixture file,
page objects by destructuring, shared navigation in `beforeEach`, one behaviour per test, titles
that state the expected behaviour.

**Repetition across cases of the same rule is a data-driven loop**, not copy-paste. Several
negative cases differing only in input and expected message belong in `data/` and one loop:

```ts
for (const { scenario, email, expectedError } of invalidEmails) {
  test(`shows error for ${scenario}`, async ({ registrationPage }) => {
    await registrationPage.register(name, email, password, country, accountType);
    await registrationPage.expectMessage(expectedError);
  });
}
```

**Each test creates the state it needs and depends on no other test.** `rules/isolation.md`
applies with full force here: these tests run in parallel, and a scenario that assumes a previous
one ran will fail on someone else's machine and pass on yours.

## 6. Run them, then triage every failure

```bash
npx playwright test tests/<area>/<page>.spec.ts
```

A red test is a finding. Decide which of three things it is — and the decision is not always
yours to make:

**A defect in the test.** Wrong locator, wrong expected text, a missing precondition. Fix the test
and run again.

**A defect in the application.** The behaviour observed in step 2 is genuinely wrong — a required
field accepts empty input, a total is miscalculated. Keep the test, mark it expected-to-fail with
the reason spelled out, and record it in the deviations section of `CLAUDE.md`:

```ts
test.fail(true, 'App bug: the total ignores quantity');
```

**Unstable — passes sometimes.** Never mark this expected-to-fail. Flakiness is investigated: an
assertion that is not web-first, a fixed wait, shared state between tests. Fix the cause.

### The one prohibition

**Never weaken or delete an assertion to make a run green.** Not by loosening a matcher, not by
asserting on a substring instead of the message, not by deleting the case. A test bent until it
passes reports safety that does not exist, and it will keep reporting it for years.

If you cannot tell whether the fault is in the test or in the application, **stop and show the
human both** — the assertion, and what the application actually did. That judgement needs someone
who knows what the product is supposed to do.

## Adding to existing coverage

A repeat invocation on an already-covered page adds; it never rewrites.

- **Read the existing spec file first** and list every scenario in it. Present that list alongside
  the new proposals so the reviewer sees what is already there.
- **Add only what is missing**, into the existing file and the existing `describe` block.
- **Do not touch existing tests** — not their order, their titles, or their bodies. They may have
  been edited by hand for reasons not visible here.
- **One scenario file per page.** Add to the existing one; never start `<page>-2.spec.ts` or a
  parallel file under another name. Coverage split across two files cannot be audited for
  completeness — nobody can say what is covered without reading both and reconciling them.
- **Leave the smoke spec alone.** The one-test file created when the page object was added is a
  different artifact with a different job: it proves the wiring holds and runs in the fast suite
  that answers "is anything broken everywhere". Do not move its test into the scenario file and do
  not delete it as a duplicate. Merging the two would leave the project without a quick check.
- Do not restate a covered case under a different title.

## Report

State:

- which scenarios were written, and which proposed rows the reviewer removed
- what the probe changed in the application, if anything
- the messages observed, and where they now live as constants
- the run result: passed, and any test marked expected-to-fail with its reason
- anything that could not be decided without a human, and what is needed to decide it

Do not commit unless asked.

## Rules for this skill

- Every expected text and every expected URL comes from an observation, never from memory of how
  such applications usually behave.
- Propose, do not decide, what is worth testing.
- Nothing irreversible without asking.
- Never bend an assertion to get a green run; when in doubt, hand the doubt to a human.
- One page per invocation.
