# Deviations: debt, breakage and application bugs

Every real project deviates from its own rules somewhere. The rule here is universal; what fills
it is always project-specific and always discovered, never assumed.

## Why this matters

**[invariant]** Every deviation must be written down explicitly in the project's `CLAUDE.md`.
An undocumented deviation causes one of two failures, both expensive:

- the assistant treats the deviation as the house style and **multiplies it**
- the assistant decides the deviation is a defect it just introduced and **starts repairing
  working code**, abandoning the actual task

One sentence in the rules file prevents both.

## Four kinds to record

**[invariant] Broken commands.** Scripts that do not work — a failing typecheck, a lint with no
config, a build that errors. Record the command and the actual error, and state plainly that it
predates the current work. Discovered by running each script and reading the exit code, not by
guessing.

**[invariant] Legacy code that violates an invariant.** Files still using forbidden patterns —
CSS locators, raw `page` usage in specs, manual waits. List them by path with what is wrong, and
label them *debt, not examples*. Add the instruction: when you touch one of these files, fix the
pattern; never copy it into new code.

**[invariant] Application bugs.** When the product under test is genuinely broken, keep the test
and mark it as expected-to-fail with the reason spelled out. Never delete the test and never
weaken the assertion — a deleted test is a bug nobody will notice being fixed:

```ts
test.fail(true, 'Site bug: sort control does not reorder the list');
```

**[invariant]** Expected-failure markers are only for confirmed product defects. A merely
unstable test is never marked this way — flakiness is investigated, not annotated.

**[invariant] Exemplar exceptions.** When a file is named as a style exemplar but contains a known
deviation, say exactly which part to copy and which to ignore. Otherwise the deviation spreads
through every file modelled on it.

## Keeping the list honest

**[default]** A deviation entry is removed when the deviation is fixed, not left to rot. A stale
debt list trains the assistant to ignore the whole section.

**[default]** A freshly generated project should have no deviations at all. If one appears
immediately, the template that produced it is faulty — fix the template, not the project.
