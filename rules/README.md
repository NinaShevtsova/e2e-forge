# rules/

The universal layer. These files describe how a Playwright + TypeScript E2E framework is built,
with no knowledge of any particular application.

## How they are used

Rules are **source material for assembly**, not a library to link against. A skill reads the
relevant files, fills in examples taken from the target project, and writes one self-contained
`CLAUDE.md` into that project. The generated file must stand alone: the project will be opened by
people who do not have this generator installed.

Skills load only what they need — writing a page object pulls `page-objects.md`, `locators.md`
and `conventions.md`, not the spec rules.

## Two kinds of rule

Every rule is tagged. The distinction decides what happens when the generator meets a project that
does things differently.

**[invariant]** — never bend. Breaking it produces brittle or unreliable tests regardless of the
project. If existing code violates an invariant, the code is debt: record it, do not imitate it.

**[default]** — a reasonable choice that a project may already have made differently. If the
target project uses another layout or naming, follow the project and record its choice. Do not
impose the default on existing code.

Example of the difference: a project keeping page objects in `e2e/pageobjects/` instead of
`src/pages/` has overridden a default — respect it. A project locating elements by CSS class has
violated an invariant — the rule still stands, and the existing locators go on the debt list.

## Examples inside rules

Code samples here use neutral names (`'Submit'`, `'Email'`, `'Checkout'`). They exist because a
rule without an example does not constrain a model — "use good locators" is advice, a line of code
is a rule. When generating a project's `CLAUDE.md`, replace these with real examples harvested
from that project: they carry far more weight than invented ones.
